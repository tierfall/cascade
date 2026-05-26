import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../../cascade-api/src/app.module.js';
import { PrismaService } from '../../cascade-api/src/prisma/prisma.service.js';
import { SecretService } from '../../cascade-api/src/secrets/secret.service.js';
import { type BackingServices, startBackingServices, stopBackingServices } from './containers.js';

describe('/setup (integration)', () => {
  let services: BackingServices;
  let app: INestApplication;
  let prisma: PrismaService;
  let secretService: SecretService;

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
    await prisma.instanceSecret.deleteMany();
    await prisma.user.deleteMany();
    delete process.env.JWT_SECRET;
    delete process.env.CREDENTIALS_ENC_KEY;
    // Reset the SecretService cache by reaching into private state — the
    // service is otherwise long-lived for the whole app instance.
    // The cache may be Map<SecretKey, string> or Map<SecretKey, Promise<string>>
    // depending on the implementation version; keep the cast loose.
    (secretService as unknown as { cache: Map<string, unknown> }).cache.clear();
  });

  it('GET /setup returns 200 with form schema when no admin exists', async () => {
    const response = await request(app.getHttpServer()).get('/setup');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      needsSetup: true,
      fields: [
        { name: 'email', type: 'email' },
        { name: 'password', type: 'password', minLength: 12 },
      ],
    });
  });

  it('POST /setup creates the admin and seeds both InstanceSecret rows', async () => {
    const response = await request(app.getHttpServer())
      .post('/setup')
      .send({ email: 'admin@example.com', password: 'correct-horse-1' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      email: 'admin@example.com',
    });

    const users = await prisma.user.findMany();
    expect(users).toHaveLength(1);
    const user0 = users[0];
    expect(user0).toBeDefined();
    if (user0 === undefined) throw new Error('expected user0');
    expect(user0.role).toBe('admin');
    await expect(argon2.verify(user0.passwordHash, 'correct-horse-1')).resolves.toBe(true);

    const secrets = await prisma.instanceSecret.findMany({ orderBy: { key: 'asc' } });
    expect(secrets.map((s) => s.key)).toEqual(['CREDENTIALS_ENC_KEY', 'JWT_SECRET']);
    for (const s of secrets) {
      expect(s.value).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('GET /setup returns 410 after the admin exists', async () => {
    await request(app.getHttpServer())
      .post('/setup')
      .send({ email: 'admin@example.com', password: 'correct-horse-1' });
    const response = await request(app.getHttpServer()).get('/setup');
    expect(response.status).toBe(410);
    expect(response.body).toEqual({ needsSetup: false });
  });

  it('POST /setup a second time returns 410 ALREADY_INITIALIZED', async () => {
    await request(app.getHttpServer())
      .post('/setup')
      .send({ email: 'admin@example.com', password: 'correct-horse-1' });
    const response = await request(app.getHttpServer())
      .post('/setup')
      .send({ email: 'other@example.com', password: 'correct-horse-2' });
    expect(response.status).toBe(410);
    expect(response.body).toEqual({ error: 'ALREADY_INITIALIZED' });
  });

  it('POST /setup with a short password returns 400 VALIDATION', async () => {
    const response = await request(app.getHttpServer())
      .post('/setup')
      .send({ email: 'admin@example.com', password: 'short' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION');
    expect(Array.isArray(response.body.issues)).toBe(true);
    const users = await prisma.user.findMany();
    expect(users).toHaveLength(0);
  });

  it('POST /setup with an extra key returns 400 VALIDATION (strict mode)', async () => {
    const response = await request(app.getHttpServer())
      .post('/setup')
      .send({ email: 'admin@example.com', password: 'correct-horse-1', role: 'super' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION');
  });

  it('parallel POST /setup yields exactly one 201 and one User row', async () => {
    const promises = Array.from({ length: 8 }, (_, i) =>
      request(app.getHttpServer())
        .post('/setup')
        .send({ email: `admin${i}@example.com`, password: 'correct-horse-1' }),
    );
    const responses = await Promise.all(promises);
    const successes = responses.filter((r) => r.status === 201);
    const rejected = responses.filter((r) => r.status === 410 || r.status === 409);
    expect(successes).toHaveLength(1);
    expect(rejected.length).toBe(responses.length - 1);

    const users = await prisma.user.findMany();
    expect(users).toHaveLength(1);
    const secrets = await prisma.instanceSecret.findMany();
    expect(secrets).toHaveLength(2);
  });

  it('with JWT_SECRET preset in env, both DB rows are still written and env wins on read', async () => {
    process.env.JWT_SECRET = 'env-supplied-jwt';
    await request(app.getHttpServer())
      .post('/setup')
      .send({ email: 'admin@example.com', password: 'correct-horse-1' });
    const secrets = await prisma.instanceSecret.findMany({ orderBy: { key: 'asc' } });
    expect(secrets.map((s) => s.key)).toEqual(['CREDENTIALS_ENC_KEY', 'JWT_SECRET']);
    await expect(secretService.get('JWT_SECRET')).resolves.toBe('env-supplied-jwt');
  });
});
