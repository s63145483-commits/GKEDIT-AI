import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/index.ts';
import { api, authStorage } from '../services/api.ts';
import {
  auth as firebaseAuth,
  onAuthStateChanged,
  FirebaseUser,
  signInWithGoogleFirebase,
  signOutFirebase,
} from '../services/firebase.ts';
import { trackUserAuthentication } from '../services/userTrackingService.ts';
import { isCreatorAdmin } from '../services/adminAuth.ts';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  // Firebase Auth State
  firebaseUser: FirebaseUser | null;
  isFirebaseLoading: boolean;
  isFirebaseAuthenticated: boolean;
  isAdmin: boolean;
  // Auth Redirect Guard
  authRedirectReason: string | null;
  setAuthRedirectReason: (reason: string | null) => void;
  // Methods
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, preferredLanguage?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(authStorage.getToken());
  const [loading, setLoading] = useState(true);

  // Firebase Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(firebaseAuth.currentUser);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);
  const [authRedirectReason, setAuthRedirectReason] = useState<string | null>(null);

  // 1. Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      setFirebaseUser(fbUser);
      setIsFirebaseLoading(false);

      if (fbUser) {
        try {
          // Automatic User Tracking on Authentication (Firestore users/{userId})
          trackUserAuthentication(fbUser).catch((trackErr) => {
            console.warn('Automatic user tracking note:', trackErr);
          });

          // Sync Firebase authenticated user into app session
          const res = await api.syncFirebaseUser({
            uid: fbUser.uid,
            email: fbUser.email || undefined,
            name: fbUser.displayName || undefined,
            avatar: fbUser.photoURL || undefined,
          });
          authStorage.setToken(res.token);
          setToken(res.token);
          setUser(res.user);
        } catch (err) {
          console.error('Failed to sync Firebase user to app session:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Initialize application session
  useEffect(() => {
    async function initAuth() {
      const storedToken = authStorage.getToken();
      if (!storedToken) {
        // Start with a clean guest session created on the server
        try {
          const res = await api.guestLogin();
          authStorage.setToken(res.token);
          setToken(res.token);
          setUser(res.user);
        } catch (err) {
          console.error('Failed to initialize session:', err);
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        const res = await api.getMe();
        setUser(res.user);
      } catch (err) {
        // Token expired, acquire fresh guest session
        try {
          const res = await api.guestLogin();
          authStorage.setToken(res.token);
          setToken(res.token);
          setUser(res.user);
        } catch {
          authStorage.removeToken();
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    authStorage.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setAuthRedirectReason(null);
  };

  const register = async (name: string, email: string, password: string, preferredLanguage = 'adaptive') => {
    const res = await api.register({ name, email, password, preferredLanguage });
    authStorage.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setAuthRedirectReason(null);
  };

  const signInWithGoogle = async () => {
    try {
      const fbUser = await signInWithGoogleFirebase();
      setFirebaseUser(fbUser);
      trackUserAuthentication(fbUser).catch((trackErr) => {
        console.warn('Google sign-in user tracking note:', trackErr);
      });
      const res = await api.syncFirebaseUser({
        uid: fbUser.uid,
        email: fbUser.email || undefined,
        name: fbUser.displayName || undefined,
        avatar: fbUser.photoURL || undefined,
      });
      authStorage.setToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setAuthRedirectReason(null);
    } catch (err) {
      console.error('Firebase Google sign-in failed:', err);
      throw err;
    }
  };

  const continueAsGuest = async () => {
    const res = await api.guestLogin();
    authStorage.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await signOutFirebase();
    } catch (e) {
      console.warn('Firebase signout note:', e);
    }
    authStorage.removeToken();
    setToken(null);
    setUser(null);
    setFirebaseUser(null);
    setAuthRedirectReason(null);
  };

  const isAdmin = isCreatorAdmin(firebaseUser?.email || user?.email) || user?.role === 'creator';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        firebaseUser,
        isFirebaseLoading,
        isFirebaseAuthenticated: !!firebaseUser,
        isAdmin,
        authRedirectReason,
        setAuthRedirectReason,
        login,
        register,
        signInWithGoogle,
        continueAsGuest,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
