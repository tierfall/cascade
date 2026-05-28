import { jest } from '@jest/globals';
import { Test, type TestingModule } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import { Prisma } from '../../prisma/generated/client/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SecretService } from '../secrets/secret.service.js';
import { CredentialAlreadyExistsError, CredentialNotFoundError } from './credential.errors.js';
import { CredentialService } from './credential.service.js';
import { encryptString } from './crypto.js';

const HEX_KEY = randomBytes(32).toString('hex');

interface MockPrisma {
  encryptedCredential: {
    create: jest.Mock<(args: unknown) => Promise<unknown>>;
    findUnique: jest.Mock<(args: unknown) => Promise<unknown>>;
    findMany: jest.Mock<(args: unknown) => Promise<unknown[]>>;
    delete: jest.Mock<(args: unknown) => Promise<unknown>>;
  };
}

describe('CredentialService', () => {
  let prisma: MockPrisma;
  let service: CredentialService;

  beforeEach(async () => {
    prisma = {
      encryptedCredential: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
      },
    };
    const get = jest.fn<(key: string) => Promise<string>>();
    get.mockResolvedValue(HEX_KEY);
    const secretService = { get } as unknown as SecretService;
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialService,
        { provide: PrismaService, useValue: prisma },
        { provide: SecretService, useValue: secretService },
      ],
    }).compile();
    service = moduleRef.get(CredentialService);
  });

  describe('store', () => {
    it('encrypts the plaintext and persists the cipher+iv+authTag', async () => {
      prisma.encryptedCredential.create.mockResolvedValueOnce({
        id: 'cred_1',
        name: 'OPENAI_API_KEY',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      });
      const result = await service.store('OPENAI_API_KEY', 'sk-secret');
      expect(result.id).toBe('cred_1');
      const args = prisma.encryptedCredential.create.mock.calls[0]?.[0] as {
        data: { name: string; ciphertext: Buffer; iv: Buffer; authTag: Buffer };
      };
      expect(args.data.name).toBe('OPENAI_API_KEY');
      expect(args.data.iv.byteLength).toBe(12);
      expect(args.data.authTag.byteLength).toBe(16);
      expect(args.data.ciphertext.byteLength).toBeGreaterThan(0);
    });

    it('maps P2002 unique-violation to CredentialAlreadyExistsError', async () => {
      prisma.encryptedCredential.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('unique violation', {
          code: 'P2002',
          clientVersion: '6.0.0',
        }),
      );
      await expect(service.store('dup', 'x')).rejects.toBeInstanceOf(CredentialAlreadyExistsError);
    });

    it('rethrows unknown errors', async () => {
      prisma.encryptedCredential.create.mockRejectedValueOnce(new Error('boom'));
      await expect(service.store('x', 'y')).rejects.toThrow('boom');
    });
  });

  describe('reveal', () => {
    it('returns the decrypted plaintext', async () => {
      const blob = encryptString(HEX_KEY, 'roundtrip-secret');
      prisma.encryptedCredential.findUnique.mockResolvedValueOnce({
        id: 'cred_1',
        name: 'X',
        ciphertext: blob.ciphertext,
        iv: blob.iv,
        authTag: blob.authTag,
        createdAt: new Date(),
      });
      const result = await service.reveal('X');
      expect(result.value).toBe('roundtrip-secret');
    });

    it('throws CredentialNotFoundError when the record does not exist', async () => {
      prisma.encryptedCredential.findUnique.mockResolvedValueOnce(null);
      await expect(service.reveal('missing')).rejects.toBeInstanceOf(CredentialNotFoundError);
    });
  });

  describe('list', () => {
    it('returns the summaries without exposing ciphertext', async () => {
      prisma.encryptedCredential.findMany.mockResolvedValueOnce([
        { id: 'a', name: 'A', createdAt: new Date() },
      ]);
      const result = await service.list();
      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('ciphertext');
    });
  });

  describe('remove', () => {
    it('deletes the row', async () => {
      prisma.encryptedCredential.delete.mockResolvedValueOnce(undefined);
      await service.remove('A');
      expect(prisma.encryptedCredential.delete).toHaveBeenCalledWith({ where: { name: 'A' } });
    });

    it('maps P2025 to CredentialNotFoundError', async () => {
      prisma.encryptedCredential.delete.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('row not found', {
          code: 'P2025',
          clientVersion: '6.0.0',
        }),
      );
      await expect(service.remove('missing')).rejects.toBeInstanceOf(CredentialNotFoundError);
    });

    it('rethrows unknown errors', async () => {
      prisma.encryptedCredential.delete.mockRejectedValueOnce(new Error('boom'));
      await expect(service.remove('x')).rejects.toThrow('boom');
    });
  });
});
