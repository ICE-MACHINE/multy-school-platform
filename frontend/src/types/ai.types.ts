import type { ScheduleChangeRequest } from './timetable.types';

export type AiRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type AiPredictionSource = 'meta' | 'heuristic';

export interface AiPredictionStudent {
  id: string;
  firstName: string;
  lastName: string;
}

export interface AiPrediction {
  id: string;
  studentId: string;
  student?: AiPredictionStudent;
  riskLevel: AiRiskLevel;
  successProbability: number;
  attendanceRate: number;
  totalAbsences: number;
  unjustifiedAbsences: number;
  missedLessons: number;
  completedLessons: number;
  factors: string[];
  recommendations: string[];
  parentSummary: string | null;
  source: AiPredictionSource;
  model: string | null;
  locale: string;
  createdAt: string;
}

export type AiDecision = 'approve' | 'reject' | 'manual_review';

export interface AiEvaluatedScheduleChangeRequest extends ScheduleChangeRequest {
  aiDecision: AiDecision | null;
  aiConfidence: number | null;
  aiReason: string | null;
  aiProcessedAt: string | null;
  autoProcessed: boolean;
  constraintFeasible: boolean | null;
  constraintViolations: ConstraintViolation[] | null;
  suggestedAlternatives: SuggestedAlternative[] | null;
  agentRecommendation: AiDecision | null;
  agentSummary: string | null;
  agentTrace: AgentTraceStep[] | null;
}

export type AiScheduleChangeRequest = ScheduleChangeRequest & {
  aiDecision?: AiDecision | null;
  aiConfidence?: number | null;
  aiReason?: string | null;
  aiProcessedAt?: string | null;
  autoProcessed?: boolean;
  constraintFeasible?: boolean | null;
  constraintViolations?: ConstraintViolation[] | null;
  suggestedAlternatives?: SuggestedAlternative[] | null;
  agentRecommendation?: AiDecision | null;
  agentSummary?: string | null;
  agentTrace?: AgentTraceStep[] | null;
};

export type HardConstraintCode =
  | 'NO_TARGET' | 'INVALID_DURATION' | 'DAY_NOT_STUDY_DAY' | 'PERIOD_NOT_FOUND'
  | 'OUTSIDE_OPERATING_HOURS' | 'DURATION_EXCEEDS_PERIOD' | 'TEACHER_CONFLICT'
  | 'CLASSROOM_CONFLICT' | 'COURSE_GROUP_CONFLICT' | 'STUDENT_CONFLICT'
  | 'CLASSROOM_CAPACITY_EXCEEDED' | 'COURSE_CAPACITY_EXCEEDED';

export interface ConstraintViolation {
  code: HardConstraintCode;
  message: string;
  details?: Record<string, string | number>;
}

export interface SuggestedAlternative {
  day: string;
  periodId: string;
  periodLabel: string;
  startTime: string;
  endTime: string;
  score: number;
  reasonCodes: string[];
}

export interface AgentTraceStep {
  step: number;
  tool: string;
  permission: string;
  status: 'ok' | 'skipped' | 'failed' | 'vetoed';
  summary: string;
  at: string;
  durationMs?: number;
}

export interface ScheduleAlternativesResult {
  requestId: string;
  feasible: boolean;
  violations: ConstraintViolation[];
  target: { day: string; periodId: string; periodLabel: string; startTime: string; endTime: string } | null;
  alternatives: SuggestedAlternative[];
}

export type DocumentScanStatus = 'processing' | 'completed' | 'failed';

export type DocumentType = 'absence_justification' | 'medical_certificate' | 'invoice' | 'other' | 'unknown';

export interface DocumentSegmentation {
  provider: string;
  bbox?: number[] | Record<string, number>;
  polygon?: number[][] | Array<{ x: number; y: number }>;
  maskAreaRatio?: number;
  confidence?: number;
}

export interface PlatformSchoolSummary {
  id: string;
  name: string;
  slug: string;
  type: string;
  isActive: boolean;
  isFrozen: boolean;
  monthlyFee: number;
  maxUsers: number;
  currentUsers: number;
  userUsagePct: number;
  maxMessages: number;
  currentMessages: number;
  messageUsagePct: number;
  students: number;
  teachers: number;
  createdAt: string;
}

export interface PlatformSnapshotTotals {
  totalSchools: number;
  activeSchools: number;
  frozenSchools: number;
  inactiveSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
}

export interface PlatformSnapshot {
  generatedAt: string;
  totals: PlatformSnapshotTotals;
  mrr: number;
  paymentsThisMonth: number;
  newSchoolsLast30Days: number;
  schoolsByType: Array<{ type: string; count: number }>;
  schools: PlatformSchoolSummary[];
}

export type AiInsightSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface AiInsight {
  id: string;
  severity: AiInsightSeverity;
  category: string;
  schoolId?: string;
  schoolName?: string;
  title: string;
  message: string;
}

export type AiRecommendationPriority = 'high' | 'medium' | 'low';

export interface AiRecommendation {
  priority: AiRecommendationPriority;
  title: string;
  description: string;
  schoolId?: string;
}

export interface AiBriefing {
  generatedAt: string;
  source: AiPredictionSource;
  summary: string;
  highlights: string[];
  recommendations: AiRecommendation[];
  snapshot: PlatformSnapshot;
  trends: PlatformTrends | null;
}

export interface MonthlyPoint {
  month: string;
  collections: number;
  paymentCount: number;
  refundsAmount: number;
  newSchools: number;
  cumulativeSchools: number;
  newStudents: number;
  newTeachers: number;
}

export interface MetricComparison {
  current: number;
  previous: number;
  delta: number;
  deltaPct: number | null;
}

export interface SchoolCollectionsComparison {
  schoolId: string;
  schoolName: string;
  currentMonth: number;
  previousMonth: number;
  delta: number;
  deltaPct: number | null;
}

export interface DiagnosisDriver {
  code: string;
  schoolId?: string;
  schoolName?: string;
  current?: number;
  previous?: number;
  deltaPct?: number | null;
  schools?: string[];
}

export interface ChurnRisk {
  schoolId: string;
  schoolName: string;
  score: number;
  level: 'high' | 'medium' | 'low';
  reasonCodes: string[];
}

export interface PlanRecommendation {
  schoolId: string;
  schoolName: string;
  userUsagePct: number;
  messageUsagePct: number;
  currentUsers: number;
  maxUsers: number;
  suggestedMaxUsers: number;
  currentMessages: number;
  maxMessages: number;
  suggestedMaxMessages: number;
  basisCodes: string[];
}

export interface ContactAction {
  schoolId: string;
  schoolName: string;
  urgencyScore: number;
  actionCodes: string[];
  reasonCodes: string[];
}

export interface PlatformTrends {
  generatedAt: string;
  months: MonthlyPoint[];
  currentVsPrevious: {
    collections: MetricComparison;
    paymentCount: MetricComparison;
    newSchools: MetricComparison;
    newStudents: MetricComparison;
  };
  last3VsPrevious3Collections: MetricComparison;
  perSchoolCollections: SchoolCollectionsComparison[];
  drivers: DiagnosisDriver[];
  churnRisks: ChurnRisk[];
  planRecommendations: PlanRecommendation[];
  contactToday: ContactAction[];
  limitations: string[];
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatResponse {
  reply: string;
  source: AiPredictionSource;
  generatedAt: string;
}

export interface MonthlyFinancePoint {
  month: string;
  collected: number;
  paymentCount: number;
  refundsAmount: number;
}

export interface StudentArrears {
  studentId: string;
  studentName: string;
  unpaidMonths: string[];
  arrearsAmount: number;
  latePaymentsCount: number;
}

export interface FinancialIntelligence {
  actuals: {
    currentMonth: string;
    collectedThisMonth: number;
    collectedPreviousMonth: number;
    collectionsDeltaPct: number | null;
    expectedMonthlyDue: number;
    collectionRateThisMonth: number | null;
    totalArrearsAmount: number;
    studentsInArrears: number;
    payingStudents: number;
    exemptStudents: number;
    months: MonthlyFinancePoint[];
  };
  forecasts: Array<{
    month: string;
    projectedCollections: number;
    lowEstimate: number;
    highEstimate: number;
    isForecast: true;
  }>;
  forecastModel: { method: string; basedOnMonths: number; confidence: 'low' | 'medium'; note: string };
  repeatLatePayers: StudentArrears[];
  arrearsAlerts: Array<{ code: string; level: 'high' | 'medium' | 'low'; value: number }>;
  expenses: { available: false; reasonCode: string; incomeVsExpenses: null };
}

export interface CourseProgress {
  courseId: string;
  courseName: string;
  teacherId: string | null;
  teacherName: string | null;
  totalLessons: number;
  taughtLessons: number;
  remainingLessons: number;
  progressPct: number;
  plannedSessions: number | null;
  completedSessions: number;
  sessionProgressPct: number | null;
  sessionsPerWeek: number;
  daysSinceLastSession: number | null;
  projectedCompletionDate: string | null;
  mayMissYearEnd: boolean;
  riskLevel: 'high' | 'medium' | 'low';
  riskCodes: string[];
  untaughtLessonTitles: string[];
}

export interface CurriculumIntelligence {
  courses: CourseProgress[];
  teachers: Array<{
    teacherId: string | null;
    teacherName: string | null;
    courses: number;
    averageProgressPct: number;
    highRiskCourses: number;
  }>;
  atRiskCourses: CourseProgress[];
  academicYearEnd: string | null;
  generatedAt: string;
}

export interface NotificationDigestResult {
  digest: {
    periodDays: number;
    total: number;
    unread: number;
    duplicatesCollapsed: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    urgentUnread: Array<{ groupKey: string; sampleTitle: string; count: number; priority: string }>;
  };
  groups: Array<{ groupKey: string; type: string; priority: string; count: number; unreadCount: number; sampleTitle: string }>;
  duplicatesCollapsed: number;
}

export interface NotificationAdminOverview {
  interventions: Array<{
    studentId: string;
    studentName: string;
    code: string;
    count: number;
    detail: string;
  }>;
  sendTimePolicy: { at: string; code: string };
  generatedAt: string;
}

export type DocumentReviewStatus = 'pending_review' | 'confirmed' | 'approved' | 'rejected' | 'archived' | 'expired';

export interface DocumentRevision {
  id: string;
  documentId: string;
  actorId?: string;
  actorRole: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  changes: Record<string, { from: string | null; to: string | null }> | null;
  note: string | null;
  createdAt: string;
}

export interface DocumentVerification {
  requiresHumanReview: true;
  studentNameMatches: boolean | null;
  firstNameMatches?: boolean | null;
  lastNameMatches?: boolean | null;
  dateOfBirthMatches?: boolean | null;
  ageMatches?: boolean | null;
  documentAgeYears?: number | null;
  studentAgeYears?: number | null;
  issueDateValid?: boolean;
  datesValid: boolean;
  lowConfidence: boolean;
  extractionSkipped: boolean;
  checks: string[];
}

export interface DocumentScan {
  id: string;
  studentId: string | null;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentScanStatus;
  documentType: DocumentType;
  extractedText: string | null;
  extractedFields: Record<string, unknown> | null;
  segmentation: DocumentSegmentation | null;
  confidence: number | null;
  error: string | null;
  reviewStatus: DocumentReviewStatus;
  verification: DocumentVerification | null;
  confirmedById: string | null;
  confirmedAt: string | null;
  reviewedById: string | null;
  reviewedByRole: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  appliedAttendanceIds: string[] | null;
  appliedCourseAttendanceIds: string[] | null;
  duplicateOfId: string | null;
  approvedStartDate: string | null;
  approvedEndDate: string | null;
  archivedById: string | null;
  archivedAt: string | null;
  expiredAt: string | null;
  createdAt: string;
}
