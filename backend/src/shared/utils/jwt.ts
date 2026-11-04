import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { UserRole } from '../interfaces';

export interface TokenPayload {
  id: string;
  role: UserRole;
  schoolId?: string;
  slug?: string;
  tv?: number;
}

const ISSUER = 'multyschool-platform';
const AUDIENCE = 'multyschool-web';

const verifyOptions: VerifyOptions = {
  algorithms: ['HS256'],
  issuer: ISSUER,
  audience: AUDIENCE,
};

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: env.jwt.expiresIn as SignOptions['expiresIn'],
    issuer: ISSUER,
    audience: AUDIENCE,
  };
  return jwt.sign(payload, env.jwt.secret, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: env.jwt.refreshExpiresIn as SignOptions['expiresIn'],
    issuer: ISSUER,
    audience: AUDIENCE,
  };
  return jwt.sign(payload, env.jwt.refreshSecret, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwt.secret, verifyOptions) as unknown as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwt.refreshSecret, verifyOptions) as unknown as TokenPayload;
};
