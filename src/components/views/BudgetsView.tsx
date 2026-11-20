import React, { useEffect, useState } from 'react';
import { Check, Plus, Repeat, Trash2 } from 'lucide-react';
import { MonthlyMetrics } from '../../lib/analytics';
import {
  CategoryBudget,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  PAYMENT_METHODS,
  PaymentMethod,
  RecurringBill,
  SCHEMA_LIMITS,
  USER_PERSONAS,
  UserPersona,
  UserProfile,
  formatINR,
  formatMonthLabel,
} from '../../types/smartpocket';

interface BudgetsViewProps {
  monthKey: string;
  profile: UserProfile;
  metrics: MonthlyMetrics;
  monthBudgets: CategoryBudget[];
  recurringBills: RecurringBill[];
  dueRecurringBills: RecurringBill[];
  onUpdateProfilePrefs: (updates: {
    displayName: string;
    persona: UserPersona;
    campusOrCity: string;
    monthlyAllowance: number;
    monthlySavingsTarget: number;
  }) => Promise<void>;
  onSaveCategoryBudget: (
    input: {
      category: ExpenseCategory;
      monthKey: string;
      monthlyLimit: number;
      alertThresholdPct: number;
    },
    existing?: CategoryBudget
  ) => Promise<void>;
  onDeleteCategoryBudget: (budgetId: string) => Promise<void>;
  onAddRecurringBill: (input: {
    title: string;
    amount: number;
    category: ExpenseCategory;
    paymentMethod: PaymentMethod;
    dayOfMonth: number;
  }) => Promise<void>;
  onToggleRecurringBill: (bill: RecurringBill) => Promise<void>;
  onApplyDueBills: () => Promise<void>;
  onDeleteRecurringBill: (id: string) => Promise<void>;
}

export function BudgetsView({
  monthKey,
  profile,
  metrics,
  monthBudgets,
  recurringBills,
  dueRecurringBills,
  onUpdateProfilePrefs,
  onSaveCategoryBudget,
  onDeleteCategoryBudget,
  onAddRecurringBill,
  onToggleRecurringBill,
  onApplyDueBills,
  onDeleteRecurringBill,
}: BudgetsViewProps) {
  // Allowance & Savings Target Form
  const [allowance, setAllowance] = useState(String(profile.monthlyAllowance));
  const [savingsTarget, setSavingsTarget] = useState(String(profile.monthlySavingsTarget));
  const [persona, setPersona] = useState<UserPersona>(profile.persona);
  const [campusOrCity, setCampusOrCity] = useState(profile.campusOrCity);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Add Category Cap Form
  const [catSelect, setCatSelect] = useState<ExpenseCategory>('Food & Canteen');
  const [catLimit, setCatLimit] = useState('2500');
  const [catThreshold, setCatThreshold] = useState('80');
  const [savingCap, setSavingCap] = useState(false);

  // Add Recurring Bill Form
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billCategory, setBillCategory] = useState<ExpenseCategory>('Bills & Recharge');
  const [billMethod, setBillMethod] = useState<PaymentMethod>('UPI');
  const [billDay, setBillDay] = useState('5');
  const [savingBill, setSavingBill] = useState(false);
  const [applyingBills, setApplyingBills] = useState(false);

  useEffect(() => {
    setAllowance(String(profile.monthlyAllowance));
    setSavingsTarget(String(profile.monthlySavingsTarget));
    setPersona(profile.persona);
    setCampusOrCity(profile.campusOrCity);
  }, [profile]);

  const handleSavePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefsSaved(false);
    try {
      await onUpdateProfilePrefs({
        displayName: profile.displayName,
        persona,
        campusOrCity: campusOrCity.trim().slice(0, SCHEMA_LIMITS.CAMPUS_MAX),
        monthlyAllowance: Math.max(0, Number(allowance) || 0),
        monthlySavingsTarget: Math.max(0, Number(savingsTarget) || 0),
      });
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2500);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(catLimit);
    if (!Number.isFinite(num) || num <= 0) return;
    setSavingCap(true);
    try {
      const existing = monthBudgets.find((b) => b.category === catSelect);
      await onSaveCategoryBudget(
        {
          category: catSelect,
          monthKey,
          monthlyLimit: num,
          alertThresholdPct: Number(catThreshold) || 80,
        },
        existing
      );
    } finally {
      setSavingCap(false);
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(billAmount);
    if (!billTitle.trim() || !Number.isFinite(num) || num <= 0) return;
    setSavingBill(true);
    try {
      await onAddRecurringBill({
        title: billTitle.trim().slice(0, SCHEMA_LIMITS.EXPENSE_TITLE_MAX),
        amount: num,
        category: billCategory,
        paymentMethod: billMethod,
        dayOfMonth: Math.min(28, Math.max(1, Number(billDay) || 1)),
      });
      setBillTitle('');
      setBillAmount('');
    } finally {
      setSavingBill(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Monthly Allowance & Savings Plan */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Monthly Allowance & Savings Rule
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            SmartPocket uses these targets to calculate your daily Safe-to-Spend limit automatically.
          </p>
        </div>

        <form onSubmit={handleSavePrefs} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="pref-allowance" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Monthly Allowance / Income (₹)
            </label>
            <input
              id="pref-allowance"
              type="number"
              min={0}
              max={SCHEMA_LIMITS.AMOUNT_MAX}
              value={allowance}
              onChange={(e) => setAllowance(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label htmlFor="pref-savings" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Monthly Savings Target (₹)
            </label>
            <input
              id="pref-savings"
              type="number"
              min={0}
              max={SCHEMA_LIMITS.AMOUNT_MAX}
              value={savingsTarget}
              onChange={(e) => setSavingsTarget(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label htmlFor="pref-persona" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Profile Role
            </label>
            <select
              id="pref-persona"
              value={persona}
              onChange={(e) => setPersona(e.target.value as UserPersona)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {USER_PERSONAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pref-campus" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Campus / City
            </label>
            <input
              id="pref-campus"
              type="text"
              maxLength={SCHEMA_LIMITS.CAMPUS_MAX}
              value={campusOrCity}
              onChange={(e) => setCampusOrCity(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Spendable monthly budget after savings:{' '}
              <strong className="font-mono-num text-slate-900 dark:text-slate-100">
                {formatINR(Math.max(0, (Number(allowance) || 0) - (Number(savingsTarget) || 0)))}
              </strong>
            </p>
            <button
              type="submit"
              disabled={savingPrefs}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {prefsSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Saved
                </>
              ) : savingPrefs ? (
                'Saving...'
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Category Budgets Grid */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Category Spending Caps ({formatMonthLabel(monthKey)})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Set caps on high-frequency student categories to trigger automated spending alerts.
          </p>
        </div>

        <form onSubmit={handleAddBudget} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
          <select
            aria-label="Category for budget cap"
            value={catSelect}
            onChange={(e) => setCatSelect(e.target.value as ExpenseCategory)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="number"
            aria-label="Monthly cap in INR"
            min={1}
            max={SCHEMA_LIMITS.AMOUNT_MAX}
            value={catLimit}
            onChange={(e) => setCatLimit(e.target.value)}
            placeholder="Monthly limit (₹)"
            className="px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />

          <select
            aria-label="Alert reminder threshold"
            value={catThreshold}
            onChange={(e) => setCatThreshold(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="70">Alert at 70% spent</option>
            <option value="80">Alert at 80% spent</option>
            <option value="90">Alert at 90% spent</option>
          </select>

          <button
            type="submit"
            disabled={savingCap}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            {savingCap ? 'Saving...' : 'Set Category Cap'}
          </button>
        </form>

        {monthBudgets.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400 py-4">
            No category caps set for {formatMonthLabel(monthKey)} yet. Add a cap above for Food & Canteen or Outings to enable automated budget reminders.
          </p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {monthBudgets.map((b) => {
              const spent = metrics.categoryTotals[b.category] || 0;
              const pct = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;
              const status =
                pct >= 100 ? 'Over Budget' : pct >= b.alertThresholdPct ? 'Near Limit' : 'On Track';
              const barColor =
                pct >= 100
                  ? 'bg-red-600 dark:bg-red-500'
                  : pct >= b.alertThresholdPct
                  ? 'bg-amber-500'
                  : 'bg-emerald-600 dark:bg-emerald-500';
              const statusTextClass =
                pct >= 100
                  ? 'text-red-600 dark:text-red-400'
                  : pct >= b.alertThresholdPct
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-700 dark:text-emerald-400';

              return (
                <div key={b.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {b.category}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">·</span>
                      <span className={`text-xs font-medium ${statusTextClass}`}>{status}</span>
                      <span aria-hidden="true" className="text-slate-400">·</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Alert at {b.alertThresholdPct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono-num text-slate-700 dark:text-slate-300">
                        <strong>{formatINR(spent)}</strong> / {formatINR(b.monthlyLimit)} ({pct}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteCategoryBudget(b.id)}
                        aria-label={`Remove ${b.category} cap`}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Automated Recurring Bills */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Automated Recurring Bills
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automate fixed student bills like Hostel Mess, Wi-Fi, Mobile Recharge, or Gym fees.
            </p>
          </div>
          {dueRecurringBills.length > 0 && (
            <button
              type="button"
              disabled={applyingBills}
              onClick={async () => {
                setApplyingBills(true);
                try {
                  await onApplyDueBills();
                } finally {
                  setApplyingBills(false);
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Repeat className="w-3.5 h-3.5" />
              {applyingBills
                ? 'Posting...'
                : `Auto-Post ${dueRecurringBills.length} Due for ${formatMonthLabel(monthKey)}`}
            </button>
          )}
        </div>

        <form onSubmit={handleCreateBill} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
          <input
            type="text"
            required
            maxLength={SCHEMA_LIMITS.EXPENSE_TITLE_MAX}
            value={billTitle}
            onChange={(e) => setBillTitle(e.target.value)}
            placeholder="e.g. Hostel Mess, Jio Plan"
            className="lg:col-span-2 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <input
            type="number"
            required
            min={1}
            max={SCHEMA_LIMITS.AMOUNT_MAX}
            value={billAmount}
            onChange={(e) => setBillAmount(e.target.value)}
            placeholder="Amount (₹)"
            className="px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <select
            aria-label="Recurring bill category"
            value={billCategory}
            onChange={(e) => setBillCategory(e.target.value as ExpenseCategory)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              aria-label="Recurring bill payment method"
              value={billMethod}
              onChange={(e) => setBillMethod(e.target.value as PaymentMethod)}
              className="flex-1 px-2 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              aria-label="Day of month"
              min={1}
              max={28}
              value={billDay}
              onChange={(e) => setBillDay(e.target.value)}
              title="Day of month (1-28)"
              className="w-16 px-2 py-2 text-sm font-mono-num bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <button
            type="submit"
            disabled={savingBill}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            {savingBill ? 'Adding...' : 'Add Rule'}
          </button>
        </form>

        {recurringBills.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No recurring rules yet. Add fixed monthly costs above so you never forget to log them.
          </p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {recurringBills.map((bill) => {
              const appliedThisMonth = bill.lastAppliedMonth === monthKey;
              return (
                <div
                  key={bill.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {bill.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {bill.category}
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      {bill.paymentMethod}
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      Day {bill.dayOfMonth} each month
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      {appliedThisMonth
                        ? `Posted for ${monthKey}`
                        : bill.active
                        ? 'Due this month'
                        : 'Paused'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-num text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatINR(bill.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleRecurringBill(bill)}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {bill.active ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRecurringBill(bill.id)}
                      aria-label={`Delete recurring bill ${bill.title}`}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
