import { randomBytes } from 'node:crypto';
import {
  DecryptionFailedError,
  InvalidEncryptionKeyError,
  decryptString,
  encryptString,
} from './crypto.js';

const HEX_KEY = randomBytes(32).toString('hex');
const OTHER_HEX_KEY = randomBytes(32).toString('hex');

describe('encryptString / decryptString', () => {
  it('round-trips a plaintext via the same key', () => {
    const blob = encryptString(HEX_KEY, 'super-secret');
    expect(decryptString(HEX_KEY, blob)).toBe('super-secret');
  });

  it('produces a 12-byte IV and a 16-byte auth tag', () => {
    const blob = encryptString(HEX_KEY, 'x');
    expect(blob.iv.byteLength).toBe(12);
    expect(blob.authTag.byteLength).toBe(16);
  });

  it('produces different ciphertext + IV for the same plaintext+key (random IV)', () => {
    const a = encryptString(HEX_KEY, 'hello');
    const b = encryptString(HEX_KEY, 'hello');
    expect(Buffer.compare(a.iv, b.iv)).not.toBe(0);
    expect(Buffer.compare(a.ciphertext, b.ciphertext)).not.toBe(0);
  });

  it('throws DecryptionFailedError on tampered ciphertext', () => {
    const blob = encryptString(HEX_KEY, 'tamper-me');
    blob.ciphertext[0] = (blob.ciphertext[0] ?? 0) ^ 0xff;
    expect(() => decryptString(HEX_KEY, blob)).toThrow(DecryptionFailedError);
  });

  it('throws DecryptionFailedError on tampered auth tag', () => {
    const blob = encryptString(HEX_KEY, 'tamper-tag');
    blob.authTag[0] = (blob.authTag[0] ?? 0) ^ 0xff;
    expect(() => decryptString(HEX_KEY, blob)).toThrow(DecryptionFailedError);
  });

  it('throws DecryptionFailedError when decrypted with the wrong key', () => {
    const blob = encryptString(HEX_KEY, 'mismatched-key');
    expect(() => decryptString(OTHER_HEX_KEY, blob)).toThrow(DecryptionFailedError);
  });

  it('rejects a key that is not 64 hex chars', () => {
    expect(() => encryptString('short', 'x')).toThrow(InvalidEncryptionKeyError);
    expect(() => encryptString('z'.repeat(64), 'x')).toThrow(InvalidEncryptionKeyError);
  });

  it('handles empty plaintext', () => {
    const blob = encryptString(HEX_KEY, '');
    expect(decryptString(HEX_KEY, blob)).toBe('');
  });

  it('handles unicode plaintext', () => {
    const blob = encryptString(HEX_KEY, 'héllo wörld 🎉');
    expect(decryptString(HEX_KEY, blob)).toBe('héllo wörld 🎉');
  });
});
