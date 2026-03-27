import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryAddress } from './entities/delivery-address.entity';
import { EncryptionService } from '../common/encryption.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(DeliveryAddress)
    private readonly addressRepo: Repository<DeliveryAddress>,
    private readonly encryption: EncryptionService,
  ) {}

  private encryptFields(dto: CreateAddressDto) {
    return {
      recipient_phone: this.encryption.encrypt(dto.recipient_phone),
      street: this.encryption.encrypt(dto.street),
      ext_number: this.encryption.encrypt(dto.ext_number),
      neighborhood: this.encryption.encrypt(dto.neighborhood),
    };
  }

  private decryptAddress(address: DeliveryAddress) {
    return {
      id: address.id,
      userId: address.userId,
      recipient_name: address.recipient_name,
      recipient_phone: this.encryption.decrypt(address.recipient_phone),
      street: this.encryption.decrypt(address.street),
      ext_number: this.encryption.decrypt(address.ext_number),
      int_number: address.int_number,
      neighborhood: this.encryption.decrypt(address.neighborhood),
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      references: address.references,
      is_default: address.is_default,
      created_at: address.created_at,
    };
  }

  async create(userId: number, dto: CreateAddressDto) {
    if (dto.is_default) {
      await this.addressRepo.update({ userId }, { is_default: false });
    }

    const address = this.addressRepo.create({
      userId,
      recipient_name: dto.recipient_name,
      int_number: dto.int_number,
      city: dto.city,
      state: dto.state,
      postal_code: dto.postal_code,
      references: dto.references,
      is_default: dto.is_default ?? false,
      ...this.encryptFields(dto),
    });

    const saved = await this.addressRepo.save(address);
    return this.decryptAddress(saved);
  }

  async findAllByUser(userId: number) {
    const addresses = await this.addressRepo.find({ where: { userId } });
    return addresses.map((a) => this.decryptAddress(a));
  }

  async findOne(id: number, userId: number) {
    const address = await this.addressRepo.findOne({ where: { id } });
    if (!address) throw new NotFoundException('Dirección no encontrada');
    if (address.userId !== userId)
      throw new ForbiddenException('No tienes acceso a esta dirección');
    return this.decryptAddress(address);
  }

  async update(id: number, userId: number, dto: UpdateAddressDto) {
    const address = await this.addressRepo.findOne({ where: { id } });
    if (!address) throw new NotFoundException('Dirección no encontrada');
    if (address.userId !== userId) throw new ForbiddenException();

    if (dto.is_default) {
      await this.addressRepo.update({ userId }, { is_default: false });
    }

    await this.addressRepo.update(id, {
      recipient_name: dto.recipient_name,
      int_number: dto.int_number,
      city: dto.city,
      state: dto.state,
      postal_code: dto.postal_code,
      references: dto.references,
      is_default: dto.is_default ?? address.is_default,
      ...this.encryptFields(dto),
    });

    const updated = await this.addressRepo.findOne({ where: { id } });
    return this.decryptAddress(updated!);
  }

  async remove(id: number, userId: number) {
    const address = await this.addressRepo.findOne({ where: { id } });
    if (!address) throw new NotFoundException('Dirección no encontrada');
    if (address.userId !== userId) throw new ForbiddenException();
    await this.addressRepo.delete(id);
    return { message: 'Dirección eliminada' };
  }
}
