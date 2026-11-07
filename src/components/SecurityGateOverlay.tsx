import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Delete,
  RotateCcw,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

interface SecurityGateOverlayProps {
  onUnlock: () => void;
  defaultPasskey?: string;
}

export const MASTER_PASSKEY_DEFAULT = '2141';

export function SecurityGateOverlay({ onUnlock, defaultPasskey = MASTER_PASSKEY_DEFAULT }: SecurityGateOverlayProps) {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const triggerShakeError = (message: string) => {
    setError(message);
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 550);
  };

  const handleValidatePasskey = (candidate: string) => {
    const cleanCandidate = candidate.trim();
    if (cleanCandidate === defaultPasskey || cleanCandidate === MASTER_PASSKEY_DEFAULT) {
      setError(null);
      setIsSuccess(true);
      try {
        localStorage.setItem('gkedit_session_active', 'true');
      } catch (e) {
        console.warn('Could not save session to localStorage', e);
      }
      setTimeout(() => {
        onUnlock();
      }, 400);
      return true;
    } else {
      triggerShakeError('Access Denied: Invalid Passkey');
      setPin('');
      return false;
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      triggerShakeError('Please enter passkey');
      return;
    }
    handleValidatePasskey(pin);
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length >= 6) return;
    setError(null);
    const nextPin = pin + digit;
    setPin(nextPin);

    // Auto-check if matches standard 4-digit master passkey
    if (nextPin.length === 4 && (nextPin === defaultPasskey || nextPin === MASTER_PASSKEY_DEFAULT)) {
      handleValidatePasskey(nextPin);
    }
  };

  const handleBackspace = () => {
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError(null);
    setPin('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="GKEDIT AI Security Gate Lock Screen"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0f1d]/95 backdrop-blur-2xl transition-all select-none"
    >
      {/* Background Ambient Glow Accents (Cyan & Gold) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-[110px]" />
      </div>

      {/* Security Gate Card */}
      <div
        className={`relative w-full max-w-sm sm:max-w-md rounded-3xl p-6 sm:p-8 bg-[#0a0f1d]/90 border border-cyan-400/30 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(6,182,212,0.15)] text-center space-y-6 ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Top Glowing Security Emblem */}
        <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-slate-900 to-amber-500/20 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.35)]">
          {isSuccess ? (
            <Unlock className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 animate-bounce" />
          ) : (
            <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
          )}
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shadow-[0_0_10px_#f59e0b]">
            <Sparkles className="w-2.5 h-2.5 text-slate-950" />
          </div>
        </div>

        {/* Header Titles */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-[10px] font-mono uppercase tracking-widest text-cyan-300">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>Biometric & Passkey Barrier</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            GKEDIT AI - Security Gate
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Enter passkey to access system
          </p>
        </div>

        {/* PIN Input & Dots Visualizer */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Masked input field for physical keyboards and screen readers */}
          <div className="relative">
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setError(null);
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPin(val);
                if (val.length === 4 && (val === defaultPasskey || val === MASTER_PASSKEY_DEFAULT)) {
                  handleValidatePasskey(val);
                }
              }}
              placeholder="••••"
              aria-label="Enter 4-to-6 digit PIN"
              className="w-full text-center tracking-[0.6em] text-2xl font-black py-3 px-4 rounded-2xl bg-[#030816]/90 border border-cyan-400/40 text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/30 transition shadow-inner"
            />
          </div>

          {/* Centered 4-to-6 Digit Masked Indicator Dots */}
          <div className="flex items-center justify-center gap-2.5 py-1">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const isFilled = index < pin.length;
              return (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    isFilled
                      ? 'bg-gradient-to-tr from-cyan-400 to-amber-300 scale-110 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                      : index < 4
                      ? 'bg-slate-800 border border-cyan-500/20'
                      : 'bg-slate-900/60 border border-slate-700/30 opacity-60'
                  }`}
                />
              );
            })}
          </div>

          {/* Error Alert Container */}
          {error && (
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center justify-center gap-2 animate-in fade-in shadow-[0_0_15px_rgba(239,68,68,0.25)]">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* On-screen Keypad for Touch / Mouse Interactions */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-2 max-w-[260px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-11 rounded-2xl bg-white/[0.04] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/40 text-white font-bold text-base transition active:scale-95 cursor-pointer shadow-sm"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-2xl bg-white/[0.03] hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
              title="Clear PIN"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-11 rounded-2xl bg-white/[0.04] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/40 text-white font-bold text-base transition active:scale-95 cursor-pointer shadow-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 rounded-2xl bg-white/[0.03] hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
              title="Backspace"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          {/* Unlock Button */}
          <button
            type="submit"
            className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-amber-400 hover:from-cyan-300 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.45)] transition transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Passkey Verified</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-slate-950" />
                <span>Unlock System</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Hint */}
        <p className="text-[11px] text-slate-500 font-mono">
          Default Master Key: <span className="text-cyan-400 font-bold">2141</span> • Protected Session
        </p>
      </div>
    </div>
  );
}
