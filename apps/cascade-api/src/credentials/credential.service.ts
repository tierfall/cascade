import { Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/client/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SecretService } from '../secrets/secret.service.js';
import { CredentialAlreadyExistsError, CredentialNotFoundError } from './credential.errors.js';
import { decryptString, encryptString } from './crypto.js';

export interface CredentialSummary {
  id: string;
  name: string;
  createdAt: Date;
}

export interface CredentialDetail extends CredentialSummary {
  value: string;
}

@Injectable()
export class CredentialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly secretService: SecretService,
  ) {}

  async store(name: string, plaintext: string): Promise<CredentialSummary> {
    const key = await this.secretService.get('CREDENTIALS_ENC_KEY');
    const blob = encryptString(key, plaintext);
    try {
      const row = await this.prisma.encryptedCredential.create({
        data: {
          name,
          ciphertext: new Uint8Array(blob.ciphertext),
          iv: new Uint8Array(blob.iv),
          authTag: new Uint8Array(blob.authTag),
        },
      });
      return { id: row.id, name: row.name, createdAt: row.createdAt };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new CredentialAlreadyExistsError(name);
      }
      throw err;
    }
  }

  async reveal(name: string): Promise<CredentialDetail> {
    const row = await this.prisma.encryptedCredential.findUnique({ where: { name } });
    if (row === null) {
      throw new CredentialNotFoundError(name);
    }
    const key = await this.secretService.get('CREDENTIALS_ENC_KEY');
    const plaintext = decryptString(key, {
      ciphertext: Buffer.from(row.ciphertext),
      iv: Buffer.from(row.iv),
      authTag: Buffer.from(row.authTag),
    });
    return { id: row.id, name: row.name, createdAt: row.createdAt, value: plaintext };
  }

  async list(): Promise<CredentialSummary[]> {
    const rows = await this.prisma.encryptedCredential.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true },
    });
    return rows;
  }

  async remove(name: string): Promise<void> {
    try {
      await this.prisma.encryptedCredential.delete({ where: { name } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new CredentialNotFoundError(name);
      }
      throw err;
    }
  }
}
