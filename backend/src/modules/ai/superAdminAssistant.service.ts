import { buildPlatformSnapshot, PlatformSnapshot, SchoolSnapshot } from './platformSnapshot';
import { buildPlatformTrends, type PlatformTrends } from './platformTrends';
import { chatJson, chatText, isMetaAiEnabled } from './metaAi.client';

export type SupportedLocale = 'en' | 'fr' | 'ar';
export type InsightSeverity = 'critical' | 'warning' | 'info' | 'success';
export type InsightCategory = 'capacity' | 'quota' | 'churn' | 'billing' | 'growth';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  category: InsightCategory;
  schoolId?: string;
  schoolName?: string;
  title: string;
  message: string;
}

export interface BriefingRecommendation {
  priority: string;
  title: string;
  description: string;
  schoolId?: string;
}

export interface BriefingResult {
  generatedAt: string;
  source: 'meta' | 'heuristic';
  summary: string;
  highlights: string[];
  recommendations: BriefingRecommendation[];
  snapshot: PlatformSnapshot;
  trends: PlatformTrends | null;
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  reply: string;
  source: 'meta' | 'heuristic';
  generatedAt: string;
}

export function normalizeLocale(locale?: string): SupportedLocale {
  const value = (locale || 'en').toLowerCase();
  if (value.startsWith('fr')) return 'fr';
  if (value.startsWith('ar')) return 'ar';
  return 'en';
}

const LANGUAGE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  fr: 'French',
  ar: 'Arabic',
};

interface Dict {
  languageName: string;
  capacityCriticalTitle: string;
  capacityWarningTitle: string;
  capacityCritical: (s: SchoolSnapshot) => string;
  capacityWarning: (s: SchoolSnapshot) => string;
  quotaTitle: string;
  quota: (s: SchoolSnapshot) => string;
  churnTitle: string;
  churn: (s: SchoolSnapshot) => string;
  frozenTitle: string;
  frozen: (s: SchoolSnapshot) => string;
  inactiveTitle: string;
  inactive: (s: SchoolSnapshot) => string;
  zeroFeeTitle: string;
  zeroFee: (s: SchoolSnapshot) => string;
  noPaymentTitle: string;
  noPayment: (s: SchoolSnapshot) => string;
  growthTitle: string;
  growth: (count: number) => string;
  summary: (snap: PlatformSnapshot) => string;
  highlightMrr: (snap: PlatformSnapshot) => string;
  highlightGrowth: (snap: PlatformSnapshot) => string;
  highlightByType: (snap: PlatformSnapshot) => string;
  highlightNone: string;
  maintainTitle: string;
  maintainDescription: string;
  capacityHeading: string;
  capacityNone: string;
  revenueHeading: (snap: PlatformSnapshot) => string;
  revenueZeroFee: (names: string) => string;
  revenueNoPayment: (names: string) => string;
  riskHeading: (snap: PlatformSnapshot) => string;
  riskNone: string;
  growthHeading: (snap: PlatformSnapshot) => string;
  largestHeading: string;
  overviewHeading: (snap: PlatformSnapshot) => string;
  topInsights: string;
  noInsights: string;
  none: string;
  biTrends: string;
  biContact: string;
  biResources: string;
  biChurn: string;
  biPlan: string;
  biLimitations: string;
  biCollections: string;
  biNoTrendData: string;
}

const DICTS: Record<SupportedLocale, Dict> = {
  en: {
    languageName: 'English',
    capacityCriticalTitle: 'Critical user capacity',
    capacityWarningTitle: 'Approaching user limit',
    capacityCritical: (s) => `${s.name} is at ${s.userUsagePct}% of its user limit (${s.currentUsers}/${s.maxUsers}) - propose an immediate plan upgrade.`,
    capacityWarning: (s) => `${s.name} is at ${s.userUsagePct}% of its user limit (${s.currentUsers}/${s.maxUsers}) - approaching user limit - propose plan upgrade.`,
    quotaTitle: 'Approaching message quota',
    quota: (s) => `${s.name} is at ${s.messageUsagePct}% of its message quota (${s.currentMessages}/${s.maxMessages}) - propose a quota increase or plan upgrade.`,
    churnTitle: 'Onboarding / churn risk',
    churn: (s) => `${s.name} was created more than 14 days ago but has ${s.students} students and ${s.teachers} teachers - onboarding/churn risk, offer onboarding help.`,
    frozenTitle: 'Frozen school',
    frozen: (s) => `${s.name} is frozen. Follow up and decide whether to unfreeze it or keep it frozen.`,
    inactiveTitle: 'Inactive school',
    inactive: (s) => `${s.name} is inactive. Follow up with the school to reactivate or close it.`,
    zeroFeeTitle: 'Active school with no monthly fee',
    zeroFee: (s) => `${s.name} is active but its monthlyFee is 0. Review its subscription/fee setup.`,
    noPaymentTitle: 'No payments this month',
    noPayment: (s) => `${s.name} has no payments this month recorded. Follow up on billing/payments.`,
    growthTitle: 'Platform growth',
    growth: (n) => `${n} new school(s) joined in the last 30 days.`,
    summary: (snap) => `Platform: ${snap.totals.totalSchools} schools (${snap.totals.activeSchools} active, ${snap.totals.frozenSchools} frozen, ${snap.totals.inactiveSchools} inactive), ${snap.totals.totalStudents} students, ${snap.totals.totalTeachers} teachers and ${snap.totals.totalParents} parents. MRR is ${snap.mrr}, payments this month are ${snap.paymentsThisMonth}, and ${snap.newSchoolsLast30Days} new school(s) joined in the last 30 days.`,
    highlightMrr: (snap) => `MRR: ${snap.mrr} - payments this month: ${snap.paymentsThisMonth}`,
    highlightGrowth: (snap) => `New schools in the last 30 days: ${snap.newSchoolsLast30Days}`,
    highlightByType: (snap) => `Schools by type: ${snap.schoolsByType.map((x) => `${x.type}: ${x.count}`).join(', ') || 'none'}`,
    highlightNone: 'No critical platform issues detected.',
    maintainTitle: 'Maintain platform monitoring',
    maintainDescription: 'No urgent action detected. Keep monitoring capacity, billing and onboarding.',
    capacityHeading: 'Schools approaching capacity/quota limits (>=80%):',
    capacityNone: 'No school is at or above 80% of its user or message limits.',
    revenueHeading: (snap) => `MRR: ${snap.mrr}. Payments this month: ${snap.paymentsThisMonth}.`,
    revenueZeroFee: (names) => `Active schools with monthlyFee=0: ${names}.`,
    revenueNoPayment: (names) => `Active schools with no payments this month: ${names}.`,
    riskHeading: (snap) => `Frozen schools: ${snap.totals.frozenSchools}. Inactive schools: ${snap.totals.inactiveSchools}.`,
    riskNone: 'No frozen, inactive or onboarding-risk schools detected.',
    growthHeading: (snap) => `${snap.newSchoolsLast30Days} new school(s) in the last 30 days, out of ${snap.totals.totalSchools} schools (${snap.schoolsByType.map((x) => `${x.type}: ${x.count}`).join(', ') || 'no types'}). Newest schools:`,
    largestHeading: 'Largest schools (by students, then current users):',
    overviewHeading: (snap) => `Platform: ${snap.totals.totalSchools} schools (${snap.totals.activeSchools} active, ${snap.totals.frozenSchools} frozen, ${snap.totals.inactiveSchools} inactive), ${snap.totals.totalStudents} students, ${snap.totals.totalTeachers} teachers, ${snap.totals.totalParents} parents. MRR: ${snap.mrr}. Payments this month: ${snap.paymentsThisMonth}. New schools (30 days): ${snap.newSchoolsLast30Days}.`,
    topInsights: 'Top insights:',
    noInsights: 'No insights to report.',
    none: 'none',
    biTrends: 'Collections trend (schools tuition collections, not platform subscription revenue):',
    biContact: 'Contact today (ranked by urgency):',
    biResources: 'Most resource-consuming schools (users/messages usage):',
    biChurn: 'Most likely churn risks (deterministic score, not a cancellation record):',
    biPlan: 'Quota/plan recommendations for schools at >=80% (suggested limits bring usage to ~60%):',
    biLimitations: 'Data limitation: there is no subscription-payment or cancellation event history, and monthlyFee is the per-student school fee; frozen/inactive are current states.',
    biCollections: 'collections',
    biNoTrendData: 'Trend data is unavailable right now.',
  },
  fr: {
    languageName: 'French',
    capacityCriticalTitle: 'Capacité utilisateurs critique',
    capacityWarningTitle: "Limite d'utilisateurs proche",
    capacityCritical: (s) => `${s.name} est à ${s.userUsagePct}% de sa limite d'utilisateurs (${s.currentUsers}/${s.maxUsers}) - proposez une mise à niveau immédiate du plan.`,
    capacityWarning: (s) => `${s.name} est à ${s.userUsagePct}% de sa limite d'utilisateurs (${s.currentUsers}/${s.maxUsers}) - limite d'utilisateurs proche - proposez une mise à niveau du plan.`,
    quotaTitle: 'Quota de messages proche',
    quota: (s) => `${s.name} est à ${s.messageUsagePct}% de son quota de messages (${s.currentMessages}/${s.maxMessages}) - proposez une augmentation du quota ou du plan.`,
    churnTitle: "Risque d'intégration / de départ",
    churn: (s) => `${s.name} a été créée il y a plus de 14 jours mais compte ${s.students} élèves et ${s.teachers} enseignants - risque d'intégration/départ, proposez une aide à l'intégration.`,
    frozenTitle: 'École gelée',
    frozen: (s) => `${s.name} est gelée. Faites un suivi et décidez de la dégeler ou de la maintenir gelée.`,
    inactiveTitle: 'École inactive',
    inactive: (s) => `${s.name} est inactive. Faites un suivi pour la réactiver ou la clôturer.`,
    zeroFeeTitle: 'École active sans frais mensuels',
    zeroFee: (s) => `${s.name} est active mais ses frais mensuels sont de 0. Vérifiez son abonnement/ses frais.`,
    noPaymentTitle: 'Aucun paiement ce mois-ci',
    noPayment: (s) => `${s.name} n'a aucun paiement enregistré ce mois-ci. Faites un suivi de la facturation/des paiements.`,
    growthTitle: 'Croissance de la plateforme',
    growth: (n) => `${n} nouvelle(s) école(s) ont rejoint la plateforme au cours des 30 derniers jours.`,
    summary: (snap) => `Plateforme : ${snap.totals.totalSchools} écoles (${snap.totals.activeSchools} actives, ${snap.totals.frozenSchools} gelées, ${snap.totals.inactiveSchools} inactives), ${snap.totals.totalStudents} élèves, ${snap.totals.totalTeachers} enseignants et ${snap.totals.totalParents} parents. Le MRR est de ${snap.mrr}, les paiements ce mois-ci de ${snap.paymentsThisMonth}, et ${snap.newSchoolsLast30Days} nouvelle(s) école(s) ont rejoint la plateforme au cours des 30 derniers jours.`,
    highlightMrr: (snap) => `MRR : ${snap.mrr} - paiements ce mois-ci : ${snap.paymentsThisMonth}`,
    highlightGrowth: (snap) => `Nouvelles écoles au cours des 30 derniers jours : ${snap.newSchoolsLast30Days}`,
    highlightByType: (snap) => `Écoles par type : ${snap.schoolsByType.map((x) => `${x.type}: ${x.count}`).join(', ') || 'aucun'}`,
    highlightNone: 'Aucun problème critique détecté sur la plateforme.',
    maintainTitle: 'Maintenir la surveillance de la plateforme',
    maintainDescription: 'Aucune action urgente détectée. Continuez à surveiller la capacité, la facturation et l’intégration.',
    capacityHeading: 'Écoles proches des limites de capacité/quota (>=80%) :',
    capacityNone: "Aucune école n'est à 80% ou plus de ses limites d'utilisateurs ou de messages.",
    revenueHeading: (snap) => `MRR : ${snap.mrr}. Paiements ce mois-ci : ${snap.paymentsThisMonth}.`,
    revenueZeroFee: (names) => `Écoles actives avec frais mensuels = 0 : ${names}.`,
    revenueNoPayment: (names) => `Écoles actives sans paiements ce mois-ci : ${names}.`,
    riskHeading: (snap) => `Écoles gelées : ${snap.totals.frozenSchools}. Écoles inactives : ${snap.totals.inactiveSchools}.`,
    riskNone: 'Aucune école gelée, inactive ou à risque d’intégration détectée.',
    growthHeading: (snap) => `${snap.newSchoolsLast30Days} nouvelle(s) école(s) au cours des 30 derniers jours, sur ${snap.totals.totalSchools} écoles (${snap.schoolsByType.map((x) => `${x.type}: ${x.count}`).join(', ') || 'aucun type'}). Écoles les plus récentes :`,
    largestHeading: 'Plus grandes écoles (par élèves, puis utilisateurs actuels) :',
    overviewHeading: (snap) => `Plateforme : ${snap.totals.totalSchools} écoles (${snap.totals.activeSchools} actives, ${snap.totals.frozenSchools} gelées, ${snap.totals.inactiveSchools} inactives), ${snap.totals.totalStudents} élèves, ${snap.totals.totalTeachers} enseignants, ${snap.totals.totalParents} parents. MRR : ${snap.mrr}. Paiements ce mois-ci : ${snap.paymentsThisMonth}. Nouvelles écoles (30 jours) : ${snap.newSchoolsLast30Days}.`,
    topInsights: 'Principaux signaux :',
    noInsights: 'Aucun signal à signaler.',
    none: 'aucun',
    biTrends: 'Tendance des encaissements (frais de scolarité des écoles, pas les revenus d’abonnement de la plateforme) :',
    biContact: 'À contacter aujourd’hui (par urgence) :',
    biResources: 'Écoles les plus consommatrices de ressources (utilisateurs/messages) :',
    biChurn: 'Risques de départ les plus probables (score déterministe, pas un historique d’annulations) :',
    biPlan: 'Recommandations de quotas/forfaits pour les écoles à >=80% (limites suggérées ramenant l’usage à ~60%) :',
    biLimitations: 'Limite des données : aucun historique de paiements d’abonnement ni d’annulations, et monthlyFee est le frais par élève de l’école ; gelé/inactif sont des états actuels.',
    biCollections: 'encaissements',
    biNoTrendData: 'Les données de tendance sont indisponibles pour le moment.',
  },
  ar: {
    languageName: 'Arabic',
    capacityCriticalTitle: 'سعة المستخدمين حرجة',
    capacityWarningTitle: 'الاقتراب من حد المستخدمين',
    capacityCritical: (s) => `${s.name} وصلت إلى ${s.userUsagePct}% من حد المستخدمين (${s.currentUsers}/${s.maxUsers}) - اقترح ترقية فورية للخطة.`,
    capacityWarning: (s) => `${s.name} وصلت إلى ${s.userUsagePct}% من حد المستخدمين (${s.currentUsers}/${s.maxUsers}) - الاقتراب من حد المستخدمين - اقترح ترقية الخطة.`,
    quotaTitle: 'الاقتراب من حصة الرسائل',
    quota: (s) => `${s.name} وصلت إلى ${s.messageUsagePct}% من حصة الرسائل (${s.currentMessages}/${s.maxMessages}) - اقترح زيادة الحصة أو ترقية الخطة.`,
    churnTitle: 'خطر الإعداد / فقدان المدرسة',
    churn: (s) => `أُنشئت ${s.name} منذ أكثر من 14 يومًا لكن لديها ${s.students} طالبًا و${s.teachers} معلمًا - خطر في الإعداد/الفقدان، قدّم مساعدة في الإعداد.`,
    frozenTitle: 'مدرسة مجمدة',
    frozen: (s) => `${s.name} مجمدة. تابع مع المدرسة وقرر إلغاء تجميدها أو إبقاءها مجمدة.`,
    inactiveTitle: 'مدرسة غير نشطة',
    inactive: (s) => `${s.name} غير نشطة. تابع مع المدرسة لإعادة تفعيلها أو إغلاقها.`,
    zeroFeeTitle: 'مدرسة نشطة بدون رسوم شهرية',
    zeroFee: (s) => `${s.name} نشطة لكن رسومها الشهرية 0. راجع إعداد اشتراكها/رسومها.`,
    noPaymentTitle: 'لا مدفوعات هذا الشهر',
    noPayment: (s) => `${s.name} ليس لديها مدفوعات مسجلة هذا الشهر. تابع الفوترة/المدفوعات.`,
    growthTitle: 'نمو المنصة',
    growth: (n) => `انضمت ${n} مدرسة جديدة خلال آخر 30 يومًا.`,
    summary: (snap) => `المنصة: ${snap.totals.totalSchools} مدرسة (${snap.totals.activeSchools} نشطة، ${snap.totals.frozenSchools} مجمدة، ${snap.totals.inactiveSchools} غير نشطة)، ${snap.totals.totalStudents} طالب، ${snap.totals.totalTeachers} معلم و${snap.totals.totalParents} ولي. الإيراد الشهري المتكرر ${snap.mrr}، ومدفوعات هذا الشهر ${snap.paymentsThisMonth}، وانضمت ${snap.newSchoolsLast30Days} مدرسة جديدة خلال آخر 30 يومًا.`,
    highlightMrr: (snap) => `الإيراد الشهري المتكرر: ${snap.mrr} - مدفوعات هذا الشهر: ${snap.paymentsThisMonth}`,
    highlightGrowth: (snap) => `المدارس الجديدة خلال آخر 30 يومًا: ${snap.newSchoolsLast30Days}`,
    highlightByType: (snap) => `المدارس حسب النوع: ${snap.schoolsByType.map((x) => `${x.type}: ${x.count}`).join(', ') || 'لا يوجد'}`,
    highlightNone: 'لم يتم رصد مشاكل حرجة في المنصة.',
    maintainTitle: 'مواصلة مراقبة المنصة',
    maintainDescription: 'لا يوجد إجراء عاجل. واصل مراقبة السعة والفوترة والإعداد.',
    capacityHeading: 'المدارس القريبة من حدود السعة/الحصة (>=80%):',
    capacityNone: 'لا توجد مدرسة عند 80% أو أكثر من حدود المستخدمين أو الرسائل.',
    revenueHeading: (snap) => `الإيراد الشهري المتكرر: ${snap.mrr}. مدفوعات هذا الشهر: ${snap.paymentsThisMonth}.`,
    revenueZeroFee: (names) => `مدارس نشطة برسوم شهرية = 0: ${names}.`,
    revenueNoPayment: (names) => `مدارس نشطة بدون مدفوعات هذا الشهر: ${names}.`,
    riskHeading: (snap) => `المدارس المجمدة: ${snap.totals.frozenSchools}. المدارس غير النشطة: ${snap.totals.inactiveSchools}.`,
    riskNone: 'لم يتم رصد مدارس مجمدة أو غير نشطة أو معرضة لخطر الإعداد.',
    growthHeading: (snap) => `${snap.newSchoolsLast30Days} مدرسة جديدة خلال آخر 30 يومًا، من أصل ${snap.totals.totalSchools} مدرسة (${snap.schoolsByType.map((x) => `${x.type}: ${x.count}`).join(', ') || 'لا أنواع'}). أحدث المدارس:`,
    largestHeading: 'أكبر المدارس (حسب الطلاب ثم المستخدمين الحاليين):',
    overviewHeading: (snap) => `المنصة: ${snap.totals.totalSchools} مدرسة (${snap.totals.activeSchools} نشطة، ${snap.totals.frozenSchools} مجمدة، ${snap.totals.inactiveSchools} غير نشطة)، ${snap.totals.totalStudents} طالب، ${snap.totals.totalTeachers} معلم، ${snap.totals.totalParents} ولي. الإيراد الشهري المتكرر: ${snap.mrr}. مدفوعات هذا الشهر: ${snap.paymentsThisMonth}. مدارس جديدة (30 يومًا): ${snap.newSchoolsLast30Days}.`,
    topInsights: 'أهم الإشارات:',
    noInsights: 'لا توجد إشارات للعرض.',
    none: 'لا يوجد',
    biTrends: 'اتجاه التحصيلات (رسوم طلبة المدارس، وليست إيرادات اشتراك المنصة):',
    biContact: 'للتواصل اليوم (مرتبة حسب الإلحاح):',
    biResources: 'المدارس الأكثر استهلاكاً للموارد (المستخدمون/الرسائل):',
    biChurn: 'المدارس الأكثر احتمالاً للمغادرة (درجة حتمية، وليست سجل إلغاءات):',
    biPlan: 'توصيات الحصص/الخطط للمدارس عند 80% فأكثر (حدود مقترحة تخفض الاستخدام إلى ~60%):',
    biLimitations: 'قيد البيانات: لا يوجد سجل لأحداث دفع الاشتراكات أو الإلغاءات، وmonthlyFee هو رسم الطالب داخل المدرسة؛ والمجمدة/غير النشطة حالات حالية لا أحداث فترة.',
    biCollections: 'التحصيلات',
    biNoTrendData: 'بيانات الاتجاه غير متاحة حالياً.',
  },
};

const SEVERITY_RANK: Record<InsightSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  success: 3,
};

export function buildInsights(snapshot: PlatformSnapshot, locale?: string): Insight[] {
  const dict = DICTS[normalizeLocale(locale)];
  const insights: Insight[] = [];
  const nowMs = new Date(snapshot.generatedAt).getTime() || Date.now();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  for (const school of snapshot.schools) {
    if (school.userUsagePct >= 90) {
      insights.push({
        id: `capacity-${school.id}`,
        severity: 'critical',
        category: 'capacity',
        schoolId: school.id,
        schoolName: school.name,
        title: dict.capacityCriticalTitle,
        message: dict.capacityCritical(school),
      });
    } else if (school.userUsagePct >= 80) {
      insights.push({
        id: `capacity-${school.id}`,
        severity: 'warning',
        category: 'capacity',
        schoolId: school.id,
        schoolName: school.name,
        title: dict.capacityWarningTitle,
        message: dict.capacityWarning(school),
      });
    }

    if (school.messageUsagePct >= 80) {
      insights.push({
        id: `quota-${school.id}`,
        severity: 'warning',
        category: 'quota',
        schoolId: school.id,
        schoolName: school.name,
        title: dict.quotaTitle,
        message: dict.quota(school),
      });
    }

    const createdMs = new Date(school.createdAt).getTime();
    if (
      Number.isFinite(createdMs) &&
      nowMs - createdMs > fourteenDaysMs &&
      (school.students === 0 || school.teachers === 0)
    ) {
      insights.push({
        id: `churn-${school.id}`,
        severity: 'critical',
        category: 'churn',
        schoolId: school.id,
        schoolName: school.name,
        title: dict.churnTitle,
        message: dict.churn(school),
      });
    }

    if (school.isFrozen) {
      insights.push({
        id: `frozen-${school.id}`,
        severity: 'info',
        category: 'churn',
        schoolId: school.id,
        schoolName: school.name,
        title: dict.frozenTitle,
        message: dict.frozen(school),
      });
    }

    if (!school.isActive) {
      insights.push({
        id: `inactive-${school.id}`,
        severity: 'warning',
        category: 'churn',
        schoolId: school.id,
        schoolName: school.name,
        title: dict.inactiveTitle,
        message: dict.inactive(school),
      });
    }

    if (school.isActive && Number(school.monthlyFee) === 0) {
      insights.push({
        id: `billing-zero-fee-${school.id}`,
        severity: 'warning',
        category: 'billing',
        schoolId: school.id,
        schoolName: school.name,
        title: dict.zeroFeeTitle,
        message: dict.zeroFee(school),
      });
    }

    if (school.isActive && !school.isFrozen && !school.hasPaymentThisMonth && school.paymentsThisMonth === 0) {
      insights.push({
        id: `billing-no-payment-${school.id}`,
        severity: 'warning',
        category: 'billing',
        schoolId: school.id,
        schoolName: school.name,
        title: dict.noPaymentTitle,
        message: dict.noPayment(school),
      });
    }
  }

  if (snapshot.newSchoolsLast30Days > 0) {
    insights.push({
      id: 'growth-new-schools',
      severity: 'success',
      category: 'growth',
      title: dict.growthTitle,
      message: dict.growth(snapshot.newSchoolsLast30Days),
    });
  }

  return insights.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

export function buildHeuristicBriefing(
  snapshot: PlatformSnapshot,
  locale?: string,
  trends?: PlatformTrends | null,
): Omit<BriefingResult, 'snapshot' | 'trends'> {
  const normalized = normalizeLocale(locale);
  const dict = DICTS[normalized];
  const insights = buildInsights(snapshot, normalized);
  const trendHighlight = trends
    ? `${dict.biCollections}: ${trends.currentVsPrevious.collections.current} vs ${trends.currentVsPrevious.collections.previous} (${trends.currentVsPrevious.collections.deltaPct === null ? 'n/a' : `${trends.currentVsPrevious.collections.deltaPct}%`})`
    : null;
  const highlights = [
    dict.highlightMrr(snapshot),
    ...(trendHighlight ? [trendHighlight] : []),
    dict.highlightGrowth(snapshot),
    dict.highlightByType(snapshot),
    ...insights.slice(0, 3).map((i) => i.message),
  ];
  const recommendations: BriefingRecommendation[] =
    insights.length > 0
      ? insights.slice(0, 5).map((insight) => ({
          priority:
            insight.severity === 'critical' ? 'high' : insight.severity === 'warning' ? 'medium' : 'low',
          title: insight.title,
          description: insight.message,
          ...(insight.schoolId ? { schoolId: insight.schoolId } : {}),
        }))
      : [{ priority: 'low', title: dict.maintainTitle, description: dict.maintainDescription }];

  return {
    generatedAt: new Date().toISOString(),
    source: 'heuristic',
    summary: dict.summary(snapshot),
    highlights: highlights.length > 0 ? highlights : [dict.highlightNone],
    recommendations,
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

interface MetaBriefing {
  summary?: unknown;
  highlights?: unknown;
  recommendations?: unknown;
}

function parseMetaRecommendations(value: unknown): BriefingRecommendation[] {
  if (!Array.isArray(value)) return [];
  const result: BriefingRecommendation[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const title = typeof record.title === 'string' ? record.title.trim() : '';
    const description = typeof record.description === 'string' ? record.description.trim() : '';
    if (!title || !description) continue;
    result.push({
      priority:
        typeof record.priority === 'string' && record.priority.trim()
          ? record.priority.trim()
          : typeof record.priority === 'number'
            ? String(record.priority)
            : 'medium',
      title,
      description,
      ...(typeof record.schoolId === 'string' && record.schoolId ? { schoolId: record.schoolId } : {}),
    });
  }
  return result;
}

function sanitizeHistory(history?: unknown): ChatHistoryItem[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (item): item is ChatHistoryItem =>
        Boolean(item) &&
        typeof item === 'object' &&
        ((item as ChatHistoryItem).role === 'user' || (item as ChatHistoryItem).role === 'assistant') &&
        typeof (item as ChatHistoryItem).content === 'string' &&
        (item as ChatHistoryItem).content.trim().length > 0,
    )
    .slice(-10)
    .map((item) => ({ role: item.role, content: item.content.slice(0, 2000) }));
}

export function ruleBasedChatReply(
  message: string,
  snapshot: PlatformSnapshot,
  locale?: string,
  trends?: PlatformTrends | null,
): string {
  const normalized = normalizeLocale(locale);
  const dict = DICTS[normalized];
  const insights = buildInsights(snapshot, normalized);
  const text = (message || '').toLowerCase();

  const has = (...keywords: string[]) => keywords.some((k) => text.includes(k));
  const pctText = (value: number | null) => (value === null ? 'n/a' : `${value}%`);

  if (has('contact today', 'contact first', 'تواصل اليوم', 'أتواصل اليوم', 'اتصل اليوم', 'contacter aujourd', 'à contacter')) {
    if (!trends || trends.contactToday.length === 0) return dict.noInsights;
    return [
      dict.biContact,
      ...trends.contactToday.map(
        (c) => `- ${c.schoolName} [${c.urgencyScore}]: ${c.actionCodes.join(', ')} (${c.reasonCodes.join(', ')})`,
      ),
    ].join('\n');
  }

  if (
    has(
      'trend', 'last 3', '3 months', 'three months', 'previous month', 'compared', 'decline', 'declined', 'drop in',
      'why did', 'reasons for', 'انخفاض', 'انخفضت', 'تراجع', 'آخر 3', 'اخر 3', 'مقارنة', 'الاتجاه', 'أسباب',
      'tendance', '3 mois', 'trois mois', 'baisse', 'comparé', 'mois précédent',
    )
  ) {
    if (!trends) return dict.biNoTrendData;
    const cmp = trends.currentVsPrevious.collections;
    const last3 = trends.last3VsPrevious3Collections;
    return [
      dict.biTrends,
      ...trends.months.map((m) => `- ${m.month}: ${m.collections} (${m.paymentCount}), +${m.newSchools} schools`),
      `Current vs previous month: ${cmp.current} vs ${cmp.previous} (${pctText(cmp.deltaPct)})`,
      `Last 3 months vs previous 3: ${last3.current} vs ${last3.previous} (${pctText(last3.deltaPct)})`,
      ...trends.drivers.map(
        (d) =>
          `- [${d.code}] ${d.schoolName || (d.schools ? d.schools.join(', ') : '')} ${d.current ?? ''}${d.previous !== undefined ? ` vs ${d.previous}` : ''} ${d.deltaPct !== undefined ? `(${pctText(d.deltaPct)})` : ''}`.trim(),
      ),
      dict.biLimitations,
    ].join('\n');
  }

  if (has('resource', 'consuming', 'consumption', 'استهلاك', 'الأكثر استهلاكاً', 'الموارد', 'ressource', 'consommation')) {
    const ranked = [...snapshot.schools]
      .sort(
        (a, b) =>
          b.userUsagePct + b.messageUsagePct - (a.userUsagePct + a.messageUsagePct) ||
          b.currentUsers + b.currentMessages - (a.currentUsers + a.currentMessages),
      )
      .slice(0, 10);
    return [
      dict.biResources,
      ...ranked.map(
        (s) =>
          `- ${s.name}: users ${s.currentUsers}/${s.maxUsers} (${s.userUsagePct}%), messages ${s.currentMessages}/${s.maxMessages} (${s.messageUsagePct}%), students ${s.students}`,
      ),
    ].join('\n');
  }

  if (has('best plan', 'plan for', 'plan recommendation', 'خطة اشتراك', 'أفضل خطة', 'افضل خطة', 'meilleur plan', 'meilleur forfait', 'forfait pour')) {
    if (!trends || trends.planRecommendations.length === 0) return dict.capacityNone;
    return [
      dict.biPlan,
      ...trends.planRecommendations.map(
        (p) =>
          `- ${p.schoolName}: users ${p.currentUsers}/${p.maxUsers} (${p.userUsagePct}%) -> ${p.suggestedMaxUsers}, messages ${p.currentMessages}/${p.maxMessages} (${p.messageUsagePct}%) -> ${p.suggestedMaxMessages} [${p.basisCodes.join(', ')}]`,
      ),
    ].join('\n');
  }

  if (has('churn', 'likely to cancel', 'cancel', 'يحتمل أن تلغي', 'احتمال المغادرة', 'مغادرة العملاء', 'إلغاء اشتراك', 'risque de départ', 'probable de partir')) {
    if (!trends || trends.churnRisks.length === 0) return dict.riskNone;
    return [
      dict.biChurn,
      ...trends.churnRisks.map((r) => `- ${r.schoolName} [${r.level} ${r.score}]: ${r.reasonCodes.join(', ')}`),
      dict.biLimitations,
    ].join('\n');
  }

  if (
    has(
      'capacity', 'limit', 'quota', 'usage', 'upgrade', 'plan upgrade', 'user limit',
      'capacité', 'limite', 'utilisateurs', 'quota de messages',
      'السعة', 'حد المستخدمين', 'الحد', 'المستخدمين', 'ترقية', 'الرسائل', 'الحصة',
    )
  ) {
    const schools = snapshot.schools
      .filter((s) => s.userUsagePct >= 80 || s.messageUsagePct >= 80)
      .sort((a, b) => Math.max(b.userUsagePct, b.messageUsagePct) - Math.max(a.userUsagePct, a.messageUsagePct))
      .slice(0, 10);
    if (schools.length === 0) return dict.capacityNone;
    return [
      dict.capacityHeading,
      ...schools.map(
        (s) =>
          `- ${s.name}: users ${s.currentUsers}/${s.maxUsers} (${s.userUsagePct}%), messages ${s.currentMessages}/${s.maxMessages} (${s.messageUsagePct}%)`,
      ),
    ].join('\n');
  }

  if (
    has(
      'revenue', 'fee', 'fees', 'mrr', 'payment', 'payments', 'billing', 'income', 'subscription',
      'revenu', 'frais', 'paiement', 'facturation', 'abonnement',
      'الإيراد', 'إيراد', 'رسوم', 'الرسوم', 'دفع', 'مدفوعات', 'المدفوعات', 'الفوترة', 'الاشتراك',
    )
  ) {
    const zeroFee = snapshot.schools.filter((s) => s.isActive && Number(s.monthlyFee) === 0);
    const noPayment = snapshot.schools.filter(
      (s) => s.isActive && !s.isFrozen && !s.hasPaymentThisMonth && s.paymentsThisMonth === 0,
    );
    return [
      dict.revenueHeading(snapshot),
      dict.revenueZeroFee(zeroFee.map((s) => s.name).join(', ') || dict.none),
      dict.revenueNoPayment(noPayment.slice(0, 10).map((s) => s.name).join(', ') || dict.none),
    ].join('\n');
  }

  if (
    has(
      'risk', 'churn', 'frozen', 'inactive', 'onboarding',
      'risque', 'gelée', 'gelé', 'inactive', 'inactif',
      'خطر', 'مخاطر', 'مجمدة', 'مجمد', 'غير نشطة', 'غير نشط', 'فقدان', 'الإعداد',
    )
  ) {
    const relevant = insights.filter((i) => i.category === 'churn');
    if (relevant.length === 0) return `${dict.riskHeading(snapshot)}\n${dict.riskNone}`;
    return [dict.riskHeading(snapshot), ...relevant.slice(0, 10).map((i) => `- ${i.title}: ${i.message}`)].join('\n');
  }

  if (
    has(
      'growth', 'new school', 'new schools', 'grow',
      'croissance', 'nouvelle école', 'nouvelles écoles',
      'نمو', 'النمو', 'مدرسة جديدة', 'مدارس جديدة', 'جديدة',
    )
  ) {
    const newest = [...snapshot.schools]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    return [
      dict.growthHeading(snapshot),
      ...newest.map((s) => `- ${s.name} (${s.type}, ${new Date(s.createdAt).toISOString().slice(0, 10)})`),
    ].join('\n');
  }

  if (
    has(
      'largest', 'biggest', 'top school', 'top schools', 'large',
      'plus grande', 'plus grandes', 'grandes écoles',
      'أكبر', 'الأكبر', 'اكبر', 'كبرى',
    )
  ) {
    const largest = [...snapshot.schools]
      .sort((a, b) => b.students - a.students || b.currentUsers - a.currentUsers)
      .slice(0, 5);
    return [
      dict.largestHeading,
      ...largest.map(
        (s) => `- ${s.name}: ${s.students} students, ${s.teachers} teachers, users ${s.currentUsers}/${s.maxUsers} (${s.userUsagePct}%)`,
      ),
    ].join('\n');
  }

  const top = insights.slice(0, 3);
  return [
    dict.overviewHeading(snapshot),
    dict.topInsights,
    ...(top.length > 0 ? top.map((i) => `- [${i.severity}] ${i.title}: ${i.message}`) : [dict.noInsights]),
  ].join('\n');
}

export const buildFallbackReply = ruleBasedChatReply;
export const fallbackChatReply = ruleBasedChatReply;

export class SuperAdminAssistantService {
  async getInsights(locale?: string): Promise<Insight[]> {
    const snapshot = await buildPlatformSnapshot();
    return buildInsights(snapshot, locale);
  }

  async getTrends(): Promise<PlatformTrends> {
    return buildPlatformTrends();
  }

  async getBriefing(locale?: string): Promise<BriefingResult> {
    const normalized = normalizeLocale(locale);
    const snapshot = await buildPlatformSnapshot();
    const trends = await buildPlatformTrends().catch(() => null);
    const heuristic = buildHeuristicBriefing(snapshot, normalized, trends);

    if (isMetaAiEnabled()) {
      try {
        const meta = await chatJson<MetaBriefing>([
          {
            role: 'system',
            content:
              'You are the AI operations assistant of the Super Admin of a multi-school SaaS platform. Respond only with a JSON object. Use only the provided live platform snapshot. Do not invent data.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              instruction: `Return JSON with summary (string), highlights (string array), and recommendations (array of {priority, title, description, schoolId?}). Write all text in ${LANGUAGE_NAMES[normalized]}. Cite school names and numbers from the snapshot/trends, compare periods when explaining changes, propose concrete actions (freeze/unfreeze follow-up, quota upgrade, onboarding help). IMPORTANT metric semantics: "collections" are tuition amounts collected BY schools from their students (not platform subscription revenue); monthlyFee is the per-student school fee, so snapshot.mrr is only the sum of those fee rates, not owner revenue. There is no cancellation/subscription-payment event history: never invent cancellations, late subscription payments, or churn events; frozen/inactive are current states.`,
              snapshot,
              trends,
            }),
          },
        ]);

        const summary = typeof meta.summary === 'string' ? meta.summary.trim() : '';
        if (!summary) throw new Error('Invalid briefing summary from Meta AI');
        const highlights = toStringArray(meta.highlights);
        const recommendations = parseMetaRecommendations(meta.recommendations);
        return {
          generatedAt: new Date().toISOString(),
          source: 'meta',
          summary,
          highlights: highlights.length > 0 ? highlights : heuristic.highlights,
          recommendations: recommendations.length > 0 ? recommendations : heuristic.recommendations,
          snapshot,
          trends,
        };
      } catch {
        return { ...heuristic, generatedAt: new Date().toISOString(), snapshot, trends };
      }
    }

    return { ...heuristic, snapshot, trends };
  }

  async chat(
    message: string,
    history?: ChatHistoryItem[] | string,
    locale?: string,
  ): Promise<ChatResult> {
    const actualLocale = typeof history === 'string' ? history : locale;
    const normalized = normalizeLocale(actualLocale);
    const cleanHistory = typeof history === 'string' ? [] : sanitizeHistory(history);
    const snapshot = await buildPlatformSnapshot();
    const trends = await buildPlatformTrends().catch(() => null);
    const generatedAt = new Date().toISOString();

    if (isMetaAiEnabled()) {
      try {
        const system = `You are the AI business-intelligence assistant of the Super Admin of a multi-school SaaS platform. Answer ONLY from this live platform snapshot and period trends (JSON). Be concise, cite school names and numbers, compare periods when explaining changes, propose concrete actions. Metric semantics: "collections" are tuition collected BY schools from students, NOT platform subscription revenue; monthlyFee is the per-student school fee (snapshot.mrr is just the sum of those rates). There is NO cancellation or subscription-payment event history: never invent cancellations or late subscription payments; frozen/inactive are current states, and churnRisks are deterministic risk scores, not recorded churn. If data is missing, say so. Reply in language: ${LANGUAGE_NAMES[normalized]}\n\nLive platform snapshot:\n${JSON.stringify(snapshot)}\n\nPeriod trends (6 months):\n${JSON.stringify(trends)}`;
        const reply = await chatText(system, [
          ...cleanHistory.slice(-10),
          { role: 'user', content: message },
        ]);
        if (!reply || !reply.trim()) throw new Error('Empty reply from Meta AI');
        return { reply: reply.trim(), source: 'meta', generatedAt };
      } catch {
        return {
          reply: ruleBasedChatReply(message, snapshot, normalized, trends),
          source: 'heuristic',
          generatedAt,
        };
      }
    }

    return {
      reply: ruleBasedChatReply(message, snapshot, normalized, trends),
      source: 'heuristic',
      generatedAt,
    };
  }
}

export const superAdminAssistantService = new SuperAdminAssistantService();
