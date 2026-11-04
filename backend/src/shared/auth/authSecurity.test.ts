import assert from 'node:assert';
import { assertPasswordStrength } from '../utils/passwordPolicy';
import {
  clearLoginFailures,
  isLoginLocked,
  loginThrottleKey,
  recordLoginFailure,
  resetLoginThrottleForTests,
} from '../utils/loginThrottle';
import { decrypt, encrypt } from '../utils/encryption';
import { isTokenRevoked } from './sessionRevocation';

assert.doesNotThrow(() => assertPasswordStrength('correct horse battery staple'));
assert.doesNotThrow(() => assertPasswordStrength('Passw0rd12345'));
assert.throws(() => assertPasswordStrength('short1'), /at least 12/);
assert.throws(() => assertPasswordStrength('password1234'), /too common/);

resetLoginThrottleForTests();
const key = loginThrottleKey('0555000000', 'school-a');
const t0 = new Date('2026-01-01T00:00:00Z');
for (let i = 0; i < 4; i++) recordLoginFailure(key, t0);
assert.strictEqual(isLoginLocked(key, t0), false);
recordLoginFailure(key, t0);
assert.strictEqual(isLoginLocked(key, t0), true, '5th failure locks the account');
assert.strictEqual(isLoginLocked(key, new Date(t0.getTime() + 16 * 60 * 1000)), false, 'lock expires');
clearLoginFailures(key);
assert.strictEqual(isLoginLocked(key, t0), false);

const encrypted = encrypt('sensitive message content');
assert.ok(encrypted.startsWith('gcm:v2:'), `new writes must be versioned GCM, got ${encrypted.slice(0, 12)}`);
assert.strictEqual(decrypt(encrypted), 'sensitive message content');
const tampered = `${encrypted.slice(0, -2)}AA`;
assert.throws(() => decrypt(tampered));
const legacyCbcShape = `${'a'.repeat(32)}:${'b'.repeat(32)}`;
assert.throws(() => decrypt(legacyCbcShape), /Legacy AES-CBC/, 'CBC support must be gone');
assert.strictEqual(decrypt('plain legacy text'), 'plain legacy text');

assert.strictEqual(isTokenRevoked({ exists: true, isActive: true, tokenVersion: 3, mustChangePassword: false }, 2), true);
assert.strictEqual(isTokenRevoked({ exists: true, isActive: true, tokenVersion: 3, mustChangePassword: false }, 3), false);
assert.strictEqual(isTokenRevoked({ exists: true, isActive: false, tokenVersion: 0, mustChangePassword: false }, 0), true);
assert.strictEqual(isTokenRevoked({ exists: false, isActive: false, tokenVersion: 0, mustChangePassword: false }, 0), true);

console.log('auth security unit tests passed');
