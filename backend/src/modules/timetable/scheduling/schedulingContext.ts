import { AppDataSource } from '../../../config/data-source';
import { Classroom } from '../../classroom/classroom.entity';
import { Course } from '../../course/course.entity';
import { Student } from '../../student/student.entity';
import { TimetableSettings } from '../timetableSettings.entity';
import { TimetableSlot } from '../timetableSlot.entity';
import type { SchedulingContext, SlotSnapshot } from './constraintEngine';

export function toSlotSnapshot(slot: TimetableSlot): SlotSnapshot {
  return {
    id: slot.id,
    teacherId: slot.teacherId || null,
    classroomId: slot.classroomId || null,
    courseId: slot.courseId || null,
    day: slot.day,
    periodId: slot.periodId || null,
    startTime: slot.startTime,
    duration: slot.duration,
  };
}

export async function loadSchedulingContext(
  schoolId: string,
  slot: TimetableSlot,
): Promise<SchedulingContext> {
  const settingsRepo = AppDataSource.getRepository(TimetableSettings);
  const slotRepo = AppDataSource.getRepository(TimetableSlot);
  const studentRepo = AppDataSource.getRepository(Student);
  const classroomRepo = AppDataSource.getRepository(Classroom);
  const courseRepo = AppDataSource.getRepository(Course);

  const [settings, allSlotEntities] = await Promise.all([
    settingsRepo.findOne({ where: { schoolId } }),
    slotRepo.find({ where: { schoolId } }),
  ]);
  const allSlots = allSlotEntities.map(toSlotSnapshot);

  let affectedStudents: Student[] = [];
  if (slot.classroomId) {
    affectedStudents = await studentRepo.find({
      where: { schoolId, classroomId: slot.classroomId },
      relations: ['enrolledCourses'],
    });
  }
  if (slot.courseId) {
    const courseStudents = await studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.enrolledCourses', 'course')
      .where('student.schoolId = :schoolId', { schoolId })
      .andWhere('course.id = :courseId', { courseId: slot.courseId })
      .getMany();
    const seenIds = new Set(affectedStudents.map((s) => s.id));
    for (const s of courseStudents) {
      if (!seenIds.has(s.id)) affectedStudents.push(s);
    }
  }
  const studentSlotIdSet = new Set<string>();
  for (const student of affectedStudents) {
    const enrolledIds = new Set((student.enrolledCourses || []).map((c) => c.id));
    for (const other of allSlots) {
      if (other.id === slot.id) continue;
      if (student.classroomId && other.classroomId === student.classroomId) studentSlotIdSet.add(other.id);
      if (other.courseId && enrolledIds.has(other.courseId)) studentSlotIdSet.add(other.id);
    }
  }

  let classroom: SchedulingContext['classroom'] = null;
  if (slot.classroomId) {
    const entity = await classroomRepo.findOne({ where: { id: slot.classroomId, schoolId } });
    if (entity) {
      const enrolledCount = await studentRepo.count({ where: { schoolId, classroomId: slot.classroomId } });
      classroom = { id: entity.id, capacity: entity.capacity, enrolledCount };
    }
  }

  let course: SchedulingContext['course'] = null;
  if (slot.courseId) {
    const entity = await courseRepo.findOne({
      where: { id: slot.courseId, schoolId },
      relations: ['enrolledStudents'],
    });
    if (entity) {
      course = {
        id: entity.id,
        capacity: entity.capacity,
        enrolledCount: (entity.enrolledStudents || []).length,
      };
    }
  }

  return {
    schoolId,
    slot: toSlotSnapshot(slot),
    studyDays: settings?.studyDays || [],
    periods: settings?.periods || [],
    allSlots,
    affectedStudentIds: affectedStudents.map((s) => s.id),
    studentSlotIds: [...studentSlotIdSet],
    classroom,
    course,
  };
}
