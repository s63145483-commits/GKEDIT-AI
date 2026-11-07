import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Clock as ClockIcon,
  Globe,
  Bell,
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw,
  Flag,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Sparkles,
  Sun,
  Moon,
  Compass,
  AlarmClock,
  Check,
  Copy,
  ChevronDown,
  Zap,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { notificationService } from '../services/notificationService.ts';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
export type ClockSubView = 'world' | 'alarm' | 'stopwatch' | 'timer';

export interface WorldCity {
  id: string;
  name: string;
  country: string;
  timezone: string;
  flag?: string;
  utcOffsetHours: number;
}

export interface ClockAlarm {
  id: string;
  hours: number; // 1-12
  minutes: number; // 0-59
  ampm: 'AM' | 'PM';
  label: string;
  enabled: boolean;
  repeatDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat. Empty = Once
  sound: 'chime' | 'pulse' | 'digital' | 'zen';
  createdAt: number;
}

export interface StopwatchLap {
  id: string;
  lapNumber: number;
  lapTimeMs: number;
  totalTimeMs: number;
}

// ---------------------------------------------------------------------------
// DEFAULT WORLD TIMEZONES & PRESETS
// ---------------------------------------------------------------------------
const DEFAULT_CITIES: WorldCity[] = [
  { id: 'ist', name: 'New Delhi / Mumbai', country: 'India', timezone: 'Asia/Kolkata', flag: '🇮🇳', utcOffsetHours: 5.5 },
  { id: 'utc', name: 'UTC Coordinated', country: 'Universal', timezone: 'UTC', flag: '🌐', utcOffsetHours: 0 },
  { id: 'est', name: 'New York', country: 'United States (EDT/EST)', timezone: 'America/New_York', flag: '🇺🇸', utcOffsetHours: -4 },
  { id: 'gmt', name: 'London', country: 'United Kingdom (GMT/BST)', timezone: 'Europe/London', flag: '🇬🇧', utcOffsetHours: 1 },
  { id: 'pst', name: 'Los Angeles / SF', country: 'United States (PDT/PST)', timezone: 'America/Los_Angeles', flag: '🇺🇸', utcOffsetHours: -7 },
  { id: 'jst', name: 'Tokyo', country: 'Japan (JST)', timezone: 'Asia/Tokyo', flag: '🇯🇵', utcOffsetHours: 9 },
  { id: 'sgt', name: 'Singapore', country: 'Singapore (SGT)', timezone: 'Asia/Singapore', flag: '🇸🇬', utcOffsetHours: 8 },
  { id: 'gst', name: 'Dubai', country: 'United Arab Emirates (GST)', timezone: 'Asia/Dubai', flag: '🇦🇪', utcOffsetHours: 4 },
  { id: 'aest', name: 'Sydney', country: 'Australia (AEST)', timezone: 'Australia/Sydney', flag: '🇦🇺', utcOffsetHours: 10 },
  { id: 'cet', name: 'Paris / Berlin', country: 'European Union (CET/CEST)', timezone: 'Europe/Paris', flag: '🇪🇺', utcOffsetHours: 2 },
];

const TIMER_PRESETS = [
  { label: '1m', seconds: 60 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
  { label: '25m (Pomodoro)', seconds: 1500 },
  { label: '30m', seconds: 1800 },
  { label: '1h', seconds: 3600 },
];

const ALARM_LABELS = ['Morning Wake-Up ☀️', 'AI Coding Sprint ⚡', 'Hydrate & Stretch 💧', 'Meeting Briefing 📞', 'Power Nap 🧘'];
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ---------------------------------------------------------------------------
// SYSTEM NOTIFICATION DISPATCHER (With Action Callbacks & App Badge)
// ---------------------------------------------------------------------------
function dispatchSystemNotification(
  title: string,
  body: string,
  tag: string,
  onAction?: () => void
) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: `${tag}-${Date.now()}`,
        requireInteraction: true,
      } as NotificationOptions);

      notif.onclick = () => {
        window.focus();
        onAction?.();
        notif.close();
      };
    } catch (err) {
      console.warn('Notification constructor issue, falling back to serviceWorker:', err);
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/icon.svg',
            badge: '/icon.svg',
            tag,
            requireInteraction: true,
          });
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// SYNTHESIZED WEB AUDIO ENGINE (Continuous looping alarm & timer alerts)
// ---------------------------------------------------------------------------
class ClockAudioEngine {
  private ctx: AudioContext | null = null;
  private isAlarmPlaying = false;
  private alarmTimer: any = null;

  private getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playTick() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, t);
      gain.gain.setValueAtTime(0.025, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.035);
    } catch {}
  }

  public playLapChime() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, t); // B5
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    } catch {}
  }

  // Continuous looping alarm chime until stopped
  public startAlarmChime(soundType: 'chime' | 'pulse' | 'digital' | 'zen' = 'chime') {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;

    const playSequence = () => {
      if (!this.isAlarmPlaying) return;
      try {
        const ctx = this.getCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        if (soundType === 'pulse') {
          [0, 0.2].forEach((offset) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(850, now + offset);
            osc.frequency.exponentialRampToValueAtTime(420, now + offset + 0.15);
            gain.gain.setValueAtTime(0.18, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + offset);
            osc.stop(now + offset + 0.2);
          });
        } else if (soundType === 'zen') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(432, now);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.25);
        } else if (soundType === 'digital') {
          [0, 0.1, 0.2, 0.3].forEach((offset) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(2048, now + offset);
            gain.gain.setValueAtTime(0.08, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.06);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + offset);
            osc.stop(now + offset + 0.07);
          });
        } else {
          // Melodic futuristic chime (C5, E5, G5, C6 arpeggio)
          const frequencies = [587.33, 739.99, 880.0, 1174.66];
          frequencies.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const startTime = now + idx * 0.14;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.15, startTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.38);
          });
        }
      } catch {}

      // Vibrate mobile device
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([400, 200, 400, 200, 600]);
        }
      } catch {}

      this.alarmTimer = setTimeout(playSequence, 1200);
    };

    playSequence();
  }

  // Continuous timer completion alert loop until stopped
  public startTimerAlarmLoop() {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;

    const playTimerBeep = () => {
      if (!this.isAlarmPlaying) return;
      try {
        const ctx = this.getCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        // Triple harmonic ringing burst
        [0, 0.12, 0.24].forEach((offset, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const freq = idx === 2 ? 1046.5 : 880;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + offset);
          gain.gain.setValueAtTime(0.2, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.3);
        });
      } catch {}

      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([300, 150, 300, 150, 500]);
        }
      } catch {}

      this.alarmTimer = setTimeout(playTimerBeep, 1100);
    };

    playTimerBeep();
  }

  public stopAlarmChime() {
    this.isAlarmPlaying = false;
    if (this.alarmTimer) {
      clearTimeout(this.alarmTimer);
      this.alarmTimer = null;
    }
  }

  public isAlarmRinging(): boolean {
    return this.isAlarmPlaying;
  }
}

const clockAudio = new ClockAudioEngine();

// ---------------------------------------------------------------------------
// MAIN CLOCK TOOL COMPONENT
// ---------------------------------------------------------------------------
export function ClockTool({ onBack }: { onBack?: () => void }) {
  const [activeSubView, setActiveSubView] = useState<ClockSubView>('world');

  // Permission state
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  });

  // Active ringing alarm & timer alert modals
  const [ringingAlarm, setRingingAlarm] = useState<ClockAlarm | null>(null);
  const [timerAlert, setTimerAlert] = useState<{ active: boolean; durationSeconds: number } | null>(null);

  // Request browser notification permission
  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      notificationService.showInAppToast('Notifications Unsupported', 'Your browser does not support Web Notifications.', 'warning');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        notificationService.playSoftChime();
        dispatchSystemNotification(
          '⏰ Clock Notifications Active',
          'Alarms and countdown timers will alert you even if this tab is in the background.',
          'clock-init'
        );
        notificationService.showInAppToast('Notifications Enabled', 'System alerts are now active for Alarms & Timers.', 'success');
      } else {
        notificationService.showInAppToast('Notifications Denied', 'Falling back to in-app audio & toast alerts.', 'info');
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* SUB-NAVIGATION BAR (INSIDE CLOCK SUB-TAB)                          */}
      {/* ----------------------------------------------------------------- */}
      <div className="relative w-full rounded-2xl p-1.5 bg-[#030917]/90 border border-cyan-500/30 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden [contain:paint]">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {/* World Clock Tab */}
          <button
            onClick={() => setActiveSubView('world')}
            className={`group relative flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeSubView === 'world'
                ? 'bg-gradient-to-r from-cyan-500/25 via-blue-600/30 to-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <Globe
              className={`w-4 h-4 transition-transform duration-300 ${
                activeSubView === 'world' ? 'text-cyan-400 scale-110' : 'text-slate-400 group-hover:text-cyan-400'
              }`}
            />
            <span className="truncate">World Clock</span>
            {activeSubView === 'world' && (
              <span className="absolute bottom-1 w-6 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full shadow-[0_0_8px_#06b6d4]" />
            )}
          </button>

          {/* Alarm Tab */}
          <button
            onClick={() => setActiveSubView('alarm')}
            className={`group relative flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeSubView === 'alarm'
                ? 'bg-gradient-to-r from-cyan-500/25 via-blue-600/30 to-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <AlarmClock
              className={`w-4 h-4 transition-transform duration-300 ${
                activeSubView === 'alarm' ? 'text-cyan-400 scale-110' : 'text-slate-400 group-hover:text-cyan-400'
              }`}
            />
            <span className="truncate">Alarm</span>
            {activeSubView === 'alarm' && (
              <span className="absolute bottom-1 w-6 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full shadow-[0_0_8px_#06b6d4]" />
            )}
          </button>

          {/* Stopwatch Tab */}
          <button
            onClick={() => setActiveSubView('stopwatch')}
            className={`group relative flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeSubView === 'stopwatch'
                ? 'bg-gradient-to-r from-cyan-500/25 via-blue-600/30 to-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <TimerIcon
              className={`w-4 h-4 transition-transform duration-300 ${
                activeSubView === 'stopwatch' ? 'text-cyan-400 scale-110' : 'text-slate-400 group-hover:text-cyan-400'
              }`}
            />
            <span className="truncate">Stopwatch</span>
            {activeSubView === 'stopwatch' && (
              <span className="absolute bottom-1 w-6 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full shadow-[0_0_8px_#06b6d4]" />
            )}
          </button>

          {/* Timer Tab */}
          <button
            onClick={() => setActiveSubView('timer')}
            className={`group relative flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeSubView === 'timer'
                ? 'bg-gradient-to-r from-cyan-500/25 via-blue-600/30 to-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <ClockIcon
              className={`w-4 h-4 transition-transform duration-300 ${
                activeSubView === 'timer' ? 'text-cyan-400 scale-110' : 'text-slate-400 group-hover:text-cyan-400'
              }`}
            />
            <span className="truncate">Timer</span>
            {activeSubView === 'timer' && (
              <span className="absolute bottom-1 w-6 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full shadow-[0_0_8px_#06b6d4]" />
            )}
          </button>
        </div>
      </div>

      {/* Permission Status Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-xs">
        <div className="flex items-center gap-2">
          {notifPermission === 'granted' ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-slate-300">
            {notifPermission === 'granted'
              ? 'System Notifications Active — Will ring & alert even if tab is backgrounded'
              : 'Browser notifications not enabled for alarms & timers'}
          </span>
        </div>

        {notifPermission !== 'granted' && (
          <button
            onClick={handleRequestPermission}
            className="px-3 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 font-semibold cursor-pointer transition text-[11px]"
          >
            Enable Alerts
          </button>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 4 DEDICATED SUB-VIEWS                                             */}
      {/* ----------------------------------------------------------------- */}
      <div className="transition-opacity duration-200">
        {activeSubView === 'world' && <WorldClockView />}
        {activeSubView === 'alarm' && (
          <AlarmView
            onRequestPermission={handleRequestPermission}
            onTriggerAlarm={(alarm) => {
              setRingingAlarm(alarm);
              clockAudio.startAlarmChime(alarm.sound);

              // Persistent system notification
              const alarmTimeStr = `${String(alarm.hours).padStart(2, '0')}:${String(alarm.minutes).padStart(2, '0')} ${alarm.ampm}`;
              dispatchSystemNotification(
                `🔔 Alarm: ${alarm.label || 'Alarm'}`,
                `Time's up! (${alarmTimeStr})`,
                'alarm-ring',
                () => {
                  clockAudio.stopAlarmChime();
                  setRingingAlarm(null);
                }
              );

              notificationService.showInAppToast(
                `🔔 Alarm Ringing!`,
                `${alarm.label || 'Alarm'} (${alarmTimeStr})`,
                'alert'
              );
            }}
          />
        )}
        {activeSubView === 'stopwatch' && <StopwatchView />}
        {activeSubView === 'timer' && (
          <TimerView
            onRequestPermission={handleRequestPermission}
            onComplete={(durationSeconds) => {
              setTimerAlert({ active: true, durationSeconds });
              // Start continuous timer looping chime
              clockAudio.startTimerAlarmLoop();

              // Trigger system notification
              const minutes = Math.floor(durationSeconds / 60);
              const durText = minutes > 0 ? `${minutes} minute(s)` : `${durationSeconds} second(s)`;
              dispatchSystemNotification(
                '⏰ Timer Finished!',
                `Your timer for ${durText} has ended.`,
                'timer-complete',
                () => {
                  clockAudio.stopAlarmChime();
                  setTimerAlert(null);
                }
              );

              notificationService.showInAppToast(
                '⏰ Timer Finished!',
                `Your timer for ${durText} has ended.`,
                'alert'
              );
            }}
          />
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* ALARM RINGING POPUP MODAL                                         */}
      {/* ----------------------------------------------------------------- */}
      {ringingAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 liquid-glass-modal-backdrop animate-fade-in">
          <div className="relative w-full max-w-sm p-6 rounded-3xl liquid-glass-modal-container !border-cyan-400/50 shadow-[0_0_60px_rgba(6,182,212,0.6)] text-center space-y-5 overflow-hidden">
            <div className="liquid-glass-modal-glare" />
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-400">
              <span className="absolute inset-0 rounded-full animate-ping bg-cyan-400/30" />
              <Bell className="w-10 h-10 text-cyan-300 animate-bounce" />
            </div>

            <div className="space-y-1">
              <div className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold">
                ⚡ GKEDIT Alarm Alert
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{ringingAlarm.label || 'Alarm Ringing!'}</h2>
              <p className="text-sm font-mono text-cyan-300">
                {String(ringingAlarm.hours).padStart(2, '0')}:{String(ringingAlarm.minutes).padStart(2, '0')}{' '}
                {ringingAlarm.ampm}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => {
                  clockAudio.stopAlarmChime();
                  setRingingAlarm(null);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-base shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer transition active:scale-95"
              >
                Dismiss Alarm
              </button>
              <button
                onClick={() => {
                  clockAudio.stopAlarmChime();
                  setRingingAlarm(null);
                  notificationService.showInAppToast(
                    'Alarm Snoozed',
                    'Will ring again in 5 minutes.',
                    'info'
                  );
                }}
                className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 text-xs font-semibold cursor-pointer transition active:scale-95"
              >
                Snooze (+5 Minutes)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TIMER COMPLETE POPUP MODAL                                       */}
      {/* ----------------------------------------------------------------- */}
      {timerAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 liquid-glass-modal-backdrop animate-fade-in">
          <div className="relative w-full max-w-sm p-6 rounded-3xl liquid-glass-modal-container !border-emerald-400/50 shadow-[0_0_60px_rgba(16,185,129,0.5)] text-center space-y-5 overflow-hidden">
            <div className="liquid-glass-modal-glare" />
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400">
              <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/30" />
              <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-1">
              <div className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-bold">
                ✓ COUNTDOWN COMPLETED
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Time's Up!</h2>
              <p className="text-xs text-slate-300">
                Your countdown timer for {Math.floor(timerAlert.durationSeconds / 60)}m has finished.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  clockAudio.stopAlarmChime();
                  setTimerAlert(null);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer transition active:scale-95"
              >
                Dismiss Ringtone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// 1. WORLD CLOCK VIEW
// ===========================================================================
function WorldClockView() {
  const [selectedCity, setSelectedCity] = useState<WorldCity>(() => DEFAULT_CITIES[0]);
  const [savedCities, setSavedCities] = useState<WorldCity[]>(() => {
    try {
      const saved = localStorage.getItem('gkedit_clock_saved_cities');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CITIES.slice(0, 5);
  });
  const [isTickAudioEnabled, setIsTickAudioEnabled] = useState<boolean>(false);
  const [smoothSweep, setSmoothSweep] = useState<boolean>(true);
  const [isAddingCity, setIsAddingCity] = useState<boolean>(false);

  const [now, setNow] = useState<Date>(new Date());
  const requestRef = useRef<number | null>(null);
  const lastSecondRef = useRef<number>(now.getSeconds());

  useEffect(() => {
    const updateTime = () => {
      const currentDate = new Date();
      setNow(currentDate);

      if (isTickAudioEnabled && currentDate.getSeconds() !== lastSecondRef.current) {
        lastSecondRef.current = currentDate.getSeconds();
        clockAudio.playTick();
      }

      requestRef.current = requestAnimationFrame(updateTime);
    };

    requestRef.current = requestAnimationFrame(updateTime);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isTickAudioEnabled]);

  const handleToggleSaveCity = (city: WorldCity) => {
    const exists = savedCities.some((c) => c.id === city.id);
    let next: WorldCity[];
    if (exists) {
      if (savedCities.length <= 1) return;
      next = savedCities.filter((c) => c.id !== city.id);
    } else {
      next = [...savedCities, city];
    }
    setSavedCities(next);
    try {
      localStorage.setItem('gkedit_clock_saved_cities', JSON.stringify(next));
    } catch {}
  };

  const cityTime = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: selectedCity.timezone,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
        fractionalSecondDigits: 3,
      });

      const parts = formatter.formatToParts(now);
      let hours = 0;
      let minutes = 0;
      let seconds = 0;
      let fractional = 0;
      let ampm = 'AM';

      parts.forEach((p) => {
        if (p.type === 'hour') hours = parseInt(p.value, 10);
        if (p.type === 'minute') minutes = parseInt(p.value, 10);
        if (p.type === 'second') seconds = parseInt(p.value, 10);
        if (p.type === 'fractionalSecond') fractional = parseInt(p.value, 10);
        if (p.type === 'dayPeriod') ampm = p.value;
      });

      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: selectedCity.timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const formattedDate = dateFormatter.format(now);

      return {
        hours,
        minutes,
        seconds,
        milliseconds: fractional,
        ampm,
        formattedDate,
        raw24Hours: ampm === 'PM' && hours !== 12 ? hours + 12 : ampm === 'AM' && hours === 12 ? 0 : hours,
      };
    } catch {
      return {
        hours: now.getHours() % 12 || 12,
        minutes: now.getMinutes(),
        seconds: now.getSeconds(),
        milliseconds: now.getMilliseconds(),
        ampm: now.getHours() >= 12 ? 'PM' : 'AM',
        formattedDate: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        raw24Hours: now.getHours(),
      };
    }
  }, [now, selectedCity.timezone]);

  const secondFrac = smoothSweep ? cityTime.seconds + cityTime.milliseconds / 1000 : cityTime.seconds;
  const secondAngle = secondFrac * 6;
  const minuteAngle = (cityTime.minutes + secondFrac / 60) * 6;
  const hourAngle = ((cityTime.hours % 12) + cityTime.minutes / 60 + secondFrac / 3600) * 30;
  const isDaytime = cityTime.raw24Hours >= 6 && cityTime.raw24Hours < 18;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-[#061226]/90 via-[#030917]/95 to-[#020612] border border-cyan-500/30 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-cyan-500/15">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl select-none">{selectedCity.flag || '🌐'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">{selectedCity.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  {selectedCity.id.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span>{selectedCity.country}</span>
                <span className="text-slate-600">·</span>
                <span className="text-cyan-300 font-mono">
                  {selectedCity.utcOffsetHours >= 0
                    ? `UTC+${selectedCity.utcOffsetHours}`
                    : `UTC${selectedCity.utcOffsetHours}`}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTickAudioEnabled(!isTickAudioEnabled)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                isTickAudioEnabled
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isTickAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Tick Sound</span>
            </button>

            <button
              onClick={() => setSmoothSweep(!smoothSweep)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                smoothSweep
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{smoothSweep ? 'Smooth' : 'Step'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-6">
          <div className="relative shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/10 to-transparent blur-xl pointer-events-none" />

            <svg
              className="w-64 h-64 sm:w-72 sm:h-72 select-none filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
              viewBox="0 0 240 240"
            >
              <defs>
                <radialGradient id="dialGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0b1b36" />
                  <stop offset="65%" stopColor="#061226" />
                  <stop offset="100%" stopColor="#020817" />
                </radialGradient>
                <linearGradient id="bezelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="35%" stopColor="#1e3a8a" />
                  <stop offset="70%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#0891b2" />
                </linearGradient>
                <linearGradient id="hourHandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="minHandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <filter id="secondGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle cx="120" cy="120" r="116" fill="#020713" stroke="url(#bezelGradient)" strokeWidth="3" />
              <circle cx="120" cy="120" r="111" fill="url(#dialGradient)" stroke="#0e294b" strokeWidth="1" />
              <circle cx="120" cy="120" r="92" fill="none" stroke="rgba(6,182,212,0.18)" strokeWidth="0.8" strokeDasharray="2,3" />

              {Array.from({ length: 60 }).map((_, i) => {
                const isHour = i % 5 === 0;
                const angle = (i * 6 * Math.PI) / 180;
                const rOuter = 107;
                const rInner = isHour ? 97 : 103;
                const x1 = 120 + rOuter * Math.sin(angle);
                const y1 = 120 - rOuter * Math.cos(angle);
                const x2 = 120 + rInner * Math.sin(angle);
                const y2 = 120 - rInner * Math.cos(angle);

                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isHour ? '#22d3ee' : 'rgba(148,163,184,0.35)'}
                    strokeWidth={isHour ? 2 : 0.9}
                    strokeLinecap="round"
                  />
                );
              })}

              {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => {
                const angle = (num * 30 * Math.PI) / 180;
                const r = 84;
                const x = 120 + r * Math.sin(angle);
                const y = 120 - r * Math.cos(angle);

                return (
                  <text
                    key={num}
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    fill={num % 3 === 0 ? '#38bdf8' : '#94a3b8'}
                    fontSize={num % 3 === 0 ? '11.5' : '10'}
                    fontWeight={num % 3 === 0 ? '800' : '600'}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {num}
                  </text>
                );
              })}

              <text x="120" y="68" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontWeight="800" letterSpacing="1.8">
                GKEDIT AI
              </text>
              <text x="120" y="77" textAnchor="middle" fill="#f59e0b" fontSize="5.5" fontWeight="600" letterSpacing="1">
                CHRONOMETER
              </text>

              <g transform="translate(120, 155)">
                <circle cx="0" cy="0" r="10" fill="#040c1d" stroke="#0284c7" strokeWidth="0.8" />
                <text x="0" y="3.5" textAnchor="middle" fontSize="10">
                  {isDaytime ? '☀️' : '🌙'}
                </text>
              </g>

              {/* Hour Hand */}
              <g transform={`rotate(${hourAngle}, 120, 120)`}>
                <rect x="117.5" y="70" width="5" height="50" rx="2.5" fill="url(#hourHandGrad)" />
                <polygon points="120,62 117.5,70 122.5,70" fill="#fbbf24" />
              </g>

              {/* Minute Hand */}
              <g transform={`rotate(${minuteAngle}, 120, 120)`}>
                <rect x="118.5" y="44" width="3" height="76" rx="1.5" fill="url(#minHandGrad)" />
                <polygon points="120,36 118.5,44 121.5,44" fill="#38bdf8" />
              </g>

              {/* Second Hand */}
              <g transform={`rotate(${secondAngle}, 120, 120)`} filter="url(#secondGlow)">
                <line x1="120" y1="26" x2="120" y2="120" stroke="#00e5ff" strokeWidth="1.4" strokeLinecap="round" />
                <line x1="120" y1="120" x2="120" y2="142" stroke="#00e5ff" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="120" cy="142" r="3.5" fill="#f59e0b" />
              </g>

              <circle cx="120" cy="120" r="5" fill="#f59e0b" stroke="#020817" strokeWidth="1" />
              <circle cx="120" cy="120" r="2" fill="#00e5ff" />
            </svg>
          </div>

          <div className="flex-1 text-center lg:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-xs font-mono text-cyan-300">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isDaytime ? 'Daytime In Selected Zone' : 'Nighttime In Selected Zone'}</span>
            </div>

            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-white flex items-baseline justify-center lg:justify-start gap-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  {String(cityTime.hours).padStart(2, '0')}:{String(cityTime.minutes).padStart(2, '0')}:
                  {String(cityTime.seconds).padStart(2, '0')}
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400">{cityTime.ampm}</span>
              </div>
              <p className="text-sm sm:text-base text-slate-300 font-medium">{cityTime.formattedDate}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 space-y-0.5">
                <div className="text-[11px] font-mono text-slate-400">IANA Timezone</div>
                <div className="text-xs sm:text-sm font-semibold text-cyan-200 truncate">{selectedCity.timezone}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 space-y-0.5">
                <div className="text-[11px] font-mono text-slate-400">Greenwich Offset</div>
                <div className="text-xs sm:text-sm font-semibold text-amber-300">
                  {selectedCity.utcOffsetHours >= 0 ? `+${selectedCity.utcOffsetHours} hrs` : `${selectedCity.utcOffsetHours} hrs`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Saved World Cities & Time Zones
            </h3>
          </div>
          <button
            onClick={() => setIsAddingCity(!isAddingCity)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingCity ? 'Done' : 'Add Time Zone'}</span>
          </button>
        </div>

        {isAddingCity && (
          <div className="p-4 rounded-2xl bg-[#030917] border border-cyan-500/30 space-y-3 animate-fade-in">
            <div className="text-xs font-semibold text-slate-300">Tap a time zone to pin/unpin to your deck:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEFAULT_CITIES.map((city) => {
                const isSaved = savedCities.some((c) => c.id === city.id);
                return (
                  <button
                    key={city.id}
                    onClick={() => handleToggleSaveCity(city)}
                    className={`p-2.5 rounded-xl text-left border text-xs font-semibold flex items-center justify-between gap-2 transition cursor-pointer ${
                      isSaved
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{city.flag} {city.name}</span>
                    {isSaved && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {savedCities.map((city) => {
            const isCurrentSelected = selectedCity.id === city.id;
            let cardTime = '00:00 AM';
            let cardDay = true;
            try {
              const fmt = new Intl.DateTimeFormat('en-US', {
                timeZone: city.timezone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              });
              cardTime = fmt.format(now);
              const hourNum = parseInt(
                new Intl.DateTimeFormat('en-US', { timeZone: city.timezone, hour: 'numeric', hour12: false }).format(now),
                10
              );
              cardDay = hourNum >= 6 && hourNum < 18;
            } catch {}

            return (
              <div
                key={city.id}
                onClick={() => setSelectedCity(city)}
                className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  isCurrentSelected
                    ? 'bg-gradient-to-br from-[#0c2242] to-[#040e20] border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                    : 'bg-[#040b18]/80 hover:bg-[#071328] border-cyan-500/20 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{city.flag || '🌐'}</span>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-200 transition">
                        {city.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{city.country}</p>
                    </div>
                  </div>
                  <span className="p-1 rounded-lg bg-slate-900/60 text-xs">
                    {cardDay ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-cyan-300" />}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex items-baseline justify-between">
                  <span className="text-lg font-mono font-bold text-cyan-300">
                    {cardTime}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-slate-400">
                    {city.utcOffsetHours >= 0 ? `+${city.utcOffsetHours}h` : `${city.utcOffsetHours}h`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// 2. ALARM VIEW (Background-Resilient, Persistent System Notifications)
// ===========================================================================
function AlarmView({
  onTriggerAlarm,
  onRequestPermission,
}: {
  onTriggerAlarm: (alarm: ClockAlarm) => void;
  onRequestPermission: () => void;
}) {
  const [alarms, setAlarms] = useState<ClockAlarm[]>(() => {
    try {
      const saved = localStorage.getItem('gkedit_clock_alarms');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'alarm_1',
        hours: 7,
        minutes: 0,
        ampm: 'AM',
        label: 'Morning Wake-Up ☀️',
        enabled: true,
        repeatDays: [1, 2, 3, 4, 5],
        sound: 'chime',
        createdAt: Date.now(),
      },
    ];
  });

  const [isCreating, setIsCreating] = useState(false);
  const [formHours, setFormHours] = useState(8);
  const [formMinutes, setFormMinutes] = useState(0);
  const [formAmpm, setFormAmpm] = useState<'AM' | 'PM'>('AM');
  const [formLabel, setFormLabel] = useState('AI Sprint Checkpoint');
  const [formDays, setFormDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [formSound, setFormSound] = useState<'chime' | 'pulse' | 'digital' | 'zen'>('chime');

  const triggeredMinutesRef = useRef<Set<string>>(new Set());

  const saveAlarms = (newAlarms: ClockAlarm[]) => {
    setAlarms(newAlarms);
    try {
      localStorage.setItem('gkedit_clock_alarms', JSON.stringify(newAlarms));
    } catch {}
  };

  // Check current time against scheduled alarms using Date timestamps
  const checkAlarms = useCallback(() => {
    const now = new Date();
    const currentHours24 = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentDay = now.getDay();

    const currentHours12 = currentHours24 % 12 || 12;
    const currentAmpm: 'AM' | 'PM' = currentHours24 >= 12 ? 'PM' : 'AM';

    const minuteKey = `${currentHours12}:${currentMinutes}:${currentAmpm}:${now.getFullYear()}:${now.getMonth()}:${now.getDate()}`;

    if (!triggeredMinutesRef.current.has(minuteKey)) {
      alarms.forEach((alarm) => {
        if (!alarm.enabled) return;
        const matchesDay = alarm.repeatDays.length === 0 || alarm.repeatDays.includes(currentDay);

        if (matchesDay && alarm.hours === currentHours12 && alarm.minutes === currentMinutes && alarm.ampm === currentAmpm) {
          triggeredMinutesRef.current.add(minuteKey);
          onTriggerAlarm(alarm);

          if (alarm.repeatDays.length === 0) {
            const updated = alarms.map((a) => (a.id === alarm.id ? { ...a, enabled: false } : a));
            saveAlarms(updated);
          }
        }
      });
    }
  }, [alarms, onTriggerAlarm]);

  useEffect(() => {
    const interval = setInterval(checkAlarms, 1000);
    const handleVisibility = () => {
      if (!document.hidden) checkAlarms();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkAlarms]);

  const handleToggleAlarm = (id: string) => {
    const updated = alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    saveAlarms(updated);
  };

  const handleDeleteAlarm = (id: string) => {
    const updated = alarms.filter((a) => a.id !== id);
    saveAlarms(updated);
  };

  const handleCreateAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestPermission();

    const newAlarm: ClockAlarm = {
      id: 'alarm_' + Date.now(),
      hours: formHours,
      minutes: formMinutes,
      ampm: formAmpm,
      label: formLabel || 'Alarm',
      enabled: true,
      repeatDays: formDays,
      sound: formSound,
      createdAt: Date.now(),
    };

    saveAlarms([newAlarm, ...alarms]);
    setIsCreating(false);
    notificationService.showInAppToast(
      'Alarm Scheduled',
      `Set for ${String(formHours).padStart(2, '0')}:${String(formMinutes).padStart(2, '0')} ${formAmpm}`,
      'success'
    );
  };

  const toggleDay = (dayIndex: number) => {
    if (formDays.includes(dayIndex)) {
      setFormDays(formDays.filter((d) => d !== dayIndex));
    } else {
      setFormDays([...formDays, dayIndex].sort());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AlarmClock className="w-5 h-5 text-cyan-400" />
            <span>Alarms & Chime Alerts</span>
          </h3>
          <p className="text-xs text-slate-400">Set wake-up chimes, work sprints & recurring task alerts</p>
        </div>
        <button
          onClick={() => {
            onRequestPermission();
            setIsCreating(!isCreating);
          }}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Cancel' : 'Set Alarm'}</span>
        </button>
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreateAlarm}
          className="p-5 rounded-3xl bg-gradient-to-b from-[#08152c] to-[#040b18] border border-cyan-500/40 shadow-[0_8px_30px_rgba(0,0,0,0.5)] space-y-5 animate-fade-in"
        >
          <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Configure New Alarm Time</span>
          </div>

          <div className="flex items-center justify-center gap-3 py-2">
            <div className="flex flex-col items-center">
              <label className="text-[10px] text-slate-400 font-mono mb-1">HOUR</label>
              <select
                value={formHours}
                onChange={(e) => setFormHours(parseInt(e.target.value, 10))}
                className="w-18 py-3 rounded-2xl bg-slate-900 border border-cyan-400/40 text-center text-2xl font-bold font-mono text-cyan-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h} className="bg-slate-900 text-white">
                    {String(h).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-3xl font-bold text-cyan-400 self-center mt-4">:</span>

            <div className="flex flex-col items-center">
              <label className="text-[10px] text-slate-400 font-mono mb-1">MINUTE</label>
              <select
                value={formMinutes}
                onChange={(e) => setFormMinutes(parseInt(e.target.value, 10))}
                className="w-18 py-3 rounded-2xl bg-slate-900 border border-cyan-400/40 text-center text-2xl font-bold font-mono text-cyan-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {String(m).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-center ml-2 mt-4">
              <div className="inline-flex rounded-2xl p-1 bg-slate-900 border border-white/10">
                <button
                  type="button"
                  onClick={() => setFormAmpm('AM')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                    formAmpm === 'AM'
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setFormAmpm('PM')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                    formAmpm === 'PM'
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Alarm Label</label>
            <input
              type="text"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              placeholder="e.g. Morning Sprint, Drink Water..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ALARM_LABELS.map((lbl) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setFormLabel(lbl)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800/60 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-200 border border-white/5 transition cursor-pointer"
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Repeat Frequency</span>
              <span className="text-[11px] font-mono text-cyan-400">
                {formDays.length === 0 ? 'Once Only' : formDays.length === 7 ? 'Every Day' : `${formDays.length} Days/Wk`}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((day, idx) => {
                const active = formDays.includes(idx);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      active
                        ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Alarm Tone</span>
              <button
                type="button"
                onClick={() => {
                  clockAudio.startAlarmChime(formSound);
                  setTimeout(() => clockAudio.stopAlarmChime(), 1500);
                }}
                className="text-[11px] font-mono text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3 h-3" />
                <span>Test Audio</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['chime', 'pulse', 'digital', 'zen'] as const).map((snd) => (
                <button
                  key={snd}
                  type="button"
                  onClick={() => setFormSound(snd)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider font-mono border transition cursor-pointer ${
                    formSound === snd
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {snd}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer transition"
            >
              Save Alarm
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm cursor-pointer transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {alarms.length === 0 ? (
          <div className="text-center py-12 rounded-3xl bg-[#040b18]/60 border border-white/5 space-y-2">
            <AlarmClock className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-400">No active alarms</div>
            <p className="text-xs text-slate-500">Tap "Set Alarm" to create your first wake-up or reminder chime.</p>
          </div>
        ) : (
          alarms.map((alarm) => {
            const repeatText =
              alarm.repeatDays.length === 0
                ? 'Once'
                : alarm.repeatDays.length === 7
                ? 'Every day'
                : alarm.repeatDays.map((d) => DAYS_OF_WEEK[d]).join(', ');

            return (
              <div
                key={alarm.id}
                className={`relative p-5 rounded-3xl border transition-all duration-300 ${
                  alarm.enabled
                    ? 'bg-gradient-to-r from-[#071733] via-[#040f24] to-[#020713] border-cyan-500/40 shadow-[0_4px_20px_rgba(6,182,212,0.15)]'
                    : 'bg-[#030917]/70 border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                        {String(alarm.hours).padStart(2, '0')}:{String(alarm.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-base font-bold font-mono text-cyan-400">{alarm.ampm}</span>
                    </div>

                    <div className="text-sm font-medium text-slate-200">{alarm.label}</div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <span>{repeatText}</span>
                      <span>·</span>
                      <span className="uppercase text-amber-300">{alarm.sound}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleAlarm(alarm.id)}
                      className={`relative w-14 h-8 rounded-full p-1 transition-colors duration-300 cursor-pointer ${
                        alarm.enabled
                          ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                          : 'bg-slate-800 border border-white/10'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full bg-white transition-transform duration-300 shadow-md ${
                          alarm.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteAlarm(alarm.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Delete Alarm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// 3. STOPWATCH VIEW
// ===========================================================================
function StopwatchView() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [laps, setLaps] = useState<StopwatchLap[]>([]);
  const [copiedLaps, setCopiedLaps] = useState(false);

  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = performance.now() - elapsedTime;

      const update = () => {
        setElapsedTime(performance.now() - startTimeRef.current);
        animationFrameRef.current = requestAnimationFrame(update);
      };

      animationFrameRef.current = requestAnimationFrame(update);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRunning, elapsedTime]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setLaps([]);
  };

  const handleLap = () => {
    if (!isRunning && elapsedTime === 0) return;
    clockAudio.playLapChime();

    const currentTotal = elapsedTime;
    const lastTotal = laps.length > 0 ? laps[0].totalTimeMs : 0;
    const lapTime = currentTotal - lastTotal;

    const newLap: StopwatchLap = {
      id: 'lap_' + (laps.length + 1),
      lapNumber: laps.length + 1,
      lapTimeMs: lapTime,
      totalTimeMs: currentTotal,
    };

    setLaps([newLap, ...laps]);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const hundredths = Math.floor((ms % 1000) / 10);

    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      hundredths: String(hundredths).padStart(2, '0'),
    };
  };

  const timeParts = formatTime(elapsedTime);

  const { fastestLapId, slowestLapId } = useMemo(() => {
    if (laps.length < 2) return { fastestLapId: null, slowestLapId: null };
    let min = laps[0].lapTimeMs;
    let max = laps[0].lapTimeMs;
    let minId = laps[0].id;
    let maxId = laps[0].id;

    laps.forEach((l) => {
      if (l.lapTimeMs < min) {
        min = l.lapTimeMs;
        minId = l.id;
      }
      if (l.lapTimeMs > max) {
        max = l.lapTimeMs;
        maxId = l.id;
      }
    });

    return { fastestLapId: minId, slowestLapId: maxId };
  }, [laps]);

  const copyLapHistory = () => {
    if (laps.length === 0) return;
    const text = laps
      .map((l) => {
        const lapFmt = formatTime(l.lapTimeMs);
        const totFmt = formatTime(l.totalTimeMs);
        return `Lap ${l.lapNumber}: ${lapFmt.minutes}:${lapFmt.seconds}.${lapFmt.hundredths} (Total: ${totFmt.minutes}:${totFmt.seconds}.${totFmt.hundredths})`;
      })
      .join('\n');

    navigator.clipboard.writeText(`GKEDIT AI Stopwatch Lap Splits:\n${text}`);
    setCopiedLaps(true);
    setTimeout(() => setCopiedLaps(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-b from-[#061226]/90 via-[#030917]/95 to-[#020612] border border-cyan-500/30 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-center space-y-6">
        <div
          className={`absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-500 ${
            isRunning ? 'bg-cyan-500/5 opacity-100' : 'opacity-0'
          }`}
        />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-xs font-mono text-cyan-300">
          <TimerIcon className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>Precision 1/100s Chronograph</span>
        </div>

        <div className="flex items-baseline justify-center gap-1 sm:gap-2">
          <span className="text-5xl sm:text-7xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            {timeParts.hours}:{timeParts.minutes}:{timeParts.seconds}
          </span>
          <span className="text-2xl sm:text-4xl font-black font-mono text-cyan-400">
            .{timeParts.hundredths}
          </span>
        </div>

        <div className="w-full max-w-md mx-auto h-1.5 rounded-full bg-slate-900 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-amber-400 transition-all duration-75"
            style={{ width: `${(elapsedTime % 1000) / 10}%` }}
          />
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-4 pt-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-base flex items-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] cursor-pointer transition transform active:scale-95"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>{elapsedTime === 0 ? 'Start' : 'Resume'}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-base flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer transition transform active:scale-95"
            >
              <Pause className="w-5 h-5 fill-slate-950" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleLap}
            disabled={!isRunning && elapsedTime === 0}
            className="px-6 py-3.5 rounded-2xl bg-slate-900 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10 font-bold text-sm flex items-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95"
          >
            <Flag className="w-4 h-4 text-cyan-400" />
            <span>Lap</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isRunning || elapsedTime === 0}
            className="px-5 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-400/40 font-semibold text-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {laps.length > 0 && (
        <div className="rounded-3xl p-5 bg-[#030917]/90 border border-cyan-500/20 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5" />
              <span>Recorded Laps ({laps.length})</span>
            </h4>

            <button
              onClick={copyLapHistory}
              className="text-xs font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition"
            >
              {copiedLaps ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLaps ? 'Copied' : 'Copy Laps'}</span>
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {laps.map((lap) => {
              const lapFmt = formatTime(lap.lapTimeMs);
              const totalFmt = formatTime(lap.totalTimeMs);
              const isFastest = lap.id === fastestLapId;
              const isSlowest = lap.id === slowestLapId;

              return (
                <div
                  key={lap.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-mono transition ${
                    isFastest
                      ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-300'
                      : isSlowest
                      ? 'bg-amber-500/10 border-amber-400/40 text-amber-300'
                      : 'bg-slate-900/60 border-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">#{String(lap.lapNumber).padStart(2, '0')}</span>
                    {isFastest && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold">
                        FASTEST
                      </span>
                    )}
                    {isSlowest && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-400 font-bold">
                        SLOWEST
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-slate-400 text-[10px]">SPLIT</div>
                      <div className="font-bold">
                        +{lapFmt.minutes}:{lapFmt.seconds}.{lapFmt.hundredths}
                      </div>
                    </div>

                    <div className="text-right pl-3 border-l border-white/10">
                      <div className="text-slate-400 text-[10px]">TOTAL</div>
                      <div className="text-white font-semibold">
                        {totalFmt.hours}:{totalFmt.minutes}:{totalFmt.seconds}.{totalFmt.hundredths}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// 4. TIMER VIEW (Background-Resilient with Timestamp Drift Protection)
// ===========================================================================
function TimerView({
  onComplete,
  onRequestPermission,
}: {
  onComplete: (durationSeconds: number) => void;
  onRequestPermission: () => void;
}) {
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(300);
  const [remainingSeconds, setRemainingSeconds] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [isSettingCustom, setIsSettingCustom] = useState(false);

  // Custom Input State
  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(5);
  const [inputSeconds, setInputSeconds] = useState(0);

  // Background drift protection: target end timestamp
  const targetEndTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Drift-immune countdown timer using Date.now()
  useEffect(() => {
    if (isRunning) {
      if (!targetEndTimeRef.current) {
        targetEndTimeRef.current = Date.now() + remainingSeconds * 1000;
      }

      const checkTick = () => {
        if (!targetEndTimeRef.current) return;
        const now = Date.now();
        const secondsLeft = Math.max(0, Math.round((targetEndTimeRef.current - now) / 1000));
        setRemainingSeconds(secondsLeft);

        if (secondsLeft <= 0) {
          clearInterval(timerIntervalRef.current);
          targetEndTimeRef.current = null;
          setIsRunning(false);
          onComplete(totalDurationSeconds);
        }
      };

      timerIntervalRef.current = setInterval(checkTick, 500);

      const handleVisibilityChange = () => {
        if (!document.hidden && targetEndTimeRef.current) {
          checkTick();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  }, [isRunning, onComplete, totalDurationSeconds]);

  const handleStart = () => {
    onRequestPermission();
    if (remainingSeconds === 0) {
      setRemainingSeconds(totalDurationSeconds);
      targetEndTimeRef.current = Date.now() + totalDurationSeconds * 1000;
    } else {
      targetEndTimeRef.current = Date.now() + remainingSeconds * 1000;
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
  };

  const handleReset = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setRemainingSeconds(totalDurationSeconds);
  };

  const handleAddMinute = () => {
    setRemainingSeconds((prev) => {
      const next = prev + 60;
      if (targetEndTimeRef.current) {
        targetEndTimeRef.current += 60000;
      }
      return next;
    });
    setTotalDurationSeconds((prev) => prev + 60);
  };

  const handleSelectPreset = (seconds: number) => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setTotalDurationSeconds(seconds);
    setRemainingSeconds(seconds);
    setIsSettingCustom(false);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const calculated = inputHours * 3600 + inputMinutes * 60 + inputSeconds;
    if (calculated <= 0) return;
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setTotalDurationSeconds(calculated);
    setRemainingSeconds(calculated);
    setIsSettingCustom(false);
  };

  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  const progressFraction = totalDurationSeconds > 0 ? remainingSeconds / totalDurationSeconds : 0;
  const strokeDashoffset = circumference - progressFraction * circumference;

  const formatSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return {
      hours: String(h).padStart(2, '0'),
      minutes: String(m).padStart(2, '0'),
      seconds: String(s).padStart(2, '0'),
    };
  };

  const timeFmt = formatSeconds(remainingSeconds);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-[#061226]/90 via-[#030917]/95 to-[#020612] border border-cyan-500/30 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-xs font-mono text-cyan-300">
          <ClockIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive Countdown Timer</span>
        </div>

        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 220 220">
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            <circle cx="110" cy="110" r={radius} stroke="rgba(14, 41, 75, 0.6)" strokeWidth="10" fill="transparent" />
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="url(#timerGradient)"
              strokeWidth="11"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-[stroke-dashoffset] duration-500 ease-linear"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-1">
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              {timeFmt.hours !== '00' && <span>{timeFmt.hours}:</span>}
              <span>{timeFmt.minutes}:</span>
              <span>{timeFmt.seconds}</span>
            </div>

            <div className="text-xs font-mono font-semibold text-cyan-300">
              {Math.round(progressFraction * 100)}% REMAINING
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-base flex items-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] cursor-pointer transition transform active:scale-95"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>{remainingSeconds === 0 ? 'Restart' : 'Start'}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-base flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer transition transform active:scale-95"
            >
              <Pause className="w-5 h-5 fill-slate-950" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleAddMinute}
            className="px-4 py-3.5 rounded-2xl bg-slate-900 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10 font-mono font-bold text-sm transition cursor-pointer transform active:scale-95"
            title="Add +1 Minute"
          >
            +1 Min
          </button>

          <button
            onClick={handleReset}
            className="px-5 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white font-semibold text-sm flex items-center gap-1.5 transition cursor-pointer transform active:scale-95"
            title="Reset Countdown"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Quick Countdown Presets
            </h4>
          </div>

          <button
            onClick={() => setIsSettingCustom(!isSettingCustom)}
            className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
          >
            {isSettingCustom ? 'Close Custom' : 'Custom Input'}
          </button>
        </div>

        {isSettingCustom && (
          <form
            onSubmit={handleApplyCustom}
            className="p-5 rounded-3xl bg-[#030917] border border-cyan-500/30 space-y-4 animate-fade-in"
          >
            <div className="text-xs font-semibold text-slate-300">Set Custom Duration (HH:MM:SS):</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400">HOURS</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={inputHours}
                  onChange={(e) => setInputHours(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono font-bold text-center focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400">MINUTES</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputMinutes}
                  onChange={(e) => setInputMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono font-bold text-center focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400">SECONDS</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputSeconds}
                  onChange={(e) => setInputSeconds(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono font-bold text-center focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer transition"
            >
              Set Countdown Duration
            </button>
          </form>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {TIMER_PRESETS.map((preset) => {
            const isCurrent = totalDurationSeconds === preset.seconds;
            return (
              <button
                key={preset.label}
                onClick={() => handleSelectPreset(preset.seconds)}
                className={`py-3 px-3 rounded-2xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-gradient-to-r from-cyan-500/25 via-blue-600/30 to-cyan-500/20 text-cyan-200 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-[#040b18]/80 hover:bg-[#071328] border-white/5 text-slate-300 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
