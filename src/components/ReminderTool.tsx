import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Volume2,
  Calendar,
  Sparkles,
  Repeat,
} from 'lucide-react';
import { reminderService, JarvisReminder } from '../services/reminderService.ts';

const QUICK_PRESETS = [
  { label: 'Drink Water (30m)', delayMins: 30, title: 'Drink Water 💧' },
  { label: 'Rest Eyes (45m)', delayMins: 45, title: 'Rest Eyes & Screen Break 👁️' },
  { label: 'Upload Video (2h)', delayMins: 120, title: 'Upload & Review Video 🎬' },
  { label: 'Study Sprint (60m)', delayMins: 60, title: 'Study & Coding Sprint 📚' },
];

export function ReminderTool() {
  const [reminders, setReminders] = useState<JarvisReminder[]>([]);
  const [title, setTitle] = useState('');
  const [timeMode, setTimeMode] = useState<'quick' | 'datetime'>('quick');
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [customTime, setCustomTime] = useState(
    new Date(Date.now() + 15 * 60 * 1000).toTimeString().slice(0, 5)
  );
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'hourly'>('none');
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
    return reminderService.subscribe(setReminders);
  }, []);

  const handleRequestChromePermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm === 'granted') {
          // Send an immediate test Chrome notification so the user confirms it works!
          reminderService.triggerAlarm({
            id: 'test_' + Date.now(),
            title: 'Chrome Notifications Verified ✓ (GKEDIT AI)',
            remindAt: Date.now(),
            triggered: true,
            createdAt: Date.now(),
          });
        }
      } catch (e) {
        console.warn('Chrome permission request:', e);
      }
    }
  };

  const handleTestNow = () => {
    reminderService.triggerAlarm({
      id: 'test_' + Date.now(),
      title: title.trim() || 'Real Chrome Notification Test from GKEDIT AI ⚡',
      remindAt: Date.now(),
      triggered: true,
      createdAt: Date.now(),
    });
    setAddedFeedback('Sent real Chrome notification right now! Check your screen/notification tray ✓');
    setTimeout(() => setAddedFeedback(null), 4000);
  };

  const handleAddQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Auto-request Chrome permission if still default
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        const p = await Notification.requestPermission();
        setNotifPermission(p);
      } catch {}
    }

    let targetTime = Date.now();
    if (timeMode === 'quick') {
      targetTime = Date.now() + delayMinutes * 60 * 1000;
    } else {
      const dt = new Date(`${customDate}T${customTime}`);
      targetTime = dt.getTime();
      if (isNaN(targetTime) || targetTime <= Date.now()) {
        targetTime = Date.now() + 5 * 60 * 1000; // Fallback to 5 mins
      }
    }

    const created = reminderService.addReminder(title.trim(), targetTime, repeat);
    setTitle('');
    setAddedFeedback(`Reminder set for ${new Date(created.remindAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓`);
    setTimeout(() => setAddedFeedback(null), 3000);
  };

  const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    const target = Date.now() + preset.delayMins * 60 * 1000;
    reminderService.addReminder(preset.title, target, 'none');
    setAddedFeedback(`"${preset.title}" set for ${preset.delayMins}m ✓`);
    setTimeout(() => setAddedFeedback(null), 3000);
  };

  const handleDelete = (id: string) => {
    reminderService.deleteReminder(id);
  };

  const handleClearCompleted = () => {
    reminderService.clearTriggered();
  };

  const activeReminders = reminders.filter((r) => !r.triggered);
  const completedReminders = reminders.filter((r) => r.triggered);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-5 rounded-3xl bg-[#041029]/80 border border-cyan-500/25 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span>J.A.R.V.I.S Smart Reminders & Alarms</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Natural voice reminders with speech synthesis, audio chimes, and browser push notifications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
              Active: {activeReminders.length}
            </span>
            {completedReminders.length > 0 && (
              <button
                onClick={handleClearCompleted}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                Clear Past
              </button>
            )}
          </div>
        </div>

        {/* Quick 1-Tap Presets */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[11px] text-cyan-400/80 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Quick Presets:
          </span>
          {QUICK_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-blue-950/70 border border-cyan-500/30 text-slate-300 hover:text-cyan-200 hover:border-cyan-400 transition active:scale-95"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Chrome Push / System Notification Status Banner */}
        {notifPermission !== 'granted' && (
          <div className="pt-2">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/70 to-blue-950/70 border border-cyan-400/40 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-cyan-200">
                <Bell className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
                <span>
                  Enable <strong>Chrome System Notifications</strong> so J.A.R.V.I.S alarms pop up even when Chrome is minimized.
                </span>
              </div>
              <button
                type="button"
                onClick={handleRequestChromePermission}
                className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[11px] whitespace-nowrap shadow-md transition"
              >
                Enable in Chrome
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reminder Creator Form */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Schedule New Reminder</span>
        </h3>

        <form onSubmit={handleAddQuick} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              What should JARVIS remind you about?
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Drink water, Call editor, Review YouTube thumbnail, Take medicine..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#020713] border border-cyan-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Time Picker Tabs */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTimeMode('quick')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  timeMode === 'quick'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                In Minutes / Hours
              </button>
              <button
                type="button"
                onClick={() => setTimeMode('datetime')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  timeMode === 'datetime'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Specific Date & Time
              </button>
            </div>

            {timeMode === 'quick' ? (
              <div className="flex items-center gap-2 flex-wrap">
                {[5, 10, 15, 30, 45, 60, 120].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDelayMinutes(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      delayMinutes === m
                        ? 'bg-blue-600 text-white border border-cyan-400'
                        : 'bg-[#020713] border border-cyan-500/20 text-slate-300 hover:border-cyan-400'
                    }`}
                  >
                    {m < 60 ? `${m}m` : `${m / 60}h`}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#020713] border border-cyan-500/30 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Time</label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#020713] border border-cyan-500/30 text-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as any)}
                className="bg-[#020713] border border-cyan-500/30 text-slate-300 text-xs rounded-xl px-2.5 py-1.5"
              >
                <option value="none">Does not repeat</option>
                <option value="hourly">Repeat Hourly</option>
                <option value="daily">Repeat Daily</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestNow}
                className="px-3 py-2 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900/60 text-cyan-300 font-bold text-xs transition flex items-center gap-1.5"
                title="Send a real Chrome notification immediately"
              >
                <Bell className="w-3.5 h-3.5 text-cyan-400" />
                <span>Test Real Chrome Alert</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>Set Reminder</span>
              </button>
            </div>
          </div>
        </form>

        {addedFeedback && (
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{addedFeedback}</span>
          </div>
        )}
      </div>

      {/* Active Reminders List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Scheduled Reminders ({activeReminders.length})</span>
        </h3>

        {activeReminders.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#040e24]/60 border border-cyan-500/20 text-center space-y-2">
            <Bell className="w-8 h-8 text-cyan-400/40 mx-auto" />
            <p className="text-xs text-slate-400">No active reminders scheduled.</p>
            <p className="text-[11px] text-slate-500">
              You can also say <strong className="text-cyan-300">"Hey Jarvis, remind me in 10 minutes to drink water"</strong> in voice mode or chat!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeReminders.map((rem) => {
              const diffMs = rem.remindAt - Date.now();
              const diffMins = Math.max(0, Math.round(diffMs / 60000));
              const timeDisplay = new Date(rem.remindAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const dateDisplay = new Date(rem.remindAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={rem.id}
                  className="p-4 rounded-2xl bg-[#03091e]/90 border border-cyan-500/30 hover:border-cyan-400/60 transition shadow-lg flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold">
                        {diffMins > 0 ? `In ~${diffMins} min${diffMins > 1 ? 's' : ''}` : 'Due now'}
                      </span>
                      {rem.repeat && rem.repeat !== 'none' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                          {rem.repeat}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white truncate max-w-[220px]">
                      {rem.title}
                    </h4>
                    <p className="text-[10.5px] text-slate-400">
                      {dateDisplay} at {timeDisplay}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const snoozed = reminderService.snoozeReminder(rem.id, 10);
                        setAddedFeedback(`"${snoozed.title}" snoozed for +10 minutes ✓`);
                        setTimeout(() => setAddedFeedback(null), 3000);
                      }}
                      className="px-2 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 text-[10.5px] font-bold transition flex items-center gap-1"
                      title="Snooze for 10 minutes"
                    >
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>+10m</span>
                    </button>
                    <button
                      onClick={() => reminderService.triggerAlarm(rem)}
                      className="p-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 border border-cyan-500/25 text-cyan-300 text-xs"
                      title="Test alarm sound"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(rem.id)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-white/5 transition"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Reminders */}
      {completedReminders.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-cyan-500/15">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Completed / Past Reminders
          </h4>
          <div className="divide-y divide-cyan-500/10 rounded-2xl bg-[#020713]/60 border border-cyan-500/15">
            {completedReminders.slice(-5).map((rem) => (
              <div key={rem.id} className="p-3 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="line-through">{rem.title}</span>
                </div>
                <span className="text-[10px] text-slate-600 font-mono">
                  {new Date(rem.remindAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
