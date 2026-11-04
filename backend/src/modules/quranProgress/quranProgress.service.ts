import { AppDataSource } from '../../config/data-source';
import { QuranProgress } from './quranProgress.entity';
import { Surah } from './surah.entity';
import { Student } from '../student/student.entity';
import { ApiError } from '../../shared/utils/ApiError';

export class QuranProgressService {
  constructor(
    private readonly quranProgressRepo = AppDataSource.getRepository(QuranProgress),
    private readonly surahRepo = AppDataSource.getRepository(Surah),
    private readonly studentRepo = AppDataSource.getRepository(Student),
  ) {}

  async initializeStudentProgress(studentId: string, schoolId: string) {
    const allSurahs = await this.surahRepo.find();
    const existing = await this.quranProgressRepo.find({
      where: { student: { id: studentId }, school: { id: schoolId } },
    });

    if (existing.length > 0) {
      return existing;
    }

    const progressEntries = allSurahs.map(surah =>
      this.quranProgressRepo.create({
        studentId,
        surahId: surah.id,
        status: 'not_reached',
        schoolId,
      })
    );

    return this.quranProgressRepo.save(progressEntries);
  }

  async getStudentProgress(studentId: string, schoolId: string, includeNotReached = false) {
    const qb = this.quranProgressRepo.createQueryBuilder('progress')
      .leftJoinAndSelect('progress.surah', 'surah')
      .where('progress.studentId = :studentId AND progress.schoolId = :schoolId', { studentId, schoolId });

    if (!includeNotReached) {
      qb.andWhere("progress.status != 'not_reached'");
    }

    const progress = await qb.orderBy('surah.number', 'ASC').getMany();

    const memorizedSurahs = progress.filter(p => p.status === 'memorized');
    const memorizingSurahs = progress.filter(p => p.status === 'memorizing');
    const juzCount = new Set(memorizedSurahs.map(p => p.surah.juz)).size;

    return {
      progress,
      stats: {
        totalMemorized: memorizedSurahs.length,
        totalMemorizing: memorizingSurahs.length,
        juzCount,
        totalAyahsMemorized: memorizedSurahs.reduce((sum, p) => sum + (p.completionType === 'full' ? p.surah.totalAyahs : (p.lastAyah || 0)), 0),
      },
    };
  }

  async updateProgress(schoolId: string, data: any) {
    const existing = await this.quranProgressRepo.findOne({
      where: {
        school: { id: schoolId },
        student: { id: data.studentId },
        surah: { id: data.surahId },
      },
    });

    if (existing) {
      existing.status = data.status;
      existing.completionType = data.completionType;
      existing.lastAyah = data.lastAyah;
      existing.memorizationType = data.memorizationType;
      existing.grade = data.grade;
      return this.quranProgressRepo.save(existing);
    }

    const progress = this.quranProgressRepo.create({
      studentId: data.studentId,
      surahId: data.surahId,
      status: data.status,
      completionType: data.completionType,
      lastAyah: data.lastAyah,
      memorizationType: data.memorizationType,
      grade: data.grade,
      schoolId,
    });
    return this.quranProgressRepo.save(progress);
  }

  async getSurahs() {
    return this.surahRepo.find({ order: { number: 'ASC' } });
  }

  async updateStudentSummary(schoolId: string, data: { studentId: string; currentSurahNumber?: number | null; hizbs?: number }) {
    const student = await this.studentRepo.findOne({
      where: { id: data.studentId, school: { id: schoolId } },
    });

    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }

    if (data.currentSurahNumber !== undefined) {
      student.quranCurrentSurahNumber = data.currentSurahNumber;
    }

    if (data.hizbs !== undefined) {
      student.quranHizbs = Math.min(60, Math.max(0, data.hizbs));
    }

    return this.studentRepo.save(student);
  }

  async getSchoolStats(schoolId: string) {
    const students = await this.studentRepo.find({
      where: { school: { id: schoolId }, isActive: true },
    });

    let totalMemorized = 0;
    let totalMemorizing = 0;
    let totalJuz = 0;

    for (const student of students) {
      const progress = await this.quranProgressRepo.find({
        where: { student: { id: student.id }, school: { id: schoolId } },
        relations: ['surah'],
      });

      const memorized = progress.filter(p => p.status === 'memorized');
      const memorizing = progress.filter(p => p.status === 'memorizing');

      totalMemorized += memorized.length;
      totalMemorizing += memorizing.length;
      totalJuz += new Set(memorized.map(p => p.surah.juz)).size;
    }

    return {
      totalStudents: students.length,
      averageMemorized: students.length > 0 ? (totalMemorized / students.length).toFixed(1) : '0',
      averageMemorizing: students.length > 0 ? (totalMemorizing / students.length).toFixed(1) : '0',
      totalJuz,
    };
  }
}

export const quranProgressService = new QuranProgressService();
