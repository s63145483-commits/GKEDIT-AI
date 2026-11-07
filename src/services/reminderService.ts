/**
 * GKEDIT AI J.A.R.V.I.S Reminders Service
 * Supports:
 * - Natural language parsing (e.g., "remind me in 5 minutes to drink water", "remind me at 18:00 to upload video")
 * - Telugu voice commands (e.g., "5 నిమిషాల తర్వాత గుర్తుచేయి", "నాకు రిమైండర్ పెట్టు")
 * - Accurate timers and scheduled alarms
 * - Audio speech announcement via Text-to-Speech + Audio Chime + System/Push Notification + In-App Toaster
 * - Persistent storage in localStorage
 */

export interface JarvisReminder {
  id: string;
  title: string;
  remindAt: number; // timestamp in ms
  timeString?: string;
  dateString?: string;
  triggered: boolean;
  repeat?: 'none' | 'daily' | 'hourly';
  createdAt: number;
}

type ReminderListener = (reminders: JarvisReminder[]) => void;

class ReminderService {
  private reminders: JarvisReminder[] = [];
  private listeners: Set<ReminderListener> = new Set();
  private checkInterval: any = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('gkedit_jarvis_reminders');
        if (saved) {
          this.reminders = JSON.parse(saved);
        }
      } catch {}

      // Start tick check every 5 seconds
      this.checkInterval = setInterval(() => {
        this.checkPendingReminders();
      }, 5000);
    }
  }

  public subscribe(listener: ReminderListener): () => void {
    this.listeners.add(listener);
    listener([...this.reminders]);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    try {
      localStorage.setItem('gkedit_jarvis_reminders', JSON.stringify(this.reminders));
    } catch {}
    this.listeners.forEach((fn) => fn([...this.reminders]));
  }

  public getReminders(): JarvisReminder[] {
    return [...this.reminders];
  }

  public addReminder(title: string, remindAtTimestamp: number, repeat: 'none' | 'daily' | 'hourly' = 'none'): JarvisReminder {
    const reminder: JarvisReminder = {
      id: 'rem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title: title.trim(),
      remindAt: remindAtTimestamp,
      triggered: false,
      repeat,
      createdAt: Date.now(),
    };

    this.reminders.push(reminder);
    // Sort chronologically
    this.reminders.sort((a, b) => a.remindAt - b.remindAt);
    this.notify();
    return reminder;
  }

  public deleteReminder(id: string) {
    this.reminders = this.reminders.filter((r) => r.id !== id);
    this.notify();
  }

  public snoozeReminder(reminderIdOrTitle: string, minutes: number = 10): JarvisReminder {
    const existing = this.reminders.find((r) => r.id === reminderIdOrTitle);
    const title = existing ? existing.title : reminderIdOrTitle;
    const newRemindAt = Date.now() + minutes * 60 * 1000;

    // If existing found, mark it triggered or delete it, and create snoozed reminder
    if (existing) {
      this.reminders = this.reminders.filter((r) => r.id !== existing.id);
    }

    const snoozed: JarvisReminder = {
      id: 'rem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title: title.trim(),
      remindAt: newRemindAt,
      triggered: false,
      repeat: existing?.repeat || 'none',
      createdAt: Date.now(),
    };

    this.reminders.push(snoozed);
    this.reminders.sort((a, b) => a.remindAt - b.remindAt);
    this.notify();
    return snoozed;
  }

  public clearTriggered() {
    this.reminders = this.reminders.filter((r) => !r.triggered);
    this.notify();
  }

  // -------------------------------------------------------------
  // Natural Language Reminder Parser (English, Telugu & Tanglish)
  // -------------------------------------------------------------
  public parseNaturalReminder(text: string): { title: string; targetTime: number; formattedDelay: string } | null {
    const raw = text.trim();
    const lower = raw.toLowerCase();

    // Check if user is asking for a reminder / remainder
    const isReminderQuery =
      lower.includes('remind') ||
      lower.includes('remainder') ||
      lower.includes('alarm') ||
      lower.includes('గుర్తు') ||
      lower.includes('రిమైండర్');

    if (!isReminderQuery) return null;

    const now = Date.now();
    let delayMs = 0;
    let title = '';
    let formattedDelay = '';

    // Pattern 1: Relative minutes (e.g. "remind me in 5 minutes to call mom" or "5 minutes remainder to drink water")
    const minMatch =
      lower.match(/(?:in|after|for)?\s*(\d+)\s*(?:mins?|minutes?|నిమిషాల|నిమిషాలు)/i) ||
      lower.match(/(\d+)\s*(?:mins?|minutes?)/i);

    // Pattern 2: Relative seconds (e.g. "in 30 seconds")
    const secMatch = lower.match(/(?:in|after)?\s*(\d+)\s*(?:secs?|seconds?|సెకన్ల)/i);

    // Pattern 3: Relative hours (e.g. "in 2 hours")
    const hrMatch = lower.match(/(?:in|after)?\s*(\d+)\s*(?:hours?|hrs?|గంటల|గంటలు)/i);

    // Pattern 4: Clock time (e.g. "at 5:30 pm" or "at 14:00" or "at 6 pm")
    const timeMatch = lower.match(/(?:at|by)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);

    if (minMatch) {
      const mins = parseInt(minMatch[1], 10);
      delayMs = mins * 60 * 1000;
      formattedDelay = `${mins} minute${mins > 1 ? 's' : ''}`;
    } else if (secMatch) {
      const secs = parseInt(secMatch[1], 10);
      delayMs = secs * 1000;
      formattedDelay = `${secs} second${secs > 1 ? 's' : ''}`;
    } else if (hrMatch) {
      const hrs = parseInt(hrMatch[1], 10);
      delayMs = hrs * 60 * 60 * 1000;
      formattedDelay = `${hrs} hour${hrs > 1 ? 's' : ''}`;
    } else if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridiem = timeMatch[3]?.toLowerCase();

      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;

      const targetDate = new Date();
      targetDate.setHours(hours, minutes, 0, 0);

      // If target time is earlier today, set for tomorrow
      if (targetDate.getTime() <= now) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      delayMs = targetDate.getTime() - now;
      formattedDelay = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Default fallback: 10 minutes if not specified
      delayMs = 10 * 60 * 1000;
      formattedDelay = '10 minutes';
    }

    // Extract title (the action/task after "to", "for", "గుర్తుచేయి", etc.)
    let extractedTitle = raw;
    if (lower.includes(' to ')) {
      extractedTitle = raw.split(/\s+to\s+/i)[1];
    } else if (lower.includes(' for ')) {
      extractedTitle = raw.split(/\s+for\s+/i)[1];
    } else if (lower.includes(' about ')) {
      extractedTitle = raw.split(/\s+about\s+/i)[1];
    } else {
      // Clean up common keywords
      extractedTitle = raw
        .replace(/remind me|remainder me|set a reminder|set reminder|add reminder|గుర్తుచేయి|రిమైండర్/gi, '')
        .replace(/(?:in|at|after)\s*\d+\s*(?:minutes?|mins?|hours?|seconds?|am|pm)?/gi, '')
        .trim();
    }

    title = extractedTitle?.trim() || 'Reminder';
    // Remove trailing punctuation
    title = title.replace(/[.!?]+$/, '');

    return {
      title,
      targetTime: now + delayMs,
      formattedDelay,
    };
  }

  // -------------------------------------------------------------
  // Periodic Check Loop
  // -------------------------------------------------------------
  private checkPendingReminders() {
    const now = Date.now();
    let hasChanges = false;

    for (const rem of this.reminders) {
      if (!rem.triggered && now >= rem.remindAt) {
        rem.triggered = true;
        hasChanges = true;
        this.triggerAlarm(rem);

        // If daily repeat, schedule next day
        if (rem.repeat === 'daily') {
          this.addReminder(rem.title, rem.remindAt + 24 * 60 * 60 * 1000, 'daily');
        } else if (rem.repeat === 'hourly') {
          this.addReminder(rem.title, rem.remindAt + 60 * 60 * 1000, 'hourly');
        }
      }
    }

    if (hasChanges) {
      this.notify();
    }
  }

  // -------------------------------------------------------------
  // Alarm Trigger: Chime + Voice TTS + Notification + Toast
  // -------------------------------------------------------------
  public triggerAlarm(reminder: JarvisReminder) {
    // 1. Play futuristic audio chime
    this.playAlarmChime();

    // 2. Text-to-Speech vocal announcement (Ultron / Jarvis style)
    const announcementText = `Attention. This is your J.A.R.V.I.S reminder: ${reminder.title}.`;
    this.speakAnnouncement(announcementText);

    // 3. System Push/Browser Notification (Chrome & Android ServiceWorker Compatible)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const sendChromeNotification = (reg?: ServiceWorkerRegistration) => {
        const notifTitle = `J.A.R.V.I.S Reminder: ${reminder.title}`;
        const notifOptions: any = {
          body: `⏰ Due Right Now! ${reminder.title}\nTap to open GKEDIT AI.`,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'jarvis-reminder-' + reminder.id,
          renotify: true,
          requireInteraction: true, // Persists on screen in Chrome until dismissed or clicked
          silent: false,
          data: { url: '/', reminderId: reminder.id },
        };

        if (reg && reg.showNotification) {
          reg.showNotification(notifTitle, notifOptions).catch(() => {
            try {
              const n = new Notification(notifTitle, notifOptions);
              n.onclick = () => { window.focus(); n.close(); };
            } catch {}
          });
        } else {
          try {
            const n = new Notification(notifTitle, notifOptions);
            n.onclick = () => { window.focus(); n.close(); };
          } catch (e) {
            console.warn('Chrome notification fallback issue:', e);
          }
        }
      };

      if (Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then((registration) => sendChromeNotification(registration))
            .catch(() => sendChromeNotification());
        } else {
          sendChromeNotification();
        }
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready
                .then((registration) => sendChromeNotification(registration))
                .catch(() => sendChromeNotification());
            } else {
              sendChromeNotification();
            }
          }
        });
      }
    }

    // 4. In-App Custom Toast through custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('gkedit:reminder_fired', {
          detail: { reminder },
        })
      );
    }
  }

  private playAlarmChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const now = this.audioCtx.currentTime;

      // 3 ascending futuristic chimes (C5 -> E5 -> G5)
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        gain.gain.setValueAtTime(0.001, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.4);
      });
    } catch {}
  }

  private speakAnnouncement(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 0.95; // Slightly deeper authoritative tone
      window.speechSynthesis.speak(utterance);
    } catch {}
  }
}

export const reminderService = new ReminderService();
