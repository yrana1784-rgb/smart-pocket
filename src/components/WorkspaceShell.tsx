import React, { useEffect, useMemo, useState } from 'react';
import { onSnapshot, query, where } from 'firebase/firestore';
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PiggyBank,
  Plus,
  ReceiptText,
  SlidersHorizontal,
  Star,
  Sun,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { computeMonthlyMetrics } from '../lib/analytics';
import { OperationType, handleFirestoreError } from '../lib/firebase';
import {
  addExpense,
  addRecurringBill,
  addSavingsGoal,
  applyDueRecurringBills,
  contributeToGoal,
  deleteCategoryBudget,
  deleteExpense,
  deleteRecurringBill,
  deleteSavingsGoal,
  deleteVerifiedReview,
  getBudgetsCollection,
  getExpensesCollection,
  getGoalsCollection,
  getRecurringCollection,
  seedStarterStudentMonth,
  toggleRecurringBill,
  updateExpense,
  updateUserPlan,
  updateUserPreferences,
  updateWillingnessToPay,
  upsertCategoryBudget,
  upsertVerifiedReview,
} from '../lib/firestoreService';
import {
  CategoryBudget,
  Expense,
  ExpenseCategory,
  RecurringBill,
  SavingsGoal,
  VerifiedReview,
  formatMonthLabel,
  getCurrentMonthKey,
  getTodayDateString,
  shiftMonthKey,
} from '../types/smartpocket';
import { ExpenseModal } from './ExpenseModal';
import { BudgetsView } from './views/BudgetsView';
import { ExpensesView } from './views/ExpensesView';
import { OverviewView } from './views/OverviewView';
import { PlansAutomationView } from './views/PlansAutomationView';
import { ReviewsView } from './views/ReviewsView';
import { SavingsGoalsView } from './views/SavingsGoalsView';

type WorkspaceTab = 'overview' | 'expenses' | 'budgets' | 'goals' | 'plans' | 'reviews';

interface WorkspaceShellProps {
  reviews: VerifiedReview[];
  reviewsLoading: boolean;
}

const NAV_ITEMS: Array<{
  id: WorkspaceTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'expenses', label: 'Expenses', icon: ReceiptText },
  { id: 'budgets', label: 'Budgets & Rules', icon: SlidersHorizontal },
  { id: 'goals', label: 'Savings Goals', icon: PiggyBank },
  { id: 'plans', label: 'Plans & Referrals', icon: CreditCard },
  { id: 'reviews', label: 'Verified Reviews', icon: Star },
];

export function WorkspaceShell({ reviews, reviewsLoading }: WorkspaceShellProps) {
  const { user, profile, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [monthKey, setMonthKey] = useState<string>(getCurrentMonthKey);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Synced Firestore data
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Expense Modal state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    setDataLoading(true);

    let loadedCount = 0;
    const markLoaded = () => {
      loadedCount += 1;
      if (loadedCount >= 4) setDataLoading(false);
    };

    const unsubExpenses = onSnapshot(
      query(getExpensesCollection(uid), where('userId', '==', uid)),
      (snap) => {
        const list: Expense[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Expense, 'id'>) }))
          .sort((a, b) => b.date.localeCompare(a.date));
        setExpenses(list);
        markLoaded();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/expenses`)
    );

    const unsubBudgets = onSnapshot(
      query(getBudgetsCollection(uid), where('userId', '==', uid)),
      (snap) => {
        const list: CategoryBudget[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CategoryBudget, 'id'>),
        }));
        setBudgets(list);
        markLoaded();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/budgets`)
    );

    const unsubGoals = onSnapshot(
      query(getGoalsCollection(uid), where('userId', '==', uid)),
      (snap) => {
        const list: SavingsGoal[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SavingsGoal, 'id'>),
        }));
        setGoals(list);
        markLoaded();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/goals`)
    );

    const unsubRecurring = onSnapshot(
      query(getRecurringCollection(uid), where('userId', '==', uid)),
      (snap) => {
        const list: RecurringBill[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RecurringBill, 'id'>),
        }));
        setRecurringBills(list);
        markLoaded();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/recurring`)
    );

    return () => {
      unsubExpenses();
      unsubBudgets();
      unsubGoals();
      unsubRecurring();
    };
  }, [user]);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.monthKey === monthKey),
    [expenses, monthKey]
  );

  const monthBudgets = useMemo(
    () => budgets.filter((b) => b.monthKey === monthKey),
    [budgets, monthKey]
  );

  const dueRecurringBills = useMemo(
    () => recurringBills.filter((b) => b.active && b.lastAppliedMonth !== monthKey),
    [recurringBills, monthKey]
  );

  const metrics = useMemo(
    () => computeMonthlyMetrics(profile, expenses, budgets, monthKey),
    [profile, expenses, budgets, monthKey]
  );

  const defaultExpenseDate =
    monthKey === getCurrentMonthKey() ? getTodayDateString() : `${monthKey}-01`;

  const activeNavMeta = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Loading your SmartPocket workspace...
        </p>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
        <span className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          SmartPocket
        </span>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav aria-label="Workspace navigation" className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Accessibility Theme Switch + Profile Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600"
        >
          <span className="inline-flex items-center gap-2">
            {isDark ? <Moon className="w-4 h-4 text-emerald-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {isDark ? 'On' : 'Off'}
          </span>
        </button>

        <div className="px-3 py-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {profile.displayName}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {profile.persona}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            title="Log out"
            className="p-2 rounded-lg text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full z-10">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Workspace Bar */}
        <header className="sticky top-0 z-10 h-16 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="hidden sm:inline text-slate-500 dark:text-slate-400">
                SmartPocket
              </span>
              <span className="hidden sm:inline text-slate-400" aria-hidden="true">/</span>
              <h1 className="font-display font-bold text-slate-900 dark:text-slate-50 truncate">
                {activeNavMeta.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Month Switcher */}
            {(activeTab === 'overview' || activeTab === 'expenses' || activeTab === 'budgets') && (
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setMonthKey((prev) => shiftMonthKey(prev, -1))}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                  {formatMonthLabel(monthKey)}
                </span>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setMonthKey((prev) => shiftMonthKey(prev, 1))}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Log Expense</span>
            </button>
          </div>
        </header>

        {/* Active View Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'overview' && (
            <OverviewView
              monthKey={monthKey}
              metrics={metrics}
              monthExpenses={monthExpenses}
              dueRecurringBills={dueRecurringBills}
              loading={dataLoading}
              onOpenAddExpense={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
              onSeedSampleMonth={() => seedStarterStudentMonth(user.uid, monthKey)}
              onApplyDueBills={async () => {
                await applyDueRecurringBills(user.uid, dueRecurringBills, monthKey);
              }}
              onApplySuggestedCap={async (cat: ExpenseCategory, cap: number) => {
                const existing = monthBudgets.find((b) => b.category === cat);
                await upsertCategoryBudget(
                  user.uid,
                  { category: cat, monthKey, monthlyLimit: cap, alertThresholdPct: 80 },
                  existing
                );
              }}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              monthKey={monthKey}
              monthExpenses={monthExpenses}
              loading={dataLoading}
              onAddExpense={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
              onEditExpense={(exp) => {
                setEditingExpense(exp);
                setExpenseModalOpen(true);
              }}
              onDeleteExpense={(id) => deleteExpense(user.uid, id)}
              onSeedSampleMonth={() => seedStarterStudentMonth(user.uid, monthKey)}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsView
              monthKey={monthKey}
              profile={profile}
              metrics={metrics}
              monthBudgets={monthBudgets}
              recurringBills={recurringBills}
              dueRecurringBills={dueRecurringBills}
              onUpdateProfilePrefs={(updates) => updateUserPreferences(user.uid, updates)}
              onSaveCategoryBudget={(input, existing) =>
                upsertCategoryBudget(user.uid, input, existing)
              }
              onDeleteCategoryBudget={(id) => deleteCategoryBudget(user.uid, id)}
              onAddRecurringBill={(input) => addRecurringBill(user.uid, input)}
              onToggleRecurringBill={(bill) => toggleRecurringBill(user.uid, bill)}
              onApplyDueBills={async () => {
                await applyDueRecurringBills(user.uid, dueRecurringBills, monthKey);
              }}
              onDeleteRecurringBill={(id) => deleteRecurringBill(user.uid, id)}
            />
          )}

          {activeTab === 'goals' && (
            <SavingsGoalsView
              goals={goals}
              activeLoggingDays={metrics.activeLoggingDays}
              budgetCount={monthBudgets.length}
              onAddGoal={(input) => addSavingsGoal(user.uid, input)}
              onContributeGoal={(goal, amt) => contributeToGoal(user.uid, goal, amt)}
              onDeleteGoal={(id) => deleteSavingsGoal(user.uid, id)}
            />
          )}

          {activeTab === 'plans' && (
            <PlansAutomationView
              profile={profile}
              onChangePlan={(plan) =>
                updateUserPlan(user.uid, plan, profile.trialStartedAt)
              }
              onChangeWtp={(wtp) => updateWillingnessToPay(user.uid, wtp)}
            />
          )}

          {activeTab === 'reviews' && (
            <ReviewsView
              reviews={reviews}
              loading={reviewsLoading}
              onSubmitReview={(input) => upsertVerifiedReview(user.uid, input)}
              onDeleteReview={() => deleteVerifiedReview(user.uid)}
            />
          )}
        </main>
      </div>

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        editingExpense={editingExpense}
        defaultDate={defaultExpenseDate}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={async (data) => {
          if (editingExpense) {
            await updateExpense(user.uid, editingExpense.id, data);
          } else {
            await addExpense(user.uid, data);
          }
        }}
      />
    </div>
  );
}
