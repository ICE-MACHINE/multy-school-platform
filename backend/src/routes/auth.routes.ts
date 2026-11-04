import { Router, Request, Response, NextFunction } from 'express';
import { superAdminService } from '../modules/superAdmin/superAdmin.service';
import { schoolAdminService } from '../modules/schoolAdmin/schoolAdmin.service';
import { teacherService } from '../modules/teacher/teacher.service';
import { parentService } from '../modules/parent/parent.service';
import { ResponseHandler } from '../shared/utils/ResponseHandler';
import { ApiError } from '../shared/utils/ApiError';
import { authLimiter } from '../shared/middleware/rateLimiter.middleware';
import { AppDataSource } from '../config/data-source';
import { SuperAdmin } from '../modules/superAdmin/superAdmin.entity';
import { SchoolAdmin } from '../modules/schoolAdmin/schoolAdmin.entity';
import { Teacher } from '../modules/teacher/teacher.entity';
import { Parent } from '../modules/parent/parent.entity';
import { authenticate } from '../shared/middleware/auth.middleware';
import { hashPassword } from '../shared/utils/hash';
import { assertPhoneUniqueAcrossRoles } from '../shared/utils/phoneUniqueness';
import { REFRESH_TOKEN_COOKIE, clearAuthCookies, readCookie, sendAuthResult } from '../shared/auth/authCookies';
import { verifyRefreshToken } from '../shared/utils/jwt';
import { bumpTokenVersion, getSessionState, invalidateSessionCache, isTokenRevoked } from '../shared/auth/sessionRevocation';

const router = Router();

router.post('/super-admin/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await superAdminService.login(req.body);
    return sendAuthResult(res, result as unknown as Record<string, unknown>);
  } catch (error) { next(error); }
});

router.post('/school/:schoolId/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, password } = req.body;
    let { schoolId } = req.params;

    const schoolRepo = AppDataSource.getRepository('School');
    const school = await schoolRepo.findOne({ where: [{ id: schoolId }, { slug: schoolId }] });
    if (!school) {
      throw ApiError.notFound('School not found');
    }
    if (school.isFrozen || !school.isActive) {
      throw ApiError.forbidden('المدرسة مجمدة أو غير نشطة');
    }
    schoolId = school.id;

    let result;
    try {
      result = await schoolAdminService.login({ phone, password, schoolId });
    } catch {
      try {
        result = await teacherService.login({ phone, password, schoolId });
      } catch {
        try {
          result = await parentService.login({ phone, password, schoolId });
        } catch (parentErr: any) {
          throw parentErr;
        }
      }
    }
    return sendAuthResult(res, result as unknown as Record<string, unknown>);
  } catch (error) { next(error); }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = readCookie(req, REFRESH_TOKEN_COOKIE);
    if (!refreshToken) throw ApiError.unauthorized('رمز التحديث مطلوب');

    const decoded = verifyRefreshToken(refreshToken);
    const session = await getSessionState(decoded.role, decoded.id);
    if (isTokenRevoked(session, decoded.tv)) throw ApiError.unauthorized('الرمز غير صالح');

    let result;
    if (decoded.role === 'super_admin') {
      const adminRepo = AppDataSource.getRepository(SuperAdmin);
      const admin = await adminRepo.findOne({ where: { id: decoded.id } });
      if (!admin) throw ApiError.unauthorized('الرمز غير صالح');
      const { generateAccessToken, generateRefreshToken } = require('../shared/utils/jwt');
      const tokenPayload = { id: admin.id, role: 'super_admin' as const, tv: admin.tokenVersion || 0 };
      result = { accessToken: generateAccessToken(tokenPayload), refreshToken: generateRefreshToken(tokenPayload) };
    } else {
      const { generateAccessToken, generateRefreshToken } = require('../shared/utils/jwt');
      const schoolRepo = AppDataSource.getRepository('School');
      const school = await schoolRepo.findOne({ where: [{ id: decoded.schoolId }, { slug: decoded.schoolId }] });
      if (!school) throw ApiError.unauthorized('المدرسة غير موجودة');
      if (school.isFrozen || !school.isActive) throw ApiError.unauthorized('المدرسة مجمدة أو غير نشطة');
      const userRepo = AppDataSource.getRepository(
        decoded.role === 'school_admin' ? SchoolAdmin : decoded.role === 'teacher' ? Teacher : Parent,
      );
      const currentUser: any = await userRepo.findOne({ where: { id: decoded.id } });
      if (!currentUser?.isActive) throw ApiError.unauthorized('الرمز غير صالح');
      const tokenPayload = {
        id: decoded.id,
        role: decoded.role,
        schoolId: school.id,
        slug: school.slug,
        tv: currentUser.tokenVersion || 0,
      };
      result = { accessToken: generateAccessToken(tokenPayload), refreshToken: generateRefreshToken(tokenPayload) };
    }
    return sendAuthResult(res, result as unknown as Record<string, unknown>, 'Token refreshed');
  } catch (error) { next(error); }
});

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = req.user!;
    let user: any = null;

    if (decoded.role === 'super_admin') {
      user = await AppDataSource.getRepository(SuperAdmin).findOne({ where: { id: decoded.id } });
    } else if (decoded.role === 'school_admin' || decoded.role === 'teacher' || decoded.role === 'parent') {
      const repo = AppDataSource.getRepository(
        decoded.role === 'school_admin' ? SchoolAdmin : decoded.role === 'teacher' ? Teacher : Parent,
      );
      user = await repo.findOne({ where: { id: decoded.id } });
    }

    return ResponseHandler.success(res, {
      id: decoded.id,
      role: decoded.role,
      schoolId: decoded.schoolId,
      schoolSlug: decoded.slug || '',
      phone: user?.phone || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      isActive: user?.isActive ?? true,
      mustChangePassword: Boolean(user?.mustChangePassword ?? false),
    });
  } catch (error) { next(error); }
});

router.put('/update-profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone, currentPassword, newPassword } = req.body;
    const userId = req.user!.id;
    const role = req.user!.role;

    let repo: any;
    if (role === 'super_admin') repo = AppDataSource.getRepository(SuperAdmin);
    else if (role === 'school_admin') repo = AppDataSource.getRepository(SchoolAdmin);
    else if (role === 'teacher') repo = AppDataSource.getRepository(Teacher);
    else if (role === 'parent') repo = AppDataSource.getRepository(Parent);
    else throw ApiError.badRequest('دور غير معروف');

    const user: any = await repo.findOne({ where: { id: userId } });
    if (!user) throw ApiError.notFound('المستخدم غير موجود');

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone && phone !== user.phone) {
      if (role === 'super_admin') {
        throw ApiError.badRequest('لا يمكن تغيير رقم هاتف المسؤول العام');
      }
      await assertPhoneUniqueAcrossRoles(user.schoolId, phone, { role, id: userId });
      user.phone = phone;
    }

    let passwordChanged = false;
    if (newPassword) {
      if (!currentPassword) throw ApiError.badRequest('كلمة المرور الحالية مطلوبة لتغيير كلمة المرور');
      const { comparePassword } = require('../shared/utils/hash');
      const valid = await comparePassword(currentPassword, user.password);
      if (!valid) throw ApiError.badRequest('كلمة المرور الحالية غير صحيحة');
      user.password = await hashPassword(newPassword);
      if ('mustChangePassword' in user) user.mustChangePassword = false;
      passwordChanged = true;
    }

    await repo.save(user);
    if (passwordChanged) {
      // Changing the password invalidates every existing session/token.
      await bumpTokenVersion(role, userId);
      invalidateSessionCache(role, userId);
      clearAuthCookies(res);
    }
    return ResponseHandler.success(res, { id: user.id, firstName: user.firstName, lastName: user.lastName, phone: user.phone, passwordChanged }, 'تم تحديث البيانات بنجاح');
  } catch (error) { next(error); }
});

router.post('/reset-password', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role !== 'super_admin') throw ApiError.forbidden('فقط المسؤول العام يمكنه إعادة تعيين كلمة المرور');
    const { userId, role, newPassword } = req.body;
    if (!userId || !newPassword) throw ApiError.badRequest('معرف المستخدم وكلمة المرور الجديدة مطلوبان');

    let repo: any;
    if (role === 'school_admin') repo = AppDataSource.getRepository(SchoolAdmin);
    else if (role === 'teacher') repo = AppDataSource.getRepository(Teacher);
    else if (role === 'parent') repo = AppDataSource.getRepository(Parent);
    else throw ApiError.badRequest('دور غير معروف');

    const user: any = await repo.findOne({ where: { id: userId } });
    if (!user) throw ApiError.notFound('المستخدم غير موجود');
    user.password = await hashPassword(newPassword);
    await repo.save(user);
    await bumpTokenVersion(role, userId);
    return ResponseHandler.success(res, null, 'تم إعادة تعيين كلمة المرور بنجاح');
  } catch (error) { next(error); }
});

router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    clearAuthCookies(res);
    return ResponseHandler.success(res, null, 'تم تسجيل الخروج');
  } catch (error) { next(error); }
});

router.post('/logout-all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await bumpTokenVersion(req.user!.role, req.user!.id);
    clearAuthCookies(res);
    return ResponseHandler.success(res, null, 'تم تسجيل الخروج من جميع الأجهزة');
  } catch (error) { next(error); }
});

export default router;
