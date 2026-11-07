import React, { useState, useEffect } from 'react';
import {
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Sliders,
  ShieldAlert,
  Save,
  CheckCircle2,
  Cpu,
  Layers,
  Zap,
  Info,
  ExternalLink,
  ChevronRight,
  Shield,
  Palette,
} from 'lucide-react';
import { GkAppIcon } from './GkAppIcon.tsx';
import {
  appIconService,
  AppIconItem,
  PRIMARY_APP_ICONS,
  APP_ICONS,
} from '../services/appIconService.ts';
import { notificationService } from '../services/notificationService.ts';

interface GkSettingsSubtabProps {
  onNavigateToTools?: () => void;
  onOpenAdvancedSettings?: () => void;
  onIconSaved?: (icon: AppIconItem) => void;
}

export function GkSettingsSubtab({
  onNavigateToTools,
  onOpenAdvancedSettings,
  onIconSaved,
}: GkSettingsSubtabProps) {
  const [selectedIconId, setSelectedIconId] = useState<string>(() =>
    appIconService.getSelectedIconId()
  );
  const [savedIconId, setSavedIconId] = useState<string>(() =>
    appIconService.getSelectedIconId()
  );
  const [showExtendedSuite, setShowExtendedSuite] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const [activeSubtabPill, setActiveSubtabPill] = useState<'tools' | 'settings'>('settings');

  // Keep in sync with appIconService
  useEffect(() => {
    const unsub = appIconService.subscribe((icon) => {
      setSelectedIconId(icon.id);
      setSavedIconId(icon.id);
    });
    return unsub;
  }, []);

  const handleSelectIcon = (id: string) => {
    setSelectedIconId(id);
    setIsSavedFeedback(false);
  };

  const handleSaveChanges = () => {
    appIconService.setIcon(selectedIconId);
    setSavedIconId(selectedIconId);
    setIsSavedFeedback(true);

    const activeItem = APP_ICONS.find((i) => i.id === selectedIconId) || APP_ICONS[0];
    onIconSaved?.(activeItem);

    notificationService.showInAppToast(
      'Launcher Icon Updated',
      `Active app icon set to "${activeItem.label}" (${activeItem.name}).`,
      'info'
    );

    setTimeout(() => {
      setIsSavedFeedback(false);
    }, 3500);
  };

  const handleRestoreDefaults = () => {
    appIconService.resetToDefault();
    setSelectedIconId('default');
    setSavedIconId('default');
    setIsResetConfirming(false);

    // Also reset common interface flags
    try {
      localStorage.removeItem('gkedit_custom_tool_order');
      localStorage.removeItem('gkedit_air_kb_layout');
    } catch {
      // storage unavailable
    }

    notificationService.showInAppToast(
      'Defaults Restored',
      'App launcher icon, UI layouts, and cached preferences restored to factory defaults.',
      'alert'
    );
  };

  const currentIcon = APP_ICONS.find((i) => i.id === selectedIconId) || APP_ICONS[0];
  const displayedIcons = showExtendedSuite ? APP_ICONS : PRIMARY_APP_ICONS;

  return (
    <div className="relative min-h-screen w-full bg-[#030712] text-slate-100 overflow-hidden select-none pb-28">
      {/* Background Layer: Deep Obsidian Black + Cosmic Navy with Glowing Cyan Circuit Grid */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Subtle radial dark cosmic glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-cyan-600/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-10 right-0 w-[450px] h-[450px] bg-blue-700/10 blur-[140px] rounded-full" />

        {/* Faint Cybernetic Circuit Board / Hex Grid Pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.08]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="circuit-grid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="#00f0ff"
                strokeWidth="0.8"
              />
              <circle cx="0" cy="0" r="2" fill="#00f0ff" />
              <circle cx="60" cy="0" r="1.5" fill="#00f0ff" />
              <path
                d="M 15 15 h 30 v 30 h -30 z"
                fill="none"
                stroke="#00f0ff"
                strokeWidth="0.4"
                strokeDasharray="2,4"
              />
              <path d="M 0 30 h 15 M 45 30 h 15" stroke="#00f0ff" strokeWidth="0.6" />
              <path d="M 30 0 v 15 M 30 45 v 15" stroke="#00f0ff" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit-grid)" />
        </svg>

        {/* Glowing Cyan Horizon Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent shadow-[0_0_12px_#00f0ff]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-6">

        {/* Top Navigation & Header */}
        <div className="space-y-4">
          {/* Subtab Navigation Pills: "All Tools" (unselected) & "Settings" (selected with vibrant cyan neon border) */}
          <div className="flex items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
            <div className="flex items-center gap-2 p-1 rounded-full bg-[#020617]/90 border border-slate-800/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(2,6,23,0.8)]">
              {/* All Tools Pill */}
              <button
                type="button"
                onClick={() => {
                  setActiveSubtabPill('tools');
                  onNavigateToTools?.();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  activeSubtabPill === 'tools'
                    ? 'border border-cyan-400 text-cyan-200 bg-cyan-500/20 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                    : 'bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>All Tools</span>
              </button>

              {/* Settings Pill (Selected with vibrant cyan neon border and glowing text) */}
              <button
                type="button"
                onClick={() => setActiveSubtabPill('settings')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                  activeSubtabPill === 'settings'
                    ? 'border-2 border-cyan-400 text-cyan-200 bg-cyan-500/20 shadow-[0_0_18px_rgba(0,240,255,0.6)]'
                    : 'bg-white/5 border border-white/10 text-slate-400'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                <span className="text-cyan-100 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
                  Settings
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
              </button>
            </div>

            {/* Quick Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>GK-OS // v4.2 PRO</span>
            </div>
          </div>

          {/* Main Title: SETTINGS with modern techno typography */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pt-1">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                  SYS // CONFIG
                </span>
                <span className="text-slate-500 font-mono text-xs">• 8K UI/UX MATRIX</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-400 font-mono mt-1 drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                SETTINGS
              </h1>
            </div>

            {/* Active Icon Mini Indicator */}
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-cyan-500/20 text-xs">
              <span className="text-slate-400">Active Launcher:</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>{currentIcon.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CARD 1 - "APP ICON PREFERENCES"
            Glassmorphic card with subtle cyan outline, heading, helper text,
            interactive grid of 8 metallic app icons with active glowing cyan outline & checkmark
           ========================================================================= */}
        <section className="relative rounded-2xl border border-cyan-500/35 bg-[#040e24]/85 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(2,6,23,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-300 group hover:border-cyan-400/60 hover:shadow-[0_8px_40px_rgba(0,240,255,0.15)]">
          {/* Subtle cyan neon top accent */}
          <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

          {/* Heading & Helper Text */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-cyan-500/15">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Change App Icon
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
                  METALLIC SUITE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Select your preferred launcher icon for GK EDIT AI
              </p>
            </div>

            {/* Suite Range Toggle */}
            <button
              type="button"
              onClick={() => setShowExtendedSuite((prev) => !prev)}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:text-white hover:border-cyan-400 text-xs font-mono transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{showExtendedSuite ? 'Show Primary (8 Icons)' : 'View All 20 Icons'}</span>
            </button>
          </div>

          {/* Interactive Grid of Rounded-Square Metallic App Icons */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {displayedIcons.map((item) => {
              const isSelected = selectedIconId === item.id;
              const isCurrentlySaved = savedIconId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectIcon(item.id)}
                  className={`group relative flex flex-col items-center p-3 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none text-center ${
                    isSelected
                      ? 'bg-gradient-to-b from-cyan-950/60 to-slate-950/90 border-cyan-400 ring-2 ring-cyan-400/80 shadow-[0_0_24px_rgba(0,240,255,0.5),inset_0_0_15px_rgba(0,240,255,0.2)] scale-[1.03]'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-900/60 hover:scale-[1.01]'
                  }`}
                >
                  {/* Active Glowing Checkmark Badge in Upper-Right Corner */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 z-20 w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-black shadow-[0_0_12px_#00f0ff] animate-in zoom-in-75 duration-150">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  {/* Saved badge if this is currently saved in persistent storage */}
                  {!isSelected && isCurrentlySaved && (
                    <div className="absolute top-2 right-2 z-20 px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-400/40 text-[9px] font-mono text-blue-300">
                      CURRENT
                    </div>
                  )}

                  {/* Metallic App Icon Frame */}
                  <div className="relative my-1">
                    <GkAppIcon
                      icon={item}
                      size={68}
                      isActive={isSelected}
                      showMetallicBezel={true}
                    />
                  </div>

                  {/* Icon Metadata */}
                  <div className="mt-2.5 w-full">
                    <span
                      className={`block font-mono text-xs font-black tracking-wider uppercase ${
                        isSelected
                          ? 'text-cyan-200 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]'
                          : 'text-slate-300 group-hover:text-cyan-300'
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="block text-[11px] text-slate-400 font-medium truncate mt-0.5">
                      {item.name}
                    </span>
                  </div>

                  {/* Subtle Tech Pill tags */}
                  <div className="mt-2 flex flex-wrap justify-center gap-1">
                    {item.tags.slice(0, 2).map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 border border-white/5 text-slate-400 capitalize"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Icon Spotlight Banner */}
          <div className="mt-5 p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-950/80 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <GkAppIcon icon={currentIcon} size={36} showMetallicBezel={false} />
              <div>
                <span className="text-slate-400">Selected Launcher:</span>{' '}
                <span className="font-bold text-white font-mono">{currentIcon.label}</span>
                <span className="text-slate-400 ml-1.5 hidden sm:inline font-mono">
                  — {currentIcon.desc}
                </span>
              </div>
            </div>
            {selectedIconId !== savedIconId && (
              <span className="shrink-0 text-[11px] font-mono text-amber-300 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <span>Unsaved</span>
              </span>
            )}
          </div>
        </section>

        {/* =========================================================================
            CARD 2 - "RESET & RESTORE"
            Warning card with neon-red/crimson border (#ff3e3e), heading, description,
            glowing crimson button "RESTORE ALL DEFAULTS" with subtle warning icon.
           ========================================================================= */}
        <section className="relative rounded-2xl border-2 border-[#ff3e3e]/70 bg-gradient-to-b from-[#18060c]/85 to-[#0b0306]/95 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_0_28px_rgba(255,62,62,0.2),inset_0_1px_0_rgba(255,62,62,0.15)] transition-all duration-300 group hover:border-[#ff3e3e] hover:shadow-[0_0_36px_rgba(255,62,62,0.3)]">
          {/* Neon Crimson Horizon Accent */}
          <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[#ff3e3e] to-transparent shadow-[0_0_10px_#ff3e3e]" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Warning Info */}
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff3e3e] shadow-[0_0_8px_#ff3e3e] animate-pulse" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Restore Defaults
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 border border-[#ff3e3e]/60 text-red-200">
                  DANGER ZONE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Reset custom icons, interface layouts, and cached preferences to original defaults.
              </p>
            </div>

            {/* Glowing Crimson Button "RESTORE ALL DEFAULTS" */}
            <div className="shrink-0 flex items-center gap-2">
              {isResetConfirming ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsResetConfirming(false)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRestoreDefaults}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff3e3e] text-white font-black text-xs font-mono tracking-wider shadow-[0_0_20px_#ff3e3e] hover:bg-red-600 active:scale-95 transition cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-white" />
                    <span>CONFIRM RESET</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsResetConfirming(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#d91d1d] via-[#ff3e3e] to-[#c21414] text-white font-black text-xs sm:text-sm font-mono tracking-wider shadow-[0_0_22px_rgba(255,62,62,0.6)] hover:shadow-[0_0_32px_rgba(255,62,62,0.85)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-red-300/40"
                  title="Reset all preferences to initial state"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-200" />
                  <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    RESTORE ALL DEFAULTS
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================================
            BOTTOM ACTION AREA
            A prominent, vibrant cyan-to-blue gradient button with rounded corners
            labeled "SAVE CHANGES", emitting a gentle futuristic neon underglow.
           ========================================================================= */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Changes are stored client-side and take effect across all applet modules.</span>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end gap-3">
            {/* Save Feedback Badge */}
            {isSavedFeedback && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-400/50 px-3 py-1.5 rounded-full animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Preferences Saved!</span>
              </div>
            )}

            {/* "SAVE CHANGES" Button */}
            <button
              type="button"
              onClick={handleSaveChanges}
              className="relative w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#00f0ff] via-[#0284c7] to-[#2563eb] text-slate-950 font-black text-sm tracking-wider uppercase font-mono shadow-[0_0_28px_rgba(0,240,255,0.6)] hover:shadow-[0_0_38px_rgba(0,240,255,0.85)] hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer border border-cyan-200/50 overflow-hidden group"
            >
              {/* Futuristic neon sweep highlight */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

              <Save className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span className="drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">SAVE CHANGES</span>
            </button>
          </div>
        </div>

        {/* Extended Deeper Preferences Accordion (Biometrics, Contacts, Wake Word, TTS) */}
        {onOpenAdvancedSettings && (
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Need to configure Voice Wake Word, Biometric Gate, or Google Contacts?
            </span>
            <button
              type="button"
              onClick={onOpenAdvancedSettings}
              className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 hover:text-cyan-200 underline cursor-pointer"
            >
              <span>System & Hardware Suite</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
