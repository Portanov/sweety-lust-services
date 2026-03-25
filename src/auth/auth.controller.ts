import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginFirstStepDto } from './dto/login-first-step.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login-first-step')
  @HttpCode(HttpStatus.OK)
  async loginFirstStep(@Body() dto: LoginFirstStepDto) {
    return this.authService.loginFirstStep(dto);
  }

  @Post('verify-pin')
  @HttpCode(HttpStatus.OK)
  async verifyPin(@Body() dto: VerifyPinDto) {
    return this.authService.verifyPin(dto);
  }
}
