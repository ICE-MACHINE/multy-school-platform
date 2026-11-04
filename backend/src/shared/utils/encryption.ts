import crypto from 'crypto';
import { env } from '../../config/env';

const GCM_V1_PREFIX = 'gcm:v1:';
const GCM_V2_PREFIX = 'gcm:v2:';
const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;

function keyFromMaterial(material: string): Buffer {
  return /^[0-9a-fA-F]{64}$/.test(material)
    ? Buffer.from(material, 'hex')
    : crypto.createHash('sha256').update(material).digest();
}

const keyCache = new Map<string, Buffer>();

export function currentEncryptionKeyId(): string {
  return env.security.encryptionKeyId || 'k1';
}

function configuredKeyRing(): Record<string, string> {
  const raw = env.security.encryptionKeys;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const ring: Record<string, string> = {};
      for (const [kid, value] of Object.entries(parsed)) {
        if (typeof value === 'string' && value) ring[kid] = value;
      }
      if (Object.keys(ring).length > 0) return ring;
    } catch {
      throw new Error('ENCRYPTION_KEYS must be a JSON object of {keyId: material}');
    }
  }
  return { [currentEncryptionKeyId()]: env.security.encryptionKey || `${env.jwt.secret}:field-encryption` };
}

export function getEncryptionKey(keyId: string): Buffer {
  const cached = keyCache.get(keyId);
  if (cached) return cached;
  const ring = configuredKeyRing();
  const material = ring[keyId];
  if (!material) throw new Error(`Unknown encryption key id "${keyId}"`);
  const key = keyFromMaterial(material);
  keyCache.set(keyId, key);
  return key;
}

function decryptGcmPayload(base64Payload: string, key: Buffer): string {
  const payload = Buffer.from(base64Payload, 'base64');
  const iv = payload.subarray(0, GCM_IV_LENGTH);
  const tag = payload.subarray(GCM_IV_LENGTH, GCM_IV_LENGTH + GCM_TAG_LENGTH);
  const ciphertext = payload.subarray(GCM_IV_LENGTH + GCM_TAG_LENGTH);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

export const encrypt = (text: string): string => {
  const keyId = currentEncryptionKeyId();
  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(keyId), iv);
  const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${GCM_V2_PREFIX}${keyId}:` + Buffer.concat([iv, tag, ciphertext]).toString('base64');
};

export const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return encryptedText;

  if (encryptedText.startsWith(GCM_V2_PREFIX)) {
    const rest = encryptedText.slice(GCM_V2_PREFIX.length);
    const separator = rest.indexOf(':');
    if (separator <= 0) throw new Error('Malformed gcm:v2 ciphertext (missing key id)');
    const keyId = rest.slice(0, separator);
    return decryptGcmPayload(rest.slice(separator + 1), getEncryptionKey(keyId));
  }

  if (encryptedText.startsWith(GCM_V1_PREFIX)) {
    // v1 payloads predate key ids; they were written with the single
    // ENCRYPTION_KEY (or its fallback) of their time.
    const v1Material = env.security.encryptionKey || `${env.jwt.secret}:field-encryption`;
    return decryptGcmPayload(encryptedText.slice(GCM_V1_PREFIX.length), keyFromMaterial(v1Material));
  }

  if (/^[0-9a-fA-F]{32}:[0-9a-fA-F]+$/.test(encryptedText)) {
    throw new Error(
      'Legacy AES-CBC ciphertext detected. Run the one-time migration (npm run security:re-encrypt-legacy) before this upgrade; CBC support and its old key have been removed.',
    );
  }

  return encryptedText;
};

export const safeEqual = (a: string | Buffer, b: string | Buffer): boolean => {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
};

export const generateRandomToken = (length = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const generateReceiptNumber = (): string => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `RCP-${timestamp}-${random}`.toUpperCase();
};
