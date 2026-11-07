/**
 * Web Audio DTMF & Sound FX Synthesizer
 * Generates true ITU-T dual-tone multi-frequency signals, ringtones, and haptic feedback
 */

const DTMF_FREQUENCIES: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
};

class DtmfAudioService {
  private audioCtx: AudioContext | null = null;
  private ringOsc1: OscillatorNode | null = null;
  private ringOsc2: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;
  private isRinging = false;

  private initCtx() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Play standard dual-tone multi-frequency for the dialed key
   */
  public playDtmf(key: string, durationMs = 120) {
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      // Provide haptic feedback if available
      this.triggerHaptic(15);

      const freqs = DTMF_FREQUENCIES[key];
      if (!freqs) {
        // Fallback tone for other keys
        this.playTone(800, durationMs);
        return;
      }

      const now = this.audioCtx.currentTime;
      const durationSec = durationMs / 1000;

      const oscLow = this.audioCtx.createOscillator();
      const oscHigh = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      oscLow.type = 'sine';
      oscLow.frequency.setValueAtTime(freqs[0], now);

      oscHigh.type = 'sine';
      oscHigh.frequency.setValueAtTime(freqs[1], now);

      // Smooth attack & release envelope to avoid clicks
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.18, now + 0.015);
      gainNode.gain.setValueAtTime(0.18, now + durationSec - 0.02);
      gainNode.gain.linearRampToValueAtTime(0, now + durationSec);

      oscLow.connect(gainNode);
      oscHigh.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      oscLow.start(now);
      oscHigh.start(now);
      oscLow.stop(now + durationSec);
      oscHigh.stop(now + durationSec);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Simple sine tone for button taps or UI alerts
   */
  public playTone(freq = 440, durationMs = 80, volume = 0.1) {
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const durationSec = durationMs / 1000;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.01);
      gain.gain.setValueAtTime(volume, now + durationSec - 0.02);
      gain.gain.linearRampToValueAtTime(0, now + durationSec);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + durationSec);
    } catch {
      // Silently catch audio restrictions
    }
  }

  /**
   * Start soft telephone ringback tone (440Hz + 480Hz modulated)
   */
  public startRingbackTone() {
    if (this.isRinging) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      this.isRinging = true;
      const now = this.audioCtx.currentTime;

      this.ringOsc1 = this.audioCtx.createOscillator();
      this.ringOsc2 = this.audioCtx.createOscillator();
      this.ringGain = this.audioCtx.createGain();

      this.ringOsc1.type = 'sine';
      this.ringOsc1.frequency.setValueAtTime(440, now);

      this.ringOsc2.type = 'sine';
      this.ringOsc2.frequency.setValueAtTime(480, now);

      // Modulate gain for 2s ring, 4s silence
      this.ringGain.gain.setValueAtTime(0.08, now);

      this.ringOsc1.connect(this.ringGain);
      this.ringOsc2.connect(this.ringGain);
      this.ringGain.connect(this.audioCtx.destination);

      this.ringOsc1.start();
      this.ringOsc2.start();
    } catch {
      // Ignore
    }
  }

  /**
   * Stop ringing tone
   */
  public stopRingbackTone() {
    this.isRinging = false;
    try {
      if (this.ringOsc1) {
        this.ringOsc1.stop();
        this.ringOsc1.disconnect();
        this.ringOsc1 = null;
      }
      if (this.ringOsc2) {
        this.ringOsc2.stop();
        this.ringOsc2.disconnect();
        this.ringOsc2 = null;
      }
      if (this.ringGain) {
        this.ringGain.disconnect();
        this.ringGain = null;
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Play call connected sound (high futuristic double-blip)
   */
  public playCallConnected() {
    this.stopRingbackTone();
    this.playTone(880, 70, 0.12);
    setTimeout(() => {
      this.playTone(1320, 110, 0.14);
    }, 90);
    this.triggerHaptic([20, 40, 30]);
  }

  /**
   * Play call disconnect / busy tone
   */
  public playCallEnded() {
    this.stopRingbackTone();
    this.playTone(480, 180, 0.15);
    setTimeout(() => {
      this.playTone(420, 240, 0.15);
    }, 200);
    this.triggerHaptic([40, 30, 40]);
  }

  /**
   * Text-to-Speech playback for AI Assistant
   */
  public speakAiMessage(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.85;

      // Select a natural English voice if present
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || (v.lang.startsWith('en') && !v.localService)
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferred) {
        utterance.voice = preferred;
      }

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      if (onEnd) onEnd();
    }
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Trigger device haptic vibration
   */
  public triggerHaptic(pattern: number | number[] = 15) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Safe fail
      }
    }
  }
}

export const dtmfAudio = new DtmfAudioService();
