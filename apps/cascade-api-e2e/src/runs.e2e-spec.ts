import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../cascade-api/src/app.module.js';
import { SESSION_COOKIE_NAME } from '../../cascade-api/src/auth/jwt-auth.guard.js';
import { PrismaService } from '../../cascade-api/src/prisma/prisma.service.js';
import type { SecretKey } from '../../cascade-api/src/secrets/secret-key.js';
import { SecretService } from '../../cascade-api/src/secrets/secret.service.js';
import { type BackingServices, startBackingServices, stopBackingServices } from './containers.js';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'correct-horse-1';

function readSessionCookie(setCookieHeader: string[] | undefined): string | undefined {
  const cookies = setCookieHeader ?? [];
  const target = cookies.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (target === undefined) return undefined;
  const semicolon = target.indexOf(';');
  const segment = semicolon === -1 ? target : target.slice(0, semicolon);
  return segment.slice(SESSION_COOKIE_NAME.length + 1);
}

describe('/runs (integration)', () => {
  let services: BackingServices;
  let app: INestApplication;
  let prisma: PrismaService;
  let secretService: SecretService;
  let cookie: string;

  beforeAll(async () => {
    services = await startBackingServices();
    process.env.DATABASE_URL = services.databaseUrl;
    process.env.REDIS_URL = services.redisUrl;
    delete process.env.JWT_SECRET;
    delete process.env.CREDENTIALS_ENC_KEY;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = moduleFixture.get(PrismaService);
    secretService = moduleFixture.get(SecretService);
  });

  afterAll(async () => {
    await app.close();
    await stopBackingServices(services);
  });

  beforeEach(async () => {
    await prisma.nodeExecution.deleteMany();
    await prisma.run.deleteMany();
    await prisma.workflow.deleteMany();
    await prisma.instanceSecret.deleteMany();
    await prisma.user.deleteMany();
    delete process.env.JWT_SECRET;
    delete process.env.CREDENTIALS_ENC_KEY;
    (secretService as unknown as { cache: Map<SecretKey, Promise<string>> }).cache.clear();
    await request(app.getHttpServer())
      .post('/setup')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    const token = readSessionCookie(login.headers['set-cookie'] as string[] | undefined);
    if (token === undefined) throw new Error('login failed to set cookie');
    cookie = `${SESSION_COOKIE_NAME}=${token}`;

    // Seed a workflow whose handlers are non-network: a conditional and a transform.
    await request(app.getHttpServer())
      .post('/workflows')
      .set('Cookie', cookie)
      .send({
        schemaVersion: '1.0.0',
        id: 'wf-runtest',
        name: 'runtest',
        nodes: [
          { id: 'cond', type: 'conditional', config: { expression: 'input.x > 5' } },
          { id: 'echo', type: 'transform', config: { expression: '$' } },
        ],
        edges: [{ from: 'cond', to: 'echo' }],
        triggers: [{ kind: 'manual' }],
      });
  });

  it('POST /workflows/:id/runs executes synchronously and returns a success run', async () => {
    const response = await request(app.getHttpServer())
      .post('/workflows/wf-runtest/runs')
      .set('Cookie', cookie)
      .send({ input: { x: 10 } });
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.workflowId).toBe('wf-runtest');
    expect(response.body.nodeExecutions).toHaveLength(2);
    expect(
      response.body.nodeExecutions.every((n: { status: string }) => n.status === 'success'),
    ).toBe(true);
  });

  it('returns 404 when the workflow does not exist', async () => {
    const response = await request(app.getHttpServer())
      .post('/workflows/missing/runs')
      .set('Cookie', cookie)
      .send({});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('WORKFLOW_NOT_FOUND');
  });

  it('returns 400 on validation failure (extra keys)', async () => {
    const response = await request(app.getHttpServer())
      .post('/workflows/wf-runtest/runs')
      .set('Cookie', cookie)
      .send({ input: { x: 1 }, garbage: true });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION');
  });

  it('GET /runs/:id returns the persisted run detail', async () => {
    const trigger = await request(app.getHttpServer())
      .post('/workflows/wf-runtest/runs')
      .set('Cookie', cookie)
      .send({ input: { x: 7 } });
    const runId = trigger.body.id as string;
    const response = await request(app.getHttpServer()).get(`/runs/${runId}`).set('Cookie', cookie);
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(runId);
    expect(response.body.status).toBe('success');
  });

  it('GET /runs/:id returns 404 when the run is missing', async () => {
    const response = await request(app.getHttpServer())
      .get('/runs/does-not-exist')
      .set('Cookie', cookie);
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('RUN_NOT_FOUND');
  });

  it('GET /runs lists with pagination', async () => {
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post('/workflows/wf-runtest/runs')
        .set('Cookie', cookie)
        .send({ input: { x: i } });
    }
    const response = await request(app.getHttpServer())
      .get('/runs?limit=2&offset=0')
      .set('Cookie', cookie);
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(3);
    expect(response.body.items).toHaveLength(2);
  });

  it('GET /runs?workflowId=... filters to that workflow', async () => {
    await request(app.getHttpServer())
      .post('/workflows/wf-runtest/runs')
      .set('Cookie', cookie)
      .send({ input: { x: 1 } });
    const response = await request(app.getHttpServer())
      .get('/runs?workflowId=wf-runtest')
      .set('Cookie', cookie);
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(
      response.body.items.every((r: { workflowId: string }) => r.workflowId === 'wf-runtest'),
    ).toBe(true);
  });

  it('requires authentication', async () => {
    const response = await request(app.getHttpServer()).post('/workflows/wf-runtest/runs').send({});
    expect(response.status).toBe(401);
  });
});
