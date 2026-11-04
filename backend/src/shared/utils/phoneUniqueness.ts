import { AppDataSource } from '../../config/data-source';
import { SchoolAdmin } from '../../modules/schoolAdmin/schoolAdmin.entity';
import { Teacher } from '../../modules/teacher/teacher.entity';
import { Parent } from '../../modules/parent/parent.entity';
import { ApiError } from './ApiError';

export type SchoolRole = 'school_admin' | 'teacher' | 'parent';

interface UserWithSchool {
  id: string;
  phone: string;
}

const ROLE_REPOS: Record<SchoolRole, { findOne: (opts: { where: { phone: string; school: { id: string } } }) => Promise<UserWithSchool | null> }> = {
  school_admin: AppDataSource.getRepository(SchoolAdmin),
  teacher: AppDataSource.getRepository(Teacher),
  parent: AppDataSource.getRepository(Parent),
};

const ROLE_LABELS: Record<SchoolRole, string> = {
  school_admin: 'مسؤول',
  teacher: 'معلم',
  parent: 'ولي أمر',
};

/**
 * Prevents a phone number from being shared by two different accounts
 * (school_admin / teacher / parent) inside the same school.
 * Phone is the login identifier, so sharing it across roles is a critical
 * security risk that can cause account takeovers via the login fallback chain.
 */
export async function assertPhoneUniqueAcrossRoles(
  schoolId: string,
  phone: string,
  exclude?: { role: SchoolRole; id: string },
): Promise<void> {
  if (!schoolId || !phone || !phone.trim()) return;

  for (const role of Object.keys(ROLE_REPOS) as SchoolRole[]) {
    const found = await ROLE_REPOS[role].findOne({
      where: { phone, school: { id: schoolId } },
    });
    if (found && !(exclude?.role === role && exclude.id === found.id)) {
      throw ApiError.conflict(
        `رقم الهاتف ${phone} مستخدم مسبقاً لحساب ${ROLE_LABELS[role]} في هذه المدرسة — يجب أن يكون الرقم فريداً بين جميع الحسابات`,
      );
    }
  }
}
