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

const baseDefinition = {
  schemaVersion: '1.0.0',
  id: 'wf-sample',
  name: 'Sample workflow',
  nodes: [{ id: 'start', type: 'http', config: { url: 'https://example.com' } }],
  edges: [],
  triggers: [{ kind: 'manual' }],
};

function readSessionCookie(setCookieHeader: string[] | undefined): string | undefined {
  const cookies = setCookieHeader ?? [];
  const target = cookies.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (target === undefined) return undefined;
  const semicolon = target.indexOf(';');
  const segment = semicolon === -1 ? target : target.slice(0, semicolon);
  return segment.slice(SESSION_COOKIE_NAME.length + 1);
}

describe('/workflows (integration)', () => {
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
  });

  describe('auth', () => {
    it('returns 401 without a session', async () => {
      const response = await request(app.getHttpServer()).get('/workflows');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /workflows', () => {
    it('creates a workflow and returns 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/workflows')
        .set('Cookie', cookie)
        .send(baseDefinition);
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 'wf-sample',
        name: 'Sample workflow',
        schemaVersion: '1.0.0',
      });
      expect(response.body.definition).toEqual(baseDefinition);
    });

    it('returns 409 when id already exists', async () => {
      await request(app.getHttpServer())
        .post('/workflows')
        .set('Cookie', cookie)
        .send(baseDefinition);
      const dup = await request(app.getHttpServer())
        .post('/workflows')
        .set('Cookie', cookie)
        .send(baseDefinition);
      expect(dup.status).toBe(409);
      expect(dup.body.error).toBe('WORKFLOW_ALREADY_EXISTS');
    });

    it('returns 400 VALIDATION on a malformed body', async () => {
      const response = await request(app.getHttpServer())
        .post('/workflows')
        .set('Cookie', cookie)
        .send({ ...baseDefinition, nodes: [] });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('VALIDATION');
    });
  });

  describe('GET /workflows', () => {
    it('returns paginated items + total', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/workflows')
          .set('Cookie', cookie)
          .send({ ...baseDefinition, id: `wf-${i.toString()}`, name: `wf ${i.toString()}` });
      }
      const response = await request(app.getHttpServer()).get('/workflows').set('Cookie', cookie);
      expect(response.status).toBe(200);
      expect(response.body.total).toBe(3);
      expect(response.body.items).toHaveLength(3);
      expect(response.body.items[0].definition).toBeUndefined();
    });

    it('respects limit + offset', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/workflows')
          .set('Cookie', cookie)
          .send({ ...baseDefinition, id: `wf-${i.toString()}`, name: `wf ${i.toString()}` });
      }
      const response = await request(app.getHttpServer())
        .get('/workflows?limit=2&offset=1')
        .set('Cookie', cookie);
      expect(response.status).toBe(200);
      expect(response.body.total).toBe(5);
      expect(response.body.items).toHaveLength(2);
    });
  });

  describe('GET /workflows/:id', () => {
    it('returns the workflow when found', async () => {
      await request(app.getHttpServer())
        .post('/workflows')
        .set('Cookie', cookie)
        .send(baseDefinition);
      const response = await request(app.getHttpServer())
        .get('/workflows/wf-sample')
        .set('Cookie', cookie);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe('wf-sample');
      expect(response.body.definition).toEqual(baseDefinition);
    });

    it('returns 404 when missing', async () => {
      const response = await request(app.getHttpServer())
        .get('/workflows/missing')
        .set('Cookie', cookie);
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('WORKFLOW_NOT_FOUND');
    });
  });

  describe('PATCH /workflows/:id', () => {
    it('updates the name', async () => {
      await request(app.getHttpServer())
        .post('/workflows')
        .set('Cookie', cookie)
        .send(baseDefinition);
      const response = await request(app.getHttpServer())
        .patch('/workflows/wf-sample')
        .set('Cookie', cookie)
        .send({ name: 'Renamed' });
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Renamed');
    });

    it('returns 404 when missing', async () => {
      const response = await request(app.getHttpServer())
        .patch('/workflows/missing')
        .set('Cookie', cookie)
        .send({ name: 'X' });
      expect(response.status).toBe(404);
    });

    it('returns 400 when body has no updates', async () => {
      await request(app.getHttpServer())
        .post('/workflows')
        .set('Cookie', cookie)
        .send(baseDefinition);
      const response = await request(app.getHttpServer())
        .patch('/workflows/wf-sample')
        .set('Cookie', cookie)
        .send({});
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /workflows/:id', () => {
    it('removes the workflow and returns 204', async () => {
      await request(app.getHttpServer())
        .post('/workflows')
        .set('Cookie', cookie)
        .send(baseDefinition);
      const del = await request(app.getHttpServer())
        .delete('/workflows/wf-sample')
        .set('Cookie', cookie);
      expect(del.status).toBe(204);
      const get = await request(app.getHttpServer())
        .get('/workflows/wf-sample')
        .set('Cookie', cookie);
      expect(get.status).toBe(404);
    });

    it('returns 404 when missing', async () => {
      const response = await request(app.getHttpServer())
        .delete('/workflows/missing')
        .set('Cookie', cookie);
      expect(response.status).toBe(404);
    });
  });
});
