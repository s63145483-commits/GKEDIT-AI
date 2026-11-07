import React, { useState } from 'react';
import {
  BookOpen,
  Scale,
  Sparkles,
  ScrollText,
  Shield,
  Gavel,
  BookMarked,
  Layers,
  Award,
} from 'lucide-react';
import { BookView, BookTheme, BookSection } from './BookView.tsx';

export function BookViewTab() {
  const [activeSection, setActiveSection] = useState<BookSection>('constitution');
  const [currentTheme, setCurrentTheme] = useState<BookTheme>('parchment');

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 pb-28 space-y-4">
      {/* Authentic Regal Leather & Gold Header Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 bg-gradient-to-r from-[#1a0e05] via-[#2d1808] to-[#120a04] p-4 sm:p-6 text-amber-100">
        {/* Ornate Gold Border Flourish Overlay */}
        <div className="absolute inset-1 rounded-2xl border border-amber-500/25 pointer-events-none" />
        <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-400/60 pointer-events-none" />
        <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-400/60 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-400/60 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-400/60 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] sm:text-xs font-mono font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                <ScrollText className="w-3.5 h-3.5 text-amber-400" />
                CONSTITUTION OF INDIA • CODEX 2026
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-mono text-emerald-300 font-bold hidden sm:inline-flex">
                BNS 2023 SYNCHRONIZED
              </span>
            </div>
            
            <h1 className="text-xl sm:text-3xl font-serif font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 drop-shadow">
              భారత రాజ్యాంగ గ్రంథాలయం &bull; Legal Codex Reader
            </h1>
            
            <p className="text-xs sm:text-sm text-amber-200/80 font-serif max-w-2xl leading-relaxed">
              Experience the authentic text, structure, and interpretations of The Constitution of India and modern statutory criminal laws (BNS / BNSS) with tactile parchment textures, serif typography, and bilingual Telugu/English translations.
            </p>
          </div>

          {/* Quick Badges & Statistics */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-stretch md:self-auto justify-between md:justify-end">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-950/70 border border-amber-500/30 text-center min-w-[76px] sm:min-w-[88px]">
              <span className="text-[10px] font-mono text-amber-400 uppercase block">ARTICLES</span>
              <span className="text-sm sm:text-base font-serif font-bold text-yellow-200">395+</span>
            </div>

            <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-950/70 border border-amber-500/30 text-center min-w-[76px] sm:min-w-[88px]">
              <span className="text-[10px] font-mono text-amber-400 uppercase block">PARTS</span>
              <span className="text-sm sm:text-base font-serif font-bold text-yellow-200">XXV</span>
            </div>

            <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-950/70 border border-amber-500/30 text-center min-w-[76px] sm:min-w-[88px]">
              <span className="text-[10px] font-mono text-amber-400 uppercase block">AMENDMENTS</span>
              <span className="text-sm sm:text-base font-serif font-bold text-yellow-200">106</span>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded High-Fidelity BookView Container */}
      <BookView
        initialSection={activeSection}
        initialTheme={currentTheme}
        onSectionChange={(sec: BookSection) => setActiveSection(sec)}
        onThemeChange={(th: BookTheme) => setCurrentTheme(th)}
      />
    </div>
  );
}
