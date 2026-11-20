import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { ensureUserProfile } from '../lib/firestoreService';
import { SignupDraft, UserProfile } from '../types/smartpocket';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  authReady: boolean;
  profileLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: (signupDraft?: SignupDraft) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const pendingDraftRef = useRef<SignupDraft | undefined>(undefined);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setProfileLoading(false);
        setAuthReady(true);
        return;
      }

      setProfileLoading(true);
      try {
        const draft = pendingDraftRef.current;
        pendingDraftRef.current = undefined;
        await ensureUserProfile(firebaseUser, draft);

        const profilePath = `users/${firebaseUser.uid}`;
        unsubProfile = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snap) => {
            if (snap.exists()) {
              setProfile(snap.data() as UserProfile);
            }
            setProfileLoading(false);
            setAuthReady(true);
          },
          (error) => {
            setProfileLoading(false);
            setAuthReady(true);
            handleFirestoreError(error, OperationType.GET, profilePath);
          }
        );
      } catch (err) {
        console.error('Failed to initialize user profile:', err);
        setAuthError(
          'Could not load your SmartPocket profile. Please check your connection and try again.'
        );
        setProfileLoading(false);
        setAuthReady(true);
      }
    });

    return () => {
      if (unsubProfile) unsubProfile();
      unsubAuth();
    };
  }, []);

  const signInWithGoogle = async (signupDraft?: SignupDraft): Promise<boolean> => {
    setAuthError(null);
    pendingDraftRef.current = signupDraft;
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (err: unknown) {
      pendingDraftRef.current = undefined;
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in window was closed before completing.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Please allow pop-ups in your browser to sign in with Google.');
      } else {
        setAuthError('Unable to complete Google sign-in right now. Please try again.');
      }
      return false;
    }
  };

  const logout = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        authReady,
        profileLoading,
        authError,
        clearAuthError: () => setAuthError(null),
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
