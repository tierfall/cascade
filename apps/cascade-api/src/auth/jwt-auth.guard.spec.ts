import { jest } from '@jest/globals';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService, type AuthenticatedUser, type JwtPayload } from './auth.service.js';
import { JwtAuthGuard, SESSION_COOKIE_NAME, type AuthenticatedRequest } from './jwt-auth.guard.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

type CookieJar = Record<string, string | undefined>;

function makeContext(
  cookies: CookieJar,
  isPublic: boolean,
): {
  ctx: ExecutionContext;
  reflector: Reflector;
  request: AuthenticatedRequest;
} {
  const request = { cookies } as AuthenticatedRequest;
  const reflector = new Reflector();
  jest
    .spyOn(reflector, 'getAllAndOverride')
    .mockImplementation((key: unknown): boolean | undefined => {
      if (key === IS_PUBLIC_KEY) return isPublic;
      return undefined;
    });
  const ctx = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getHandler: () => ({}) as never,
    getClass: () => ({}) as never,
  } as unknown as ExecutionContext;
  return { ctx, reflector, request };
}

describe('JwtAuthGuard', () => {
  const verifyToken = jest.fn<(t: string) => Promise<JwtPayload>>();
  const loadUser = jest.fn<(id: string) => Promise<AuthenticatedUser>>();
  const authService = { verifyToken, loadUser } as unknown as AuthService;

  beforeEach(() => {
    verifyToken.mockReset();
    loadUser.mockReset();
  });

  it('returns true without checking cookies when handler is @Public()', async () => {
    const { ctx, reflector } = makeContext({}, true);
    const guard = new JwtAuthGuard(reflector, authService);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when cookie is missing', async () => {
    const { ctx, reflector } = makeContext({}, false);
    const guard = new JwtAuthGuard(reflector, authService);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException when cookie is empty', async () => {
    const { ctx, reflector } = makeContext({ [SESSION_COOKIE_NAME]: '' }, false);
    const guard = new JwtAuthGuard(reflector, authService);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('propagates verifyToken UnauthorizedException', async () => {
    const { ctx, reflector } = makeContext({ [SESSION_COOKIE_NAME]: 'expired' }, false);
    verifyToken.mockRejectedValueOnce(new UnauthorizedException('expired'));
    const guard = new JwtAuthGuard(reflector, authService);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches user to request and returns true on valid token', async () => {
    const { ctx, reflector, request } = makeContext(
      { [SESSION_COOKIE_NAME]: 'valid-token' },
      false,
    );
    verifyToken.mockResolvedValueOnce({ sub: 'u1', email: 'admin@example.com' });
    loadUser.mockResolvedValueOnce({ id: 'u1', email: 'admin@example.com', role: 'admin' });
    const guard = new JwtAuthGuard(reflector, authService);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'u1', email: 'admin@example.com', role: 'admin' });
  });

  it('treats undefined cookies object as missing cookie', async () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const request = {} as AuthenticatedRequest;
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
      getHandler: () => ({}) as never,
      getClass: () => ({}) as never,
    } as unknown as ExecutionContext;
    const guard = new JwtAuthGuard(reflector, authService);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
