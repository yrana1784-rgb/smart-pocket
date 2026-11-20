import React, { useEffect, useState } from 'react';
import { onSnapshot, query, where } from 'firebase/firestore';
import { AuthModal } from './components/AuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingView } from './components/LandingView';
import { WorkspaceShell } from './components/WorkspaceShell';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { OperationType, handleFirestoreError } from './lib/firebase';
import { getReviewsCollection } from './lib/firestoreService';
import { VerifiedReview } from './types/smartpocket';

function SmartPocketApp() {
  const { user, profile, authReady, profileLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [reviews, setReviews] = useState<VerifiedReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    const q = query(getReviewsCollection(), where('isPublished', '==', true));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: VerifiedReview[] = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<VerifiedReview, 'id'>),
          }))
          .sort((a, b) => {
            const ta = a.createdAt ? a.createdAt.toMillis() : Date.now();
            const tb = b.createdAt ? b.createdAt.toMillis() : Date.now();
            return tb - ta;
          });
        setReviews(list);
        setReviewsLoading(false);
      },
      (err) => {
        setReviewsLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'reviews');
      }
    );

    return () => unsub();
  }, []);

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  if (!authReady || (user && profileLoading && !profile)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
            SmartPocket
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Preparing your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {user && profile ? (
        <WorkspaceShell reviews={reviews} reviewsLoading={reviewsLoading} />
      ) : (
        <LandingView
          reviews={reviews}
          reviewsLoading={reviewsLoading}
          onOpenAuth={openAuth}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SmartPocketApp />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
