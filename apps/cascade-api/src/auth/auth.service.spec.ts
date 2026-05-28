import { jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { SecretService } from '../secrets/secret.service.js';
import { AuthService } from './auth.service.js';

interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FindUniqueArgs {
  where: { id?: string; email?: string };
}

describe('AuthService', () => {
  const findUnique = jest.fn<(args: FindUniqueArgs) => Promise<UserRow | null>>();
  const getSecret = jest.fn<(key: string) => Promise<string>>();
  let service: AuthService;

  beforeEach(async () => {
    findUnique.mockReset();
    getSecret.mockReset();
    getSecret.mockResolvedValue('a'.repeat(64));
    const prisma = { user: { findUnique } } as unknown as PrismaService;
    const secretService = { get: getSecret } as unknown as SecretService;
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: SecretService, useValue: secretService },
        { provide: JwtService, useValue: new JwtService({}) },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  describe('signToken / verifyToken', () => {
    it('round-trips a payload', async () => {
      const token = await service.signToken({ id: 'u1', email: 'admin@example.com' });
      const payload = await service.verifyToken(token);
      expect(payload.sub).toBe('u1');
      expect(payload.email).toBe('admin@example.com');
    });

    it('rejects a token signed by a different secret', async () => {
      const token = await service.signToken({ id: 'u1', email: 'admin@example.com' });
      getSecret.mockResolvedValueOnce('b'.repeat(64));
      await expect(service.verifyToken(token)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a malformed token', async () => {
      await expect(service.verifyToken('not.a.jwt')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('returns token + user on correct credentials', async () => {
      const passwordHash = await argon2.hash('correct-horse', { type: argon2.argon2id });
      findUnique.mockResolvedValueOnce({
        id: 'u1',
        email: 'admin@example.com',
        passwordHash,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await service.login('admin@example.com', 'correct-horse');
      expect(result.user).toEqual({ id: 'u1', email: 'admin@example.com', role: 'admin' });
      expect(typeof result.token).toBe('string');
      const payload = await service.verifyToken(result.token);
      expect(payload.sub).toBe('u1');
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      findUnique.mockResolvedValueOnce(null);
      await expect(service.login('nope@example.com', 'whatever')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password does not match', async () => {
      const passwordHash = await argon2.hash('correct-horse', { type: argon2.argon2id });
      findUnique.mockResolvedValueOnce({
        id: 'u1',
        email: 'admin@example.com',
        passwordHash,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await expect(service.login('admin@example.com', 'wrong')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('loadUser', () => {
    it('returns the user when found', async () => {
      findUnique.mockResolvedValueOnce({
        id: 'u1',
        email: 'admin@example.com',
        passwordHash: 'x',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await expect(service.loadUser('u1')).resolves.toEqual({
        id: 'u1',
        email: 'admin@example.com',
        role: 'admin',
      });
    });

    it('throws UnauthorizedException when user not found', async () => {
      findUnique.mockResolvedValueOnce(null);
      await expect(service.loadUser('missing')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
