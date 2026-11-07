import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, Check, X, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

export function PWAInstallModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    const ok = await install();
    setInstalling(false);
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 liquid-glass-modal-backdrop animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl liquid-glass-modal-container p-6 space-y-5 text-center overflow-hidden">
        <div className="liquid-glass-modal-glare" />
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="font-black text-white text-sm">Install J.A.R.V.I.S on Your Phone</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-bold p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Icon Badge */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-700 p-0.5 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
          <div className="w-full h-full bg-[#030712] rounded-[22px] flex flex-col items-center justify-center">
            <span className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
              GK
            </span>
            <span className="text-[8px] font-mono tracking-widest text-cyan-400 mt-0.5">
              JARVIS
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-base font-black text-white">
            {isInstalled ? 'App Already Installed!' : 'Progressive Web App (PWA)'}
          </h4>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            {isInstalled
              ? 'GKEDIT AI is running as a standalone app on your home screen.'
              : 'Install directly onto your Android, iPhone, or PC home screen. Launches instantly with full-screen cinematic UI, offline support, and wake word background listening!'}
          </p>
        </div>

        {/* Features Highlights */}
        <div className="grid grid-cols-2 gap-2 text-left text-xs">
          <div className="p-2.5 rounded-xl bg-[#020713]/80 border border-cyan-500/15">
            <span className="text-cyan-400 font-bold block text-[11px]">⚡ Native Speed</span>
            <span className="text-[10.5px] text-slate-400">Runs full-screen with no browser search bars.</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#020713]/80 border border-cyan-500/15">
            <span className="text-cyan-400 font-bold block text-[11px]">🎙️ Wake Word</span>
            <span className="text-[10.5px] text-slate-400">Say "Hey Jarvis" anytime to summon voice assistant.</span>
          </div>
        </div>

        {/* Action Button: Chrome / Android vs iOS Safari Guide */}
        {isInstalled ? (
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Installed & Active on your device</span>
          </div>
        ) : isInstallable ? (
          <button
            onClick={handleInstallClick}
            disabled={installing}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 text-slate-950 font-black text-xs shadow-[0_0_25px_rgba(6,182,212,0.5)] transition flex items-center justify-center gap-2 active:scale-95"
          >
            {success ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>Installed Successfully!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-slate-950" />
                <span>{installing ? 'Installing...' : 'Add to Home Screen (1-Tap Install)'}</span>
              </>
            )}
          </button>
        ) : isIOS ? (
          <div className="p-4 rounded-2xl bg-[#020713] border border-cyan-500/30 text-left space-y-2">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Share className="w-3.5 h-3.5 text-cyan-400" />
              <span>How to Install on iPhone / iPad (Safari):</span>
            </p>
            <ol className="text-[11px] text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
              <li>Tap the <strong className="text-cyan-300">Share</strong> icon (box with up arrow) in Safari bottom bar.</li>
              <li>Scroll down and tap <strong className="text-cyan-300">"Add to Home Screen"</strong> <PlusSquare className="w-3 h-3 inline text-slate-300" />.</li>
              <li>Tap <strong className="text-cyan-300">"Add"</strong> in the top right corner.</li>
            </ol>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#020713] border border-cyan-500/30 text-left space-y-2">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Manual Browser Installation:</span>
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Tap your browser menu (<strong className="text-cyan-300">⋮</strong> or three dots in top-right) and select <strong className="text-cyan-300">"Install app"</strong> or <strong className="text-cyan-300">"Add to Home screen"</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PWAInstallButton({ onOpenModal }: { onOpenModal: () => void }) {
  const { isInstalled } = usePWAInstall();

  if (isInstalled) return null;

  return (
    <button
      onClick={onOpenModal}
      className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 hover:border-cyan-300 text-cyan-200 text-xs font-bold transition shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:scale-105 active:scale-95"
      title="Install JARVIS as a real phone app (PWA)"
    >
      <Download className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
      <span className="hidden sm:inline">Install App</span>
    </button>
  );
}
