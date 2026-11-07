import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, ShieldCheck, Lock, Unlock, Key, X, Terminal, Radio } from 'lucide-react';

interface CyberRadarUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
}

export function CyberRadarUnlockModal({ isOpen, onClose, onUnlockSuccess }: CyberRadarUnlockModalProps) {
  const [pinInput, setPinInput] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMessage(null);
      setErrorShake(false);
      setIsUnlocked(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = (codeToVerify?: string) => {
    const candidate = (codeToVerify ?? pinInput).trim().toUpperCase();
    if (candidate === 'GKEDIT') {
      setIsUnlocked(true);
      setErrorMessage(null);
      sessionStorage.setItem('gkedit_cyber_radar_unlocked', 'true');
      
      // Play celebratory futuristic chime
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const now = ctx.currentTime;
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.2, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.26);
          });
        }
      } catch {
        // AudioContext error ignored
      }

      setTimeout(() => {
        onUnlockSuccess();
        onClose();
      }, 700);
    } else {
      setErrorShake(true);
      setErrorMessage('ACCESS DENIED · INVALID AUTHORIZATION PIN');
      
      // Error buzzer
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(160, ctx.currentTime);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        }
      } catch {
        // Audio error ignored
      }

      setTimeout(() => setErrorShake(false), 600);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleQuickChar = (char: string) => {
    if (pinInput.length < 10) {
      const next = pinInput + char;
      setPinInput(next);
      if (next.toUpperCase() === 'GKEDIT') {
        handleVerify(next);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 liquid-glass-modal-backdrop animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md rounded-3xl liquid-glass-modal-container ${
          isUnlocked
            ? '!border-emerald-500/80 shadow-[0_0_50px_rgba(16,185,129,0.35)]'
            : errorMessage
            ? '!border-red-500/80 shadow-[0_0_50px_rgba(239,68,68,0.35)]'
            : ''
        } p-6 overflow-hidden transition-all duration-300 ${errorShake ? 'animate-bounce' : ''}`}
      >
        <div className="liquid-glass-modal-glare" />
        {/* Radar ambient scanline background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
              isUnlocked
                ? 'bg-emerald-950/60 border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : 'bg-cyan-950/60 border-cyan-400/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
            }`}
          >
            {isUnlocked ? <Unlock className="w-6 h-6 animate-pulse" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-500/30">
                RESTRICTED PROTOCOL
              </span>
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" /> CLASSIFIED
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-wide mt-0.5">
              HOME INTERNET TRACKER
            </h2>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300/90 leading-relaxed mb-5">
          Enter the master security PIN to initialize the camera-free{' '}
          <span className="text-cyan-300 font-semibold">Cyber Radar Signal Finder</span> with 360° sweep,
          gyroscope compass, dynamic network blips & Sonar/Geiger acoustic telemetry.
        </p>

        {/* PIN Input Display */}
        <div className="space-y-2 mb-4">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-cyan-400" /> Clearance Passcode
            </span>
            <span className="text-cyan-400/80 text-[10px]">REQUIRED PIN: GKEDIT</span>
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value.toUpperCase());
                setErrorMessage(null);
              }}
              onKeyDown={handleKeyPress}
              placeholder="ENTER PIN (GKEDIT)"
              maxLength={12}
              disabled={isUnlocked}
              className={`w-full px-4 py-3 bg-black/70 border rounded-xl font-mono text-center text-lg tracking-[0.25em] font-bold text-white placeholder:text-slate-600 focus:outline-none transition ${
                isUnlocked
                  ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                  : errorMessage
                  ? 'border-red-500 text-red-300 focus:border-red-400'
                  : 'border-cyan-500/40 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50'
              }`}
            />
            {isUnlocked && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center gap-1 text-xs font-mono font-bold">
                <ShieldCheck className="w-4 h-4 animate-bounce" /> GRANTED
              </div>
            )}
          </div>
          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 font-mono mt-1 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Quick Alphanumeric Keypad Helper */}
        <div className="grid grid-cols-6 gap-1.5 mb-5 font-mono text-xs">
          {['G', 'K', 'E', 'D', 'I', 'T'].map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => handleQuickChar(letter)}
              className="py-2 rounded-lg bg-slate-900/90 hover:bg-cyan-950/60 border border-slate-700/80 hover:border-cyan-400 text-cyan-200 font-bold transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Keypad actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleBackspace}
            disabled={isUnlocked || pinInput.length === 0}
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition cursor-pointer disabled:opacity-40"
          >
            CLEAR
          </button>
          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={isUnlocked || pinInput.length === 0}
            className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
              isUnlocked
                ? 'bg-emerald-500 text-slate-950 border border-emerald-300 shadow-emerald-500/40'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border border-cyan-300 hover:shadow-cyan-500/40 active:scale-[0.98]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isUnlocked ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>UNLOCKED · LAUNCHING...</span>
              </>
            ) : (
              <>
                <Terminal className="w-4 h-4" />
                <span>VERIFY & UNLOCK</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Hint */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>HINT: TYPE &quot;GKEDIT&quot;</span>
          <button
            type="button"
            onClick={() => {
              setPinInput('GKEDIT');
              handleVerify('GKEDIT');
            }}
            className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
          >
            Auto-fill PIN &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
