import { jest } from '@jest/globals';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { AuthController } from './auth.controller.js';
import { AuthService, type AuthenticatedUser } from './auth.service.js';
import { SESSION_COOKIE_NAME, type AuthenticatedRequest } from './jwt-auth.guard.js';

function buildResponse(): {
  res: Response;
  cookie: jest.Mock;
  clearCookie: jest.Mock;
} {
  const cookie = jest.fn();
  const clearCookie = jest.fn();
  return {
    cookie,
    clearCookie,
    res: { cookie, clearCookie } as unknown as Response,
  };
}

describe('AuthController', () => {
  const login =
    jest.fn<
      (email: string, password: string) => Promise<{ token: string; user: AuthenticatedUser }>
    >();
  let controller: AuthController;

  beforeEach(async () => {
    login.mockReset();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: { login } }],
    }).compile();
    controller = moduleRef.get(AuthController);
  });

  describe('POST /auth/login', () => {
    const validBody = { email: 'admin@example.com', password: 'correct-horse' };

    it('sets a session cookie and returns the user on success', async () => {
      login.mockResolvedValueOnce({
        token: 'signed.jwt.value',
        user: { id: 'u1', email: validBody.email, role: 'admin' },
      });
      const { res, cookie } = buildResponse();
      const result = await controller.login(validBody, res);
      expect(result).toEqual({
        user: { id: 'u1', email: validBody.email, role: 'admin' },
      });
      expect(cookie).toHaveBeenCalledTimes(1);
      const [name, value, opts] = cookie.mock.calls[0] ?? [];
      expect(name).toBe(SESSION_COOKIE_NAME);
      expect(value).toBe('signed.jwt.value');
      expect(opts).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/' });
    });

    it('throws BadRequestException for invalid body', async () => {
      const { res } = buildResponse();
      await expect(controller.login({ email: 'nope', password: '' }, res)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(login).not.toHaveBeenCalled();
    });

    it('propagates UnauthorizedException from AuthService', async () => {
      login.mockRejectedValueOnce(new UnauthorizedException());
      const { res } = buildResponse();
      await expect(controller.login(validBody, res)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('POST /auth/logout', () => {
    it('clears the session cookie', () => {
      const { res, clearCookie } = buildResponse();
      controller.logout(res);
      expect(clearCookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME, { path: '/' });
    });
  });

  describe('GET /auth/me', () => {
    it('returns the user attached by the guard', () => {
      const user: AuthenticatedUser = { id: 'u1', email: 'admin@example.com', role: 'admin' };
      const req = { user } as AuthenticatedRequest;
      expect(controller.me(req)).toEqual(user);
    });

    it('throws UnauthorizedException when no user is attached', () => {
      const req = {} as AuthenticatedRequest;
      expect(() => controller.me(req)).toThrow(UnauthorizedException);
    });
  });
});
