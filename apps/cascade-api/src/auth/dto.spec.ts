import { LoginBodySchema } from './dto.js';

describe('LoginBodySchema', () => {
  it('accepts valid email and non-empty password', () => {
    expect(LoginBodySchema.safeParse({ email: 'admin@example.com', password: 'pw' }).success).toBe(
      true,
    );
  });

  it('rejects malformed email', () => {
    expect(LoginBodySchema.safeParse({ email: 'nope', password: 'pw' }).success).toBe(false);
  });

  it('rejects empty password', () => {
    expect(LoginBodySchema.safeParse({ email: 'admin@example.com', password: '' }).success).toBe(
      false,
    );
  });

  it('rejects extra keys (strict)', () => {
    expect(
      LoginBodySchema.safeParse({
        email: 'admin@example.com',
        password: 'pw',
        role: 'super',
      }).success,
    ).toBe(false);
  });
});
