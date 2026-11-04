import assert from 'node:assert';
import { computeFinancialIntelligence } from './financialIntelligence';
import { computeCurriculumIntelligence } from './curriculumIntelligence';
import {
  buildNotificationDigest,
  classifyNotificationPriority,
  groupNotifications,
  isNotificationDeletable,
  suggestSendTime,
} from '../notification/notificationIntelligence';

const finance = computeFinancialIntelligence({
  monthlyFee: 1000,
  payingStudents: 50,
  exemptStudents: 2,
  months: [
    { month: '2026-03', collected: 30000, paymentCount: 30, refundsAmount: 0 },
    { month: '2026-04', collected: 35000, paymentCount: 35, refundsAmount: 0 },
    { month: '2026-05', collected: 40000, paymentCount: 40, refundsAmount: 500 },
    { month: '2026-06', collected: 45000, paymentCount: 45, refundsAmount: 0 },
  ],
  studentArrears: [
    { studentId: 's1', studentName: 'Late One', unpaidMonths: ['2026-05', '2026-06'], arrearsAmount: 2000, latePaymentsCount: 3 },
    { studentId: 's2', studentName: 'Ok Two', unpaidMonths: ['2026-06'], arrearsAmount: 1000, latePaymentsCount: 0 },
  ],
});
assert.strictEqual(finance.actuals.expectedMonthlyDue, 50000);
assert.strictEqual(finance.actuals.collectionRateThisMonth, 90);
assert.strictEqual(finance.actuals.totalArrearsAmount, 3000);
assert.strictEqual(finance.repeatLatePayers.length, 1);
assert.strictEqual(finance.repeatLatePayers[0].studentId, 's1');
assert.strictEqual(finance.forecasts.length, 3);
assert.ok(finance.forecasts.every((f) => f.isForecast === true), 'forecasts must be labelled as forecasts');
assert.ok(finance.forecasts[0].projectedCollections > 45000, 'upward trend should project growth');
assert.strictEqual(finance.expenses.available, false, 'no expense ledger must not be invented');

const curriculum = computeCurriculumIntelligence(
  [
    {
      courseId: 'c1', courseName: 'Math', teacherId: 't1', teacherName: 'Teacher One',
      totalLessons: 20, taughtLessons: 5, untaughtLessonTitles: ['Algebra'],
      plannedSessions: 20, completedSessions: 5, sessionsLast28Days: 0,
      lastSessionDate: '2026-05-01', startDate: '2026-01-01',
    },
    {
      courseId: 'c2', courseName: 'Science', teacherId: 't1', teacherName: 'Teacher One',
      totalLessons: 10, taughtLessons: 10, untaughtLessonTitles: [],
      plannedSessions: 10, completedSessions: 10, sessionsLast28Days: 4,
      lastSessionDate: '2026-06-10', startDate: '2026-01-01',
    },
  ],
  new Date('2026-06-15T00:00:00Z'),
  '2026-06-30',
);
const math = curriculum.courses.find((c) => c.courseId === 'c1');
assert.ok(math);
assert.strictEqual(math.progressPct, 25);
assert.strictEqual(math.riskLevel, 'high');
assert.ok(math.riskCodes.includes('no_recent_sessions_velocity_zero'));
assert.strictEqual(curriculum.teachers[0].averageProgressPct, 62.5);
assert.strictEqual(curriculum.atRiskCourses.length, 1);

const notifications = [
  { id: '1', type: 'absence', title: 'Absence', message: 'unjustified absence', link: '/x', isRead: false, createdAt: '2026-06-14T08:00:00Z', recipientId: 'p1' },
  { id: '2', type: 'absence', title: 'Absence', message: 'unjustified absence', link: '/x', isRead: false, createdAt: '2026-06-14T09:00:00Z', recipientId: 'p1' },
  { id: '3', type: 'message', title: 'Hi', message: 'hello', link: null, isRead: true, createdAt: '2026-06-14T10:00:00Z', recipientId: 'p1' },
];
assert.strictEqual(classifyNotificationPriority(notifications[0]), 'critical');
const groups = groupNotifications(notifications);
assert.strictEqual(groups.length, 2, 'same-day same-link absences collapse into one group');
assert.strictEqual(groups[0].count, 2);
const digest = buildNotificationDigest(notifications, 7, new Date('2026-06-15T00:00:00Z'));
assert.strictEqual(digest.duplicatesCollapsed, 1);
assert.strictEqual(digest.urgentUnread.length, 1);
assert.strictEqual(suggestSendTime('low', new Date('2026-06-15T03:00:00')).code, 'next_morning_window_08_19');
assert.strictEqual(suggestSendTime('critical', new Date('2026-06-15T03:00:00')).code, 'send_immediately');

const oldReadMessage = { ...notifications[2], createdAt: '2026-01-01T00:00:00Z' };
const oldReadPayment = { id: '9', type: 'payment', title: 'Paid', message: 'payment recorded', link: null, isRead: true, createdAt: '2026-01-01T00:00:00Z', recipientId: 'p1' };
const now = new Date('2026-06-15T00:00:00Z');
assert.strictEqual(isNotificationDeletable(oldReadMessage, now), true, 'old read low-value notifications are deletable');
assert.strictEqual(isNotificationDeletable(oldReadPayment, now), false, 'audit payment notifications survive at 5.5 months');
assert.strictEqual(
  isNotificationDeletable(notifications[0], now),
  false,
  'critical notifications are never auto-deleted',
);

console.log('finance/curriculum/notification intelligence tests passed');
