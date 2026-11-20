import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Plus,
  Repeat,
  TrendingUp,
} from 'lucide-react';
import { MonthlyMetrics } from '../../lib/analytics';
import { useTheme } from '../../context/ThemeContext';
import {
  CATEGORY_COLORS,
  EXPENSE_CATEGORIES,
  Expense,
  ExpenseCategory,
  RecurringBill,
  formatINR,
  formatMonthLabel,
} from '../../types/smartpocket';

interface OverviewViewProps {
  monthKey: string;
  metrics: MonthlyMetrics;
  monthExpenses: Expense[];
  dueRecurringBills: RecurringBill[];
  loading: boolean;
  onOpenAddExpense: () => void;
  onSeedSampleMonth: () => Promise<void>;
  onApplyDueBills: () => Promise<void>;
  onApplySuggestedCap: (category: ExpenseCategory, cap: number) => Promise<void>;
  onNavigate: (tab: 'expenses' | 'budgets' | 'goals') => void;
}

export function OverviewView({
  monthKey,
  metrics,
  monthExpenses,
  dueRecurringBills,
  loading,
  onOpenAddExpense,
  onSeedSampleMonth,
  onApplyDueBills,
  onApplySuggestedCap,
  onNavigate,
}: OverviewViewProps) {
  const { isDark } = useTheme();
  const [seeding, setSeeding] = React.useState(false);
  const [applyingBills, setApplyingBills] = React.useState(false);
  const [applyingCapCat, setApplyingCapCat] = React.useState<string | null>(null);

  const axisColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#1E293B' : '#E2E8F0';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0';
  const tooltipText = isDark ? '#F8FAFC' : '#0F172A';

  const categoryChartData = EXPENSE_CATEGORIES.map((cat) => ({
    category: cat.split(' & ')[0],
    fullCategory: cat,
    spent: Math.round(metrics.categoryTotals[cat] || 0),
    color: CATEGORY_COLORS[cat],
  }))
    .filter((d) => d.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  const spentPct =
    metrics.allowance > 0 ? Math.round((metrics.totalSpent / metrics.allowance) * 100) : 0;
  const isOverAllowance = metrics.remainingAllowance < 0;
  const savingsOnTrack = metrics.projectedSavings >= metrics.savingsTarget;

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await onSeedSampleMonth();
    } finally {
      setSeeding(false);
    }
  };

  const handleApplyBills = async () => {
    setApplyingBills(true);
    try {
      await onApplyDueBills();
    } finally {
      setApplyingBills(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
          <div className="h-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4-Column Financial KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Monthly Allowance</span>
            <span>{formatMonthLabel(monthKey)}</span>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono-num text-slate-900 dark:text-slate-50">
            {formatINR(metrics.allowance)}
          </p>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Savings goal: <span className="font-mono-num font-medium">{formatINR(metrics.savingsTarget)}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Spent This Month</span>
            <span className="font-mono-num">{spentPct}% of allowance</span>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono-num text-slate-900 dark:text-slate-50">
            {formatINR(metrics.totalSpent)}
          </p>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            UPI share: <span className="font-mono-num font-medium">{metrics.upiSharePct}%</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>{monthExpenses.length} entries</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Daily Safe-to-Spend</span>
            <span>{metrics.daysRemaining}d left</span>
          </div>
          <p
            className={`mt-2 text-2xl font-bold font-mono-num ${
              isOverAllowance
                ? 'text-red-600 dark:text-red-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {formatINR(metrics.dailySafeToSpend)}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/day</span>
          </p>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            {isOverAllowance
              ? `Over allowance by ${formatINR(Math.abs(metrics.remainingAllowance))}`
              : `${formatINR(metrics.remainingAllowance)} remaining before savings`}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Projected Savings</span>
            <span
              className={
                savingsOnTrack
                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                  : 'text-amber-600 dark:text-amber-400 font-medium'
              }
            >
              {savingsOnTrack ? 'On Track' : 'Needs Cutback'}
            </span>
          </div>
          <p
            className={`mt-2 text-2xl font-bold font-mono-num ${
              metrics.projectedSavings < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-900 dark:text-slate-50'
            }`}
          >
            {formatINR(metrics.projectedSavings)}
          </p>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Est. month-end spend: <span className="font-mono-num">{formatINR(metrics.projectedMonthEndSpend)}</span>
          </p>
        </div>
      </div>

      {/* Automated Actions & Alerts Banner */}
      {(dueRecurringBills.length > 0 || metrics.alerts.length > 0) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800">
          {dueRecurringBills.length > 0 && (
            <div className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Repeat className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {dueRecurringBills.length} recurring student bill{dueRecurringBills.length > 1 ? 's' : ''} ready to auto-post
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {dueRecurringBills.map((b) => `${b.title} (${formatINR(b.amount)})`).join(' · ')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={applyingBills}
                onClick={handleApplyBills}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {applyingBills ? 'Posting...' : 'Auto-Post Due Bills'}
              </button>
            </div>
          )}

          {metrics.alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    alert.status === 'over-budget'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                />
                <div className="text-sm">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {alert.status === 'over-budget' ? 'Over Budget' : 'Near Limit'}: {alert.category}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 ml-2">
                    <span className="font-mono-num">{formatINR(alert.spent)}</span> spent of{' '}
                    <span className="font-mono-num">{formatINR(alert.limit)}</span> ({alert.pct}%)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('budgets')}
                className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                Adjust budget
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State when no expenses exist for this month */}
      {monthExpenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            No expenses logged for {formatMonthLabel(monthKey)} yet
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Log your first daily UPI or cash spend to activate live Safe-to-Spend calculations, category charts, and personalized saving suggestions.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Log First Expense
            </button>
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeed}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {seeding ? 'Loading sample month...' : 'Load Sample Student Month'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    Cumulative Spending Pace
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Day-by-day cumulative outflow in INR for {formatMonthLabel(monthKey)}
                  </p>
                </div>
                <span className="text-xs font-mono-num text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  Target ceiling: {formatINR(metrics.spendableAllowance)}
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.dailyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="spSpendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke={axisColor}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `D${v}`}
                    />
                    <YAxis
                      stroke={axisColor}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${v}`}
                      width={56}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: '8px',
                        color: tooltipText,
                        fontSize: '12px',
                      }}
                      formatter={(val, name) => [
                        formatINR(Number(val ?? 0)),
                        name === 'cumulative' ? 'Cumulative Spent' : 'Day Spend',
                      ]}
                      labelFormatter={(label) => `Day ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#059669"
                      strokeWidth={2}
                      fill="url(#spSpendGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Spend by Category
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Where your allowance is going this month
                </p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryChartData}
                    layout="vertical"
                    margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis
                      type="number"
                      stroke={axisColor}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      stroke={axisColor}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={72}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: '8px',
                        color: tooltipText,
                        fontSize: '12px',
                      }}
                      formatter={(val) => [formatINR(Number(val ?? 0)), 'Spent']}
                    />
                    <Bar dataKey="spent" radius={[0, 4, 4, 0]} barSize={18}>
                      {categoryChartData.map((entry) => (
                        <Cell key={entry.fullCategory} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Automated Saving Suggestions + Recent Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    Automated Saving Suggestions
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Rule-based insights generated directly from your spending habits
                  </p>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {metrics.suggestions.map((item) => (
                  <div key={item.id} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.detail}
                        </p>
                      </div>
                      {item.estimatedMonthlySaving > 0 && (
                        <span className="text-xs font-mono-num font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
                          +{formatINR(item.estimatedMonthlySaving)}/mo
                        </span>
                      )}
                    </div>
                    {item.category && item.recommendedCap && (
                      <div className="mt-2.5">
                        <button
                          type="button"
                          disabled={applyingCapCat === item.category}
                          onClick={async () => {
                            setApplyingCapCat(item.category!);
                            try {
                              await onApplySuggestedCap(item.category!, item.recommendedCap!);
                            } finally {
                              setApplyingCapCat(null);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-md transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {applyingCapCat === item.category
                            ? 'Applying cap...'
                            : `Apply ${formatINR(item.recommendedCap)} cap`}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    Recent Transactions
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Latest expenses recorded in {formatMonthLabel(monthKey)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('expenses')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer whitespace-nowrap"
                >
                  View all
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {monthExpenses.slice(0, 6).map((exp) => (
                  <div
                    key={exp.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {exp.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {exp.category}
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        {exp.paymentMethod}
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span className="font-mono-num">{exp.date}</span>
                      </p>
                    </div>
                    <span className="text-sm font-semibold font-mono-num text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
                      {formatINR(exp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
