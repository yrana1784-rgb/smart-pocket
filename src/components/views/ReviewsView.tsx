import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ShieldCheck, Star, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  SCHEMA_LIMITS,
  VerifiedReview,
} from '../../types/smartpocket';

interface ReviewsViewProps {
  reviews: VerifiedReview[];
  loading: boolean;
  onSubmitReview?: (input: {
    authorName: string;
    authorRole: string;
    rating: number;
    title: string;
    comment: string;
  }) => Promise<void>;
  onDeleteReview?: () => Promise<void>;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
}

export function ReviewsView({
  reviews,
  loading,
  onSubmitReview,
  onDeleteReview,
  onOpenAuth,
}: ReviewsViewProps) {
  const { user, profile } = useAuth();
  const isVerified = Boolean(user && user.emailVerified);
  const myReview = useMemo(
    () => (user ? reviews.find((r) => r.userId === user.uid) || null : null),
    [reviews, user]
  );

  const [starFilter, setStarFilter] = useState<number | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'highest'>('recent');

  // Review Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorRole, setAuthorRole] = useState('');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setAuthorRole(myReview.authorRole);
      setTitle(myReview.title);
      setComment(myReview.comment);
    } else if (profile) {
      setAuthorRole(`${profile.persona} · ${profile.campusOrCity || 'India'}`);
    }
  }, [myReview, profile]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const counts = [0, 0, 0, 0, 0, 0];
    let sum = 0;
    for (const r of reviews) {
      const clamped = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[clamped] += 1;
      sum += clamped;
    }
    const avg = total > 0 ? sum / total : 0;
    return { total, counts, avg };
  }, [reviews]);

  const visibleReviews = useMemo(() => {
    const list =
      starFilter === 'ALL' ? [...reviews] : reviews.filter((r) => r.rating === starFilter);
    if (sortBy === 'highest') {
      list.sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [reviews, starFilter, sortBy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmitReview || !user || !isVerified) return;
    setFormError(null);

    const t = title.trim();
    const c = comment.trim();
    if (t.length < SCHEMA_LIMITS.REVIEW_TITLE_MIN) {
      setFormError(`Headline must be at least ${SCHEMA_LIMITS.REVIEW_TITLE_MIN} characters.`);
      return;
    }
    if (c.length < SCHEMA_LIMITS.REVIEW_COMMENT_MIN) {
      setFormError(`Review must be at least ${SCHEMA_LIMITS.REVIEW_COMMENT_MIN} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitReview({
        authorName: profile?.displayName || user.displayName || 'Verified Student',
        authorRole:
          authorRole.trim().slice(0, SCHEMA_LIMITS.AUTHOR_ROLE_MAX) ||
          `${profile?.persona || 'Student'} · India`,
        rating,
        title: t.slice(0, SCHEMA_LIMITS.REVIEW_TITLE_MAX),
        comment: c.slice(0, SCHEMA_LIMITS.REVIEW_COMMENT_MAX),
      });
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    } catch {
      setFormError('Could not publish your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteReview) return;
    setDeleting(true);
    try {
      await onDeleteReview();
      setTitle('');
      setComment('');
      setRating(5);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Aggregate Rating Summary & Star Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Verified User Rating
            </p>
            <div className="mt-2 flex items-baseline gap-2.5">
              <span className="text-4xl font-bold font-mono-num text-slate-900 dark:text-slate-50">
                {stats.total > 0 ? stats.avg.toFixed(1) : '—'}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">out of 5.0</span>
            </div>
            <div className="mt-2 flex items-center gap-1" aria-label={`Average rating ${stats.avg.toFixed(1)} out of 5`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(stats.avg)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Based on <strong className="font-mono-num">{stats.total}</strong> verified SmartPocket user{stats.total === 1 ? '' : 's'}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Only authenticated users with a verified email can publish or update a rating.
            </span>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.counts[star] || 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStarFilter(starFilter === star ? 'ALL' : star)}
                  className="w-full flex items-center gap-3 text-xs group cursor-pointer"
                >
                  <span className="w-10 text-left font-mono-num font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {star} star
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-14 text-right font-mono-num text-slate-500 dark:text-slate-400">
                    {count} ({pct}%)
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filter & Sort Controls */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
              {(['ALL', 5, 4, 3, 2, 1] as const).map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setStarFilter(val)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    starFilter === val
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {val === 'ALL' ? 'All Ratings' : `${val}★`}
                </button>
              ))}
            </div>

            <select
              aria-label="Sort reviews"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'highest')}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Verified User Review Composer (or Sign-In Gate) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6">
        {isVerified && onSubmitReview ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {myReview ? 'Update Your Verified Review' : 'Write a Verified Review'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Posting as{' '}
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {profile?.displayName || user?.displayName}
                  </span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Verified Account
                  </span>
                </p>
              </div>
              {myReview && onDeleteReview && (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting ? 'Removing...' : 'Delete Review'}
                </button>
              )}
            </div>

            {/* Interactive Star Rating Selector */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Select star rating">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= (hoverRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={rating === star}
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1.5 rounded-md focus-visible:outline-2 focus-visible:outline-emerald-600 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          active
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {rating} / 5 stars selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="review-title" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Review Headline
                </label>
                <input
                  id="review-title"
                  type="text"
                  required
                  minLength={SCHEMA_LIMITS.REVIEW_TITLE_MIN}
                  maxLength={SCHEMA_LIMITS.REVIEW_TITLE_MAX}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Finally stopped running out of allowance before the 25th"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label htmlFor="review-role" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Your Role & Campus / City
                </label>
                <input
                  id="review-role"
                  type="text"
                  required
                  maxLength={SCHEMA_LIMITS.AUTHOR_ROLE_MAX}
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  placeholder="e.g. MBA Student · Meerut"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="review-comment" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Your Experience
                </label>
                <span className="text-xs font-mono-num text-slate-400">
                  {comment.length}/{SCHEMA_LIMITS.REVIEW_COMMENT_MAX}
                </span>
              </div>
              <textarea
                id="review-comment"
                rows={3}
                required
                minLength={SCHEMA_LIMITS.REVIEW_COMMENT_MIN}
                maxLength={SCHEMA_LIMITS.REVIEW_COMMENT_MAX}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share how SmartPocket helped you track UPI spending, follow monthly budgets, or save money..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {formError && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                {formError}
              </p>
            )}

            <div className="flex items-center justify-between gap-3">
              {savedBanner ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Your verified review is live.
                </span>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Your email address is never displayed publicly.
                </span>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                {submitting
                  ? 'Publishing...'
                  : myReview
                  ? 'Update Review'
                  : 'Publish Verified Review'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Using SmartPocket? Share a verified review
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Sign in with your verified Google account to rate SmartPocket and help other students decide.
              </p>
            </div>
            {onOpenAuth && (
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Published Verified Reviews Feed */}
      <section className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : visibleReviews.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {reviews.length === 0
                ? 'Be the first verified user to rate SmartPocket'
                : `No ${starFilter}-star reviews yet`}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {reviews.length === 0
                ? 'Verified user ratings appear here immediately once published.'
                : 'Try selecting All Ratings to view every verified review.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleReviews.map((rev) => {
              const dateLabel = rev.createdAt
                ? rev.createdAt.toDate().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Just now';

              return (
                <article
                  key={rev.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-0.5" aria-label={`${rev.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified User
                      </span>
                    </div>

                    <h4 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
                      {rev.title}
                    </h4>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {rev.authorName}
                      </span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>{rev.authorRole}</span>
                    </div>
                    <span className="font-mono-num">{dateLabel}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
