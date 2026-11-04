import { AppDataSource } from '../../config/data-source';
import { Attendance } from '../attendance/attendance.entity';
import { ApiError } from '../../shared/utils/ApiError';

export class SchoolAdminAttendanceService {
  constructor(
    private readonly attendanceRepo = AppDataSource.getRepository(Attendance),
  ) {}

  async getAttendanceByDate(schoolId: string, date: string) {
    return this.attendanceRepo.find({
      where: { school: { id: schoolId }, date },
      relations: ['student'],
    });
  }

  async justifyAbsence(id: string, schoolId: string, justification: string) {
    const attendance = await this.attendanceRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!attendance) {
      throw ApiError.notFound('سجل الحضور غير موجود');
    }
    attendance.justified = true;
    attendance.justification = justification;
    return this.attendanceRepo.save(attendance);
  }
}

export const schoolAdminAttendanceService = new SchoolAdminAttendanceService();
