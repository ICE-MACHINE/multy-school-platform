import { In } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { env } from '../../config/env';
import { Attendance } from '../attendance/attendance.entity';
import { CourseAttendance } from '../courseAttendance/courseAttendance.entity';
import { StudentLessonProgress } from '../lesson/studentLessonProgress.entity';
import { Student } from '../student/student.entity';
import { ApiError } from '../../shared/utils/ApiError';
import { AiPrediction, AiRiskLevel } from './aiPrediction.entity';
import { chatJson, isMetaAiEnabled } from './metaAi.client';

type SupportedLocale = 'en' | 'fr' | 'ar';

interface StudentFeatures {
  attendanceRate: number;
  completionRate: number;
  totalRecords: number;
  totalAbsences: number;
  unjustifiedAbsences: number;
  missedLessons: number;
  completedLessons: number;
  totalLessons: number;
}

interface HeuristicResult {
  successProbability: number;
  riskLevel: AiRiskLevel;
  factors: string[];
  recommendations: string[];
  parentSummary: string;
}

interface MetaPredictionResponse {
  successProbability?: unknown;
  riskLevel?: unknown;
  factors?: unknown;
  recommendations?: unknown;
  parentSummary?: unknown;
}

export interface PredictionListItem {
  id: string;
  schoolId: string;
  studentId: string;
  riskLevel: AiRiskLevel;
  successProbability: number;
  attendanceRate: number;
  totalAbsences: number;
  unjustifiedAbsences: number;
  missedLessons: number;
  completedLessons: number;
  factors: string[] | null;
  recommendations: string[] | null;
  parentSummary: string | null;
  source: string;
  model: string | null;
  locale: string;
  createdAt: Date;
  student: { id: string; firstName: string; lastName: string } | null;
}

const DICTIONARIES: Record<
  SupportedLocale,
  {
    factors: {
      goodAttendance: string;
      lowAttendance: string;
      unjustifiedAbsences: string;
      missedLessons: string;
      goodCompletion: string;
      lowCompletion: string;
      stable: string;
    };
    recommendations: {
      improveAttendance: string;
      justifyAbsences: string;
      catchUpLessons: string;
      maintain: string;
      monitor: string;
    };
    parentSummary: (successProbability: number, attendancePercent: number, completionPercent: number) => string;
    languageName: string;
  }
> = {
  en: {
    factors: {
      goodAttendance: 'Good attendance rate',
      lowAttendance: 'Low attendance rate',
      unjustifiedAbsences: 'Unjustified absences recorded',
      missedLessons: 'Missed lessons recorded',
      goodCompletion: 'Good lesson completion',
      lowCompletion: 'Low lesson completion',
      stable: 'Stable learning progress',
    },
    recommendations: {
      improveAttendance: 'Improve regular attendance',
      justifyAbsences: 'Provide justifications for absences and follow up with the school',
      catchUpLessons: 'Arrange catch-up support for missed lessons',
      maintain: 'Maintain the current routine and progress',
      monitor: 'Monitor progress closely in the coming weeks',
    },
    parentSummary: (successProbability, attendancePercent, completionPercent) =>
      `Your child's estimated chance of success is ${successProbability}%. Attendance is ${attendancePercent}% and lesson completion is ${completionPercent}%. Please follow the recommendations shared by the school.`,
    languageName: 'English',
  },
  fr: {
    factors: {
      goodAttendance: "Bon taux de présence",
      lowAttendance: "Faible taux de présence",
      unjustifiedAbsences: 'Absences injustifiées enregistrées',
      missedLessons: 'Leçons manquées enregistrées',
      goodCompletion: 'Bonne progression des leçons',
      lowCompletion: 'Faible progression des leçons',
      stable: 'Progression stable',
    },
    recommendations: {
      improveAttendance: 'Améliorer la présence régulière',
      justifyAbsences: 'Fournir les justificatifs des absences et suivre avec l’école',
      catchUpLessons: 'Organiser un rattrapage pour les leçons manquées',
      maintain: 'Maintenir la routine et les progrès actuels',
      monitor: 'Surveiller de près les progrès dans les prochaines semaines',
    },
    parentSummary: (successProbability, attendancePercent, completionPercent) =>
      `Les chances estimées de réussite de votre enfant sont de ${successProbability}%. La présence est de ${attendancePercent}% et l'avancement des leçons de ${completionPercent}%. Merci de suivre les recommandations de l’école.`,
    languageName: 'French',
  },
  ar: {
    factors: {
      goodAttendance: 'معدل حضور جيد',
      lowAttendance: 'معدل حضور منخفض',
      unjustifiedAbsences: 'تم تسجيل غيابات غير مبررة',
      missedLessons: 'تم تسجيل دروس فائتة',
      goodCompletion: 'إتمام جيد للدروس',
      lowCompletion: 'إتمام منخفض للدروس',
      stable: 'تقدم تعليمي مستقر',
    },
    recommendations: {
      improveAttendance: 'تحسين الحضور المنتظم',
      justifyAbsences: 'تقديم مبررات الغياب والمتابعة مع المدرسة',
      catchUpLessons: 'تنظيم دعم لتعويض الدروس الفائتة',
      maintain: 'الحفاظ على الروتين والتقدم الحالي',
      monitor: 'متابعة التقدم عن قرب خلال الأسابيع القادمة',
    },
    parentSummary: (successProbability, attendancePercent, completionPercent) =>
      `نسبة نجاح طفلكم المقدرة هي ${successProbability}%. نسبة الحضور ${attendancePercent}% ونسبة إتمام الدروس ${completionPercent}%. يرجى متابعة توصيات المدرسة.`,
    languageName: 'Arabic',
  },
};

function normalizeLocale(locale?: string): SupportedLocale {
  const value = (locale || 'en').toLowerCase();
  if (value.startsWith('fr')) return 'fr';
  if (value.startsWith('ar')) return 'ar';
  return 'en';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function riskFromSuccess(successProbability: number): AiRiskLevel {
  if (successProbability >= 75) return 'low';
  if (successProbability >= 55) return 'medium';
  if (successProbability >= 35) return 'high';
  return 'critical';
}

function isRiskLevel(value: unknown): value is AiRiskLevel {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'critical';
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export class PredictionService {
  constructor(
    private readonly predictionRepo = AppDataSource.getRepository(AiPrediction),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly attendanceRepo = AppDataSource.getRepository(Attendance),
    private readonly courseAttendanceRepo = AppDataSource.getRepository(CourseAttendance),
    private readonly progressRepo = AppDataSource.getRepository(StudentLessonProgress),
  ) {}

  private computeFeatures(
    attendanceRows: Attendance[],
    courseAttendanceRows: CourseAttendance[],
    progressRows: StudentLessonProgress[],
  ): StudentFeatures {
    const totalRecords = attendanceRows.length + courseAttendanceRows.length;
    const attendanceAbsences = attendanceRows.filter((row) => row.isAbsent).length;
    const courseAbsences = courseAttendanceRows.filter((row) => row.isAbsent).length;
    const totalAbsences = attendanceAbsences + courseAbsences;
    const unjustifiedAbsences =
      attendanceRows.filter((row) => row.isAbsent && !row.justified).length +
      courseAttendanceRows.filter((row) => row.isAbsent && !row.justified).length;

    const attendanceRate =
      totalRecords === 0 ? 1 : (totalRecords - totalAbsences) / totalRecords;

    const completedLessons = progressRows.filter((row) => row.status === 'completed').length;
    const missedLessons = progressRows.filter((row) => row.status === 'absent').length;
    const totalLessons = progressRows.length;
    const completionRate = totalLessons === 0 ? 1 : completedLessons / totalLessons;

    return {
      attendanceRate,
      completionRate,
      totalRecords,
      totalAbsences,
      unjustifiedAbsences,
      missedLessons,
      completedLessons,
      totalLessons,
    };
  }

  private async collectFeatures(schoolId: string, studentId: string): Promise<StudentFeatures> {
    const [attendanceRows, courseAttendanceRows, progressRows] = await Promise.all([
      this.attendanceRepo.find({ where: { schoolId, studentId } }),
      this.courseAttendanceRepo.find({ where: { schoolId, studentId } }),
      this.progressRepo.find({ where: { studentId } }),
    ]);
    return this.computeFeatures(attendanceRows, courseAttendanceRows, progressRows);
  }

  private async collectFeaturesForSchool(
    schoolId: string,
    studentIds: string[],
  ): Promise<Map<string, StudentFeatures>> {
    const [attendanceRows, courseAttendanceRows, progressRows] = await Promise.all([
      this.attendanceRepo.find({ where: { schoolId, studentId: In(studentIds) } }),
      this.courseAttendanceRepo.find({ where: { schoolId, studentId: In(studentIds) } }),
      this.progressRepo.find({ where: { studentId: In(studentIds) } }),
    ]);

    const groupByStudent = <T extends { studentId: string | null }>(rows: T[]): Map<string, T[]> => {
      const grouped = new Map<string, T[]>();
      for (const row of rows) {
        if (!row.studentId) continue;
        const list = grouped.get(row.studentId);
        if (list) list.push(row);
        else grouped.set(row.studentId, [row]);
      }
      return grouped;
    };

    const attendanceByStudent = groupByStudent(attendanceRows);
    const courseAttendanceByStudent = groupByStudent(courseAttendanceRows);
    const progressByStudent = groupByStudent(progressRows);

    const features = new Map<string, StudentFeatures>();
    for (const studentId of studentIds) {
      features.set(
        studentId,
        this.computeFeatures(
          attendanceByStudent.get(studentId) || [],
          courseAttendanceByStudent.get(studentId) || [],
          progressByStudent.get(studentId) || [],
        ),
      );
    }
    return features;
  }

  private buildPrediction(
    schoolId: string,
    studentId: string,
    features: StudentFeatures,
    result: HeuristicResult,
    source: 'meta' | 'heuristic',
    model: string | null,
    locale: SupportedLocale,
  ): AiPrediction {
    return this.predictionRepo.create({
      schoolId,
      studentId,
      riskLevel: result.riskLevel,
      successProbability: result.successProbability,
      attendanceRate: Math.round(features.attendanceRate * 10000) / 10000,
      totalAbsences: features.totalAbsences,
      unjustifiedAbsences: features.unjustifiedAbsences,
      missedLessons: features.missedLessons,
      completedLessons: features.completedLessons,
      factors: result.factors,
      recommendations: result.recommendations,
      parentSummary: result.parentSummary,
      source,
      model,
      locale,
    });
  }

  private heuristic(features: StudentFeatures, locale: SupportedLocale): HeuristicResult {
    const dict = DICTIONARIES[locale];
    const raw =
      0.55 * features.attendanceRate +
      0.45 * features.completionRate -
      Math.min(features.unjustifiedAbsences * 0.02, 0.2);
    const successProbability = Math.round(clamp(raw, 0, 1) * 10000) / 100;
    const riskLevel = riskFromSuccess(successProbability);

    const factors: string[] = [];
    if (features.attendanceRate >= 0.9) factors.push(dict.factors.goodAttendance);
    if (features.attendanceRate < 0.75) factors.push(dict.factors.lowAttendance);
    if (features.unjustifiedAbsences > 0) factors.push(dict.factors.unjustifiedAbsences);
    if (features.missedLessons > 0) factors.push(dict.factors.missedLessons);
    if (features.completionRate >= 0.8) factors.push(dict.factors.goodCompletion);
    if (features.completionRate < 0.5) factors.push(dict.factors.lowCompletion);
    if (factors.length === 0) factors.push(dict.factors.stable);

    const recommendations: string[] = [];
    if (features.attendanceRate < 0.85) recommendations.push(dict.recommendations.improveAttendance);
    if (features.unjustifiedAbsences > 0) recommendations.push(dict.recommendations.justifyAbsences);
    if (features.completionRate < 0.7 || features.missedLessons > 0) {
      recommendations.push(dict.recommendations.catchUpLessons);
    }
    if (riskLevel === 'high' || riskLevel === 'critical') {
      recommendations.push(dict.recommendations.monitor);
    }
    if (recommendations.length === 0) recommendations.push(dict.recommendations.maintain);

    const parentSummary = dict.parentSummary(
      successProbability,
      Math.round(features.attendanceRate * 100),
      Math.round(features.completionRate * 100),
    );

    return { successProbability, riskLevel, factors, recommendations, parentSummary };
  }

  async predictForStudent(
    schoolId: string,
    studentId: string,
    locale?: string,
  ): Promise<AiPrediction> {
    const normalizedLocale = normalizeLocale(locale);
    const student = await this.studentRepo.findOne({ where: { id: studentId, schoolId } });
    if (!student) throw ApiError.notFound('Student not found');

    const features = await this.collectFeatures(schoolId, studentId);
    const heuristic = this.heuristic(features, normalizedLocale);

    let result: HeuristicResult = heuristic;
    let source: 'meta' | 'heuristic' = 'heuristic';
    let model: string | null = null;

    if (isMetaAiEnabled()) {
      try {
        const dict = DICTIONARIES[normalizedLocale];
        const meta = await chatJson<MetaPredictionResponse>([
          {
            role: 'system',
            content:
              'You predict student success from anonymized numeric features only. Respond only with a JSON object.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              instruction: `Return JSON with successProbability (0-100 number), riskLevel (low|medium|high|critical), factors (string array), recommendations (string array), and parentSummary (string). Write factors, recommendations and parentSummary in ${dict.languageName}. Do not invent personal information.`,
              features: {
                attendanceRate: features.attendanceRate,
                completionRate: features.completionRate,
                totalRecords: features.totalRecords,
                totalAbsences: features.totalAbsences,
                unjustifiedAbsences: features.unjustifiedAbsences,
                missedLessons: features.missedLessons,
                completedLessons: features.completedLessons,
                totalLessons: features.totalLessons,
              },
            }),
          },
        ]);

        if (typeof meta.successProbability !== 'number' || !Number.isFinite(meta.successProbability)) {
          throw new Error('Invalid successProbability from Meta AI');
        }

        const successProbability = Math.round(clamp(meta.successProbability, 0, 100) * 100) / 100;
        const factors = toStringArray(meta.factors);
        const recommendations = toStringArray(meta.recommendations);
        result = {
          successProbability,
          riskLevel: isRiskLevel(meta.riskLevel)
            ? meta.riskLevel
            : riskFromSuccess(successProbability),
          factors: factors.length > 0 ? factors : heuristic.factors,
          recommendations:
            recommendations.length > 0 ? recommendations : heuristic.recommendations,
          parentSummary:
            typeof meta.parentSummary === 'string' && meta.parentSummary.trim().length > 0
              ? meta.parentSummary
              : heuristic.parentSummary,
        };
        source = 'meta';
        model = env.ai.model || null;
      } catch {
        result = heuristic;
        source = 'heuristic';
        model = null;
      }
    }

    const prediction = this.buildPrediction(
      schoolId,
      studentId,
      features,
      result,
      source,
      model,
      normalizedLocale,
    );

    return this.predictionRepo.save(prediction);
  }

  async predictForSchool(schoolId: string, locale?: string): Promise<AiPrediction[]> {
    const normalizedLocale = normalizeLocale(locale);
    const students = await this.studentRepo.find({ where: { schoolId, isActive: true } });
    if (students.length === 0) return [];

    const featuresByStudent = await this.collectFeaturesForSchool(
      schoolId,
      students.map((student) => student.id),
    );

    const predictions = students.map((student) => {
      const features = featuresByStudent.get(student.id) || this.computeFeatures([], [], []);
      return this.buildPrediction(
        schoolId,
        student.id,
        features,
        this.heuristic(features, normalizedLocale),
        'heuristic',
        null,
        normalizedLocale,
      );
    });

    return this.predictionRepo.save(predictions);
  }

  async getLatest(schoolId: string, studentId: string): Promise<AiPrediction | null> {
    return this.predictionRepo.findOne({
      where: { schoolId, studentId },
      order: { createdAt: 'DESC' },
    });
  }

  async list(
    schoolId: string,
    options?: { riskLevel?: AiRiskLevel; limit?: number },
  ): Promise<PredictionListItem[]> {
    const all = await this.predictionRepo
      .createQueryBuilder('prediction')
      .leftJoinAndSelect('prediction.student', 'student')
      .where('prediction.schoolId = :schoolId', { schoolId })
      .orderBy('prediction.createdAt', 'DESC')
      .getMany();

    const latestByStudent = new Map<string, AiPrediction>();
    for (const prediction of all) {
      if (!latestByStudent.has(prediction.studentId)) {
        latestByStudent.set(prediction.studentId, prediction);
      }
    }

    let items = Array.from(latestByStudent.values());
    if (options?.riskLevel) {
      items = items.filter((item) => item.riskLevel === options.riskLevel);
    }

    const limit = clamp(Math.floor(options?.limit || 50), 1, 500);
    items = items.slice(0, limit);

    return items.map((prediction) => ({
      id: prediction.id,
      schoolId: prediction.schoolId,
      studentId: prediction.studentId,
      riskLevel: prediction.riskLevel,
      successProbability: prediction.successProbability,
      attendanceRate: prediction.attendanceRate,
      totalAbsences: prediction.totalAbsences,
      unjustifiedAbsences: prediction.unjustifiedAbsences,
      missedLessons: prediction.missedLessons,
      completedLessons: prediction.completedLessons,
      factors: prediction.factors,
      recommendations: prediction.recommendations,
      parentSummary: prediction.parentSummary,
      source: prediction.source,
      model: prediction.model,
      locale: prediction.locale,
      createdAt: prediction.createdAt,
      student: prediction.student
        ? {
            id: prediction.student.id,
            firstName: prediction.student.firstName,
            lastName: prediction.student.lastName,
          }
        : null,
    }));
  }
}

export const predictionService = new PredictionService();
