import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/data-source';
import { School } from '../../modules/school/school.entity';
import { ApiError } from '../../shared/utils/ApiError';

const schoolRepo = AppDataSource.getRepository(School);

export async function resolveSchoolId(req: Request, _res: Response, next: NextFunction) {
  try {
    const param = req.params.schoolId;
    if (!param) return next();

    const school = await schoolRepo.findOne({ where: [{ id: param }, { slug: param }] });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }
    if (school.isFrozen || !school.isActive) {
      throw ApiError.forbidden('المدرسة مجمدة أو غير نشطة');
    }

    (req as any).schoolSlug = param;
    (req as any).resolvedSchoolId = school.id;
    req.params.schoolId = school.id;
    next();
  } catch (error) {
    next(error);
  }
}
