import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Mic,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  Shield,
  ShieldAlert,
  ChevronDown,
  Sun,
  Moon,
  Lock,
  Sliders,
  Keyboard,
  Bell,
  Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { isCreatorAdmin } from '../services/adminAuth.ts';
import { ActiveTab } from '../types/index.ts';
import { PWAInstallButton } from './PWAInstallModal.tsx';
import { keyboardShortcutsService } from '../services/keyboardShortcutsService.ts';
import { themeService, ThemeMode } from '../services/themeService.ts';
import { appIconService, AppIconItem } from '../services/appIconService.ts';
import { GkAppIcon } from './GkAppIcon.tsx';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAuth: () => void;
  onOpenVoice: () => void;
  onOpenCreatorHub: () => void;
  onOpenMonitor?: () => void;
  onLockSession?: () => void;
  currentLang?: string;
  onChangeLang?: (lang: any) => void;
  showModelPanel?: boolean;
  onToggleModelPanel?: () => void;
  isGestureHUDOpen?: boolean;
  onToggleGestureHUD?: () => void;
  isSearchGrounding?: boolean;
  onToggleSearchGrounding?: () => void;
  onOpenNexusSettings?: () => void;
  onOpenInstall?: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenVoice,
  onOpenCreatorHub,
  onOpenMonitor,
  onLockSession,
  onOpenInstall,
  onOpenNexusSettings,
}: HeaderProps) {
  const { user, isAdmin, logout } = useAuth();
  const effectiveEmail = user?.email || (typeof window !== 'undefined' ? localStorage.getItem('gkedit_auth_email') : '') || '';
  const isCreator = isCreatorAdmin(effectiveEmail) || effectiveEmail.toLowerCase() === 'narsimha2141@gmail.com' || user?.role === 'creator';
  const avatarLetter = isCreator
    ? 'N'
    : effectiveEmail
    ? effectiveEmail.charAt(0).toUpperCase()
    : user?.name
    ? user.name.charAt(0).toUpperCase()
    : 'U';

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(themeService.getThemeMode());
  const [activeAppIcon, setActiveAppIcon] = useState<AppIconItem>(() => appIconService.getSelectedIcon());

  useEffect(() => {
    const unsub = themeService.subscribeMode(setThemeMode);
    const unsubIcon = appIconService.subscribe(setActiveAppIcon);
    return () => {
      unsub();
      unsubIcon();
    };
  }, []);

  const handleToggleTheme = () => {
    const next = themeService.toggleThemeMode();
    setThemeMode(next);
  };

  return (
    <header className="sticky top-0 z-30 px-2 sm:px-4 py-2 sm:py-2.5 transition-colors duration-300 pointer-events-auto space-y-2">
      {/* Liquid Glass Top Bar (Frosted 20px blur, translucent border, glossy reflections) */}
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 px-3.5 sm:px-5 py-2.5 rounded-full border border-white/10 bg-[#0d162a]/70 backdrop-blur-[20px] shadow-[0_12px_36px_rgba(2,6,23,0.7),0_0_24px_rgba(0,242,254,0.12)] relative overflow-hidden pointer-events-auto">
        {/* Specular Top Sheen Highlight */}
        <div className="absolute top-0 inset-x-10 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        {/* Left: Brand Circular Logo & Glowing Gradient Title */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          title="GKEDIT AI Hub"
        >
          {/* Metallic Selected App Icon */}
          <div className="relative w-8 h-8 rounded-2xl group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center shadow-[0_0_12px_rgba(0,242,254,0.3)]">
            <GkAppIcon icon={activeAppIcon} size={30} showMetallicBezel={false} />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FFD700] rounded-full flex items-center justify-center border border-[#070B14] shadow-[0_0_6px_#FFD700]">
              <Sparkles className="w-1.5 h-1.5 text-slate-950" />
            </div>
          </div>

          {/* Project Title with Glowing Gradient */}
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm sm:text-base tracking-tight whitespace-nowrap bg-gradient-to-r from-[#00F2FE] via-[#38bdf8] to-[#9D4EDD] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(0,242,254,0.45)]">
              GKEDIT AI
            </span>
          </div>
        </div>

        {/* Center: Live Status Pill "• GKEDIT" with Pulsing Indicator */}
        <div
          onClick={() => onOpenVoice()}
          className="cursor-pointer group flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-slate-900/60 border border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),0_0_16px_rgba(0,242,254,0.18)] hover:border-[#00F2FE]/50 hover:shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all select-none"
          title="• GKEDIT Status • Tap to activate Live Voice"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF87] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF87] shadow-[0_0_8px_#00FF87]" />
          </span>
          <span className="text-[11px] sm:text-xs font-mono font-black tracking-widest uppercase text-cyan-200 group-hover:text-white drop-shadow-[0_0_8px_rgba(0,255,135,0.5)]">
            • GKEDIT
          </span>
        </div>

        {/* Right Actions: Status Counter, Shield, Voice & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Notification / Activity Badge Counter */}
          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className="w-7 h-7 rounded-full bg-cyan-500/15 border border-[#00F2FE]/30 text-cyan-200 text-xs font-mono font-bold flex items-center justify-center hover:bg-cyan-500/25 hover:border-[#00F2FE]/60 transition cursor-pointer shadow-[0_0_8px_rgba(0,242,254,0.2)]"
            title="System Status: 3 Services Connected"
          >
            3
          </button>

          {/* Shield / Security Indicator */}
          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className="w-7 h-7 rounded-full bg-emerald-500/15 border border-[#00FF87]/30 text-[#00FF87] hover:text-white hover:bg-emerald-500/25 flex items-center justify-center transition cursor-pointer shadow-[0_0_8px_rgba(0,255,135,0.2)]"
            title="Security Shield Active"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>

          {/* Voice Command Shortcuts Trigger Button */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('gkedit:open_voice_shortcuts'))}
            className="w-7 h-7 rounded-full bg-purple-500/15 border border-[#9D4EDD]/30 text-[#9D4EDD] hover:text-white hover:bg-purple-500/25 flex items-center justify-center transition cursor-pointer shadow-[0_0_8px_rgba(157,78,221,0.25)]"
            title="Voice Command Shortcuts"
            aria-label="Voice Command Shortcuts"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>

          {/* User Profile Avatar Circle with Gold outline */}
          <button
            type="button"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs hover:scale-105 transition cursor-pointer relative ${
              isCreator
                ? 'bg-gradient-to-tr from-[#FFD700] to-amber-600 text-slate-950 border border-[#FFD700]/70 shadow-[0_0_12px_rgba(255,215,0,0.4)]'
                : 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white border border-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
            }`}
            title={isCreator ? 'Creator: narsimha2141@gmail.com' : (user ? `User: ${user.name}` : 'Profile & Account')}
          >
            {isCreator && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 drop-shadow-[0_0_6px_#f59e0b] pointer-events-none">
                <Crown className="w-2.5 h-2.5 text-amber-300 fill-amber-300 animate-pulse" />
              </span>
            )}
            {avatarLetter}
          </button>

          {/* Sun / Moon Theme Toggle Button */}
          <button
            type="button"
            onClick={handleToggleTheme}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-cyan-300 hover:text-white flex items-center justify-center transition cursor-pointer active:scale-90"
            title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Light and Dark Mode"
          >
            {themeMode === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-300" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-cyan-600" />
            )}
          </button>

          {/* Discrete Lock Session Button */}
          {onLockSession && (
            <button
              type="button"
              onClick={onLockSession}
              className="p-1 rounded-full bg-white/5 hover:bg-cyan-500/20 border border-white/10 text-slate-400 hover:text-cyan-200 transition cursor-pointer"
              title="Lock / Logout Security Gate"
            >
              <Lock className="w-3 h-3 text-cyan-400" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-header displaying "ORIGIN OS 6" status pill and a glassmorphic "Customize Layout" button */}
      <div className="max-w-5xl mx-auto flex items-center justify-between px-3 sm:px-4 py-1 text-xs">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d162a]/60 border border-white/10 backdrop-blur-xl shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F2FE] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F2FE] shadow-[0_0_8px_#00F2FE]" />
          </span>
          <span className="text-[#00F2FE] font-mono font-extrabold tracking-wider text-[11px]">
            ORIGIN OS 6
          </span>
          <span className="text-white/20">|</span>
          <span className="text-slate-400 text-[10px] hidden sm:inline font-mono">
            Liquid Glassmorphism • Material 3 Expressive
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (activeTab !== 'dashboard') {
              setActiveTab('dashboard');
            }
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('gkedit:toggle_layout_customize'));
            }, 50);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:border-[#00F2FE]/40 hover:shadow-[0_0_16px_rgba(0,242,254,0.25)] active:scale-95"
          title="Customize Origin OS 6 layout & widgets"
        >
          <Sliders className="w-3 h-3 text-[#00F2FE]" />
          <span>Customize Layout</span>
        </button>
      </div>

      {/* Profile Dropdown Menu */}
      {showProfileMenu && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setShowProfileMenu(false)}
          />
          <div className="absolute right-4 top-14 w-60 rounded-2xl bg-[#06122c]/95 backdrop-blur-2xl border border-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-3 z-50 text-xs">
            <div className="pb-2 border-b border-cyan-500/20">
              <p className="font-bold text-white text-xs truncate">
                {user ? user.name : 'GKEDIT Workspace User'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                {user?.email || 'Standard Secure Mode'}
              </p>
            </div>
            <div className="pt-2 space-y-1">
              {!user && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenAuth();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-cyan-500/20 text-cyan-300 font-bold flex items-center gap-1.5 transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-red-500/20 text-red-300 font-bold flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  window.dispatchEvent(new CustomEvent('gkedit:open_voice_shortcuts'));
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-cyan-500/10 text-cyan-300 font-semibold flex items-center gap-1.5 transition"
              >
                <Mic className="w-3.5 h-3.5 text-cyan-400" />
                <span>Voice Command Shortcuts</span>
              </button>
              {onLockSession && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLockSession();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-cyan-500/10 text-slate-300 flex items-center gap-1.5 transition"
                >
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Lock Security Gate</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
