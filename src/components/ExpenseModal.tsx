import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  Expense,
  ExpenseCategory,
  PAYMENT_METHODS,
  PaymentMethod,
  SCHEMA_LIMITS,
  getTodayDateString,
} from '../types/smartpocket';

interface ExpenseModalProps {
  isOpen: boolean;
  editingExpense: Expense | null;
  defaultDate?: string;
  onClose: () => void;
  onSave: (data: {
    title: string;
    amount: number;
    category: ExpenseCategory;
    paymentMethod: PaymentMethod;
    date: string;
    note: string;
  }) => Promise<void>;
}

const QUICK_PRESETS: Array<{
  label: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
}> = [
  { label: 'Canteen ₹80', title: 'College Canteen Meal', amount: 80, category: 'Food & Canteen', paymentMethod: 'UPI' },
  { label: 'Auto ₹40', title: 'Auto Commute', amount: 40, category: 'Travel & Commute', paymentMethod: 'UPI' },
  { label: 'Chai ₹35', title: 'Chai & Samosa', amount: 35, category: 'Food & Canteen', paymentMethod: 'UPI' },
  { label: 'Recharge ₹299', title: 'Mobile Data Recharge', amount: 299, category: 'Bills & Recharge', paymentMethod: 'UPI' },
];

export function ExpenseModal({
  isOpen,
  editingExpense,
  defaultDate,
  onClose,
  onSave,
}: ExpenseModalProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Canteen');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [date, setDate] = useState(defaultDate || getTodayDateString());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmount(String(editingExpense.amount));
      setCategory(editingExpense.category);
      setPaymentMethod(editingExpense.paymentMethod);
      setDate(editingExpense.date);
      setNote(editingExpense.note);
    } else {
      setTitle('');
      setAmount('');
      setCategory('Food & Canteen');
      setPaymentMethod('UPI');
      setDate(defaultDate || getTodayDateString());
      setNote('');
    }
  }, [isOpen, editingExpense, defaultDate]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const numericAmount = Number(amount);

    if (!trimmedTitle) {
      setError('Enter a short description for this expense.');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > SCHEMA_LIMITS.AMOUNT_MAX) {
      setError('Enter a valid amount greater than ₹0.');
      return;
    }
    if (!SCHEMA_LIMITS.DATE_PATTERN.test(date)) {
      setError('Choose a valid date.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: trimmedTitle.slice(0, SCHEMA_LIMITS.EXPENSE_TITLE_MAX),
        amount: numericAmount,
        category,
        paymentMethod,
        date,
        note: note.trim().slice(0, SCHEMA_LIMITS.EXPENSE_NOTE_MAX),
      });
      onClose();
    } catch {
      setError('Failed to save expense. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2
            id="expense-modal-title"
            className="text-lg font-bold text-slate-900 dark:text-slate-50"
          >
            {editingExpense ? 'Edit Expense' : 'Log Daily Expense'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close expense dialog"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!editingExpense && (
          <div className="mb-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Quick student presets
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setTitle(preset.title);
                    setAmount(String(preset.amount));
                    setCategory(preset.category);
                    setPaymentMethod(preset.paymentMethod);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="expense-title"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Title / Merchant
              </label>
              <input
                id="expense-title"
                type="text"
                required
                maxLength={SCHEMA_LIMITS.EXPENSE_TITLE_MAX}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Canteen Lunch, Swiggy, Metro Card"
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label
                htmlFor="expense-amount"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Amount (₹)
              </label>
              <input
                id="expense-amount"
                type="number"
                required
                min={1}
                max={SCHEMA_LIMITS.AMOUNT_MAX}
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="150"
                className="w-full px-3.5 py-2.5 text-sm font-mono-num bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="expense-category"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Category
              </label>
              <select
                id="expense-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="expense-payment"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Payment Mode
              </label>
              <select
                id="expense-payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="expense-date"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Date
              </label>
              <input
                id="expense-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-mono-num bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="expense-note"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Note (optional)
            </label>
            <input
              id="expense-note"
              type="text"
              maxLength={SCHEMA_LIMITS.EXPENSE_NOTE_MAX}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add context so you remember where this went"
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {saving ? 'Saving...' : editingExpense ? 'Save Changes' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
