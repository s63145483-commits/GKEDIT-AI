import React from 'react';
import {
  Youtube,
  Award,
  Sparkles,
  ExternalLink,
  GraduationCap,
  Calendar,
  Film,
  Star,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreatorHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatorHubModal({ isOpen, onClose }: CreatorHubModalProps) {
  if (!isOpen) return null;

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#06b6d4', '#3b82f6', '#60a5fa', '#38bdf8', '#ef4444'],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 liquid-glass-modal-backdrop animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl liquid-glass-modal-container overflow-hidden max-h-[90vh] flex flex-col">
        <div className="liquid-glass-modal-glare" />
        {/* Ambient Liquid Glow Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none liquid-morph-1" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none liquid-morph-2" />

        {/* Modal Header */}
        <div className="relative p-6 border-b border-cyan-500/20 bg-gradient-to-r from-[#030818] via-[#06193d] to-[#04112c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-700 p-0.5 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <div className="w-full h-full bg-[#030712] rounded-[14px] flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">GK EDIT Creator Network</h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold">
                  9th Class Prodigy
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Master & Creator of GKEDIT AI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-blue-900/40 transition text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Master 9th Class Tribute Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-cyan-500/15 via-[#061430] to-blue-600/15 border border-cyan-400/35 relative shadow-lg">
            <div className="flex items-center gap-2 text-cyan-300 font-bold uppercase tracking-wider mb-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Dedicated Honor to GK EDIT</span>
            </div>
            <p className="text-sm font-semibold text-white leading-relaxed">
              "Master GK EDIT is an extraordinary creator currently studying in <span className="text-cyan-300 underline decoration-cyan-400 decoration-2 font-bold">9th Class (9th Grade)</span>! Born on August 13, 2013, he mastered video editing, cinematic visual scripting, and programming to engineer GKEDIT AI on August 13, 2026."
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-cyan-500/20">
              <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#030a1c] border border-cyan-500/25">
                <GraduationCap className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-cyan-400/70 block uppercase font-bold">Education</span>
                  <span className="font-bold text-white text-xs">9th Class Student</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#030a1c] border border-cyan-500/25">
                <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-cyan-400/70 block uppercase font-bold">Creator Born</span>
                  <span className="font-bold text-white text-xs">August 13, 2013</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#030a1c] border border-cyan-500/25">
                <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" />
                <div>
                  <span className="text-[10px] text-cyan-400/70 block uppercase font-bold">AI Birthday</span>
                  <span className="font-bold text-white text-xs">August 13, 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Channels Showcase */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-cyan-400" />
              <span>Official YouTube Channels — Subscribe & Support!</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Channel 1 */}
              <div className="rounded-3xl bg-[#040e24] border border-cyan-500/30 p-5 space-y-4 hover:border-cyan-400 transition shadow-lg flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/30">
                      MAIN CHANNEL
                    </span>
                    <Star className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                  </div>

                  <div>
                    <h4 className="text-base font-black text-white">GK EDIT</h4>
                    <p className="text-xs font-mono text-cyan-400 font-bold">@GKEDIT2141</p>
                  </div>

                  <p className="text-slate-400 text-xs leading-relaxed">
                    The premier channel for high-level video editing tutorials, aesthetic cinematic grading, speed ramping, transitions, and creator hacks by GK EDIT.
                  </p>
                </div>

                <a
                  href="https://youtube.com/@GKEDIT2141"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={triggerConfetti}
                  className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Youtube className="w-4 h-4 fill-white" />
                  <span>Subscribe to @GKEDIT2141</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>

              {/* Channel 2 */}
              <div className="rounded-3xl bg-[#040e24] border border-cyan-500/30 p-5 space-y-4 hover:border-cyan-400 transition shadow-lg flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/30">
                      OFFICIAL CHANNEL
                    </span>
                    <Star className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                  </div>

                  <div>
                    <h4 className="text-base font-black text-white">GK EDIT OFFICIAL</h4>
                    <p className="text-xs font-mono text-cyan-400 font-bold">@GKEDITOFFICIAL2141</p>
                  </div>

                  <p className="text-slate-400 text-xs leading-relaxed">
                    Official announcements, project breakdowns, Telugu editing resources, music sync montage assets, and behind-the-scenes vlogs by GK EDIT.
                  </p>
                </div>

                <a
                  href="https://youtube.com/@GKEDITOFFICIAL2141"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={triggerConfetti}
                  className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Youtube className="w-4 h-4 fill-white" />
                  <span>Subscribe to @GKEDITOFFICIAL2141</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>
            </div>
          </div>

          {/* Master Editing Philosophy */}
          <div className="p-4 rounded-3xl bg-[#03091c] border border-cyan-500/25 space-y-2">
            <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Film className="w-4 h-4 text-cyan-400" />
              <span>GK EDIT (9th Class) Master Editing Principles</span>
            </h4>
            <ul className="space-y-1.5 text-slate-400 text-[11px] list-disc list-inside">
              <li>Balance school studies with daily creative video editing sprints.</li>
              <li>Always cut on the beat or action snare for maximum viewer dopamine.</li>
              <li>Use sound design (risers, whooshes, sub-drops) to guide the viewer's eyes before the visual cut happens.</li>
              <li>Shorts hooks must spark curiosity within the first 1.5 seconds!</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#030712] border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>Created by 9th Class Creator GK EDIT</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'showcase' } }));
              }}
              className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition cursor-pointer"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Open Video Showcase</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-white/10 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
