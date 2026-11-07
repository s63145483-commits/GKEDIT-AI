import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, AlertCircle, Sparkles, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectReason?: string | null;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, redirectReason: propRedirectReason, onSuccess }: AuthModalProps) {
  const { login, register, continueAsGuest, signInWithGoogle, authRedirectReason, isFirebaseAuthenticated } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('adaptive');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const activeRedirectReason = propRedirectReason || authRedirectReason;

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      setError(err.message || 'Firebase Google authentication failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password, preferredLanguage);
      } else {
        await login(email, password);
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setError(null);
    setLoading(true);
    try {
      await continueAsGuest();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Guest session initialization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 liquid-glass-modal-backdrop animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl liquid-glass-modal-container p-6 overflow-hidden">
        <div className="liquid-glass-modal-glare" />
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-600 to-amber-500 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <div className="w-full h-full bg-[#020617] rounded-[10px] flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {isRegister ? 'Create GKEDIT AI Account' : 'Firebase Authentication'}
              </h2>
              <p className="text-[11px] text-cyan-300 font-mono">
                Secure Session & Role Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Protected Route Redirect Notice Banner */}
        {activeRedirectReason && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-amber-300">Protected Route Access Required</p>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">{activeRedirectReason}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-red-950/50 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Recommended: Firebase Google Sign-In */}
        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all transform active:scale-95 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#ffffff"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#ffffff"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#ffffff"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#ffffff"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {googleLoading
                ? 'Authenticating with Google...'
                : isFirebaseAuthenticated
                ? 'Verified with Firebase (Switch Google Account)'
                : 'Sign in with Google (Firebase)'}
            </span>
          </button>

          <div className="flex items-center gap-3 my-2 text-[11px] text-slate-500">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="uppercase tracking-wider font-mono">Or use email credentials</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-[#020617] border border-cyan-500/30 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-cyan-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#020617] border border-cyan-500/30 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-cyan-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#020617] border border-cyan-500/30 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Preferred Language</label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full bg-[#020617] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="adaptive">Adaptive (Auto Telugu/English)</option>
                <option value="telugu">Telugu (తెలుగు)</option>
                <option value="tanglish">Tanglish (Telugu in English Script)</option>
                <option value="english">English</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-cyan-500/30 hover:border-cyan-400 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Processing...' : isRegister ? 'Create Account & Sign In' : 'Sign In with Password'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-cyan-500/20 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleGuest}
            disabled={loading || googleLoading}
            className="w-full py-2 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-400 hover:text-white transition cursor-pointer"
          >
            Continue as Guest (Public features only)
          </button>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-cyan-400 hover:underline font-semibold cursor-pointer"
            >
              {isRegister ? 'Sign In instead' : 'Register now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
