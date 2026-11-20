import {
  CategoryBudget,
  EXPENSE_CATEGORIES,
  Expense,
  ExpenseCategory,
  UserProfile,
  formatINR,
  getCurrentMonthKey,
  getDaysInMonth,
} from '../types/smartpocket';

export interface SavingSuggestion {
  id: string;
  title: string;
  detail: string;
  estimatedMonthlySaving: number;
  category?: ExpenseCategory;
  recommendedCap?: number;
  severity: 'info' | 'warning' | 'alert';
}

export interface BudgetAlert {
  id: string;
  category: ExpenseCategory;
  spent: number;
  limit: number;
  pct: number;
  status: 'near-limit' | 'over-budget';
}

export interface MonthlyMetrics {
  allowance: number;
  savingsTarget: number;
  spendableAllowance: number;
  totalSpent: number;
  remainingAllowance: number;
  dailySafeToSpend: number;
  projectedMonthEndSpend: number;
  projectedSavings: number;
  upiSpend: number;
  upiSharePct: number;
  daysElapsed: number;
  daysInMonth: number;
  daysRemaining: number;
  categoryTotals: Record<ExpenseCategory, number>;
  dailyTrend: { day: string; spent: number; cumulative: number }[];
  alerts: BudgetAlert[];
  suggestions: SavingSuggestion[];
  activeLoggingDays: number;
}

export function computeMonthlyMetrics(
  profile: UserProfile | null,
  expenses: Expense[],
  budgets: CategoryBudget[],
  monthKey: string
): MonthlyMetrics {
  const allowance = profile?.monthlyAllowance ?? 10000;
  const savingsTarget = profile?.monthlySavingsTarget ?? 2000;
  const spendableAllowance = Math.max(0, allowance - savingsTarget);

  const monthExpenses = expenses.filter((e) => e.monthKey === monthKey);
  const monthBudgets = budgets.filter((b) => b.monthKey === monthKey);

  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingAllowance = allowance - totalSpent;

  const daysInMonth = getDaysInMonth(monthKey);
  const currentMonth = getCurrentMonthKey();
  const today = new Date();

  let daysElapsed = daysInMonth;
  if (monthKey === currentMonth) {
    daysElapsed = Math.max(1, today.getDate());
  } else if (monthKey > currentMonth) {
    daysElapsed = 1;
  }

  const daysRemaining =
    monthKey === currentMonth
      ? Math.max(1, daysInMonth - today.getDate() + 1)
      : monthKey > currentMonth
      ? daysInMonth
      : 1;

  const remainingAfterSavings = allowance - savingsTarget - totalSpent;
  const dailySafeToSpend = Math.max(0, Math.floor(remainingAfterSavings / daysRemaining));

  const avgDailySpend = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
  const projectedMonthEndSpend =
    monthKey < currentMonth ? totalSpent : Math.round(avgDailySpend * daysInMonth);
  const projectedSavings = allowance - projectedMonthEndSpend;

  const upiSpend = monthExpenses
    .filter((e) => e.paymentMethod === 'UPI')
    .reduce((sum, e) => sum + e.amount, 0);
  const upiSharePct = totalSpent > 0 ? Math.round((upiSpend / totalSpent) * 100) : 0;

  const categoryTotals = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  const uniqueDays = new Set<string>();
  const daySpendMap = new Map<number, number>();

  for (const exp of monthExpenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    uniqueDays.add(exp.date);
    const dayNum = Number(exp.date.slice(8, 10));
    if (!Number.isNaN(dayNum)) {
      daySpendMap.set(dayNum, (daySpendMap.get(dayNum) || 0) + exp.amount);
    }
  }

  const maxDayToShow = monthKey === currentMonth ? Math.max(daysElapsed, 7) : daysInMonth;
  const clampedMaxDay = Math.min(daysInMonth, maxDayToShow);
  const dailyTrend: { day: string; spent: number; cumulative: number }[] = [];
  let running = 0;
  for (let d = 1; d <= clampedMaxDay; d++) {
    const spent = daySpendMap.get(d) || 0;
    running += spent;
    dailyTrend.push({
      day: String(d),
      spent: Math.round(spent),
      cumulative: Math.round(running),
    });
  }

  // Automated Budget Alerts
  const alerts: BudgetAlert[] = [];
  for (const b of monthBudgets) {
    const spent = categoryTotals[b.category] || 0;
    const pct = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;
    if (pct >= 100) {
      alerts.push({
        id: b.id,
        category: b.category,
        spent,
        limit: b.monthlyLimit,
        pct,
        status: 'over-budget',
      });
    } else if (pct >= b.alertThresholdPct) {
      alerts.push({
        id: b.id,
        category: b.category,
        spent,
        limit: b.monthlyLimit,
        pct,
        status: 'near-limit',
      });
    }
  }

  // Automated Saving Suggestions Engine
  const suggestions: SavingSuggestion[] = [];
  const budgetedCategories = new Set(monthBudgets.map((b) => b.category));

  // 1. Over-budget categories
  for (const alert of alerts.filter((a) => a.status === 'over-budget')) {
    const overage = alert.spent - alert.limit;
    suggestions.push({
      id: `over-${alert.category}`,
      title: `Trim ${alert.category} spending`,
      detail: `You exceeded your ${formatINR(alert.limit)} cap by ${formatINR(overage)}. Pausing non-essential orders in this category protects your month-end buffer.`,
      estimatedMonthlySaving: Math.max(200, Math.round(overage)),
      category: alert.category,
      severity: 'alert',
    });
  }

  // 2. Small UPI micro-spends leak detector (< ₹200 transactions)
  const smallUpiExpenses = monthExpenses.filter(
    (e) => e.paymentMethod === 'UPI' && e.amount <= 200
  );
  const smallUpiTotal = smallUpiExpenses.reduce((s, e) => s + e.amount, 0);
  if (smallUpiExpenses.length >= 4 && smallUpiTotal >= 400) {
    const potential = Math.round(smallUpiTotal * 0.25);
    suggestions.push({
      id: 'upi-micro-leaks',
      title: `Watch small UPI micro-spends (${smallUpiExpenses.length} payments)`,
      detail: `Small UPI payments under ₹200 total ${formatINR(smallUpiTotal)} this month. Cutting 1 in 4 impulse scans saves around ${formatINR(potential)}/month.`,
      estimatedMonthlySaving: potential,
      severity: 'warning',
    });
  }

  // 3. Top unbudgeted discretionary category -> recommend automated cap
  const discretionaryCats: ExpenseCategory[] = [
    'Food & Canteen',
    'Outings & Fun',
    'Shopping',
  ];
  const topUnbudgeted = discretionaryCats
    .filter((c) => !budgetedCategories.has(c) && categoryTotals[c] > 0)
    .sort((a, b) => categoryTotals[b] - categoryTotals[a])[0];

  if (topUnbudgeted) {
    const spent = categoryTotals[topUnbudgeted];
    const suggestedCap = Math.max(500, Math.round((spent * 0.85) / 50) * 50);
    const estSave = Math.max(150, Math.round(spent * 0.15));
    suggestions.push({
      id: `cap-${topUnbudgeted}`,
      title: `Set an automated cap for ${topUnbudgeted}`,
      detail: `${topUnbudgeted} accounts for ${formatINR(spent)} with no monthly limit set. Adding a ${formatINR(suggestedCap)} cap triggers an early reminder at 80%.`,
      estimatedMonthlySaving: estSave,
      category: topUnbudgeted,
      recommendedCap: suggestedCap,
      severity: 'info',
    });
  }

  // 4. Month-end pace warning
  if (totalSpent > 0 && projectedMonthEndSpend > spendableAllowance && allowance > 0) {
    const gap = projectedMonthEndSpend - spendableAllowance;
    suggestions.push({
      id: 'pace-warning',
      title: `Keep daily spending under ${formatINR(dailySafeToSpend)}`,
      detail: `At your current pace (${formatINR(avgDailySpend)}/day), month-end spend will reach ${formatINR(projectedMonthEndSpend)}, missing your ${formatINR(savingsTarget)} savings target by ${formatINR(gap)}.`,
      estimatedMonthlySaving: Math.min(gap, Math.round(allowance * 0.2)),
      severity: 'warning',
    });
  }

  // 5. Positive reinforcement if on track and no alerts
  if (suggestions.length === 0 && totalSpent > 0 && projectedSavings >= savingsTarget) {
    suggestions.push({
      id: 'on-track-sweep',
      title: 'Great pace — sweep surplus into a Savings Goal',
      detail: `You are tracking to save ${formatINR(projectedSavings)} this month, ahead of your ${formatINR(savingsTarget)} target. Move surplus funds into an emergency buffer.`,
      estimatedMonthlySaving: Math.max(0, projectedSavings - savingsTarget),
      severity: 'info',
    });
  }

  return {
    allowance,
    savingsTarget,
    spendableAllowance,
    totalSpent,
    remainingAllowance,
    dailySafeToSpend,
    projectedMonthEndSpend,
    projectedSavings,
    upiSpend,
    upiSharePct,
    daysElapsed,
    daysInMonth,
    daysRemaining,
    categoryTotals,
    dailyTrend,
    alerts,
    suggestions,
    activeLoggingDays: uniqueDays.size,
  };
}

export function exportExpensesToCsv(expenses: Expense[], monthKey: string): void {
  const headers = ['Date', 'Title', 'Category', 'Payment Method', 'Amount (INR)', 'Note'];
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = expenses.map((e) =>
    [e.date, e.title, e.category, e.paymentMethod, e.amount, e.note]
      .map(escapeCell)
      .join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `smartpocket-expenses-${monthKey}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
