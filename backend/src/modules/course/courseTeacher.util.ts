import { Repository, Not } from 'typeorm';
import { Course } from './course.entity';
import { ApiError } from '../../shared/utils/ApiError';

/**
 * A teacher may only teach a single course at a time. Rejects assigning a
 * teacher who is already the teacher of another course in the same school.
 */
export async function assertTeacherNotOnAnotherCourse(
  repo: Repository<Course>,
  schoolId: string,
  teacherId: string | null | undefined,
  excludeCourseId?: string,
): Promise<void> {
  if (!teacherId) return;
  const where: any = { schoolId, teacherId };
  if (excludeCourseId) where.id = Not(excludeCourseId);
  const existing = await repo.findOne({ where });
  if (existing) {
    throw ApiError.badRequest('لا يمكن تكليف هذا الأستاذ — هو يدرّس حالياً دورة أخرى (دورة واحدة لكل أستاذ)');
  }
}
