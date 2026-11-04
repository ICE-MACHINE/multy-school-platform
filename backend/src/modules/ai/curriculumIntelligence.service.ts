import { AppDataSource } from '../../config/data-source';
import { Course } from '../course/course.entity';
import { CourseSession } from '../courseSession/courseSession.entity';
import { Lesson } from '../lesson/lesson.entity';
import { scopedWhere } from '../../shared/tenant/tenantScope';
import {
  computeCurriculumIntelligence,
  type CourseProgressInput,
  type CurriculumIntelligence,
} from './curriculumIntelligence';

export class CurriculumIntelligenceService {
  async getOverview(
    schoolId: string,
    options: { teacherId?: string; academicYearEnd?: string } = {},
  ): Promise<CurriculumIntelligence> {
    const courseRepo = AppDataSource.getRepository(Course);
    const lessonRepo = AppDataSource.getRepository(Lesson);
    const sessionRepo = AppDataSource.getRepository(CourseSession);

    const courses = await courseRepo.find({
      where: options.teacherId
        ? scopedWhere(schoolId, { teacherId: options.teacherId })
        : scopedWhere(schoolId),
      relations: ['teacher'],
      order: { name: 'ASC' },
    });
    if (courses.length === 0) return computeCurriculumIntelligence([], new Date(), options.academicYearEnd);

    const courseIds = courses.map((c) => c.id);
    const lessons = await lessonRepo
      .createQueryBuilder('lesson')
      .where('lesson.schoolId = :schoolId', { schoolId })
      .andWhere('lesson.courseId IN (:...courseIds)', { courseIds })
      .orderBy('lesson.courseId', 'ASC')
      .addOrderBy('lesson.orderIndex', 'ASC')
      .getMany();

    const sessions = await sessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.lessons', 'lesson')
      .leftJoin('session.course', 'course')
      .where('course.schoolId = :schoolId', { schoolId })
      .andWhere('session.courseId IN (:...courseIds)', { courseIds })
      .andWhere('session.completedAt IS NOT NULL')
      .getMany();

    const lessonsByCourse = new Map<string, Lesson[]>();
    for (const lesson of lessons) {
      if (!lesson.courseId) continue;
      const list = lessonsByCourse.get(lesson.courseId) || [];
      list.push(lesson);
      lessonsByCourse.set(lesson.courseId, list);
    }

    const now = Date.now();
    const inputs: CourseProgressInput[] = courses.map((course) => {
      const courseLessons = lessonsByCourse.get(course.id) || [];
      const courseSessions = sessions.filter((s) => s.courseId === course.id);
      const taughtIds = new Set<string>();
      for (const session of courseSessions) {
        for (const lesson of session.lessons || []) taughtIds.add(lesson.id);
      }
      const recentSessions = courseSessions.filter((s) => {
        if (!s.completedAt) return false;
        return now - new Date(s.completedAt).getTime() <= 28 * 24 * 60 * 60 * 1000;
      });
      const sessionDates = courseSessions
        .map((s) => s.completedAt)
        .filter((d): d is string => Boolean(d))
        .sort();
      return {
        courseId: course.id,
        courseName: course.name,
        teacherId: course.teacherId || null,
        teacherName: course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : null,
        totalLessons: courseLessons.length,
        taughtLessons: courseLessons.filter((l) => taughtIds.has(l.id)).length,
        untaughtLessonTitles: courseLessons.filter((l) => !taughtIds.has(l.id)).map((l) => l.title),
        plannedSessions: course.numberOfSessions,
        completedSessions: courseSessions.length,
        sessionsLast28Days: recentSessions.length,
        lastSessionDate: sessionDates[sessionDates.length - 1] || null,
        startDate: course.startDate,
      };
    });

    return computeCurriculumIntelligence(inputs, new Date(), options.academicYearEnd);
  }
}

export const curriculumIntelligenceService = new CurriculumIntelligenceService();
