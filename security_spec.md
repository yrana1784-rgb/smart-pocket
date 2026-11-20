# SmartPocket Security Specification (Phase 0 — Payload-First Security TDD)

## 1. Data Invariants

1. **PII Isolation (`/users/{userId}`)**: A user profile contains private email PII. Only the authenticated, email-verified owner (`request.auth.uid == userId`) can `get`, `create`, or `update` their own profile. Collection-level `list` and `delete` are denied.
2. **Master Gate Ownership (Subcollections)**: Every `Expense`, `CategoryBudget`, `SavingsGoal`, and `RecurringBill` under `/users/{userId}/...` can only be accessed by `userId == request.auth.uid`, and single-document operations (`get`, `create`, `update`, `delete`) verify that the parent `/users/{userId}` document exists. List queries strictly enforce `resource.data.userId == request.auth.uid` without `get()`/`exists()` calls.
3. **Verified User Review Integrity (`/reviews/{reviewId}`)**: Only email-verified users (`request.auth.token.email_verified == true`) with an existing SmartPocket profile can create a review, strictly keyed by `reviewId == request.auth.uid`. Public reads only return documents with `isPublished == true` and contain zero PII.
4. **Terminal State Locking (`SavingsGoal`)**: Once a savings goal reaches `status == 'completed'`, no further updates are permitted.
5. **Temporal Integrity & Immutability**: `createdAt` must equal `request.time` on create and remain immutable on update. `updatedAt` must equal `request.time` on both create and update. `uid`/`userId` is immutable on update.
6. **Strict Schema & Bounds**: Every string has explicit `.size()` bounds, every enum matches `firebase-blueprint.json`, every document ID matches `^[a-zA-Z0-9_\-]+$` (<= 128 chars), and shadow/ghost fields are blocked via `hasOnly()`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)

1. **Identity Spoofing on User Create**: Creating `/users/victim_uid` while signed in as `attacker_uid`.
2. **Shadow Field Injection on User Profile**: Adding ghost field `{ "isAdmin": true }` during profile create or update.
3. **PII Blanket Read Attack**: Signed-in user `attacker_uid` calling `get('/users/victim_uid')` or `list('/users')`.
4. **Unverified Email Write**: Creating an expense or review when `request.auth.token.email_verified == false`.
5. **Cross-User Subcollection Spoofing**: Creating `/users/attacker_uid/expenses/exp1` with `userId: "victim_uid"`.
6. **Orphaned Subcollection Write**: Creating `/users/new_uid/expenses/exp1` before `/users/new_uid` exists.
7. **ID Poisoning Attack**: Creating a document with a 300-character or special-character document ID (`../../etc/passwd`).
8. **Invalid Amount / Negative Expense**: Logging an expense with `amount: -500` or `amount: 999999999`.
9. **Timestamp Backdating**: Submitting a client-forged `createdAt` timestamp instead of `serverTimestamp()` (`request.time`).
10. **Terminal State Mutation**: Updating a `SavingsGoal` whose existing `status` is already `'completed'`.
11. **Review Impersonation & Out-of-Range Rating**: Creating `/reviews/other_uid` or submitting `rating: 6` or `verifiedEmail: false`.
12. **Value Poisoning on Update**: Updating allowed field `title` on a review or expense with a 2,000-character string or non-string boolean.
