import { AppDataSource } from '../../config/data-source';
import { Classroom } from '../classroom/classroom.entity';
import { ClassroomService, classroomService as defaultClassroomService } from '../classroom/classroom.service';
import { ApiError } from '../../shared/utils/ApiError';

export class SchoolAdminClassroomsService {
  constructor(
    private readonly classroomRepo = AppDataSource.getRepository(Classroom),
    private readonly classroomService: ClassroomService = defaultClassroomService,
  ) {}

  async getAllClassrooms(schoolId: string) {
    return this.classroomRepo.find({
      where: { school: { id: schoolId } },
      relations: ['teacher', 'students'],
    });
  }

  async createClassroom(schoolId: string, data: any) {
    const classroom = this.classroomRepo.create({ ...data, schoolId });
    return this.classroomRepo.save(classroom);
  }

  async updateClassroom(id: string, schoolId: string, data: any) {
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

  async deleteClassroom(id: string, schoolId: string) {
    return this.classroomService.delete(id, schoolId);
  }
}

export const schoolAdminClassroomsService = new SchoolAdminClassroomsService();
