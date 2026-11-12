import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/auth/entities/user.entity';
import { UserRole } from 'src/auth/entities/user.entity';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  CreateUserDto,
  UpdateRoleDto,
} from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.username && dto.username !== user.username) {
      const exists = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if (exists) throw new ConflictException('El username ya está en uso');
    }

    if (dto.email && dto.email !== user.email) {
      const exists = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (exists) throw new ConflictException('El email ya está en uso');
    }

    await this.userRepository.update(userId, {
      ...(dto.username && { username: dto.username }),
      ...(dto.email && { email: dto.email }),
      ...(dto.phone && { phone: dto.phone }),
      ...(dto.birth_date && { birth_date: dto.birth_date }),
    });

    return this.getProfile(userId);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const storedHash = user.password.toString('utf8');
    const isMatch = await bcrypt.compare(dto.current_password, storedHash);

    if (!isMatch) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const newHash = await bcrypt.hash(dto.new_password, 10);
    await this.userRepository.update(userId, {
      password: Buffer.from(newHash),
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  async findAll() {
    const users = await this.userRepository.find({
      order: { created_at: 'DESC' },
    });
    return users.map((u) => this.sanitizeUser(u));
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.sanitizeUser(user);
  }

  async createUser(dto: CreateUserDto) {
    const exists = await this.userRepository.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (exists)
      throw new ConflictException('El email o username ya está en uso');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      password: Buffer.from(hashedPassword),
      phone: dto.phone,
      birth_date: dto.birth_date,
      role: (dto.role as UserRole) ?? UserRole.CLIENT,
    });

    const saved = await this.userRepository.save(user);
    return this.sanitizeUser(saved);
  }

  async updateRole(id: number, dto: UpdateRoleDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    await this.userRepository.update(id, { role: dto.role as UserRole });
    return this.findOne(id);
  }

  async removeUser(adminId: number, targetId: number) {
    if (adminId === targetId) {
      throw new ForbiddenException('No puedes eliminarte a ti mismo');
    }
    const user = await this.userRepository.findOne({ where: { id: targetId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    await this.userRepository.delete(targetId);
    return { message: 'Usuario eliminado correctamente' };
  }

  private sanitizeUser(user: User) {
    const { password, ...safe } = user;
    return safe;
  }
}
