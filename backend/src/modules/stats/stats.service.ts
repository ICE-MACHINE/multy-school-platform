import { AppDataSource } from '../../config/data-source';
import { School } from '../school/school.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Parent } from '../parent/parent.entity';
import { Student } from '../student/student.entity';
import { Classroom } from '../classroom/classroom.entity';
import { Course } from '../course/course.entity';
import { Attendance } from '../attendance/attendance.entity';
import { Payment } from '../payment/payment.entity';
import { QuranProgress } from '../quranProgress/quranProgress.entity';
import { StudentLessonProgress } from '../lesson/studentLessonProgress.entity';
import { StudentActivityParticipation } from '../activity/participation.entity';
import { Activity } from '../activity/activity.entity';
import { Message } from '../message/message.entity';
import { CourseAttendance } from '../courseAttendance/courseAttendance.entity';
import { Lesson } from '../lesson/lesson.entity';

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map<string, { expiresAt: number; value: unknown }>();

function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return Promise.resolve(hit.value as T);
  return loader().then((value) => {
    cache.set(key, { expiresAt: Date.now() + ttlMs, value });
    return value;
  });
}

export class StatsService {
  constructor(
    private readonly schoolRepo = AppDataSource.getRepository(School),
    private readonly teacherRepo = AppDataSource.getRepository(Teacher),
    private readonly parentRepo = AppDataSource.getRepository(Parent),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly classroomRepo = AppDataSource.getRepository(Classroom),
    private readonly courseRepo = AppDataSource.getRepository(Course),
    private readonly attendanceRepo = AppDataSource.getRepository(Attendance),
    private readonly paymentRepo = AppDataSource.getRepository(Payment),
    private readonly quranProgressRepo = AppDataSource.getRepository(QuranProgress),
    private readonly lessonProgressRepo = AppDataSource.getRepository(StudentLessonProgress),
    private readonly participationRepo = AppDataSource.getRepository(StudentActivityParticipation),
    private readonly activityRepo = AppDataSource.getRepository(Activity),
    private readonly messageRepo = AppDataSource.getRepository(Message),
    private readonly courseAttendanceRepo = AppDataSource.getRepository(CourseAttendance),
    private readonly lessonRepo = AppDataSource.getRepository(Lesson),
  ) {}

  async getSuperAdminStats() {
    const totalSchools = await this.schoolRepo.count();
    const activeSchools = await this.schoolRepo.count({ where: { isActive: true } });
    const frozenSchools = await this.schoolRepo.count({ where: { isFrozen: true } });
    const totalTeachers = await this.teacherRepo.count();
    const totalParents = await this.parentRepo.count();
    const totalStudents = await this.studentRepo.count();

    const schoolsByType = await this.schoolRepo
      .createQueryBuilder('school')
      .select('school.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('school.type')
      .getRawMany();

    return {
      totalSchools,
      activeSchools,
      frozenSchools,
      inactiveSchools: totalSchools - activeSchools,
      totalTeachers,
      totalParents,
      totalStudents,
      schoolsByType,
    };
  }

  async getSchoolAdminStats(schoolId: string) {
    const totalTeachers = await this.teacherRepo.count({ where: { school: { id: schoolId } } });
    const totalParents = await this.parentRepo.count({ where: { school: { id: schoolId } } });
    const totalStudents = await this.studentRepo.count({ where: { school: { id: schoolId }, isActive: true } });
    const totalClassrooms = await this.classroomRepo.count({ where: { school: { id: schoolId } } });
    const totalCourses = await this.courseRepo.count({ where: { school: { id: schoolId } } });

    const today = new Date().toISOString().split('T')[0];
    const todayAbsent = await this.attendanceRepo.count({
      where: { school: { id: schoolId }, date: today, isAbsent: true },
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    let monthlyPaymentsQb = this.paymentRepo
      .createQueryBuilder('payment')
      .where('payment.schoolId = :schoolId', { schoolId });
    if (school?.type === 'private') {
      monthlyPaymentsQb = monthlyPaymentsQb.andWhere("DATE_FORMAT(payment.paymentDate, '%Y-%m') = :month", { month: currentMonth });
    } else {
      monthlyPaymentsQb = monthlyPaymentsQb.andWhere("DATE_FORMAT(payment.createdAt, '%Y-%m') = :month", { month: currentMonth });
    }
    const monthlyPayments = await monthlyPaymentsQb.getMany();

    const totalRevenue = monthlyPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const recentActivities = await this.activityRepo.find({
      where: { school: { id: schoolId } },
      order: { date: 'DESC' },
      take: 5,
    });

    const unreadMessages = await this.messageRepo.count({
      where: { schoolId, isRead: false },
    });

    const totalMessages = await this.messageRepo.count({
      where: { schoolId },
    });

    const monthlyPaymentsData = await this.paymentRepo
      .createQueryBuilder('payment')
      .select("DATE_FORMAT(payment.createdAt, '%Y-%m')", 'month')
      .addSelect('SUM(payment.amount)', 'amount')
      .where('payment.schoolId = :schoolId', { schoolId })
      .groupBy("DATE_FORMAT(payment.createdAt, '%Y-%m')")
      .orderBy("DATE_FORMAT(payment.createdAt, '%Y-%m')", 'ASC')
      .limit(12)
      .getRawMany();

    const monthNames: Record<string, string> = {
      '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
      '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
      '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر',
    };

    const monthlyPaymentsDataFormatted = monthlyPaymentsData.map((r: any) => {
      const monthNum = r.month.split('-')[1];
      return { month: monthNames[monthNum] || r.month, amount: Number(r.amount) };
    });

    const totalPayments = await this.paymentRepo
      .createQueryBuilder('payment')
      .where('payment.schoolId = :schoolId', { schoolId })
      .getMany();

    const totalPaymentsSum = totalPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalTeachers,
      totalParents,
      totalStudents,
      totalClassrooms,
      totalCourses,
      todayAttendance: {
        absent: todayAbsent,
        present: totalStudents - todayAbsent,
        rate: totalStudents > 0 ? ((totalStudents - todayAbsent) / totalStudents * 100).toFixed(1) : '0',
      },
      monthlyRevenue: totalRevenue,
      monthlyPaymentsCount: monthlyPayments.length,
      monthlyPayments: totalRevenue,
      monthlyPaymentsData: monthlyPaymentsDataFormatted,
      totalPayments: totalPaymentsSum,
      absentToday: todayAbsent,
      totalMessages,
      recentActivities,
      unreadMessages,
    };
  }

  async getTeacherStats(schoolId: string, teacherId: string) {
    const teacher = await this.teacherRepo.findOne({
      where: { id: teacherId, school: { id: schoolId } },
      relations: ['classroom', 'school'],
    });

    if (!teacher) {
      return {
        assignedClassroom: null,
        assignedCourse: null,
        totalStudents: 0,
        todayStats: { present: 0, absent: 0 },
        quranStats: { memorized: 0, memorizing: 0 },
        attendanceRate: 0,
        monthAttendanceRate: 0,
        avgProgress: 0,
        avgMemorizedSurahs: 0,
        totalMemorizedSurahs: 0,
        totalLessonsAttended: 0,
        avgLessonsPerStudent: 0,
        genderDistribution: [],
        ageDistribution: [],
        progressDistribution: [],
        lessonDistribution: [],
        monthlyAttendance: [],
      };
    }

    const schoolType = teacher.school?.type;

    if (schoolType === 'private') {
      const emptyReturn = {
        assignedClassroom: null,
        assignedCourse: null,
        totalStudents: 0,
        todayStats: { present: 0, absent: 0 },
        quranStats: { memorized: 0, memorizing: 0 },
        attendanceRate: 0,
        monthAttendanceRate: 0,
        avgProgress: 0,
        avgMemorizedSurahs: 0,
        totalMemorizedSurahs: 0,
        totalLessonsAttended: 0,
        avgLessonsPerStudent: 0,
        genderDistribution: [],
        ageDistribution: [],
        progressDistribution: [],
        lessonDistribution: [],
        monthlyAttendance: [],
      };

      const course = await this.courseRepo.findOne({
        where: { teacher: { id: teacherId }, school: { id: schoolId } },
        relations: ['enrolledStudents'],
      });

      if (!course) return emptyReturn;

      const enrolledStudents = (course.enrolledStudents || []).filter((s: Student) => s.isActive !== false);
      const totalStudents = enrolledStudents.length;
      const studentIds = enrolledStudents.map((s: Student) => s.id);

      const today = new Date().toISOString().split('T')[0];
      const todayAbsent = totalStudents > 0
        ? await this.courseAttendanceRepo.count({
            where: { course: { id: course.id }, date: today, isAbsent: true },
          })
        : 0;

      const attendanceAgg = studentIds.length > 0
        ? await this.courseAttendanceRepo
            .createQueryBuilder('ca')
            .select('COUNT(*)', 'total')
            .addSelect("SUM(CASE WHEN ca.isAbsent = 1 THEN 1 ELSE 0 END)", 'absent')
            .where('ca.courseId = :courseId', { courseId: course.id })
            .getRawOne()
        : null;

      const totalAttendanceRecords = Number(attendanceAgg?.total) || 0;
      const totalAbsentRecords = Number(attendanceAgg?.absent) || 0;
      const attendanceRate = totalAttendanceRecords > 0
        ? Math.round(((totalAttendanceRecords - totalAbsentRecords) / totalAttendanceRecords) * 100)
        : 0;

      const currentMonth = today.slice(0, 7);
      const monthAgg = studentIds.length > 0
        ? await this.courseAttendanceRepo
            .createQueryBuilder('ca')
            .select('COUNT(*)', 'total')
            .addSelect("SUM(CASE WHEN ca.isAbsent = 1 THEN 1 ELSE 0 END)", 'absent')
            .where("ca.courseId = :courseId AND DATE_FORMAT(ca.date, '%Y-%m') = :month", {
              courseId: course.id, month: currentMonth,
            })
            .getRawOne()
        : null;

      const monthTotal = Number(monthAgg?.total) || 0;
      const monthAbsent = Number(monthAgg?.absent) || 0;
      const monthAttendanceRate = monthTotal > 0 ? Math.round(((monthTotal - monthAbsent) / monthTotal) * 100) : 0;

      const monthNames: Record<string, string> = {
        '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
        '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
        '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر',
      };

      let monthlyAttendance: { month: string; present: number; absent: number }[] = [];
      if (studentIds.length > 0) {
        const monthlyRaw = await this.courseAttendanceRepo
          .createQueryBuilder('ca')
          .select("DATE_FORMAT(ca.date, '%Y-%m')", 'month')
          .addSelect("SUM(CASE WHEN ca.isAbsent = 1 THEN 1 ELSE 0 END)", 'absent')
          .addSelect("SUM(CASE WHEN ca.isAbsent = 0 THEN 1 ELSE 0 END)", 'present')
          .where('ca.courseId = :courseId', { courseId: course.id })
          .groupBy("DATE_FORMAT(ca.date, '%Y-%m')")
          .orderBy("DATE_FORMAT(ca.date, '%Y-%m')", 'ASC')
          .getRawMany();

        const lastMonths: string[] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          lastMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }

        const monthMap: Record<string, { month: string; present: number; absent: number }> = {};
        lastMonths.forEach((m) => {
          monthMap[m] = { month: monthNames[m.split('-')[1]] || m, present: 0, absent: 0 };
        });
        monthlyRaw.forEach((r: any) => {
          if (monthMap[r.month]) {
            monthMap[r.month].present = Number(r.present) || 0;
            monthMap[r.month].absent = Number(r.absent) || 0;
          }
        });
        monthlyAttendance = lastMonths.map(m => monthMap[m]);
      }

      let totalLessonsAttended = 0;
      let avgLessonsPerStudent = 0;
      let avgProgress = 0;
      let lessonDistribution: { status: string; count: number }[] = [];

      if (studentIds.length > 0) {
        const totalLessonsInCourse = await this.lessonRepo.count({
          where: { course: { id: course.id } },
        });

        const lessonsInCompletedSessions = await this.lessonRepo
          .createQueryBuilder('l')
          .innerJoin('l.courseSessions', 'cs')
          .where('cs.courseId = :courseId AND cs.completedAt IS NOT NULL', { courseId: course.id })
          .getCount();

        const lessonAgg = await this.lessonProgressRepo
          .createQueryBuilder('p')
          .innerJoin('p.student', 'st')
          .innerJoin('p.lesson', 'l')
          .select("SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END)", 'completedCount')
          .addSelect("SUM(CASE WHEN p.status = 'absent' THEN 1 ELSE 0 END)", 'absentCount')
          .where('l.courseId = :courseId AND st.id IN (:...studentIds)', { courseId: course.id, studentIds })
          .getRawOne();

        const completed = Number(lessonAgg?.completedCount) || 0;
        const absent = Number(lessonAgg?.absentCount) || 0;
        const notStarted = (totalLessonsInCourse - lessonsInCompletedSessions) * totalStudents;

        totalLessonsAttended = completed;
        avgLessonsPerStudent = totalStudents > 0 ? Math.round((completed / totalStudents) * 10) / 10 : 0;
        const lessonDenominator = completed + absent;
        avgProgress = lessonDenominator > 0 ? Math.round((completed / lessonDenominator) * 100) : 0;
        lessonDistribution = [
          { status: 'حضر', count: completed },
          { status: 'غاب', count: absent },
          { status: 'لم يصل', count: Math.max(0, notStarted) },
        ];
      }

      const calcAge = (dob: string) => {
        const [y, m, d] = dob.split('-').map(Number);
        const now = new Date();
        let age = now.getFullYear() - y;
        const monthDiff = now.getMonth() + 1 - m;
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d)) age--;
        return age;
      };

      const genderMap: Record<string, string> = { male: 'ذكور', female: 'إناث' };
      const genderCount: Record<string, number> = {};
      enrolledStudents.forEach((s: Student) => {
        genderCount[s.gender] = (genderCount[s.gender] || 0) + 1;
      });
      const genderDistribution = Object.entries(genderCount).map(([gender, count]) => ({
        gender: genderMap[gender] || gender,
        count,
      }));

      const ageBrackets: Record<string, number> = { '0-5': 0, '6-8': 0, '9-11': 0, '12-14': 0, '15-17': 0, '18+': 0 };
      enrolledStudents.forEach((s: Student) => {
        if (s.dateOfBirth) {
          const age = calcAge(s.dateOfBirth);
          if (age <= 5) ageBrackets['0-5']++;
          else if (age >= 6 && age <= 8) ageBrackets['6-8']++;
          else if (age >= 9 && age <= 11) ageBrackets['9-11']++;
          else if (age >= 12 && age <= 14) ageBrackets['12-14']++;
          else if (age >= 15 && age <= 17) ageBrackets['15-17']++;
          else ageBrackets['18+']++;
        }
      });
      const ageDistribution = Object.entries(ageBrackets).map(([age, count]) => ({ age, count }));

      return {
        assignedClassroom: null,
        assignedCourse: { id: course.id, name: course.name },
        totalStudents,
        todayStats: {
          present: totalStudents - todayAbsent,
          absent: todayAbsent,
        },
        quranStats: { memorized: 0, memorizing: 0 },
        attendanceRate,
        monthAttendanceRate,
        avgProgress,
        avgMemorizedSurahs: 0,
        totalMemorizedSurahs: 0,
        totalLessonsAttended,
        avgLessonsPerStudent,
        genderDistribution,
        ageDistribution,
        progressDistribution: [],
        lessonDistribution,
        monthlyAttendance,
      };
    }

    if (!teacher.classroom) {
      return {
        assignedClassroom: null,
        assignedCourse: null,
        totalStudents: 0,
        todayStats: { present: 0, absent: 0 },
        quranStats: { memorized: 0, memorizing: 0 },
        attendanceRate: 0,
        monthAttendanceRate: 0,
        avgProgress: 0,
        avgMemorizedSurahs: 0,
        totalMemorizedSurahs: 0,
        totalLessonsAttended: 0,
        avgLessonsPerStudent: 0,
        genderDistribution: [],
        ageDistribution: [],
        progressDistribution: [],
        lessonDistribution: [],
        monthlyAttendance: [],
      };
    }

    const classroomId = teacher.classroom.id;

    const students = await this.studentRepo.find({
      where: { classroom: { id: classroomId }, school: { id: schoolId } },
      select: ['id', 'gender', 'dateOfBirth'],
    });
    const totalStudents = students.length;
    const studentIds = students.map(s => s.id);

    const today = new Date().toISOString().split('T')[0];
    const todayAbsent = await this.attendanceRepo.count({
      where: {
        school: { id: schoolId },
        date: today,
        isAbsent: true,
        student: { classroom: { id: classroomId } },
      },
    });

    const attendanceAgg = studentIds.length > 0
      ? await this.attendanceRepo
          .createQueryBuilder('a')
          .innerJoin('a.student', 'st')
          .select('COUNT(*)', 'total')
          .addSelect("SUM(CASE WHEN a.isAbsent = 1 THEN 1 ELSE 0 END)", 'absent')
          .where('st.classroomId = :classroomId AND a.schoolId = :schoolId', { classroomId, schoolId })
          .getRawOne()
      : null;

    const totalAttendanceRecords = Number(attendanceAgg?.total) || 0;
    const totalAbsentRecords = Number(attendanceAgg?.absent) || 0;
    const attendanceRate = totalAttendanceRecords > 0
      ? Math.round(((totalAttendanceRecords - totalAbsentRecords) / totalAttendanceRecords) * 100)
      : 0;

    const currentMonth = today.slice(0, 7);
    const monthAgg = studentIds.length > 0
      ? await this.attendanceRepo
          .createQueryBuilder('a')
          .innerJoin('a.student', 'st')
          .select('COUNT(*)', 'total')
          .addSelect("SUM(CASE WHEN a.isAbsent = 1 THEN 1 ELSE 0 END)", 'absent')
          .where("st.classroomId = :classroomId AND a.schoolId = :schoolId AND DATE_FORMAT(a.date, '%Y-%m') = :month", {
            classroomId, schoolId, month: currentMonth,
          })
          .getRawOne()
      : null;

    const monthTotal = Number(monthAgg?.total) || 0;
    const monthAbsent = Number(monthAgg?.absent) || 0;
    const monthAttendanceRate = monthTotal > 0 ? Math.round(((monthTotal - monthAbsent) / monthTotal) * 100) : 0;

    const monthNames: Record<string, string> = {
      '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
      '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
      '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر',
    };

    let monthlyAttendance: { month: string; present: number; absent: number }[] = [];
    if (studentIds.length > 0) {
      const monthlyRaw = await this.attendanceRepo
        .createQueryBuilder('a')
        .innerJoin('a.student', 'st')
        .select("DATE_FORMAT(a.date, '%Y-%m')", 'month')
        .addSelect("SUM(CASE WHEN a.isAbsent = 1 THEN 1 ELSE 0 END)", 'absent')
        .addSelect("SUM(CASE WHEN a.isAbsent = 0 THEN 1 ELSE 0 END)", 'present')
        .where('st.classroomId = :classroomId AND a.schoolId = :schoolId', { classroomId, schoolId })
        .groupBy("DATE_FORMAT(a.date, '%Y-%m')")
        .orderBy("DATE_FORMAT(a.date, '%Y-%m')", 'ASC')
        .getRawMany();

      const lastMonths: string[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        lastMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }

      const monthMap: Record<string, { month: string; present: number; absent: number }> = {};
      lastMonths.forEach((m) => {
        monthMap[m] = { month: monthNames[m.split('-')[1]] || m, present: 0, absent: 0 };
      });
      monthlyRaw.forEach((r: any) => {
        if (monthMap[r.month]) {
          monthMap[r.month].present = Number(r.present) || 0;
          monthMap[r.month].absent = Number(r.absent) || 0;
        }
      });
      monthlyAttendance = lastMonths.map(m => monthMap[m]);
    }

    let totalMemorizedSurahs = 0;
    let avgMemorizedSurahs = 0;
    let memorizingSurahs = 0;
    let avgProgress = 0;
    let progressDistribution: { status: string; count: number }[] = [];
    let totalLessonsAttended = 0;
    let avgLessonsPerStudent = 0;
    let lessonDistribution: { status: string; count: number }[] = [];

    if (schoolType === 'quranic') {
      if (studentIds.length > 0) {
        const statusRaw = await this.quranProgressRepo
          .createQueryBuilder('p')
          .innerJoin('p.student', 'st')
          .select('p.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .where('st.classroomId = :classroomId AND p.schoolId = :schoolId', { classroomId, schoolId })
          .groupBy('p.status')
          .getRawMany();

        const statusMap: Record<string, string> = {
          memorized: 'محفوظة', memorizing: 'ملقنة', not_reached: 'لم يصل لها',
        };
        progressDistribution = statusRaw.map((r: any) => ({
          status: statusMap[r.status] || r.status,
          count: Number(r.count),
        }));

        const perStudentProgress = await this.quranProgressRepo
          .createQueryBuilder('p')
          .innerJoin('p.student', 'st')
          .select('p.studentId', 'studentId')
          .addSelect("SUM(CASE WHEN p.status = 'memorized' THEN 1 ELSE 0 END)", 'memorized')
          .addSelect("SUM(CASE WHEN p.status = 'memorizing' THEN 1 ELSE 0 END)", 'memorizing')
          .where('st.classroomId = :classroomId AND p.schoolId = :schoolId', { classroomId, schoolId })
          .groupBy('p.studentId')
          .getRawMany();

        const totalSurahs = 114;
        let progressSum = 0;
        perStudentProgress.forEach((r: any) => {
          const memorized = Number(r.memorized) || 0;
          const memorizing = Number(r.memorizing) || 0;
          totalMemorizedSurahs += memorized;
          memorizingSurahs += memorizing;
          progressSum += ((memorized + memorizing * 0.5) / totalSurahs) * 100;
        });
        avgProgress = totalStudents > 0 ? Math.round(progressSum / totalStudents) : 0;
        avgMemorizedSurahs = totalStudents > 0 ? Math.round((totalMemorizedSurahs / totalStudents) * 10) / 10 : 0;
      }
    } else if (schoolType === 'kindergarten') {
      if (studentIds.length > 0) {
        const activityAgg = await this.participationRepo
          .createQueryBuilder('p')
          .innerJoin('p.activity', 'a')
          .innerJoin('p.student', 'st')
          .select("SUM(CASE WHEN p.participated = 1 THEN 1 ELSE 0 END)", 'attendedCount')
          .addSelect("SUM(CASE WHEN p.participated = 0 THEN 1 ELSE 0 END)", 'missedCount')
          .where('st.classroomId = :classroomId AND a.schoolId = :schoolId', { classroomId, schoolId })
          .getRawOne();

        const attended = Number(activityAgg?.attendedCount) || 0;
        const missed = Number(activityAgg?.missedCount) || 0;

        const plannedCount = await this.activityRepo.count({
          where: { school: { id: schoolId }, classroom: { id: classroomId }, status: 'planned' },
        });

        totalLessonsAttended = attended;
        avgLessonsPerStudent = totalStudents > 0 ? Math.round((attended / totalStudents) * 10) / 10 : 0;
        const activityDenominator = attended + missed;
        avgProgress = activityDenominator > 0 ? Math.round((attended / activityDenominator) * 100) : 0;
        lessonDistribution = [
          { status: 'حضر', count: attended },
          { status: 'غاب', count: missed },
          { status: 'لم يصل', count: plannedCount },
        ];
      }
    } else {
      if (studentIds.length > 0) {
        const lessonAgg = await this.lessonProgressRepo
          .createQueryBuilder('p')
          .innerJoin('p.student', 'st')
          .innerJoin('p.lesson', 'l')
          .select("SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END)", 'completedCount')
          .addSelect("SUM(CASE WHEN p.status = 'absent' THEN 1 ELSE 0 END)", 'absentCount')
          .addSelect("SUM(CASE WHEN p.status = 'not_started' THEN 1 ELSE 0 END)", 'notStartedCount')
          .where('st.classroomId = :classroomId AND l.schoolId = :schoolId', { classroomId, schoolId })
          .getRawOne();

        const completed = Number(lessonAgg?.completedCount) || 0;
        const absent = Number(lessonAgg?.absentCount) || 0;
        const notStarted = Number(lessonAgg?.notStartedCount) || 0;

        totalLessonsAttended = completed;
        avgLessonsPerStudent = totalStudents > 0 ? Math.round((completed / totalStudents) * 10) / 10 : 0;
        const lessonDenominator = completed + absent;
        avgProgress = lessonDenominator > 0 ? Math.round((completed / lessonDenominator) * 100) : 0;
        lessonDistribution = [
          { status: 'حضر', count: completed },
          { status: 'غاب', count: absent },
          { status: 'لم يصل', count: notStarted },
        ];
      }
    }

    const genderDistributionRaw = await this.studentRepo
      .createQueryBuilder('student')
      .select('student.gender', 'gender')
      .addSelect('COUNT(*)', 'count')
      .where('student.classroomId = :classroomId AND student.schoolId = :schoolId', { classroomId, schoolId })
      .groupBy('student.gender')
      .getRawMany();

    const genderMap: Record<string, string> = { male: 'ذكور', female: 'إناث' };
    const genderDistribution = genderDistributionRaw.map((g: any) => ({
      gender: genderMap[g.gender] || g.gender,
      count: Number(g.count),
    }));

    const calcAge = (dob: string) => {
      const [y, m, d] = dob.split('-').map(Number);
      const now = new Date();
      let age = now.getFullYear() - y;
      const monthDiff = now.getMonth() + 1 - m;
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d)) age--;
      return age;
    };

    const ageBrackets: Record<string, number> = { '0-5': 0, '6-8': 0, '9-11': 0, '12-14': 0, '15-17': 0, '18+': 0 };
    students.forEach((s) => {
      if (s.dateOfBirth) {
        const age = calcAge(s.dateOfBirth);
        if (age <= 5) ageBrackets['0-5']++;
        else if (age >= 6 && age <= 8) ageBrackets['6-8']++;
        else if (age >= 9 && age <= 11) ageBrackets['9-11']++;
        else if (age >= 12 && age <= 14) ageBrackets['12-14']++;
        else if (age >= 15 && age <= 17) ageBrackets['15-17']++;
        else ageBrackets['18+']++;
      }
    });
    const ageDistribution = Object.entries(ageBrackets).map(([age, count]) => ({ age, count }));

    return {
      assignedClassroom: teacher.classroom,
      assignedCourse: null,
      totalStudents,
      todayStats: {
        present: totalStudents - todayAbsent,
        absent: todayAbsent,
      },
      quranStats: {
        memorized: totalMemorizedSurahs,
        memorizing: memorizingSurahs,
      },
      attendanceRate,
      monthAttendanceRate,
      avgProgress,
      avgMemorizedSurahs,
      totalMemorizedSurahs,
      totalLessonsAttended,
      avgLessonsPerStudent,
      genderDistribution,
      ageDistribution,
      progressDistribution,
      lessonDistribution,
      monthlyAttendance,
    };
  }

  async getPublicPlatformStats() {
    return cached('public:platform', CACHE_TTL_MS, async () => {
      const schools = await this.schoolRepo.find({
        where: { isActive: true, isFrozen: false },
        select: ['id', 'type'],
      });
      const ids = schools.map((s) => s.id);

      const countForSchools = async (repo: any, isActiveColumn: boolean) => {
        if (ids.length === 0) return 0;
        const qb = repo.createQueryBuilder('e').where('e.schoolId IN (:...ids)', { ids });
        if (isActiveColumn) qb.andWhere('e.isActive = :active', { active: true });
        return qb.getCount();
      };

      const [totalStudents, totalTeachers, totalCourses, totalClassrooms, totalActivities] = await Promise.all([
        countForSchools(this.studentRepo, true),
        countForSchools(this.teacherRepo, true),
        countForSchools(this.courseRepo, false),
        countForSchools(this.classroomRepo, false),
        countForSchools(this.activityRepo, true),
      ]);

      const schoolsByTypeMap: Record<string, number> = {};
      schools.forEach((s) => {
        schoolsByTypeMap[s.type] = (schoolsByTypeMap[s.type] || 0) + 1;
      });

      return {
        totalSchools: schools.length,
        totalStudents,
        totalTeachers,
        totalCourses,
        totalClassrooms,
        totalActivities,
        schoolsByType: Object.entries(schoolsByTypeMap).map(([type, count]) => ({ type, count })),
      };
    });
  }

  async getPublicSchoolStats(schoolId: string) {
    return cached(`public:school:${schoolId}`, CACHE_TTL_MS, async () => {
      const school = await this.schoolRepo.findOne({
        where: { id: schoolId },
        select: ['id', 'name', 'type', 'isActive', 'isFrozen'],
      });
      if (!school || school.isFrozen || !school.isActive) {
        return null;
      }

      const [totalStudents, totalTeachers, totalCourses, totalClassrooms, totalActivities] = await Promise.all([
        this.studentRepo.count({ where: { school: { id: schoolId }, isActive: true } }),
        this.teacherRepo.count({ where: { school: { id: schoolId }, isActive: true } }),
        this.courseRepo.count({ where: { schoolId } }),
        this.classroomRepo.count({ where: { schoolId } }),
        this.activityRepo.count({ where: { school: { id: schoolId }, isActive: true } }),
      ]);

      return {
        totalStudents,
        totalTeachers,
        totalCourses,
        totalClassrooms,
        totalActivities,
      };
    });
  }
}

export const statsService = new StatsService();
