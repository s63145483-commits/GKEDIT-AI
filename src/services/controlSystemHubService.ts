// ========================================================================
// CONTROL SYSTEM HUB SERVICE
// Coordinates Normal Controls, Hand Gestures, and Face/Eye Tracking
// ========================================================================

export type ControlMode = 'normal' | 'gestures' | 'face_eye';

export interface ControlSettings {
  gazeSensitivity: number; // 0.5 - 2.5 (default 1.2)
  deadzone: number; // 0.02 - 0.20 (default 0.06)
  dwellClickDuration: number; // 500 - 2500 ms (default 1100)
  blinkThreshold: number; // 0.3 - 0.8 (default 0.55)
  eyebrowRaiseThreshold: number; // 0.3 - 0.8 (default 0.45)
  mouthOpenThreshold: number; // 0.3 - 0.7 (default 0.40)
  smileThreshold: number; // 0.3 - 0.7 (default 0.45)
  virtualJoystick: boolean; // Virtual joystick & D-pad for touch/mobile
  soundFeedback: boolean;
}

export interface ControlTrackingState {
  isCameraActive: boolean;
  isTracking: boolean; // Green if face/hand detected, Red if lost
  cursorX: number; // 0 - 100%
  cursorY: number; // 0 - 100%
  dwellProgress: number; // 0 - 100%
  currentActionName: string | null; // e.g. "Gaze: Left", "Eyebrows Raised", "Pinch Tap"
  fps: number;
}

const STORAGE_KEY_MODE = 'gkedit_control_mode';
const STORAGE_KEY_SETTINGS = 'gkedit_control_settings';

const DEFAULT_SETTINGS: ControlSettings = {
  gazeSensitivity: 1.2,
  deadzone: 0.06,
  dwellClickDuration: 1100,
  blinkThreshold: 0.55,
  eyebrowRaiseThreshold: 0.45,
  mouthOpenThreshold: 0.40,
  smileThreshold: 0.45,
  virtualJoystick: true,
  soundFeedback: true,
};

type ControlListener = (mode: ControlMode, settings: ControlSettings, tracking: ControlTrackingState) => void;

class ControlSystemHubService {
  private mode: ControlMode = 'normal';
  private settings: ControlSettings = DEFAULT_SETTINGS;
  private tracking: ControlTrackingState = {
    isCameraActive: false,
    isTracking: false,
    cursorX: 50,
    cursorY: 50,
    dwellProgress: 0,
    currentActionName: null,
    fps: 0,
  };

  private listeners: Set<ControlListener> = new Set();
  private dwellTimer: any = null;
  private lastDwellTarget: Element | null = null;
  private dwellStartTime: number = 0;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const savedMode = localStorage.getItem(STORAGE_KEY_MODE) as ControlMode;
      if (savedMode === 'normal' || savedMode === 'gestures' || savedMode === 'face_eye') {
        this.mode = savedMode;
      }
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (savedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }
    } catch (e) {
      console.warn('Error loading control hub settings:', e);
    }
  }

  public saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_MODE, this.mode);
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Error saving control hub settings:', e);
    }
  }

  public getMode(): ControlMode {
    return this.mode;
  }

  public getSettings(): ControlSettings {
    return { ...this.settings };
  }

  public getTrackingState(): ControlTrackingState {
    return { ...this.tracking };
  }

  public subscribe(listener: ControlListener): () => void {
    this.listeners.add(listener);
    listener(this.mode, this.settings, this.tracking);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.mode, this.settings, this.tracking);
      } catch (err) {
        console.error('Error in ControlHub listener:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('gkedit:control_mode_change', {
          detail: {
            mode: this.mode,
            settings: this.settings,
            tracking: this.tracking,
          },
        })
      );
    }
  }

  public setMode(mode: ControlMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.saveToStorage();

    if (mode === 'normal') {
      this.tracking.isCameraActive = false;
      this.tracking.isTracking = false;
      this.tracking.dwellProgress = 0;
      this.tracking.currentActionName = null;
      this.resetDwell();
    }

    this.notify();
  }

  public updateSettings(partial: Partial<ControlSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.saveToStorage();
    this.notify();
  }

  public updateTracking(partial: Partial<ControlTrackingState>) {
    this.tracking = { ...this.tracking, ...partial };

    // Check dwell click if cursor updated
    if (partial.cursorX !== undefined || partial.cursorY !== undefined) {
      this.handleDwellUpdate(this.tracking.cursorX, this.tracking.cursorY);
    }

    this.notify();
  }

  public setActionName(actionName: string | null) {
    this.tracking.currentActionName = actionName;
    this.notify();
  }

  /**
   * Sound chime on successful click or trigger
   */
  public playClickSound() {
    if (!this.settings.soundFeedback || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.08); // E6
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch {}
  }

  /**
   * Synthesize real DOM click at normalized viewport coordinates
   */
  public executeClickAt(normalizedX: number, normalizedY: number) {
    if (typeof window === 'undefined') return;
    const clientX = (normalizedX / 100) * window.innerWidth;
    const clientY = (normalizedY / 100) * window.innerHeight;

    const elem = document.elementFromPoint(clientX, clientY);
    if (!elem) return;

    // Find closest clickable or focusable element
    const clickable = elem.closest(
      'button, a, input, textarea, select, [role="button"], [tabindex], [data-interactive="true"]'
    ) as HTMLElement | null;

    const target = clickable || (elem as HTMLElement);

    this.playClickSound();

    // Visual ripple effect
    this.createRipple(clientX, clientY);

    // Trigger click events
    target.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX, clientY })
    );
    target.dispatchEvent(
      new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX, clientY })
    );
    target.click();

    this.resetDwell();
  }

  private createRipple(x: number, y: number) {
    if (typeof document === 'undefined') return;
    const ripple = document.createElement('div');
    ripple.className =
      'fixed z-[9999] pointer-events-none rounded-full border-2 border-cyan-400 bg-cyan-400/30 animate-ping';
    ripple.style.left = `${x - 16}px`;
    ripple.style.top = `${y - 16}px`;
    ripple.style.width = '32px';
    ripple.style.height = '32px';
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  /**
   * Dwell click processing: triggers when hovering over a clickable element
   */
  private handleDwellUpdate(normX: number, normY: number) {
    if (this.mode === 'normal') return;
    if (typeof window === 'undefined') return;

    const clientX = (normX / 100) * window.innerWidth;
    const clientY = (normY / 100) * window.innerHeight;

    const elem = document.elementFromPoint(clientX, clientY);
    if (!elem) {
      this.resetDwell();
      return;
    }

    const clickable = elem.closest(
      'button, a, input, textarea, select, [role="button"], [tabindex], [data-interactive="true"]'
    );

    if (!clickable) {
      this.resetDwell();
      return;
    }

    if (clickable === this.lastDwellTarget) {
      const elapsed = Date.now() - this.dwellStartTime;
      const progress = Math.min(100, Math.round((elapsed / this.settings.dwellClickDuration) * 100));
      this.tracking.dwellProgress = progress;

      if (progress >= 100) {
        this.executeClickAt(normX, normY);
        this.resetDwell();
      }
    } else {
      this.lastDwellTarget = clickable;
      this.dwellStartTime = Date.now();
      this.tracking.dwellProgress = 0;
    }
  }

  private resetDwell() {
    this.lastDwellTarget = null;
    this.dwellStartTime = 0;
    this.tracking.dwellProgress = 0;
  }
}

export const controlSystemHub = new ControlSystemHubService();
