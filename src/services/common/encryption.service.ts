import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const secret = this.config.get<string>('ENCRYPTION_KEY') ?? '';
    this.key = Buffer.from(secret.padEnd(32, '0').slice(0, 32), 'utf8');
  }

  encrypt(text: string): Buffer {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    return Buffer.concat([iv, encrypted]);
  }

  decrypt(data: Buffer): string {
    const iv = data.subarray(0, IV_LENGTH);
    const encrypted = data.subarray(IV_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }
}
