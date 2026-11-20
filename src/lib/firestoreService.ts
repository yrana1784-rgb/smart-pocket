import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  CategoryBudget,
  ExpenseCategory,
  PaymentMethod,
  SCHEMA_LIMITS,
  SignupDraft,
  SubscriptionPlan,
  UserPersona,
  UserProfile,
  WillingnessToPay,
  getCurrentMonthKey,
  getTodayDateString,
  slugifyCategory,
} from '../types/smartpocket';
import { OperationType, db, handleFirestoreError } from './firebase';

function sanitizeText(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

function clampAmount(value: number, min = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(SCHEMA_LIMITS.AMOUNT_MAX, Math.max(min, Math.round(n * 100) / 100));
}

function generateReferralCode(uid: string): string {
  const clean = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'STUDENT';
  return `SP-${clean}`;
}

function makeDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}

export async function ensureUserProfile(
  user: User,
  draft?: SignupDraft
): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    const displayName = sanitizeText(
      draft?.displayName || user.displayName || 'SmartPocket Student',
      SCHEMA_LIMITS.DISPLAY_NAME_MAX
    ) || 'SmartPocket Student';

    const email = sanitizeText(user.email || '', 150);
    const persona: UserPersona = draft?.persona || 'College Student';
    const campusOrCity = sanitizeText(
      draft?.campusOrCity || 'Meerut, India',
      SCHEMA_LIMITS.CAMPUS_MAX
    );
    const monthlyAllowance = clampAmount(draft?.monthlyAllowance ?? 10000, 0);
    const monthlySavingsTarget = clampAmount(Math.round(monthlyAllowance * 0.2), 0);

    const payload = {
      uid: user.uid,
      displayName,
      email,
      persona,
      campusOrCity,
      monthlyAllowance,
      monthlySavingsTarget,
      plan: 'free' as SubscriptionPlan,
      trialStartedAt: '',
      referralCode: generateReferralCode(user.uid),
      willingnessToPay99: 'undecided' as WillingnessToPay,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, payload);
    const createdSnap = await getDoc(ref);
    return createdSnap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserPreferences(
  uid: string,
  updates: {
    displayName: string;
    persona: UserPersona;
    campusOrCity: string;
    monthlyAllowance: number;
    monthlySavingsTarget: number;
  }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName:
        sanitizeText(updates.displayName, SCHEMA_LIMITS.DISPLAY_NAME_MAX) || 'Student',
      persona: updates.persona,
      campusOrCity: sanitizeText(updates.campusOrCity, SCHEMA_LIMITS.CAMPUS_MAX),
      monthlyAllowance: clampAmount(updates.monthlyAllowance, 0),
      monthlySavingsTarget: clampAmount(updates.monthlySavingsTarget, 0),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateUserPlan(
  uid: string,
  plan: SubscriptionPlan,
  existingTrialStartedAt: string
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const trialStartedAt =
      plan === 'trial'
        ? existingTrialStartedAt || new Date().toISOString().slice(0, 10)
        : existingTrialStartedAt;
    await updateDoc(doc(db, 'users', uid), {
      plan,
      trialStartedAt: sanitizeText(trialStartedAt, 40),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateWillingnessToPay(
  uid: string,
  willingnessToPay99: WillingnessToPay
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      willingnessToPay99,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function addExpense(
  uid: string,
  input: {
    title: string;
    amount: number;
    category: ExpenseCategory;
    paymentMethod: PaymentMethod;
    date: string;
    note?: string;
    isRecurringInstance?: boolean;
  }
): Promise<string> {
  const expenseId = makeDocId('exp');
  const path = `users/${uid}/expenses/${expenseId}`;
  const dateStr = SCHEMA_LIMITS.DATE_PATTERN.test(input.date)
    ? input.date
    : getTodayDateString();
  const monthKey = dateStr.slice(0, 7);

  try {
    await setDoc(doc(db, 'users', uid, 'expenses', expenseId), {
      userId: uid,
      title: sanitizeText(input.title, SCHEMA_LIMITS.EXPENSE_TITLE_MAX) || 'Expense',
      amount: clampAmount(input.amount, 1),
      category: input.category,
      paymentMethod: input.paymentMethod,
      date: dateStr,
      monthKey,
      note: sanitizeText(input.note || '', SCHEMA_LIMITS.EXPENSE_NOTE_MAX),
      isRecurringInstance: Boolean(input.isRecurringInstance),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return expenseId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateExpense(
  uid: string,
  expenseId: string,
  input: {
    title: string;
    amount: number;
    category: ExpenseCategory;
    paymentMethod: PaymentMethod;
    date: string;
    note: string;
  }
): Promise<void> {
  const path = `users/${uid}/expenses/${expenseId}`;
  const dateStr = SCHEMA_LIMITS.DATE_PATTERN.test(input.date)
    ? input.date
    : getTodayDateString();
  const monthKey = dateStr.slice(0, 7);

  try {
    await updateDoc(doc(db, 'users', uid, 'expenses', expenseId), {
      title: sanitizeText(input.title, SCHEMA_LIMITS.EXPENSE_TITLE_MAX) || 'Expense',
      amount: clampAmount(input.amount, 1),
      category: input.category,
      paymentMethod: input.paymentMethod,
      date: dateStr,
      monthKey,
      note: sanitizeText(input.note || '', SCHEMA_LIMITS.EXPENSE_NOTE_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteExpense(uid: string, expenseId: string): Promise<void> {
  const path = `users/${uid}/expenses/${expenseId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'expenses', expenseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertCategoryBudget(
  uid: string,
  input: {
    category: ExpenseCategory;
    monthKey: string;
    monthlyLimit: number;
    alertThresholdPct: number;
  },
  existingBudget?: CategoryBudget
): Promise<void> {
  const monthKey = SCHEMA_LIMITS.MONTH_PATTERN.test(input.monthKey)
    ? input.monthKey
    : getCurrentMonthKey();
  const budgetId = existingBudget?.id || `${monthKey}_${slugifyCategory(input.category)}`;
  const path = `users/${uid}/budgets/${budgetId}`;
  const limit = clampAmount(input.monthlyLimit, 1);
  const threshold = Math.min(100, Math.max(50, Math.round(input.alertThresholdPct)));

  try {
    const ref = doc(db, 'users', uid, 'budgets', budgetId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        monthlyLimit: limit,
        alertThresholdPct: threshold,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        userId: uid,
        category: input.category,
        monthKey,
        monthlyLimit: limit,
        alertThresholdPct: threshold,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCategoryBudget(uid: string, budgetId: string): Promise<void> {
  const path = `users/${uid}/budgets/${budgetId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'budgets', budgetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function addSavingsGoal(
  uid: string,
  input: {
    name: string;
    targetAmount: number;
    savedAmount: number;
    targetDate: string;
  }
): Promise<void> {
  const goalId = makeDocId('goal');
  const path = `users/${uid}/goals/${goalId}`;
  const targetDate = SCHEMA_LIMITS.DATE_PATTERN.test(input.targetDate)
    ? input.targetDate
    : getTodayDateString();
  const targetAmount = clampAmount(input.targetAmount, 1);
  const savedAmount = Math.min(targetAmount, clampAmount(input.savedAmount, 0));

  try {
    await setDoc(doc(db, 'users', uid, 'goals', goalId), {
      userId: uid,
      name: sanitizeText(input.name, SCHEMA_LIMITS.GOAL_NAME_MAX) || 'Savings Goal',
      targetAmount,
      savedAmount,
      targetDate,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function contributeToGoal(
  uid: string,
  goal: {
    id: string;
    name: string;
    targetAmount: number;
    savedAmount: number;
    targetDate: string;
  },
  addAmount: number
): Promise<void> {
  const path = `users/${uid}/goals/${goal.id}`;
  const nextSaved = clampAmount(goal.savedAmount + addAmount, 0);
  const nextStatus = nextSaved >= goal.targetAmount ? 'completed' : 'active';
  try {
    await updateDoc(doc(db, 'users', uid, 'goals', goal.id), {
      name: goal.name,
      targetAmount: goal.targetAmount,
      savedAmount: Math.min(nextSaved, goal.targetAmount),
      targetDate: goal.targetDate,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSavingsGoal(uid: string, goalId: string): Promise<void> {
  const path = `users/${uid}/goals/${goalId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'goals', goalId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function addRecurringBill(
  uid: string,
  input: {
    title: string;
    amount: number;
    category: ExpenseCategory;
    paymentMethod: PaymentMethod;
    dayOfMonth: number;
  }
): Promise<void> {
  const recurringId = makeDocId('rec');
  const path = `users/${uid}/recurring/${recurringId}`;
  const day = Math.min(28, Math.max(1, Math.round(input.dayOfMonth)));

  try {
    await setDoc(doc(db, 'users', uid, 'recurring', recurringId), {
      userId: uid,
      title: sanitizeText(input.title, SCHEMA_LIMITS.EXPENSE_TITLE_MAX) || 'Monthly Bill',
      amount: clampAmount(input.amount, 1),
      category: input.category,
      paymentMethod: input.paymentMethod,
      dayOfMonth: day,
      lastAppliedMonth: '',
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleRecurringBill(
  uid: string,
  bill: {
    id: string;
    title: string;
    amount: number;
    category: ExpenseCategory;
    paymentMethod: PaymentMethod;
    dayOfMonth: number;
    active: boolean;
  }
): Promise<void> {
  const path = `users/${uid}/recurring/${bill.id}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'recurring', bill.id), {
      title: bill.title,
      amount: bill.amount,
      category: bill.category,
      paymentMethod: bill.paymentMethod,
      dayOfMonth: bill.dayOfMonth,
      active: !bill.active,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function applyDueRecurringBills(
  uid: string,
  dueBills: Array<{
    id: string;
    title: string;
    amount: number;
    category: ExpenseCategory;
    paymentMethod: PaymentMethod;
    dayOfMonth: number;
  }>,
  monthKey: string
): Promise<number> {
  if (dueBills.length === 0) return 0;
  const path = `users/${uid}/recurring`;
  try {
    const batch = writeBatch(db);
    for (const bill of dueBills) {
      const dayStr = String(Math.min(28, Math.max(1, bill.dayOfMonth))).padStart(2, '0');
      const dateStr = `${monthKey}-${dayStr}`;
      const expId = makeDocId('exp');
      batch.set(doc(db, 'users', uid, 'expenses', expId), {
        userId: uid,
        title: sanitizeText(bill.title, SCHEMA_LIMITS.EXPENSE_TITLE_MAX),
        amount: clampAmount(bill.amount, 1),
        category: bill.category,
        paymentMethod: bill.paymentMethod,
        date: dateStr,
        monthKey,
        note: 'Auto-posted from recurring rule',
        isRecurringInstance: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'users', uid, 'recurring', bill.id), {
        lastAppliedMonth: monthKey,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    return dueBills.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteRecurringBill(uid: string, recurringId: string): Promise<void> {
  const path = `users/${uid}/recurring/${recurringId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'recurring', recurringId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertVerifiedReview(
  uid: string,
  input: {
    authorName: string;
    authorRole: string;
    rating: number;
    title: string;
    comment: string;
  }
): Promise<void> {
  const path = `reviews/${uid}`;
  const ref = doc(db, 'reviews', uid);
  const safeRating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const authorName =
    sanitizeText(input.authorName, SCHEMA_LIMITS.DISPLAY_NAME_MAX) || 'Verified User';
  const authorRole =
    sanitizeText(input.authorRole, SCHEMA_LIMITS.AUTHOR_ROLE_MAX) || 'Student User';
  const title = sanitizeText(input.title, SCHEMA_LIMITS.REVIEW_TITLE_MAX);
  const comment = sanitizeText(input.comment, SCHEMA_LIMITS.REVIEW_COMMENT_MAX);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        authorName,
        authorRole,
        rating: safeRating,
        title,
        comment,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        userId: uid,
        authorName,
        authorRole,
        rating: safeRating,
        title,
        comment,
        verifiedEmail: true,
        isPublished: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteVerifiedReview(uid: string): Promise<void> {
  const path = `reviews/${uid}`;
  try {
    await deleteDoc(doc(db, 'reviews', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedStarterStudentMonth(uid: string, monthKey: string): Promise<void> {
  const path = `users/${uid}/expenses`;
  const todayDay = Math.min(25, Math.max(4, new Date().getDate()));
  const day = (offset: number) =>
    `${monthKey}-${String(Math.max(1, todayDay - offset)).padStart(2, '0')}`;

  const starterExpenses: Array<{
    title: string;
    amount: number;
    category: ExpenseCategory;
    paymentMethod: PaymentMethod;
    date: string;
    note: string;
  }> = [
    {
      title: 'Campus Canteen Lunch & Chai',
      amount: 145,
      category: 'Food & Canteen',
      paymentMethod: 'UPI',
      date: day(0),
      note: 'Thali and evening tea with classmates',
    },
    {
      title: 'Auto to University Gate',
      amount: 60,
      category: 'Travel & Commute',
      paymentMethod: 'UPI',
      date: day(1),
      note: 'Shared auto from Shastri Nagar',
    },
    {
      title: 'Swiggy Late-Night Study Order',
      amount: 340,
      category: 'Food & Canteen',
      paymentMethod: 'UPI',
      date: day(2),
      note: 'Exam prep dinner',
    },
    {
      title: 'Financial Management Case Pack',
      amount: 420,
      category: 'Books & Study',
      paymentMethod: 'UPI',
      date: day(3),
      note: 'Photocopy & printed notes',
    },
    {
      title: 'Jio Prepaid Mobile Recharge',
      amount: 299,
      category: 'Bills & Recharge',
      paymentMethod: 'UPI',
      date: day(4),
      note: '28-day student data plan',
    },
    {
      title: 'Weekend Coffee & Movie',
      amount: 580,
      category: 'Outings & Fun',
      paymentMethod: 'UPI',
      date: day(5),
      note: 'PVR Meerut with friends',
    },
    {
      title: 'Evening Samosa & Cold Coffee',
      amount: 95,
      category: 'Food & Canteen',
      paymentMethod: 'UPI',
      date: day(6),
      note: 'Campus kiosk',
    },
  ];

  const starterBudgets: Array<{ category: ExpenseCategory; monthlyLimit: number }> = [
    { category: 'Food & Canteen', monthlyLimit: 2800 },
    { category: 'Travel & Commute', monthlyLimit: 1200 },
    { category: 'Outings & Fun', monthlyLimit: 1500 },
    { category: 'Bills & Recharge', monthlyLimit: 800 },
  ];

  try {
    const batch = writeBatch(db);
    for (const item of starterExpenses) {
      const id = makeDocId('exp');
      batch.set(doc(db, 'users', uid, 'expenses', id), {
        userId: uid,
        title: item.title,
        amount: item.amount,
        category: item.category,
        paymentMethod: item.paymentMethod,
        date: item.date,
        monthKey,
        note: item.note,
        isRecurringInstance: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const b of starterBudgets) {
      const id = `${monthKey}_${slugifyCategory(b.category)}`;
      batch.set(doc(db, 'users', uid, 'budgets', id), {
        userId: uid,
        category: b.category,
        monthKey,
        monthlyLimit: b.monthlyLimit,
        alertThresholdPct: 80,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const goalId = makeDocId('goal');
    batch.set(doc(db, 'users', uid, 'goals', goalId), {
      userId: uid,
      name: 'Semester Emergency Buffer',
      targetAmount: 5000,
      savedAmount: 1500,
      targetDate: `${Number(monthKey.slice(0, 4)) + 1}-03-31`,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const recId = makeDocId('rec');
    batch.set(doc(db, 'users', uid, 'recurring', recId), {
      userId: uid,
      title: 'Hostel Wi-Fi & Broadband Share',
      amount: 450,
      category: 'Bills & Recharge',
      paymentMethod: 'UPI',
      dayOfMonth: 5,
      lastAppliedMonth: '',
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function getExpensesCollection(uid: string) {
  return collection(db, 'users', uid, 'expenses');
}

export function getBudgetsCollection(uid: string) {
  return collection(db, 'users', uid, 'budgets');
}

export function getGoalsCollection(uid: string) {
  return collection(db, 'users', uid, 'goals');
}

export function getRecurringCollection(uid: string) {
  return collection(db, 'users', uid, 'recurring');
}

export function getReviewsCollection() {
  return collection(db, 'reviews');
}
