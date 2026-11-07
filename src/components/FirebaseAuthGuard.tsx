import React, { useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Lock, ArrowRight, Loader2, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface FirebaseAuthGuardProps {
  children: React.ReactNode;
  componentName: string;
  description?: string;
  onRedirectToAuth: (reason: string) => void;
  onBack?: () => void;
  mode?: 'screen' | 'inline' | 'modal';
}

export function FirebaseAuthGuard({
  children,
  componentName,
  description,
  onRedirectToAuth,
  onBack,
  mode = 'screen',
}: FirebaseAuthGuardProps) {
  const { isFirebaseAuthenticated, isFirebaseLoading } = useAuth();

  const redirectMessage = `🔒 Firebase Authentication Required: Access to ${componentName} requires a verified Firebase session.`;

  // Auto-redirect to AuthModal on initial mount if unauthenticated
  useEffect(() => {
    if (!isFirebaseLoading && !isFirebaseAuthenticated) {
      onRedirectToAuth(redirectMessage);
    }
  }, [isFirebaseLoading, isFirebaseAuthenticated, componentName]);

  if (isFirebaseLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] p-6 text-center">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
        </div>
        <p className="mt-4 text-xs font-mono text-cyan-300 tracking-wider uppercase">
          Verifying Firebase Session...
        </p>
      </div>
    );
  }

  if (!isFirebaseAuthenticated) {
    return (
      <div
        className={`relative overflow-hidden ${
          mode === 'modal'
            ? 'p-6 sm:p-8 text-center'
            : 'max-w-xl mx-auto my-8 p-6 sm:p-8 rounded-3xl bg-[#03091e]/90 border border-amber-500/30 shadow-[0_15px_45px_rgba(0,0,0,0.85)] text-center'
        }`}
      >
        {/* Ambient Amber & Cyan Glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Icon Emblem */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 via-red-500/15 to-cyan-500/20 border border-amber-400/40 p-1 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.25)]">
          <div className="w-full h-full rounded-[20px] bg-[#020617] flex items-center justify-center text-amber-400">
            <Lock className="w-9 h-9 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black shadow-md">
            !
          </div>
        </div>

        <div className="mt-5 space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[11px] font-mono font-bold tracking-wider uppercase">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Protected Route & Component</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {componentName} Locked
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            {description ||
              `Access to ${componentName} contains sensitive tools, telemetry, and settings that require a verified Firebase authentication session.`}
          </p>
        </div>

        {/* Security Invariants Box */}
        <div className="mt-6 p-3.5 rounded-2xl bg-black/40 border border-cyan-500/20 text-left max-w-md mx-auto space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Firebase Security Check</span>
          </div>
          <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
            <li>Zero-trust attribute-based access control (ABAC)</li>
            <li>Real-time token validation with Firebase Authentication</li>
            <li>Prevents unauthenticated writes and settings leakage</li>
          </ul>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
          <button
            onClick={() => onRedirectToAuth(redirectMessage)}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Sign In with Firebase</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              Return to Chat
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
