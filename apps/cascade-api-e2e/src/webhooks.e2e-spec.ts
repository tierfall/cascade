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

describe('/webhooks (integration)', () => {
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

    // Seed a workflow with a webhook trigger at /github/push.
    await request(app.getHttpServer())
      .post('/workflows')
      .set('Cookie', cookie)
      .send({
        schemaVersion: '1.0.0',
        id: 'wf-webhook',
        name: 'webhook',
        nodes: [{ id: 'echo', type: 'transform', config: { expression: '$' } }],
        edges: [],
        triggers: [{ kind: 'webhook', path: '/github/push' }],
      });
  });

  it('POST /webhooks/<path> matches the trigger and returns 202 with the run id', async () => {
    const response = await request(app.getHttpServer())
      .post('/webhooks/github/push')
      .send({ commit: 'abc123', author: 'octocat' });
    expect(response.status).toBe(202);
    expect(response.body.workflowId).toBe('wf-webhook');
    expect(typeof response.body.runId).toBe('string');

    // Persisted run is visible via /runs/:id (authed).
    const run = await request(app.getHttpServer())
      .get(`/runs/${response.body.runId as string}`)
      .set('Cookie', cookie);
    expect(run.status).toBe(200);
    expect(run.body.status).toBe('success');
  });

  it('returns 404 WEBHOOK_NOT_FOUND when no workflow has a matching trigger', async () => {
    const response = await request(app.getHttpServer()).post('/webhooks/unknown/path').send({});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('WEBHOOK_NOT_FOUND');
    expect(response.body.path).toBe('/unknown/path');
  });

  it('does not require authentication (webhooks are public by design)', async () => {
    const response = await request(app.getHttpServer()).post('/webhooks/github/push').send({});
    expect(response.status).toBe(202);
  });

  it('replay with the same payload starts a new run each time (idempotency is out of scope)', async () => {
    const first = await request(app.getHttpServer()).post('/webhooks/github/push').send({ x: 1 });
    const second = await request(app.getHttpServer()).post('/webhooks/github/push').send({ x: 1 });
    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    expect(first.body.runId).not.toBe(second.body.runId);
    const list = await request(app.getHttpServer()).get('/runs').set('Cookie', cookie);
    expect(list.body.total).toBe(2);
  });
});
