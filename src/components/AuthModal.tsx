import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SCHEMA_LIMITS, USER_PERSONAS, UserPersona } from '../types/smartpocket';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  onClose: () => void;
}

export function AuthModal({ isOpen, initialMode, onClose }: AuthModalProps) {
  const { signInWithGoogle, authError, clearAuthError } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [persona, setPersona] = useState<UserPersona>('College Student');
  const [campusOrCity, setCampusOrCity] = useState('Meerut, India');
  const [monthlyAllowance, setMonthlyAllowance] = useState('10000');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    clearAuthError();
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const parsedAllowance = Math.max(0, Math.min(SCHEMA_LIMITS.AMOUNT_MAX, Number(monthlyAllowance) || 10000));
    const draft =
      mode === 'signup'
        ? {
            displayName: displayName.trim().slice(0, SCHEMA_LIMITS.DISPLAY_NAME_MAX) || undefined,
            persona,
            campusOrCity: campusOrCity.trim().slice(0, SCHEMA_LIMITS.CAMPUS_MAX) || 'Meerut, India',
            monthlyAllowance: parsedAllowance,
          }
        : undefined;

    const ok = await signInWithGoogle(draft);
    setSubmitting(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2
              id="auth-modal-title"
              className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight"
            >
              {mode === 'login' ? 'Log in to SmartPocket' : 'Create your SmartPocket account'}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {mode === 'login'
                ? 'Sync your monthly allowance, UPI expenses, and savings goals.'
                : 'Personalize your monthly allowance and start tracking in under 30 seconds.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              clearAuthError();
            }}
            className={`py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              clearAuthError();
            }}
            className={`py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'signup'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleContinue} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Your Name (optional — defaults to Google profile)
                </label>
                <input
                  id="signup-name"
                  type="text"
                  maxLength={SCHEMA_LIMITS.DISPLAY_NAME_MAX}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="signup-persona"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Role
                  </label>
                  <select
                    id="signup-persona"
                    value={persona}
                    onChange={(e) => setPersona(e.target.value as UserPersona)}
                    className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {USER_PERSONAS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="signup-allowance"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Monthly Allowance (₹)
                  </label>
                  <input
                    id="signup-allowance"
                    type="number"
                    min={0}
                    max={SCHEMA_LIMITS.AMOUNT_MAX}
                    step={500}
                    value={monthlyAllowance}
                    onChange={(e) => setMonthlyAllowance(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono-num bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-campus"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  College / University or City
                </label>
                <input
                  id="signup-campus"
                  type="text"
                  maxLength={SCHEMA_LIMITS.CAMPUS_MAX}
                  value={campusOrCity}
                  onChange={(e) => setCampusOrCity(e.target.value)}
                  placeholder="e.g. DBS Global University, Meerut"
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </>
          )}

          {authError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300"
            >
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <span>
              {submitting
                ? 'Connecting to Google...'
                : mode === 'login'
                ? 'Log In with Google'
                : 'Sign Up with Google'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Google sign-in verifies your email automatically, securing your private financial ledger and unlocking verified user reviews.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
