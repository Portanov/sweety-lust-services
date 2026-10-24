import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginFirstStepDto } from './dto/login-first-step.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Res } from '@nestjs/common';
import '@fastify/cookie';

const isProduction = process.env.NODE_ENV === 'production';
const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  signed: true,
} as const;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login-first-step')
  @HttpCode(HttpStatus.OK)
  async loginFirstStep(
    @Body() dto: LoginFirstStepDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const { temp_token, ...rest } = await this.authService.loginFirstStep(dto);

    res.setCookie('temp_token', temp_token, {
      ...baseCookieOptions,
      path: '/api/auth',
      maxAge: 10 * 60,
    });

    return rest;
  }

  @Post('verify-pin')
  @HttpCode(HttpStatus.OK)
  async verifyPin(
    @Body() dto: VerifyPinDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const cookieVal = req.cookies['temp_token'];
    const unsigned = cookieVal ? req.unsignCookie(cookieVal) : null;
    if (!unsigned?.valid || !unsigned.value) {
      throw new UnauthorizedException('Token expirado o inválido');
    }

    const { access_token, user } = await this.authService.verifyPin(
      dto,
      unsigned.value,
    );

    res.setCookie('access_token', access_token, {
      ...baseCookieOptions,
      path: '/',
      maxAge: 8 * 60 * 60,
    });

    res.clearCookie('temp_token', { path: '/api/auth' });

    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: FastifyReply) {
    res.clearCookie('access_token', { path: '/' });
    return { message: 'Sesión cerrada' };
  }
}
