import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../cascade-api/src/app.module.js';
import { AuthService } from '../../cascade-api/src/auth/auth.service.js';
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

describe('/auth (integration)', () => {
  let services: BackingServices;
  let app: INestApplication;
  let prisma: PrismaService;
  let secretService: SecretService;
  let authService: AuthService;
  let jwtService: JwtService;

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
    authService = moduleFixture.get(AuthService);
    jwtService = moduleFixture.get(JwtService);
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
    (secretService as unknown as { cache: Map<SecretKey, Promise<string>> }).cache.clear();
    await request(app.getHttpServer())
      .post('/setup')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  });

  describe('POST /auth/login', () => {
    it('returns 200 with user payload and sets HttpOnly cookie on success', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({ email: ADMIN_EMAIL, role: 'admin' });
      const setCookie = response.headers['set-cookie'] as string[] | undefined;
      const cookieEntry = setCookie?.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
      expect(cookieEntry).toBeDefined();
      expect(cookieEntry).toMatch(/HttpOnly/i);
      expect(cookieEntry).toMatch(/SameSite=Lax/i);
      expect(cookieEntry).not.toMatch(/Secure/i);
    });

    it('rejects unknown email with 401', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nope@example.com', password: ADMIN_PASSWORD });
      expect(response.status).toBe(401);
    });

    it('rejects wrong password with 401', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: ADMIN_EMAIL, password: 'wrong-password' });
      expect(response.status).toBe(401);
    });

    it('rejects malformed body with 400 VALIDATION', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email' });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('VALIDATION');
    });
  });

  describe('JWT guard on protected routes', () => {
    async function login(): Promise<string> {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
      const token = readSessionCookie(response.headers['set-cookie'] as string[] | undefined);
      if (token === undefined) {
        throw new Error('login did not return a session cookie');
      }
      return token;
    }

    it('GET /auth/me returns 401 without cookie', async () => {
      const response = await request(app.getHttpServer()).get('/auth/me');
      expect(response.status).toBe(401);
    });

    it('GET /auth/me returns 200 with valid cookie', async () => {
      const token = await login();
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `${SESSION_COOKIE_NAME}=${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ email: ADMIN_EMAIL, role: 'admin' });
    });

    it('GET /auth/me returns 401 with a malformed token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `${SESSION_COOKIE_NAME}=not.a.jwt`);
      expect(response.status).toBe(401);
    });

    it('GET /auth/me returns 401 with a token signed by the wrong secret', async () => {
      const forged = await jwtService.signAsync(
        { sub: 'u1', email: ADMIN_EMAIL },
        { secret: 'wrong-secret' },
      );
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `${SESSION_COOKIE_NAME}=${forged}`);
      expect(response.status).toBe(401);
    });

    it('GET /auth/me returns 401 with an expired token', async () => {
      const user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
      if (user === null) throw new Error('admin not found');
      const secret = await secretService.get('JWT_SECRET');
      const expired = await jwtService.signAsync(
        { sub: user.id, email: user.email },
        { secret, expiresIn: -10 },
      );
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `${SESSION_COOKIE_NAME}=${expired}`);
      expect(response.status).toBe(401);
    });

    it('POST /auth/logout clears the session cookie', async () => {
      const token = await login();
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', `${SESSION_COOKIE_NAME}=${token}`);
      expect(response.status).toBe(204);
      const setCookie = response.headers['set-cookie'] as string[] | undefined;
      const cleared = setCookie?.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
      expect(cleared).toBeDefined();
      expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970/i);
    });
  });

  describe('@Public() routes', () => {
    it('GET /health is reachable without a session', async () => {
      const response = await request(app.getHttpServer()).get('/health');
      expect(response.status).toBe(200);
    });

    it('GET /setup is reachable without a session', async () => {
      const response = await request(app.getHttpServer()).get('/setup');
      // After setup is done (in beforeEach), /setup returns 410.
      expect([200, 410]).toContain(response.status);
    });
  });

  describe('signToken / verifyToken via AuthService', () => {
    it('round-trips a signed token using JWT_SECRET from the DB', async () => {
      const user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
      if (user === null) throw new Error('admin not found');
      const token = await authService.signToken({ id: user.id, email: user.email });
      const payload = await authService.verifyToken(token);
      expect(payload.sub).toBe(user.id);
      expect(payload.email).toBe(user.email);
    });
  });
});
