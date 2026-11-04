import { DataSource } from 'typeorm';
import path from 'path';
import { env } from './env';
import { SuperAdmin } from '../modules/superAdmin/superAdmin.entity';
import { School } from '../modules/school/school.entity';
import { SchoolAdmin } from '../modules/schoolAdmin/schoolAdmin.entity';
import { Teacher } from '../modules/teacher/teacher.entity';
import { Parent } from '../modules/parent/parent.entity';
import { Student } from '../modules/student/student.entity';
import { StudentExemptionPeriod } from '../modules/student/studentExemptionPeriod.entity';
import { Classroom } from '../modules/classroom/classroom.entity';
import { Course } from '../modules/course/course.entity';
import { Attendance } from '../modules/attendance/attendance.entity';
import { Payment } from '../modules/payment/payment.entity';
import { QuranProgress } from '../modules/quranProgress/quranProgress.entity';
import { Surah } from '../modules/quranProgress/surah.entity';
import { Program } from '../modules/program/program.entity';
import { ProgramModule } from '../modules/program/programModule.entity';
import { Lesson } from '../modules/lesson/lesson.entity';
import { CourseSession } from '../modules/courseSession/courseSession.entity';
import { CourseAttendance } from '../modules/courseAttendance/courseAttendance.entity';
import { Activity } from '../modules/activity/activity.entity';
import { StudentActivityParticipation } from '../modules/activity/participation.entity';
import { Message } from '../modules/message/message.entity';
import { Conversation } from '../modules/message/conversation.entity';
import { Notification } from '../modules/notification/notification.entity';
import { StudentLessonProgress } from '../modules/lesson/studentLessonProgress.entity';
import { TimetableSettings } from '../modules/timetable/timetableSettings.entity';
import { TimetableSlot } from '../modules/timetable/timetableSlot.entity';
import { ScheduleChangeRequest } from '../modules/timetable/scheduleChangeRequest.entity';
import { AiPrediction } from '../modules/ai/aiPrediction.entity';
import { DocumentScan } from '../modules/ai/documentScan.entity';
import { DocumentAccessLog } from '../modules/ai/documentAccessLog.entity';
import { DocumentRevision } from '../modules/ai/documentRevision.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  synchronize: env.NODE_ENV !== 'production', // never auto-sync schema in production; use migrations
  logging: env.NODE_ENV === 'development',
  entities: [
    SuperAdmin,
    School,
    SchoolAdmin,
    Teacher,
    Parent,
    Student,
    StudentExemptionPeriod,
    Classroom,
    Course,
    Attendance,
    Payment,
    QuranProgress,
    Surah,
    Program,
    ProgramModule,
    Lesson,
    CourseSession,
    CourseAttendance,
    Activity,
    StudentActivityParticipation,
    Message,
    Conversation,
    Notification,
    StudentLessonProgress,
    TimetableSettings,
    TimetableSlot,
    ScheduleChangeRequest,
    AiPrediction,
    DocumentScan,
    DocumentAccessLog,
    DocumentRevision,
  ],
  migrations: [path.join(__dirname, '../migrations/*')],
  subscribers: [],
});