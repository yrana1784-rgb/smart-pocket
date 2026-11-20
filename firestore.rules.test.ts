/**
 * SmartPocket Firestore Security Rules Specification Tests (Dirty Dozen)
 * Validates every adversarial payload against the Eight Pillars invariants.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
  enforcedByRule: string;
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on User Create',
    collectionPath: '/users/victim_uid',
    operation: 'create',
    auth: { uid: 'attacker_uid', email_verified: true },
    payload: { uid: 'victim_uid', displayName: 'Spoof' },
    expected: 'PERMISSION_DENIED',
    enforcedByRule: 'userId == request.auth.uid && isValidUserProfile(incoming())',
  },
  {
    id: 2,
    name: 'Shadow Field Injection (Ghost Field isAdmin)',
    collectionPath: '/users/attacker_uid',
    operation: 'update',
    auth: { uid: 'attacker_uid', email_verified: true },
    payload: { displayName: 'Valid', isAdmin: true },
    expected: 'PERMISSION_DENIED',
    enforcedByRule: 'data.keys().hasOnly([...]) && affectedKeys().hasOnly([...])',
  },
  {
    id: 3,
    name: 'PII Blanket Read Attack on /users',
    collectionPath: '/users/victim_uid',
    operation: 'get',
    auth: { uid: 'attacker_uid', email_verified: true },
    expected: 'PERMISSION_DENIED',
    enforcedByRule: 'allow get: if isVerifiedOwner(userId); allow list: if false;',
  },
  {
    id: 4,
    name: 'Unverified Email Review Submission',
    collectionPath: '/reviews/unverified_uid',
    operation: 'create',
    auth: { uid: 'unverified_uid', email_verified: false },
    payload: {
      userId: 'unverified_uid',
      rating: 5,
      title: 'Great app',
      comment: 'Trying to bypass verified review gate.',
      verifiedEmail: true,
      isPublished: true,
    },
    expected: 'PERMISSION_DENIED',
    enforcedByRule: 'isVerifiedUser() requires request.auth.token.email_verified == true',
  },
  {
    id: 5,
    name: 'Cross-User Expense Owner Spoofing',
    collectionPath: '/users/attacker_uid/expenses/exp_001',
    operation: 'create',
    auth: { uid: 'attacker_uid', email_verified: true },
    payload: { userId: 'victim_uid', title: 'Tea', amount: 20 },
    expected: 'PERMISSION_DENIED',
    enforcedByRule: 'isValidExpense(incoming(), userId) requires data.userId == request.auth.uid',
  },
  {
    id: 6,
    name: 'Orphaned Subcollection Write Without Parent Profile',
    collectionPath: '/users/orphan_uid/expenses/exp_001',
    operation: 'create',
    auth: { uid: 'orphan_uid', email_verified: true },
    payload: { userId: 'orphan_uid', title: 'Canteen', amount: 80 },
    expected: 'PERMISSION_DENIED',
    enforcedByRule: 'parentUserExists(userId) Master Gate',
  },
  {
    id: 7,
    name: 'Document ID Poisoning (>128 chars or invalid chars)',
    collectionPath: `/users/attacker_uid/expenses/${'a'.repeat(200)}`,
    operation: 'create',
    auth: { uid: 'attacker_uid', email_verified: true },
    payload: { userId: 'attacker_uid', title: 'Snack', amount: 30 },
    expected: 'PERMISSION_DENIED',
    enforcedByRule: 'isValidId(expenseId) regex and <= 128 size guard',
  },
  {
    id: 8,
    name: 'Negative or Out-of-Range Expense Amount',
    collectionPath: '/users/attacker_uid/expenses/exp_neg',
    operation: 'create',
    auth: { uid: 'attacker_uid', email_verified: true },
    payload: { userId: 'attacker_uid', title: 'Hack', amount: -500 },
    expected: 'PERMISSION_DENIED',
    enforcedByRule: 'data.amount is number && data.amount > 0 && data.amount <= 10000000',
  },
  {
    id: 9,
    name: 'Client Timestamp Backdating',
    collectionPath: '/users/attacker_uid/expenses/exp_old',
    operation: 'create',
    auth: { uid: 'attacker_uid', email_verified: true },
    payload: { createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
    enforcedByRule: 'incoming().createdAt == request.time && incoming().updatedAt == request.time',
  },
  {
    id: 10,
    name: 'Terminal State Mutation on Completed Savings Goal',
    collectionPath: '/users/owner_uid/goals/goal_done',
    operation: 'update',
    auth: { uid: 'owner_uid', email_verified: true },
    payload: { status: 'active', savedAmount: 0 },
    expected: 'PERMISSION_DENIED',
    enforcedByRule: 'existing().status != "completed" terminal lock',
  },
  {
    id: 11,
    name: 'Review Impersonation & Out-of-Bounds Rating',
    collectionPath: '/reviews/victim_uid',
    operation: 'create',
    auth: { uid: 'attacker_uid', email_verified: true },
    payload: { userId: 'attacker_uid', rating: 6, verifiedEmail: false },
    expected: 'PERMISSION_DENIED',
    enforcedByRule: 'reviewId == request.auth.uid && data.rating is int && data.rating >= 1 && data.rating <= 5',
  },
  {
    id: 12,
    name: 'Value Poisoning on Whitelisted Update Field',
    collectionPath: '/reviews/owner_uid',
    operation: 'update',
    auth: { uid: 'owner_uid', email_verified: true },
    payload: { title: 'x'.repeat(2000) },
    expected: 'PERMISSION_DENIED',
    enforcedByRule: 'isValidReview(incoming()) enforces data.title.size() <= 100 on every update',
  },
];
