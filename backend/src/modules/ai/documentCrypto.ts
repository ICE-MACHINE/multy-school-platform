import crypto from 'crypto';
import { env } from '../../config/env';

function getKey(): Buffer {
  return crypto
    .createHash('sha256')
    .update(env.ai.documentKey || `${env.jwt.secret}:documents`)
    .digest();
}

export function encryptBuffer(buffer: Buffer): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]);
}

export function decryptBuffer(data: Buffer): Buffer {
  if (data.length < 28) {
    throw new Error('Encrypted document is corrupted');
  }
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
