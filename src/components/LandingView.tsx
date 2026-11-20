import React, { useState } from 'react';
import {
  ArrowRight,
  Moon,
  Sun,
  TrendingUp,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { VerifiedReview, formatINR } from '../types/smartpocket';
import { ReviewsView } from './views/ReviewsView';

interface LandingViewProps {
  reviews: VerifiedReview[];
  reviewsLoading: boolean;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export function LandingView({
  reviews,
  reviewsLoading,
  onOpenAuth,
}: LandingViewProps) {
  const { isDark, toggleTheme } = useTheme();
  const [simAllowance, setSimAllowance] = useState(12000);
  const [simSavingsPct, setSimSavingsPct] = useState(20);

  const simSavings = Math.round((simAllowance * simSavingsPct) / 100);
  const simSpendable = simAllowance - simSavings;
  const simDailySafe = Math.floor(simSpendable / 30);
  const simFoodCap = Math.round(simSpendable * 0.4);
  const simTravelCap = Math.round(simSpendable * 0.18);
  const simOutingsCap = Math.round(simSpendable * 0.22);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Bar Contract: Brand — 4 Single-Line Nav Links — Action Zone */}
      <header className="sticky top-0 z-30 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0"
          >
            SmartPocket
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <a
              href="#features"
              className="hover:text-slate-900 dark:hover:text-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#automation"
              className="hover:text-slate-900 dark:hover:text-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Automation
            </a>
            <a
              href="#pricing"
              className="hover:text-slate-900 dark:hover:text-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Pricing
            </a>
            <a
              href="#reviews"
              className="hover:text-slate-900 dark:hover:text-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Reviews
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={isDark}
              className="p-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Log In
            </button>

            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Split */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 lg:pt-16 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Built for college students & young professionals across India
              </p>

              <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.12] [text-wrap:balance]">
                Make your monthly allowance last past the 30th.
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                SmartPocket replaces messy notebooks and forgotten UPI scans with instant expense logging, automated category caps, and clear daily Safe-to-Spend guidance.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-5 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  Log In to Workspace
                </button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>Free basic tier</span>
                <span aria-hidden="true">·</span>
                <span>30-day SmartPocket Plus trial</span>
                <span aria-hidden="true">·</span>
                <span>INR & UPI-first workflow</span>
              </div>
            </div>

            {/* Interactive Live Allowance Simulator */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                      Try the Daily Safe-to-Spend Engine
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Adjust your allowance to preview your automated monthly plan
                    </p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <label htmlFor="sim-allowance" className="font-medium text-slate-700 dark:text-slate-300">
                        Monthly Allowance
                      </label>
                      <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                        {formatINR(simAllowance)}
                      </span>
                    </div>
                    <input
                      id="sim-allowance"
                      type="range"
                      min={4000}
                      max={30000}
                      step={500}
                      value={simAllowance}
                      onChange={(e) => setSimAllowance(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <label htmlFor="sim-savings" className="font-medium text-slate-700 dark:text-slate-300">
                        Savings Goal ({simSavingsPct}%)
                      </label>
                      <span className="font-mono-num font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatINR(simSavings)} / month
                      </span>
                    </div>
                    <input
                      id="sim-savings"
                      type="range"
                      min={5}
                      max={40}
                      step={5}
                      value={simSavingsPct}
                      onChange={(e) => setSimSavingsPct(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your automated daily Safe-to-Spend limit
                  </p>
                  <p className="mt-1 text-3xl font-bold font-mono-num text-emerald-600 dark:text-emerald-400">
                    {formatINR(simDailySafe)}
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400"> / day</span>
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Food Cap</p>
                    <p className="mt-0.5 font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                      {formatINR(simFoodCap)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Commute</p>
                    <p className="mt-0.5 font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                      {formatINR(simTravelCap)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Outings</p>
                    <p className="mt-0.5 font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                      {formatINR(simOutingsCap)}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="mt-6 w-full py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Save this budget to your free account
              </button>
            </div>
          </div>

          {/* 4-Column Proof Strip Below Hero Split */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-2xl font-bold font-mono-num text-slate-900 dark:text-slate-50">
                &lt; 10 sec
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                To log a daily UPI, canteen, or auto spend with presets
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono-num text-slate-900 dark:text-slate-50">
                ₹0 / ₹99
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Free Basic plan with optional ₹99/mo SmartPocket Plus
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono-num text-slate-900 dark:text-slate-50">
                80% Alerts
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Automated reminders before you breach any category cap
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono-num text-slate-900 dark:text-slate-50">
                100% Verified
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Ratings restricted to email-verified SmartPocket accounts
              </p>
            </div>
          </div>
        </section>

        {/* Core Streamlined Experience & Automated Processes */}
        <section
          id="features"
          className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 [text-wrap:balance]">
                Designed around real student spending habits
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                No complex accounting charts or spreadsheet formulas — just the three workflows that keep monthly finances under control.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-mono-num text-emerald-700 dark:text-emerald-400 font-semibold">
                  01. Daily UPI & Cash Ledger
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Log expenses in two taps
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Record canteen meals, autos, online orders, and recharges with student quick-presets, live search, payment-mode filters, and one-click CSV export.
                </p>
              </div>

              <div id="automation" className="pt-5 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-mono-num text-emerald-700 dark:text-emerald-400 font-semibold">
                  02. Automated Saving Suggestions
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Spot UPI leaks before month-end
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  SmartPocket automatically detects frequent sub-₹200 UPI micro-spends, projects month-end burn, and recommends concrete category caps you can apply in one click.
                </p>
              </div>

              <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-mono-num text-emerald-700 dark:text-emerald-400 font-semibold">
                  03. Recurring Bills & Goals
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Automate fixed student costs
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Auto-post monthly hostel mess, Wi-Fi, and prepaid bills with a single click and sweep leftover allowance into tracked savings milestones.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Transparent Pricing */}
        <section id="pricing" className="border-t border-slate-200 dark:border-slate-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Simple pricing built for student budgets
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Start free forever or activate a 30-day early-access trial of SmartPocket Plus inside your dashboard.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    For daily expense starters
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-50">
                    Free Basic
                  </h3>
                  <p className="mt-3 text-3xl font-bold font-mono-num text-slate-900 dark:text-slate-50">
                    ₹0 <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ month</span>
                  </p>
                  <ul className="mt-5 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <li>Unlimited daily UPI, Cash, and Card expense tracking</li>
                    <li>Monthly allowance & Daily Safe-to-Spend calculator</li>
                    <li>Up to 3 active category caps & 2 recurring bill rules</li>
                    <li>Savings goals tracker & current-month CSV export</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="mt-6 w-full py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Start Free
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-emerald-600/60 dark:border-emerald-500/50 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    For committed monthly savers · 30-day free trial
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-50">
                    SmartPocket Plus
                  </h3>
                  <p className="mt-3 text-3xl font-bold font-mono-num text-slate-900 dark:text-slate-50">
                    ₹99 <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ month · ₹1,188/year</span>
                  </p>
                  <ul className="mt-5 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <li>Everything in Free Basic, with unlimited category caps</li>
                    <li>Real-time UPI micro-spend leak detection & smart caps</li>
                    <li>Unlimited automated recurring monthly student bills</li>
                    <li>Full multi-month ledger export & campus referral perks</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="mt-6 w-full py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                >
                  Try 30 Days Free
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Verified User Reviews & Ratings */}
        <section
          id="reviews"
          className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 py-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Verified User Reviews & Ratings
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Every rating below is published by a signed-in, email-verified SmartPocket user.
              </p>
            </div>

            <ReviewsView
              reviews={reviews}
              loading={reviewsLoading}
              onOpenAuth={onOpenAuth}
            />
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-slate-900 dark:text-slate-100">
              SmartPocket
            </span>
            <span aria-hidden="true">·</span>
            <span>Student Personal Finance · Meerut & Urban India</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-slate-100">
              Features
            </a>
            <a href="#pricing" className="hover:text-slate-900 dark:hover:text-slate-100">
              Pricing
            </a>
            <a href="#reviews" className="hover:text-slate-900 dark:hover:text-slate-100">
              Reviews
            </a>
            <button
              type="button"
              onClick={toggleTheme}
              className="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
