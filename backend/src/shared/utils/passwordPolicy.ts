import { ApiError } from './ApiError';

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', 'passw0rd', '123456', '12345678', '123456789',
  'admin123456', 'admin12345', 'qwerty12345', 'letmein12345',
  '1234567890', 'qwerty', 'qwerty123', 'abc123', 'admin123', 'admin1234', 'administrator',
  'letmein', 'welcome', 'welcome123', 'changeme', 'default', 'school123', 'teacher123',
  'parent123', 'student123', 'iloveyou', 'football', 'monkey', 'dragon', 'master',
  'sunshine', 'princess', 'superman', 'batman', 'trustno1', '111111', '000000',
  'password1234', 'qwertyuiop', 'azerty', 'azerty123', 'motdepasse', 'bonjour123',
]);

export function assertPasswordStrength(password: string): void {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw ApiError.badRequest(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long (long passphrases are welcome)`,
    );
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw ApiError.badRequest(`Password must be at most ${MAX_PASSWORD_LENGTH} characters long`);
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    throw ApiError.badRequest('This password is too common; choose a less predictable passphrase');
  }
}
