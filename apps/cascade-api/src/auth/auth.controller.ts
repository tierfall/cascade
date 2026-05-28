import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService, type AuthenticatedUser } from './auth.service.js';
import { LoginBodySchema } from './dto.js';
import { SESSION_COOKIE_NAME, type AuthenticatedRequest } from './jwt-auth.guard.js';
import { Public } from './public.decorator.js';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthenticatedUser }> {
    const parsed = LoginBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'VALIDATION',
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
          code: i.code,
        })),
      });
    }
    const { token, user } = await this.authService.login(parsed.data.email, parsed.data.password);
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_MS,
      path: '/',
    });
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  }

  @Get('me')
  me(@Req() req: AuthenticatedRequest): AuthenticatedUser {
    if (req.user === undefined) {
      throw new UnauthorizedException();
    }
    return req.user;
  }
}
