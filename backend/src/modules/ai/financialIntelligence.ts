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

export interface FinancialActuals {
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
}

export interface FinancialForecastPoint {
  month: string;
  projectedCollections: number;
  lowEstimate: number;
  highEstimate: number;
  isForecast: true;
}

export interface FinancialIntelligence {
  actuals: FinancialActuals;
  forecasts: FinancialForecastPoint[];
  forecastModel: {
    method: 'linear_trend_on_monthly_collections';
    basedOnMonths: number;
    confidence: 'low' | 'medium';
    note: string;
  };
  repeatLatePayers: StudentArrears[];
  arrearsAlerts: Array<{ code: string; level: 'high' | 'medium' | 'low'; value: number }>;
  expenses: {
    available: false;
    reasonCode: 'no_expense_ledger_in_platform';
    incomeVsExpenses: null;
  };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / Math.abs(previous)) * 10000) / 100;
}

function nextMonthKeys(lastMonth: string, count: number): string[] {
  const [y, m] = lastMonth.split('-').map(Number);
  const keys: string[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(Date.UTC(y, (m - 1) + i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

export function linearTrend(values: number[]): { intercept: number; slope: number } {
  const n = values.length;
  if (n === 0) return { intercept: 0, slope: 0 };
  if (n === 1) return { intercept: values[0], slope: 0 };
  const avgX = (n - 1) / 2;
  const avgY = values.reduce((a, b) => a + b, 0) / n;
  let numerator = 0;
  let denominator = 0;
  values.forEach((y, x) => {
    numerator += (x - avgX) * (y - avgY);
    denominator += (x - avgX) ** 2;
  });
  const slope = denominator === 0 ? 0 : numerator / denominator;
  return { intercept: avgY - slope * avgX, slope };
}

export function computeFinancialIntelligence(input: {
  monthlyFee: number;
  payingStudents: number;
  exemptStudents: number;
  months: MonthlyFinancePoint[];
  studentArrears: StudentArrears[];
}): FinancialIntelligence {
  const months = [...input.months].sort((a, b) => a.month.localeCompare(b.month));
  const current = months[months.length - 1];
  const previous = months[months.length - 2];
  const expectedMonthlyDue = Math.max(0, input.monthlyFee) * Math.max(0, input.payingStudents);
  const collectedThisMonth = current?.collected || 0;

  const totalArrearsAmount = input.studentArrears.reduce((sum, s) => sum + s.arrearsAmount, 0);
  const repeatLatePayers = input.studentArrears
    .filter((s) => s.latePaymentsCount >= 2 || s.unpaidMonths.length >= 2)
    .sort((a, b) => b.arrearsAmount - a.arrearsAmount)
    .slice(0, 20);

  const arrearsAlerts: FinancialIntelligence['arrearsAlerts'] = [];
  const arrearsShare = input.payingStudents > 0 ? input.studentArrears.length / input.payingStudents : 0;
  if (totalArrearsAmount > 0) {
    arrearsAlerts.push({
      code: 'arrears_outstanding',
      level: arrearsShare >= 0.3 ? 'high' : arrearsShare >= 0.15 ? 'medium' : 'low',
      value: Math.round(totalArrearsAmount * 100) / 100,
    });
  }
  if (repeatLatePayers.length > 0) {
    arrearsAlerts.push({
      code: 'repeat_late_payers_detected',
      level: repeatLatePayers.length >= 5 ? 'high' : 'medium',
      value: repeatLatePayers.length,
    });
  }

  const values = months.slice(-6).map((m) => m.collected);
  const { intercept, slope } = linearTrend(values);
  const lastMonthKey = current?.month || new Date().toISOString().slice(0, 7);
  const forecasts: FinancialForecastPoint[] = nextMonthKeys(lastMonthKey, 3).map((month, i) => {
    const projected = Math.max(0, intercept + slope * (values.length + i));
    const rounded = Math.round(projected * 100) / 100;
    return {
      month,
      projectedCollections: rounded,
      lowEstimate: Math.round(rounded * 0.85 * 100) / 100,
      highEstimate: Math.round(rounded * 1.15 * 100) / 100,
      isForecast: true,
    };
  });

  return {
    actuals: {
      currentMonth: lastMonthKey,
      collectedThisMonth,
      collectedPreviousMonth: previous?.collected || 0,
      collectionsDeltaPct: pctChange(collectedThisMonth, previous?.collected || 0),
      expectedMonthlyDue: Math.round(expectedMonthlyDue * 100) / 100,
      collectionRateThisMonth:
        expectedMonthlyDue > 0
          ? Math.round((collectedThisMonth / expectedMonthlyDue) * 10000) / 100
          : null,
      totalArrearsAmount: Math.round(totalArrearsAmount * 100) / 100,
      studentsInArrears: input.studentArrears.length,
      payingStudents: input.payingStudents,
      exemptStudents: input.exemptStudents,
      months,
    },
    forecasts,
    forecastModel: {
      method: 'linear_trend_on_monthly_collections',
      basedOnMonths: values.length,
      confidence: values.length >= 4 ? 'medium' : 'low',
      note: 'Forecasts are statistical projections from recorded collections only. They are not accounting figures and exclude course/session pricing changes, enrolment changes and any expense data.',
    },
    repeatLatePayers,
    arrearsAlerts,
    expenses: {
      available: false,
      reasonCode: 'no_expense_ledger_in_platform',
      incomeVsExpenses: null,
    },
  };
}
