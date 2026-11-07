/**
 * GKEDIT AI Notification & System Chrome Alerts Engine
 * Supports:
 * 1. AI reply completion Chrome system notifications when tab is backgrounded + in-app toast + soft audio chime.
 * 2. Real Chrome push notifications via ServiceWorker and Notification API.
 * 3. Firebase Cloud Messaging (FCM) service worker integration.
 */

export interface InAppToast {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'alert' | 'warning';
  timestamp: number;
  reminderId?: string;
  isReminder?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

type ToastListener = (toasts: InAppToast[]) => void;

class NotificationService {
  private audioCtx: AudioContext | null = null;
  private toasts: InAppToast[] = [];
  private toastListeners: Set<ToastListener> = new Set();

  public notificationsEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedNotif = localStorage.getItem('gkedit_notifications_enabled');
        if (savedNotif !== null) {
          this.notificationsEnabled = savedNotif === 'true';
        }
      } catch {}
    }
  }

  // -------------------------------------------------------------
  // PERMISSIONS & TOGGLES
  // -------------------------------------------------------------
  public getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      throw new Error('Chrome notifications are not supported on this browser.');
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.notificationsEnabled = true;
        try {
          localStorage.setItem('gkedit_notifications_enabled', 'true');
        } catch {}
        this.playSoftChime();
        this.sendChromeNotification(
          'Chrome Notifications Active ⚡',
          'GKEDIT AI will alert you when replies finish and when reminders are due.'
        );
        this.showInAppToast('Notifications Enabled', 'Real Chrome system notifications are now active.', 'success');
        return true;
      } else {
        this.notificationsEnabled = false;
        try {
          localStorage.setItem('gkedit_notifications_enabled', 'false');
        } catch {}
        return false;
      }
    } catch (err: any) {
      console.warn('Chrome notification permission error:', err);
      throw err;
    }
  }

  public setNotificationsEnabled(enabled: boolean) {
    this.notificationsEnabled = enabled;
    try {
      localStorage.setItem('gkedit_notifications_enabled', enabled ? 'true' : 'false');
    } catch {}
  }

  // -------------------------------------------------------------
  // IN-APP TOAST SYSTEM
  // -------------------------------------------------------------
  public subscribeToasts(listener: ToastListener): () => void {
    this.toastListeners.add(listener);
    listener([...this.toasts]);
    return () => this.toastListeners.delete(listener);
  }

  public dismissToast(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.toastListeners.forEach((fn) => fn([...this.toasts]));
  }

  public showInAppToast(
    title: string,
    message: string,
    type: 'info' | 'success' | 'alert' | 'warning' = 'info',
    options?: {
      reminderId?: string;
      isReminder?: boolean;
      durationMs?: number;
      actionLabel?: string;
      onAction?: () => void;
    }
  ) {
    const toast: InAppToast = {
      id: 'toast_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title,
      message,
      type,
      timestamp: Date.now(),
      reminderId: options?.reminderId,
      isReminder: options?.isReminder,
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
    };
    this.toasts.push(toast);
    this.toastListeners.forEach((fn) => fn([...this.toasts]));

    const duration = options?.durationMs ?? (options?.isReminder ? 12000 : options?.actionLabel ? 7000 : 4500);
    setTimeout(() => {
      this.dismissToast(toast.id);
    }, duration);
  }

  // -------------------------------------------------------------
  // SOFT PLEASANT AUDIO CHIME (Synthesized Web Audio)
  // -------------------------------------------------------------
  public playSoftChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Note 1: 587.33 Hz (D5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Note 2: 880 Hz (A5 - Harmonic chime)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.001, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.15, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch {
      // Audio autoplay may be restricted until user interaction
    }
  }

  // -------------------------------------------------------------
  // REAL CHROME NOTIFICATION SENDER
  // -------------------------------------------------------------
  public sendChromeNotification(title: string, message: string, tag?: string) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const notifOptions: any = {
      body: message,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: tag || 'gkedit-' + Date.now(),
      renotify: true,
      requireInteraction: false,
      data: { url: '/' },
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready
        .then((reg) => reg.showNotification(title, notifOptions))
        .catch(() => {
          try {
            const notif = new Notification(title, notifOptions);
            notif.onclick = () => { window.focus(); notif.close(); };
          } catch {}
        });
    } else {
      try {
        const notif = new Notification(title, notifOptions);
        notif.onclick = () => { window.focus(); notif.close(); };
      } catch (err) {
        console.warn('Chrome notification dispatch issue:', err);
      }
    }
  }

  // -------------------------------------------------------------
  // USER NOTIFICATION ON AI REPLY FINISH
  // -------------------------------------------------------------
  public onAiReplyComplete(replyText: string) {
    const snippet = replyText.replace(/[*#_`]/g, '').trim().slice(0, 110);

    // Play pleasant sound
    this.playSoftChime();

    // In-app floating toast
    this.showInAppToast('GKEDIT AI', snippet + (replyText.length > 110 ? '...' : ''), 'info');

    // Real Chrome notification if tab is backgrounded or hidden
    if (this.notificationsEnabled && typeof document !== 'undefined' && document.hidden) {
      this.sendChromeNotification('GKEDIT AI Response Ready ⚡', snippet + (replyText.length > 110 ? '...' : ''));
    }
  }
}

export const notificationService = new NotificationService();
