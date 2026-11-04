import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../interfaces';
import { ApiError } from '../utils/ApiError';

export const roleGuard = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('المصادقة مطلوبة'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('صلاحيات غير كافية'));
    }

    const schoolIdFromParams = (req as any).resolvedSchoolId || req.params.schoolId;
    if (schoolIdFromParams && req.user.schoolId && req.user.schoolId !== schoolIdFromParams) {
      return next(ApiError.forbidden('الوصول مرفوض لهذه المدرسة'));
    }

    next();
  };
};