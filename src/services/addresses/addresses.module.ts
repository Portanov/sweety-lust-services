import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DeliveryAddress } from './entities/delivery-address.entity';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { EncryptionService } from '../common/encryption.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([DeliveryAddress])],
  controllers: [AddressesController],
  providers: [AddressesService, EncryptionService],
  exports: [AddressesService],
})
export class AddressesModule {}
