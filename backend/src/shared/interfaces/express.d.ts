import { Request } from 'express';
import { AuthUser } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}