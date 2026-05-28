import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM: 256-bit key (32 bytes), 96-bit IV (12 bytes), 128-bit auth tag.
const ALGO = 'aes-256-gcm' as const;
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

export interface EncryptedBlob {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

export class InvalidEncryptionKeyError extends Error {
  constructor(public readonly reason: string) {
    super(`CREDENTIALS_ENC_KEY is invalid: ${reason}`);
    this.name = 'InvalidEncryptionKeyError';
  }
}

export class DecryptionFailedError extends Error {
  constructor() {
    super('decryption failed (tampered ciphertext or wrong key)');
    this.name = 'DecryptionFailedError';
  }
}

function parseKey(hexKey: string): Buffer {
  if (!/^[0-9a-f]{64}$/i.test(hexKey)) {
    throw new InvalidEncryptionKeyError('must be 64 hex chars (32 bytes)');
  }
  const buf = Buffer.from(hexKey, 'hex');
  if (buf.byteLength !== KEY_BYTES) {
    throw new InvalidEncryptionKeyError(`key must decode to ${KEY_BYTES.toString()} bytes`);
  }
  return buf;
}

export function encryptString(hexKey: string, plaintext: string): EncryptedBlob {
  const key = parseKey(hexKey);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  if (authTag.byteLength !== AUTH_TAG_BYTES) {
    throw new Error(`unexpected auth tag length: ${authTag.byteLength.toString()}`);
  }
  return { ciphertext, iv, authTag };
}

export function decryptString(hexKey: string, blob: EncryptedBlob): string {
  const key = parseKey(hexKey);
  const decipher = createDecipheriv(ALGO, key, blob.iv);
  decipher.setAuthTag(blob.authTag);
  try {
    const plaintext = Buffer.concat([decipher.update(blob.ciphertext), decipher.final()]);
    return plaintext.toString('utf8');
  } catch {
    throw new DecryptionFailedError();
  }
}
