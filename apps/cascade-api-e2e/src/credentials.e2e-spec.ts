import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../cascade-api/src/app.module.js';
import {
  CredentialAlreadyExistsError,
  CredentialNotFoundError,
} from '../../cascade-api/src/credentials/credential.errors.js';
import { CredentialService } from '../../cascade-api/src/credentials/credential.service.js';
import { PrismaService } from '../../cascade-api/src/prisma/prisma.service.js';
import type { SecretKey } from '../../cascade-api/src/secrets/secret-key.js';
import { SecretService } from '../../cascade-api/src/secrets/secret.service.js';
import { type BackingServices, startBackingServices, stopBackingServices } from './containers.js';

describe('CredentialService (integration)', () => {
  let services: BackingServices;
  let app: INestApplication;
  let prisma: PrismaService;
  let credentialService: CredentialService;
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
    credentialService = moduleFixture.get(CredentialService);
    secretService = moduleFixture.get(SecretService);
  });

  afterAll(async () => {
    await app.close();
    await stopBackingServices(services);
  });

  beforeEach(async () => {
    await prisma.encryptedCredential.deleteMany();
    await prisma.instanceSecret.deleteMany();
    await prisma.user.deleteMany();
    delete process.env.JWT_SECRET;
    delete process.env.CREDENTIALS_ENC_KEY;
    (secretService as unknown as { cache: Map<SecretKey, Promise<string>> }).cache.clear();
    // Run setup so CREDENTIALS_ENC_KEY is seeded in the DB.
    await request(app.getHttpServer())
      .post('/setup')
      .send({ email: 'admin@example.com', password: 'correct-horse-1' });
  });

  it('round-trips a secret through store + reveal', async () => {
    const stored = await credentialService.store('OPENAI_API_KEY', 'sk-test-1234');
    expect(stored.name).toBe('OPENAI_API_KEY');
    const revealed = await credentialService.reveal('OPENAI_API_KEY');
    expect(revealed.value).toBe('sk-test-1234');
  });

  it('persists ciphertext that does not contain the plaintext', async () => {
    await credentialService.store('SLACK_WEBHOOK', 'https://hooks.slack.com/services/SECRET/TOKEN');
    const row = await prisma.encryptedCredential.findUnique({
      where: { name: 'SLACK_WEBHOOK' },
    });
    expect(row).not.toBeNull();
    if (row !== null) {
      const cipherAsString = Buffer.from(row.ciphertext).toString('utf8');
      expect(cipherAsString).not.toContain('hooks.slack.com');
      expect(cipherAsString).not.toContain('SECRET');
    }
  });

  it('rejects a tampered ciphertext at decryption time', async () => {
    await credentialService.store('TAMPER_ME', 'original-value');
    // Flip a byte in the stored ciphertext.
    const row = await prisma.encryptedCredential.findUnique({ where: { name: 'TAMPER_ME' } });
    if (row === null) throw new Error('row not found');
    const corrupted = Buffer.from(row.ciphertext);
    corrupted[0] = (corrupted[0] ?? 0) ^ 0xff;
    await prisma.encryptedCredential.update({
      where: { name: 'TAMPER_ME' },
      data: { ciphertext: corrupted },
    });
    await expect(credentialService.reveal('TAMPER_ME')).rejects.toThrow(/decryption failed/i);
  });

  it('throws CredentialAlreadyExistsError on duplicate name', async () => {
    await credentialService.store('UNIQUE', 'first');
    await expect(credentialService.store('UNIQUE', 'second')).rejects.toBeInstanceOf(
      CredentialAlreadyExistsError,
    );
  });

  it('throws CredentialNotFoundError on reveal of missing credential', async () => {
    await expect(credentialService.reveal('MISSING')).rejects.toBeInstanceOf(
      CredentialNotFoundError,
    );
  });

  it('list returns summaries without ciphertext', async () => {
    await credentialService.store('A', 'a-val');
    await credentialService.store('B', 'b-val');
    const list = await credentialService.list();
    expect(list).toHaveLength(2);
    expect(list[0]).not.toHaveProperty('ciphertext');
    expect(list[0]).not.toHaveProperty('value');
  });

  it('remove deletes the row', async () => {
    await credentialService.store('REMOVE_ME', 'gone');
    await credentialService.remove('REMOVE_ME');
    await expect(credentialService.reveal('REMOVE_ME')).rejects.toBeInstanceOf(
      CredentialNotFoundError,
    );
  });

  it('remove on missing credential throws CredentialNotFoundError', async () => {
    await expect(credentialService.remove('NEVER_EXISTED')).rejects.toBeInstanceOf(
      CredentialNotFoundError,
    );
  });
});
