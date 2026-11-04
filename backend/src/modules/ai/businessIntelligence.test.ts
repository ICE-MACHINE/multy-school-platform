import assert from 'node:assert';
import type { PlatformSnapshot, SchoolSnapshot } from './platformSnapshot';
import {
  buildChurnRisks,
  buildContactToday,
  buildPlanRecommendations,
  diagnoseCollections,
  pctChange,
} from './businessIntelligence';
import { compareMetric, monthKeysEnding } from './platformTrends';
import { ruleBasedChatReply } from './superAdminAssistant.service';

function school(partial: Partial<SchoolSnapshot>): SchoolSnapshot {
  return {
    id: 's1',
    name: 'School One',
    slug: 'one',
    type: 'private',
    isActive: true,
    isFrozen: false,
    monthlyFee: 1000,
    maxUsers: 100,
    currentUsers: 10,
    userUsagePct: 10,
    maxMessages: 1000,
    currentMessages: 100,
    messageUsagePct: 10,
    students: 50,
    teachers: 5,
    paymentsThisMonth: 5000,
    hasPaymentThisMonth: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    ...partial,
  };
}

function snapshot(schools: SchoolSnapshot[]): PlatformSnapshot {
  return {
    generatedAt: '2026-06-15T00:00:00.000Z',
    totals: {
      totalSchools: schools.length,
      activeSchools: schools.filter((s) => s.isActive).length,
      frozenSchools: schools.filter((s) => s.isFrozen).length,
      inactiveSchools: schools.filter((s) => !s.isActive).length,
      totalStudents: 0,
      totalTeachers: 0,
      totalParents: 0,
    },
    mrr: 0,
    paymentsThisMonth: 0,
    newSchoolsLast30Days: 0,
    schoolsByType: [],
    schools,
  };
}

assert.deepStrictEqual(monthKeysEnding(new Date('2026-03-15T00:00:00Z'), 3), [
  '2026-01',
  '2026-02',
  '2026-03',
]);
assert.deepStrictEqual(monthKeysEnding(new Date('2026-01-10T00:00:00Z'), 3), [
  '2025-11',
  '2025-12',
  '2026-01',
]);
assert.strictEqual(pctChange(85, 100), -15);
assert.strictEqual(pctChange(0, 0), 0);
assert.strictEqual(pctChange(50, 0), null);
assert.strictEqual(compareMetric(85, 100).deltaPct, -15);

const risky = school({ id: 'risky', name: 'Risky', isActive: false, isFrozen: true, students: 0, teachers: 0, hasPaymentThisMonth: false });
const healthy = school({ id: 'ok', name: 'Healthy' });
const snap = snapshot([risky, healthy]);
const risks = buildChurnRisks(snap, new Date('2026-06-15T00:00:00Z'));
assert.strictEqual(risks[0].schoolId, 'risky');
assert.strictEqual(risks[0].level, 'high');
assert.ok(risks[0].reasonCodes.includes('frozen'));
assert.ok(!risks.some((r) => r.schoolId === 'ok'), 'healthy schools must not be flagged');

const packed = school({
  id: 'packed',
  name: 'Packed',
  currentUsers: 90,
  userUsagePct: 90,
  currentMessages: 900,
  messageUsagePct: 90,
});
const plans = buildPlanRecommendations(snapshot([packed]));
assert.strictEqual(plans.length, 1);
assert.ok(plans[0].suggestedMaxUsers > 100, 'suggested limit must exceed the current max');
assert.ok(plans[0].suggestedMaxUsers >= Math.ceil(90 / 0.6));

const contacts = buildContactToday(snap, risks);
assert.strictEqual(contacts[0].schoolId, 'risky');

const drivers = diagnoseCollections({
  collectionsCurrent: 850,
  collectionsPrevious: 1000,
  paymentCountCurrent: 8,
  paymentCountPrevious: 10,
  refundsCurrent: 100,
  refundsPrevious: 0,
  perSchool: [
    { schoolId: 'a', schoolName: 'A', currentMonth: 0, previousMonth: 400, delta: -400, deltaPct: -100 },
    { schoolId: 'b', schoolName: 'B', currentMonth: 850, previousMonth: 600, delta: 250, deltaPct: 41.67 },
  ],
  newSchoolsCurrent: 1,
  newSchoolsPrevious: 3,
  frozenSchools: 1,
  inactiveSchools: 1,
});
assert.ok(drivers.some((d) => d.code === 'schools_dropped_to_zero_collections'));
assert.ok(drivers.some((d) => d.code === 'refunds_increased'));
assert.ok(drivers.some((d) => d.code === 'payment_count_changed'));

const trendReply = ruleBasedChatReply(
  'Why did revenue decline compared to the previous month in the last 3 months?',
  snap,
  'en',
  {
    generatedAt: '2026-06-15T00:00:00.000Z',
    months: [
      { month: '2026-05', collections: 1000, paymentCount: 10, refundsAmount: 0, newSchools: 1, cumulativeSchools: 2, newStudents: 5, newTeachers: 1 },
      { month: '2026-06', collections: 850, paymentCount: 8, refundsAmount: 100, newSchools: 0, cumulativeSchools: 2, newStudents: 2, newTeachers: 0 },
    ],
    currentVsPrevious: {
      collections: compareMetric(850, 1000),
      paymentCount: compareMetric(8, 10),
      newSchools: compareMetric(0, 1),
      newStudents: compareMetric(2, 5),
    },
    last3VsPrevious3Collections: compareMetric(850, 1000),
    perSchoolCollections: [],
    drivers,
    churnRisks: risks,
    planRecommendations: plans,
    contactToday: contacts,
    limitations: ['no_cancellation_or_subscription_payment_event_history'],
  },
);
assert.ok(trendReply.includes('-15%') || trendReply.includes('-15'), 'reply must quantify the decline');
assert.ok(trendReply.toLowerCase().includes('limitation'), 'reply must disclose data limitations');

const contactReply = ruleBasedChatReply('Which schools should I contact today?', snap, 'en', {
  generatedAt: '2026-06-15T00:00:00.000Z',
  months: [],
  currentVsPrevious: {
    collections: compareMetric(0, 0),
    paymentCount: compareMetric(0, 0),
    newSchools: compareMetric(0, 0),
    newStudents: compareMetric(0, 0),
  },
  last3VsPrevious3Collections: compareMetric(0, 0),
  perSchoolCollections: [],
  drivers: [],
  churnRisks: risks,
  planRecommendations: plans,
  contactToday: contacts,
  limitations: [],
});
assert.ok(contactReply.includes('Risky'));

console.log('business intelligence tests passed');
