import { AppDataSource } from '../../config/data-source';
import { Course } from '../course/course.entity';
import { School } from '../school/school.entity';
import { ApiError } from '../../shared/utils/ApiError';
import { validateCoursePricing, assertStartDateEditable } from '../course/coursePricing.util';
import { assertTeacherNotOnAnotherCourse } from '../course/courseTeacher.util';

export class SchoolAdminCoursesService {
  constructor(
    private readonly courseRepo = AppDataSource.getRepository(Course),
    private readonly schoolRepo = AppDataSource.getRepository(School),
  ) {}

  async getAllCourses(schoolId: string) {
    return this.courseRepo.find({
      where: { school: { id: schoolId } },
      relations: ['teacher'],
    });
  }

  async createCourse(schoolId: string, data: any) {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    validateCoursePricing(school?.type, data);
    await assertTeacherNotOnAnotherCourse(this.courseRepo, schoolId, data.teacherId);
    const course = this.courseRepo.create({ ...data, schoolId });
    return this.courseRepo.save(course);
  }

  async updateCourse(id: string, schoolId: string, data: any) {
    const course = await this.courseRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!course) {
      throw ApiError.notFound('المادة غير موجودة');
    }
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    validateCoursePricing(school?.type, { ...course, ...data });
    assertStartDateEditable(course, data);
    if (data.teacherId !== undefined && data.teacherId !== course.teacherId) {
      await assertTeacherNotOnAnotherCourse(this.courseRepo, schoolId, data.teacherId, id);
    }
    Object.assign(course, data);
    return this.courseRepo.save(course);
  }

  async deleteCourse(id: string, schoolId: string) {
    const course = await this.courseRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!course) {
      throw ApiError.notFound('المادة غير موجودة');
    }
    await this.courseRepo.remove(course);
  }
}

export const schoolAdminCoursesService = new SchoolAdminCoursesService();
