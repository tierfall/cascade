import { SetupBodySchema } from './dto.js';

describe('SetupBodySchema', () => {
  it('accepts a valid email + 12-char password', () => {
    const result = SetupBodySchema.safeParse({
      email: 'admin@example.com',
      password: 'correct-horse',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-email', () => {
    const result = SetupBodySchema.safeParse({ email: 'nope', password: 'correct-horse' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 12 chars', () => {
    const result = SetupBodySchema.safeParse({
      email: 'admin@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects extra keys (strict mode)', () => {
    const result = SetupBodySchema.safeParse({
      email: 'admin@example.com',
      password: 'correct-horse',
      role: 'superuser',
    });
    expect(result.success).toBe(false);
  });
});
