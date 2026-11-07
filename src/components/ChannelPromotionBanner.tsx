import React, { useState } from 'react';
import { Youtube, ExternalLink, Sparkles, Award, Check, PlayCircle, GraduationCap, Film } from 'lucide-react';
import confetti from 'canvas-confetti';

export function ChannelPromotionBanner({
  onOpenHub,
  onOpenShowcase,
}: {
  onOpenHub: () => void;
  onOpenShowcase?: () => void;
}) {
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);

  const handleOpenShowcase = () => {
    if (onOpenShowcase) {
      onOpenShowcase();
    } else {
      window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'showcase' } }));
    }
  };

  const handleCopy = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    setCopiedChannel(name);
    setTimeout(() => setCopiedChannel(null), 2500);
  };

  const handleConfetti = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#3b82f6', '#60a5fa', '#38bdf8'],
    });
  };

  return (
    <div className="relative overflow-hidden border-b border-cyan-500/25 bg-gradient-to-r from-[#030712] via-[#081b3e] to-[#04122d] px-4 py-2 text-xs text-slate-300 shadow-[0_4px_20px_rgba(6,182,212,0.15)] backdrop-blur-md">
      {/* Liquid animated subtle shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-75 animate-pulse" />

      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: 9th Class Creator Recognition */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Creator: <strong className="text-white">GK EDIT</strong> (9th Class Prodigy)</span>
          </div>

          <span className="hidden sm:inline text-cyan-700">|</span>

          <span className="text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>AI Born: <strong className="text-cyan-200">Aug 13, 2026</strong></span>
            <span className="text-slate-500 hidden md:inline">• Born: Aug 13, 2013</span>
          </span>
        </div>

        {/* Right: Official Channels with Liquid Blue Styling */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-cyan-300 font-semibold flex items-center gap-1">
            <Youtube className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>Channels:</span>
          </span>

          {/* Channel 1 */}
          <div className="inline-flex items-center bg-blue-950/60 hover:bg-blue-900/60 border border-cyan-500/30 rounded-xl px-2 py-0.5 text-slate-200 transition shadow-sm hover:border-cyan-400">
            <a
              href="https://youtube.com/@GKEDIT2141"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleConfetti}
              className="flex items-center gap-1 hover:text-cyan-200 font-semibold text-[11px]"
              title="Subscribe to @GKEDIT2141"
            >
              <span className="text-cyan-300">@GKEDIT2141</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </a>
            <button
              onClick={() => handleCopy('https://youtube.com/@GKEDIT2141', 'main')}
              className="ml-1.5 pl-1.5 border-l border-cyan-500/30 text-slate-400 hover:text-white"
              title="Copy URL"
            >
              {copiedChannel === 'main' ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-[10px]">Copy</span>}
            </button>
          </div>

          {/* Channel 2 */}
          <div className="inline-flex items-center bg-blue-950/60 hover:bg-blue-900/60 border border-cyan-500/30 rounded-xl px-2 py-0.5 text-slate-200 transition shadow-sm hover:border-cyan-400">
            <a
              href="https://youtube.com/@GKEDITOFFICIAL2141"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleConfetti}
              className="flex items-center gap-1 hover:text-cyan-200 font-semibold text-[11px]"
              title="Subscribe to @GKEDITOFFICIAL2141"
            >
              <span className="text-cyan-300">@GKEDITOFFICIAL2141</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </a>
            <button
              onClick={() => handleCopy('https://youtube.com/@GKEDITOFFICIAL2141', 'official')}
              className="ml-1.5 pl-1.5 border-l border-cyan-500/30 text-slate-400 hover:text-white"
              title="Copy URL"
            >
              {copiedChannel === 'official' ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-[10px]">Copy</span>}
            </button>
          </div>

          {/* Video Showcase Button */}
          <button
            onClick={handleOpenShowcase}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-[11px] shadow-[0_0_15px_rgba(6,182,212,0.4)] transition cursor-pointer"
            title="Open Video Editing Showcase"
          >
            <Film className="w-3 h-3" />
            <span>Showcase</span>
          </button>

          <button
            onClick={onOpenHub}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10 hover:border-cyan-400/40 font-semibold text-[11px] transition cursor-pointer"
          >
            <PlayCircle className="w-3 h-3 text-cyan-400" />
            <span>Hub</span>
          </button>
        </div>
      </div>
    </div>
  );
}
