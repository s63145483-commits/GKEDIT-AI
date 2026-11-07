import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutGrid,
  MessageSquare,
  Dna,
  Camera,
  Wrench,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Film,
  BookOpen,
  MapPin,
  Settings,
  Activity,
  Heart,
  X,
} from 'lucide-react';
import { ActiveTab } from '../types/index.ts';

export interface LiquidGlassBottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export type LiquidGlassFloatingNavProps = LiquidGlassBottomNavProps;

interface PrimaryNavTab {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  glow: string;
}

const PRIMARY_TABS: PrimaryNavTab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutGrid,
    accentColor: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.45)',
  },
  {
    id: 'chat',
    label: 'Copilot',
    icon: MessageSquare,
    accentColor: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.45)',
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: Wrench,
    accentColor: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.45)',
  },
];

interface SecondaryNavTab {
  id: ActiveTab;
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const SECONDARY_TABS: SecondaryNavTab[] = [
  { id: 'biolab', label: 'Bio Lab', category: 'Science', icon: Dna, accentColor: '#10b981' },
  { id: 'camera', label: 'Vision', category: 'Camera', icon: Camera, accentColor: '#f59e0b' },
  { id: 'showcase', label: 'Showcase', category: 'Media', icon: Film, accentColor: '#ec4899' },
  { id: 'generators', label: 'AI Studios', category: 'Creative', icon: Sparkles, accentColor: '#8b5cf6' },
  { id: 'bookview', label: 'Codex Laws', category: 'Knowledge', icon: BookOpen, accentColor: '#f59e0b' },
  { id: 'maps', label: 'Maps Live', category: 'Navigation', icon: MapPin, accentColor: '#06b6d4' },
  { id: 'inditrack', label: 'IndiTrack', category: 'Radar', icon: Activity, accentColor: '#10b981' },
  { id: 'devotional', label: 'Devotional', category: 'Spirit', icon: Heart, accentColor: '#f97316' },
  { id: 'settings', label: 'Settings', category: 'System', icon: Settings, accentColor: '#94a3b8' },
];

export const LiquidGlassBottomNav = React.memo(function LiquidGlassBottomNav({
  activeTab,
  onChangeTab,
}: LiquidGlassBottomNavProps) {
  // Requirement 1: useState hook to track collapsed and expanded state
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Active tab metadata for the small floating circular button
  const activePrimaryTab = PRIMARY_TABS.find((t) => t.id === activeTab);
  const activeSecondaryTab = SECONDARY_TABS.find((t) => t.id === activeTab);
  const ActiveIcon = activePrimaryTab?.icon || activeSecondaryTab?.icon || LayoutGrid;
  const activeAccentColor = activePrimaryTab?.accentColor || activeSecondaryTab?.accentColor || '#38bdf8';

  // Close drawer on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreOpen]);

  const triggerHaptic = (ms = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // Ignore haptic errors on unsupported platforms
      }
    }
  };

  const handleSelectTab = (tab: ActiveTab) => {
    triggerHaptic(12);
    onChangeTab(tab);
    setIsMoreOpen(false);
  };

  return (
    <nav
      aria-label="GKEDIT Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center pointer-events-none pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      {/* Slide-out Liquid Glass Extended Drawer */}
      {!isMinimized && isMoreOpen && (
        <div
          ref={drawerRef}
          className="pointer-events-auto mb-3 mx-4 max-w-md w-[calc(100%-2rem)] rounded-3xl bg-[#030917]/90 backdrop-blur-2xl border border-cyan-500/30 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.85)] animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-200 uppercase">
                GK Suite Apps &amp; Hubs
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsMoreOpen(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              aria-label="Close extended menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {SECONDARY_TABS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-150 cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center mb-1 transition-transform group-hover:scale-110"
                    style={{
                      color: item.accentColor,
                      backgroundColor: `${item.accentColor}18`,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold truncate max-w-full">{item.label}</span>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5">{item.category}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Dock Container with Smooth Transition between Expanded Dock and Floating Circular Button */}
      <div className="relative flex items-center justify-center transition-all duration-300 ease-in-out">
        {/* Full Expanded Navigation Bar */}
        <div
          className={`pointer-events-auto mx-auto px-2 py-1.5 rounded-full bg-[#020612]/85 backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.7)] flex items-center gap-1 sm:gap-2 transition-all duration-300 ease-in-out ${
            isMinimized
              ? 'opacity-0 scale-75 translate-y-6 pointer-events-none absolute'
              : 'opacity-100 scale-100 translate-y-0'
          }`}
        >
          {/* Primary Navigation Tabs (Dashboard, Copilot, Tools) */}
          {PRIMARY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`relative px-3.5 sm:px-4 py-2 rounded-full flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 border border-cyan-400/60 text-white font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isActive ? 'scale-110 drop-shadow-[0_0_6px_#38bdf8]' : ''
                  }`}
                />
                <span className="text-[10px] sm:text-xs tracking-tight">{tab.label}</span>

                {/* Active Indicator Pip */}
                {isActive && (
                  <span
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full shadow-[0_0_8px_currentColor]"
                    style={{ backgroundColor: tab.accentColor, color: tab.accentColor }}
                  />
                )}
              </button>
            );
          })}

          {/* More Apps Drawer Expander Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setIsMoreOpen(!isMoreOpen);
            }}
            className={`px-2.5 sm:px-3 py-2 rounded-full flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer active:scale-90 ${
              isMoreOpen || SECONDARY_TABS.some((t) => t.id === activeTab)
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
            title="More GK Apps & Codex Hubs"
            aria-label="More GK Apps"
          >
            <ChevronUp
              className={`w-4 h-4 transition-transform duration-300 ${
                isMoreOpen ? 'rotate-180 text-cyan-300' : ''
              }`}
            />
            <span className="text-[10px] sm:text-xs font-mono hidden xs:inline">More</span>
          </button>

          {/* Requirement 2: Down-Arrow Button on Right Side to smoothly collapse into floating circular button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(12);
              setIsMinimized(true);
              setIsMoreOpen(false);
            }}
            className="px-2.5 sm:px-3 py-2 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-all duration-200 cursor-pointer active:scale-90 group"
            title="Collapse navigation bar"
            aria-label="Collapse navigation bar"
          >
            <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" />
          </button>
        </div>

        {/* Requirement 3: Small Floating Circular Button that expands back into full navigation bar */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(12);
            setIsMinimized(false);
          }}
          aria-label="Expand navigation bar"
          title="Expand navigation bar"
          className={`pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#020612]/90 backdrop-blur-2xl border border-cyan-400/60 shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.45)] flex items-center justify-center text-cyan-300 hover:text-white hover:border-cyan-300 hover:scale-105 active:scale-90 transition-all duration-300 ease-in-out cursor-pointer group ${
            isMinimized
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-75 translate-y-6 pointer-events-none absolute'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <ActiveIcon
              className="w-5 h-5 transition-transform duration-300 group-hover:scale-95"
              style={{ color: activeAccentColor }}
            />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-[0_0_8px_#22d3ee] border border-[#020612]">
              <ChevronUp className="w-2.5 h-2.5 stroke-[3] transition-transform duration-300 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </button>
      </div>
    </nav>
  );
});

export const LiquidGlassFloatingNav = LiquidGlassBottomNav;
