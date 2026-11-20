import React, { useState } from 'react';
import { CheckCircle2, Plus, Target, Trash2 } from 'lucide-react';
import {
  SCHEMA_LIMITS,
  SavingsGoal,
  formatINR,
  getTodayDateString,
} from '../../types/smartpocket';

interface SavingsGoalsViewProps {
  goals: SavingsGoal[];
  activeLoggingDays: number;
  budgetCount: number;
  onAddGoal: (input: {
    name: string;
    targetAmount: number;
    savedAmount: number;
    targetDate: string;
  }) => Promise<void>;
  onContributeGoal: (goal: SavingsGoal, addAmount: number) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
}

export function SavingsGoalsView({
  goals,
  activeLoggingDays,
  budgetCount,
  onAddGoal,
  onContributeGoal,
  onDeleteGoal,
}: SavingsGoalsViewProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('0');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [creating, setCreating] = useState(false);
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const habitComplete = activeLoggingDays >= 3 && budgetCount >= 1;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(targetAmount);
    const saved = Math.max(0, Number(savedAmount) || 0);
    if (!name.trim() || !Number.isFinite(target) || target <= 0) return;

    setCreating(true);
    try {
      await onAddGoal({
        name: name.trim().slice(0, SCHEMA_LIMITS.GOAL_NAME_MAX),
        targetAmount: target,
        savedAmount: Math.min(saved, target),
        targetDate: SCHEMA_LIMITS.DATE_PATTERN.test(targetDate)
          ? targetDate
          : getTodayDateString(),
      });
      setName('');
      setTargetAmount('');
      setSavedAmount('0');
    } finally {
      setCreating(false);
    }
  };

  const handleContribute = async (goal: SavingsGoal, amt: number) => {
    if (goal.status === 'completed' || amt <= 0) return;
    setContributingId(goal.id);
    try {
      await onContributeGoal(goal, amt);
      setCustomInputs((prev) => ({ ...prev, [goal.id]: '' }));
    } finally {
      setContributingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary & 30-Day Budgeting Habit Milestone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Saved Across Goals</p>
          <p className="mt-2 text-2xl font-bold font-mono-num text-emerald-600 dark:text-emerald-400">
            {formatINR(totalSaved)}
          </p>
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
            Target combined: <span className="font-mono-num">{formatINR(totalTarget)}</span>
          </p>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              30-Day Financial Habit Check
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-50">
              {habitComplete
                ? 'Active Budgeting Habit Unlocked'
                : 'Log expenses on 3+ days & set 1 category budget'}
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Logged on <span className="font-mono-num font-semibold">{activeLoggingDays}</span> day{activeLoggingDays === 1 ? '' : 's'} this month
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span className="font-mono-num font-semibold">{budgetCount}</span> active budget cap{budgetCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                habitComplete
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {habitComplete ? 'Consistent Saver' : 'Building Habit'}
            </span>
          </div>
        </div>
      </div>

      {/* Create New Savings Goal */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Create a Savings Goal
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Set aside part of your monthly allowance for exam fees, trips, gadgets, or an emergency buffer.
          </p>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            required
            maxLength={SCHEMA_LIMITS.GOAL_NAME_MAX}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Goal name (e.g. Emergency Buffer)"
            className="lg:col-span-2 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <input
            type="number"
            required
            min={1}
            max={SCHEMA_LIMITS.AMOUNT_MAX}
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="Target (₹)"
            className="px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <input
            type="date"
            required
            aria-label="Goal target date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            {creating ? 'Creating...' : 'Add Goal'}
          </button>
        </form>
      </section>

      {/* Goals List */}
      <section className="space-y-4">
        {goals.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
            <Target className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              No savings goals yet
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Add your first goal above and top it up whenever you stay under your daily Safe-to-Spend limit.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const pct =
                goal.targetAmount > 0
                  ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100))
                  : 0;
              const isCompleted = goal.status === 'completed';

              return (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                          {goal.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Target date: <span className="font-mono-num">{goal.targetDate}</span>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span
                            className={
                              isCompleted
                                ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                                : 'text-slate-600 dark:text-slate-400'
                            }
                          >
                            {isCompleted ? 'Completed' : 'In Progress'}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(goal.id)}
                        aria-label={`Delete goal ${goal.name}`}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between gap-2">
                      <span className="text-xl font-bold font-mono-num text-slate-900 dark:text-slate-50">
                        {formatINR(goal.savedAmount)}
                      </span>
                      <span className="text-xs font-mono-num text-slate-500 dark:text-slate-400">
                        of {formatINR(goal.targetAmount)} ({pct}%)
                      </span>
                    </div>

                    <div className="mt-2 h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {!isCompleted ? (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                      {[250, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          disabled={contributingId === goal.id}
                          onClick={() => handleContribute(goal, amt)}
                          className="px-2.5 py-1.5 text-xs font-mono-num font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-md transition-colors cursor-pointer"
                        >
                          +{formatINR(amt)}
                        </button>
                      ))}
                      <form
                        className="flex items-center gap-1.5 ml-auto"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const val = Number(customInputs[goal.id]);
                          if (val > 0) void handleContribute(goal, val);
                        }}
                      >
                        <input
                          type="number"
                          min={1}
                          aria-label={`Custom contribution for ${goal.name}`}
                          value={customInputs[goal.id] || ''}
                          onChange={(e) =>
                            setCustomInputs((prev) => ({ ...prev, [goal.id]: e.target.value }))
                          }
                          placeholder="₹ Add"
                          className="w-20 px-2 py-1.5 text-xs font-mono-num bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
                        />
                        <button
                          type="submit"
                          disabled={contributingId === goal.id}
                          className="px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors cursor-pointer"
                        >
                          Save
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Goal reached and locked as a completed milestone.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
