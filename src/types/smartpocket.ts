import { Timestamp } from 'firebase/firestore';

export const EXPENSE_CATEGORIES = [
  'Food & Canteen',
  'Travel & Commute',
  'Shopping',
  'Outings & Fun',
  'Books & Study',
  'Bills & Recharge',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYMENT_METHODS = [
  'UPI',
  'Cash',
  'Card',
  'Bank Transfer',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const USER_PERSONAS = [
  'College Student',
  'MBA Student',
  'Fresh Graduate',
  'Young Professional',
] as const;

export type UserPersona = (typeof USER_PERSONAS)[number];

export type SubscriptionPlan = 'free' | 'trial' | 'plus';
export type WillingnessToPay = 'undecided' | 'yes' | 'maybe' | 'no';
export type GoalStatus = 'active' | 'completed';

/**
 * Validation constants synchronized verbatim with firebase-blueprint.json & firestore.rules.
 */
export const SCHEMA_LIMITS = {
  DISPLAY_NAME_MAX: 80,
  CAMPUS_MAX: 100,
  EXPENSE_TITLE_MAX: 100,
  EXPENSE_NOTE_MAX: 240,
  GOAL_NAME_MAX: 80,
  REVIEW_TITLE_MIN: 3,
  REVIEW_TITLE_MAX: 100,
  REVIEW_COMMENT_MIN: 10,
  REVIEW_COMMENT_MAX: 600,
  AUTHOR_ROLE_MAX: 80,
  AMOUNT_MAX: 10000000,
  DATE_PATTERN: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  MONTH_PATTERN: /^[0-9]{4}-[0-9]{2}$/,
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
} as const;

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  persona: UserPersona;
  campusOrCity: string;
  monthlyAllowance: number;
  monthlySavingsTarget: number;
  plan: SubscriptionPlan;
  trialStartedAt: string;
  referralCode: string;
  willingnessToPay99: WillingnessToPay;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Expense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  note: string;
  isRecurringInstance: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CategoryBudget {
  id: string;
  userId: string;
  category: ExpenseCategory;
  monthKey: string; // YYYY-MM
  monthlyLimit: number;
  alertThresholdPct: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string; // YYYY-MM-DD
  status: GoalStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RecurringBill {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  dayOfMonth: number;
  lastAppliedMonth: string; // YYYY-MM or ""
  active: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface VerifiedReview {
  id: string;
  userId: string;
  authorName: string;
  authorRole: string;
  rating: number;
  title: string;
  comment: string;
  verifiedEmail: boolean;
  isPublished: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SignupDraft {
  displayName?: string;
  persona?: UserPersona;
  campusOrCity?: string;
  monthlyAllowance?: number;
}

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  'Food & Canteen': '#059669',
  'Travel & Commute': '#0284C7',
  'Shopping': '#7C3AED',
  'Outings & Fun': '#D97706',
  'Books & Study': '#0D9488',
  'Bills & Recharge': '#475569',
  'Other': '#64748B',
};

export function formatINR(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(safe));
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthKey(): string {
  return getTodayDateString().slice(0, 7);
}

export function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const [yStr, mStr] = monthKey.split('-');
  const d = new Date(Number(yStr), Number(mStr) - 1 + deltaMonths, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [yStr, mStr] = monthKey.split('-');
  const d = new Date(Number(yStr), Number(mStr) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function getDaysInMonth(monthKey: string): number {
  const [yStr, mStr] = monthKey.split('-');
  return new Date(Number(yStr), Number(mStr), 0).getDate();
}

export function slugifyCategory(category: ExpenseCategory): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}
