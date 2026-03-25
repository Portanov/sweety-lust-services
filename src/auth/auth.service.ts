import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from './entities/user.entity';
import { VerificationCode } from './entities/verification-code.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginFirstStepDto } from './dto/login-first-step.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const exists = await this.userRepository.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });

    if (exists) {
      throw new ConflictException('El email o username ya está en uso');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      password: Buffer.from(hashedPassword),
      phone: dto.phone,
      birth_date: dto.birth_date,
      role: dto.role || UserRole.CLIENT,
    });

    await this.userRepository.save(user);

    return { message: 'Usuario registrado exitosamente' };
  }

  async loginFirstStep(dto: LoginFirstStepDto): Promise<{
    temp_token: string;
    message: string;
    requires_2fa: boolean;
  }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const storedHash = user.password.toString('utf8');
    const isMatch = await bcrypt.compare(dto.password, storedHash);

    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    await this.verificationCodeRepository.delete({
      email: dto.email,
      is_used: false,
    });

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.verificationCodeRepository.save({
      email: dto.email,
      code: pin,
      expires_at: expiresAt,
    });

    console.log(`PIN para ${dto.email}: ${pin}`);

    const tempToken = this.jwtService.sign(
      {
        email: dto.email,
        type: 'temp',
        step: 'first',
        role: user.role,
      },
      { expiresIn: '10m' },
    );

    return {
      temp_token: tempToken,
      message: 'Código de verificación enviado',
      requires_2fa: true,
    };
  }

  async verifyPin(dto: VerifyPinDto): Promise<LoginResponseDto> {
    let tempPayload: any;
    try {
      tempPayload = this.jwtService.verify(dto.temp_token);
      if (tempPayload.type !== 'temp' || tempPayload.step !== 'first') {
        throw new UnauthorizedException('Token inválido');
      }

      if (tempPayload.email !== dto.email) {
        throw new UnauthorizedException('Email no coincide con el token');
      }
    } catch (error) {
      throw new UnauthorizedException('Token expirado o inválido');
    }

    const verificationCode = await this.verificationCodeRepository.findOne({
      where: {
        email: dto.email,
        code: dto.pin,
        is_used: false,
        expires_at: MoreThan(new Date()),
      },
    });

    if (!verificationCode) {
      throw new BadRequestException('PIN inválido o expirado');
    }

    verificationCode.is_used = true;
    await this.verificationCodeRepository.save(verificationCode);

    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '8h' });

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
}
