import React, { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import {
  SubscriptionPlan,
  UserProfile,
  WillingnessToPay,
} from '../../types/smartpocket';

interface PlansAutomationViewProps {
  profile: UserProfile;
  onChangePlan: (plan: SubscriptionPlan) => Promise<void>;
  onChangeWtp: (wtp: WillingnessToPay) => Promise<void>;
}

const COMPARISON_ROWS = [
  {
    feature: 'Daily UPI, Cash & Card Expense Logging',
    free: 'Unlimited entries',
    plus: 'Unlimited entries',
  },
  {
    feature: 'Monthly Allowance & Safe-to-Spend Tracker',
    free: 'Included',
    plus: 'Included',
  },
  {
    feature: 'Category Spending Caps & Reminders',
    free: 'Up to 3 active caps',
    plus: 'Unlimited caps & custom thresholds',
  },
  {
    feature: 'Automated Recurring Student Bills',
    free: 'Up to 2 recurring rules',
    plus: 'Unlimited auto-post rules',
  },
  {
    feature: 'Automated Saving Suggestions Engine',
    free: 'Weekly summary',
    plus: 'Real-time UPI leak detection',
  },
  {
    feature: 'Monthly Ledger CSV Export',
    free: 'Current month',
    plus: 'All historical months',
  },
];

export function PlansAutomationView({
  profile,
  onChangePlan,
  onChangeWtp,
}: PlansAutomationViewProps) {
  const [updatingPlan, setUpdatingPlan] = useState<SubscriptionPlan | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [savingWtp, setSavingWtp] = useState(false);

  const handlePlan = async (plan: SubscriptionPlan) => {
    setUpdatingPlan(plan);
    try {
      await onChangePlan(plan);
    } finally {
      setUpdatingPlan(null);
    }
  };

  const handleCopyReferral = async () => {
    const shareMsg = `Join me on SmartPocket to track daily UPI expenses & save from your monthly allowance. Use campus referral code: ${profile.referralCode}`;
    try {
      await navigator.clipboard.writeText(shareMsg);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      setCopiedCode(false);
    }
  };

  const handleWtp = async (wtp: WillingnessToPay) => {
    setSavingWtp(true);
    try {
      await onChangeWtp(wtp);
    } finally {
      setSavingWtp(false);
    }
  };

  const planLabel =
    profile.plan === 'plus'
      ? 'SmartPocket Plus (₹99/month)'
      : profile.plan === 'trial'
      ? '30-Day Early-Access Trial'
      : 'Free Basic Plan';

  return (
    <div className="space-y-6">
      {/* Active Subscription Banner */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Current Membership</p>
          <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-50">
            {planLabel}
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {profile.plan === 'trial'
              ? `Early-access trial activated on ${profile.trialStartedAt || 'today'}. Enjoy full SmartPocket Plus automation for 30 days.`
              : profile.plan === 'plus'
              ? 'All SmartPocket Plus automation, unlimited category rules, and UPI leak alerts are active.'
              : 'Start a 30-day early-access trial of SmartPocket Plus at ₹0 to test automated savings insights and unlimited rules.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {profile.plan === 'free' && (
            <button
              type="button"
              disabled={updatingPlan !== null}
              onClick={() => handlePlan('trial')}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {updatingPlan === 'trial' ? 'Activating...' : 'Start 30-Day Free Trial'}
            </button>
          )}
          {profile.plan !== 'plus' && (
            <button
              type="button"
              disabled={updatingPlan !== null}
              onClick={() => handlePlan('plus')}
              className="px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {updatingPlan === 'plus' ? 'Switching...' : 'Activate Plus (₹99/mo)'}
            </button>
          )}
          {profile.plan !== 'free' && (
            <button
              type="button"
              disabled={updatingPlan !== null}
              onClick={() => handlePlan('free')}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              Switch to Free Basic
            </button>
          )}
        </div>
      </section>

      {/* Plan Comparison Matrix */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Student-Friendly Plans
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Designed for college allowances — ₹0 Free Basic or ₹99/month (₹1,188/year) for SmartPocket Plus.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-3.5 px-5">Capability</th>
                <th className="py-3.5 px-5">For daily starters · Free (₹0/mo)</th>
                <th className="py-3.5 px-5 text-emerald-700 dark:text-emerald-400">
                  For committed savers · Plus (₹99/mo)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td className="py-3.5 px-5 font-medium text-slate-900 dark:text-slate-100">
                    {row.feature}
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400">{row.free}</td>
                  <td className="py-3.5 px-5 font-medium text-slate-900 dark:text-slate-100">
                    {row.plus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Automated Campus Referral & Early-Access Pricing Validation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Campus Referral Link
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Share with classmates in WhatsApp groups or campus clubs to invite friends to SmartPocket.
              </p>
            </div>
            <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          </div>

          <div className="flex items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your unique referral code</p>
              <p className="text-lg font-bold font-mono-num text-slate-900 dark:text-slate-50 tracking-wider mt-0.5">
                {profile.referralCode}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyReferral}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied Invite
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Invite
                </>
              )}
            </button>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Early-Access Pricing Feedback
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Would you subscribe to SmartPocket Plus at ₹99/month for automated saving alerts & unlimited budget rules?
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: 'yes', label: 'Yes, ₹99/mo works for me' },
                { value: 'maybe', label: 'Maybe at ₹49–₹79/mo' },
                { value: 'no', label: 'I prefer the Free plan' },
              ] as const
            ).map((opt) => {
              const active = profile.willingnessToPay99 === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={savingWtp}
                  onClick={() => handleWtp(opt.value)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {profile.willingnessToPay99 !== 'undecided' && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Thank you — your pricing preference has been recorded.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
