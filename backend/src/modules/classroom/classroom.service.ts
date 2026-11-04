import { AppDataSource } from '../../config/data-source';
import { Classroom } from './classroom.entity';
import { Student } from '../student/student.entity';
import { Teacher } from '../teacher/teacher.entity';
import { ApiError } from '../../shared/utils/ApiError';

export class ClassroomService {
  constructor(
    private readonly classroomRepo = AppDataSource.getRepository(Classroom),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly teacherRepo = AppDataSource.getRepository(Teacher),
  ) {}

  async getAll(schoolId: string) {
    return this.classroomRepo.find({
      where: { school: { id: schoolId } },
      relations: ['teacher', 'students'],
      order: { name: 'ASC' },
    });
  }

  async getById(id: string, schoolId: string) {
    const classroom = await this.classroomRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['teacher', 'students'],
    });
    if (!classroom) {
      throw ApiError.notFound('القسم غير موجود');
    }
    return classroom;
  }

  async create(schoolId: string, data: any) {
    const classroom = this.classroomRepo.create({ ...data, schoolId });
    return this.classroomRepo.save(classroom);
  }

  async update(id: string, schoolId: string, data: any) {
    const classroom = await this.classroomRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['students'],
    });
    if (!classroom) {
      throw ApiError.notFound('القسم غير موجود');
    }
    if (data.capacity !== undefined && data.capacity < classroom.students.length) {
      throw ApiError.badRequest(`لا يمكن خفض السعة إلى أقل من عدد الطلبة الحالي (${classroom.students.length})`);
    }
    Object.assign(classroom, data);
    return this.classroomRepo.save(classroom);
  }

  async delete(id: string, schoolId: string) {
    const classroom = await this.classroomRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['students', 'teacher'],
    });
    if (!classroom) {
      throw ApiError.notFound('القسم غير موجود');
    }
    if (classroom.students && classroom.students.length > 0) {
      await this.studentRepo.update({ classroomId: id }, { classroomId: null as unknown as string });
    }
    if (classroom.teacher) {
      await this.teacherRepo.update({ classroomId: id }, { classroomId: null as unknown as string });
    }
    await this.classroomRepo.remove(classroom);
  }

  async assignTeacher(id: string, schoolId: string, teacherId: string) {
    const classroom = await this.classroomRepo.findOne({
      where: { id, school: { id: schoolId } },
    });
    if (!classroom) {
      throw ApiError.notFound('القسم غير موجود');
    }
    if (teacherId) {
      const teacher = await this.teacherRepo.findOne({ where: { id: teacherId, school: { id: schoolId } } });
      if (!teacher) {
        throw ApiError.notFound('المعلم غير موجود');
      }
      teacher.classroomId = id;
      await this.teacherRepo.save(teacher);
    }
    const currentTeacher = await this.teacherRepo.findOne({ where: { classroomId: id } });
    if (currentTeacher && currentTeacher.id !== teacherId) {
      currentTeacher.classroomId = null as any;
      await this.teacherRepo.save(currentTeacher);
    }
    return this.classroomRepo.findOne({ where: { id }, relations: ['teacher', 'students'] });
  }
}

export const classroomService = new ClassroomService();
