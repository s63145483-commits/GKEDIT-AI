/**
 * Wake Word Detection & Continuous Voice Service
 * Listens for "Hey Jarvis", "Jarvis", "ఓయ్ జార్విస్", "నమస్తే జార్విస్"
 * and triggers voice interaction / device controls.
 */

export type WakeWordCallback = (transcript: string, isWakeWordOnly: boolean) => void;

class WakeWordService {
  private recognition: any = null;
  private isListening = false;
  private isEnabled = true;
  private listeners: Set<WakeWordCallback> = new Set();
  private restartTimeout: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('gkedit_wake_word_enabled');
        if (saved !== null) {
          this.isEnabled = saved === 'true';
        }
      } catch {}

      // Pause continuous recognition when browser tab is hidden to prevent battery/GPU drain
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stop();
        } else if (this.isEnabled) {
          this.start();
        }
      });
    }
  }

  public get listening(): boolean {
    return this.isListening;
  }

  public get enabled(): boolean {
    return this.isEnabled;
  }

  public setEnabled(enable: boolean) {
    this.isEnabled = enable;
    try {
      localStorage.setItem('gkedit_wake_word_enabled', String(enable));
    } catch {}

    if (enable) {
      this.start();
    } else {
      this.stop();
    }
  }

  public subscribe(cb: WakeWordCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(text: string, isWakeOnly: boolean) {
    this.listeners.forEach((fn) => fn(text, isWakeOnly));
  }

  public start() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('SpeechRecognition API not available in this browser environment.');
      return;
    }

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
    }

    try {
      const recog = new SpeechRec();
      recog.continuous = true;
      recog.interimResults = false;
      recog.lang = 'en-US';

      recog.onstart = () => {
        this.isListening = true;
      };

      recog.onresult = (event: any) => {
        const last = event.results[event.results.length - 1];
        const spoken = (last[0]?.transcript || '').trim();
        if (!spoken) return;

        const lower = spoken.toLowerCase();

        // Check wake words
        const wakeWordTriggers = [
          'hey jarvis',
          'jarvis',
          'hi jarvis',
          'ok jarvis',
          'okay jarvis',
          'hello jarvis',
          'listen jarvis',
          'oye jarvis',
          'namaste jarvis',
        ];

        const matched = wakeWordTriggers.find((w) => lower.includes(w));
        if (matched) {
          // Play subtle activation beep if audio context permitted
          this.playWakeChime();

          // Check if there is command text after the wake word
          const afterWord = lower.split(matched)[1]?.trim() || '';
          this.notify(afterWord || spoken, afterWord.length === 0);
        }
      };

      recog.onerror = (err: any) => {
        if (err.error !== 'no-speech') {
          console.warn('Wake word recognition error:', err.error);
        }
      };

      recog.onend = () => {
        this.isListening = false;
        // Auto-restart if still enabled (keep always listening mode like real JARVIS)
        if (this.isEnabled) {
          clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            this.start();
          }, 1000);
        }
      };

      recog.start();
      this.recognition = recog;
    } catch (e) {
      console.warn('Could not initialize SpeechRecognition:', e);
    }
  }

  public stop() {
    clearTimeout(this.restartTimeout);
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  public playWakeChime() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);

      setTimeout(() => {
        try {
          ctx.close();
        } catch {}
      }, 350);
    } catch {}
  }
}

export const wakeWordService = new WakeWordService();
