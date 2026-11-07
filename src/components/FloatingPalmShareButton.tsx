import React from 'react';
import { Camera, Share2, Sparkles } from 'lucide-react';

export interface FloatingPalmShareButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function FloatingPalmShareButton({
  isOpen,
  onToggle,
}: FloatingPalmShareButtonProps) {
  return (
    <div className="fixed bottom-24 right-3 sm:bottom-24 sm:right-6 z-40 select-none">
      <button
        type="button"
        onClick={onToggle}
        className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-full border transition-all duration-300 shadow-2xl backdrop-blur-xl cursor-pointer active:scale-95 ${
          isOpen
            ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.7)]'
            : 'bg-slate-900/90 text-slate-100 border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]'
        }`}
        title="Toggle All-in-One Palm Gesture Photo Share (WebRTC P2P)"
        aria-label="Toggle Palm Gesture Photo Share"
      >
        {/* Glowing Palm Icon with Badge */}
        <div className="relative flex items-center justify-center">
          <span className="text-lg group-hover:scale-115 transition-transform">🖐️</span>
          <span
            className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-900 ${
              isOpen ? 'bg-white animate-pulse' : 'bg-cyan-400 animate-ping'
            }`}
          />
        </div>

        {/* Text Label */}
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold leading-tight flex items-center gap-1">
            <span>Palm Share</span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold uppercase ${
                isOpen
                  ? 'bg-black/30 text-slate-950'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              P2P
            </span>
          </span>
          <span
            className={`text-[9px] font-mono leading-none ${
              isOpen ? 'text-slate-900 font-bold' : 'text-slate-400'
            }`}
          >
            {isOpen ? 'Active • Close' : 'Touchless Capture'}
          </span>
        </div>
      </button>
    </div>
  );
}
