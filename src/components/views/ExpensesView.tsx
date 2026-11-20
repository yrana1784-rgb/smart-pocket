import React, { useMemo, useState } from 'react';
import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { exportExpensesToCsv } from '../../lib/analytics';
import {
  EXPENSE_CATEGORIES,
  Expense,
  ExpenseCategory,
  PAYMENT_METHODS,
  PaymentMethod,
  formatINR,
  formatMonthLabel,
} from '../../types/smartpocket';

interface ExpensesViewProps {
  monthKey: string;
  monthExpenses: Expense[];
  loading: boolean;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  onSeedSampleMonth: () => Promise<void>;
}

export function ExpensesView({
  monthKey,
  monthExpenses,
  loading,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onSeedSampleMonth,
}: ExpensesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ExpenseCategory>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return monthExpenses.filter((exp) => {
      if (categoryFilter !== 'ALL' && exp.category !== categoryFilter) return false;
      if (paymentFilter !== 'ALL' && exp.paymentMethod !== paymentFilter) return false;
      if (q) {
        const hay = `${exp.title} ${exp.category} ${exp.paymentMethod} ${exp.note}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [monthExpenses, searchQuery, categoryFilter, paymentFilter]);

  const filteredTotal = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered]
  );

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteExpense(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filter & Export Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Search expenses"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search merchant, canteen, or note..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | ExpenseCategory)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="ALL">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
              {(['ALL', ...PAYMENT_METHODS] as const).map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPaymentFilter(pm)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    paymentFilter === pm
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {pm === 'ALL' ? 'All Modes' : pm}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={filtered.length === 0}
              onClick={() => exportExpensesToCsv(filtered, monthKey)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>
            <button
              type="button"
              onClick={onAddExpense}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Expense
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-600 dark:text-slate-400">
        <span>
          Showing <strong className="font-mono-num text-slate-900 dark:text-slate-100">{filtered.length}</strong>{' '}
          expense{filtered.length === 1 ? '' : 's'} in {formatMonthLabel(monthKey)}
        </span>
        <span>
          Filtered total:{' '}
          <strong className="font-mono-num text-sm text-slate-900 dark:text-slate-100">
            {formatINR(filteredTotal)}
          </strong>
        </span>
      </div>

      {/* High-Density Financial Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {monthExpenses.length === 0
                ? `No expenses recorded in ${formatMonthLabel(monthKey)}`
                : 'No matching expenses'}
            </h3>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              {monthExpenses.length === 0
                ? 'Start logging daily UPI, canteen, and commute transactions to see where your monthly allowance goes.'
                : 'Try clearing your search query or switching category and payment filters.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onAddExpense}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Log Expense
              </button>
              {monthExpenses.length === 0 && (
                <button
                  type="button"
                  disabled={seeding}
                  onClick={async () => {
                    setSeeding(true);
                    try {
                      await onSeedSampleMonth();
                    } finally {
                      setSeeding(false);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {seeding ? 'Loading...' : 'Load Sample Student Month'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Expense</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {filtered.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono-num text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {exp.title}
                      </p>
                      {exp.note && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {exp.note}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {exp.category}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {exp.paymentMethod}
                      {exp.isRecurringInstance && (
                        <span className="ml-1.5 text-emerald-700 dark:text-emerald-400">
                          · Auto
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditExpense(exp)}
                          aria-label={`Edit ${exp.title}`}
                          className="p-2 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === exp.id}
                          onClick={() => handleDelete(exp.id)}
                          aria-label={`Delete ${exp.title}`}
                          className="p-2 rounded-md text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
