import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../interfaces';
import { ApiError } from '../utils/ApiError';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('المصادقة مطلوبة'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('ليس لديك صلاحية لتنفيذ هذا الإجراء'));
    }

    const schoolIdFromParams = (req as any).resolvedSchoolId || req.params.schoolId;
    if (schoolIdFromParams && req.user.schoolId) {
      const originalSlug = (req as any).schoolSlug;
      const matchesId = req.user.schoolId === schoolIdFromParams;
      const matchesSlug = originalSlug && req.user.slug === originalSlug;

      if (!matchesId && !matchesSlug) {
        return next(ApiError.forbidden('الوصول مرفوض لهذه المدرسة'));
      }
    }

    next();
  };
};
