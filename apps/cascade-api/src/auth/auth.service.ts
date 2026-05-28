import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { SecretService } from '../secrets/secret.service.js';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly secretService: SecretService,
    private readonly jwtService: JwtService,
  ) {}

  async signToken(user: { id: string; email: string }): Promise<string> {
    const secret = await this.secretService.get('JWT_SECRET');
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const options: JwtSignOptions = { secret, expiresIn: DEFAULT_TOKEN_TTL_SECONDS };
    return this.jwtService.signAsync(payload, options);
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    const secret = await this.secretService.get('JWT_SECRET');
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, { secret });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ token: string; user: AuthenticatedUser }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user === null) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = await this.signToken({ id: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email, role: user.role } };
  }

  async loadUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user === null) {
      throw new UnauthorizedException('User not found');
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
