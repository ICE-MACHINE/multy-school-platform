import bcrypt from 'bcryptjs';
import { assertPasswordStrength } from './passwordPolicy';

export { assertPasswordStrength };

// bcryptjs at cost 12 (~250ms/hash). Argon2id would be preferable for a new
// system, but switching algorithms requires a rehash-on-login migration for
// every existing account; cost-12 bcrypt remains an accepted configuration.
const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  assertPasswordStrength(password);
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
