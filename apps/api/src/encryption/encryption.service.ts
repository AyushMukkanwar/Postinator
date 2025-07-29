import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService implements OnModuleInit {
  private key: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  // FIX: Switched to the recommended 12-byte (96-bit) IV for AES-GCM
  private readonly ivLength = 12;
  private readonly authTagLength = 16;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey || encryptionKey.length !== 64) {
      throw new Error(
        'ENCRYPTION_KEY must be a 64-character hex string (32 bytes)'
      );
    }
    this.key = Buffer.from(encryptionKey, 'hex');
  }

  encrypt(text: string): string {
    if (text === null || typeof text === 'undefined') {
      return text;
    }
    // Use the corrected 12-byte IV length
    const iv = crypto.randomBytes(this.ivLength);

    // It's good practice to pass the authTagLength option explicitly
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv, {
      authTagLength: this.authTagLength,
    });

    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]).toString('hex');
  }

  decrypt(encryptedText: string): string {
    if (encryptedText === null || typeof encryptedText === 'undefined') {
      return encryptedText;
    }
    try {
      const encryptedBuffer = Buffer.from(encryptedText, 'hex');

      // FIX: Use modern `subarray` which is more performant than deprecated `slice`
      const iv = encryptedBuffer.subarray(0, this.ivLength);
      const authTag = encryptedBuffer.subarray(
        this.ivLength,
        this.ivLength + this.authTagLength
      );
      const encrypted = encryptedBuffer.subarray(
        this.ivLength + this.authTagLength
      );

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv, {
        authTagLength: this.authTagLength,
      });
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Decryption failed:', error);
      // It's better to throw a more specific error or handle it gracefully
      throw new Error('Decryption failed: Invalid or corrupted data');
    }
  }
}
