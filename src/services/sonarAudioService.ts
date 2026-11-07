/**
 * Sonar & Geiger Synthetic Web Audio Service
 * Produces clean sci-fi radar pings, sonar chirps, and Geiger clicks
 * dynamically scaled by network signal quality.
 */

export type AudioMode = 'sonar' | 'geiger' | 'synth';

class SonarAudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.6;
  private timerId: any = null;
  private currentMode: AudioMode = 'sonar';
  private signalIndex: number = 50; // 0 to 100
  private onPulseCallback?: (intensity: number) => void;

  constructor() {
    // AudioContext will initialize on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    if (muted && this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    } else if (!muted && !this.timerId) {
      this.scheduleNextPulse();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public setMode(mode: AudioMode) {
    this.currentMode = mode;
  }

  public getMode(): AudioMode {
    return this.currentMode;
  }

  public setSignalIndex(index: number) {
    this.signalIndex = Math.max(0, Math.min(100, index));
  }

  public setPulseCallback(cb: (intensity: number) => void) {
    this.onPulseCallback = cb;
  }

  public start() {
    this.initContext();
    if (this.timerId) clearTimeout(this.timerId);
    this.scheduleNextPulse();
  }

  public stop() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Schedule dynamic pulses:
   * Better signal (index ~ 100) -> fast pulse rate (200ms - 350ms)
   * Weak signal (index ~ 10) -> slow pulse rate (1400ms - 2000ms)
   */
  private scheduleNextPulse() {
    if (this.isMuted) return;

    // Pulse interval formula: 100% -> 240ms, 0% -> 1800ms
    const ratio = this.signalIndex / 100;
    const minInterval = 220; // ms at 100%
    const maxInterval = 1750; // ms at 0%
    const baseInterval = maxInterval - ratio * (maxInterval - minInterval);
    
    // Add subtle jitter in Geiger mode
    const jitter = this.currentMode === 'geiger' ? (Math.random() - 0.5) * 80 : 0;
    const interval = Math.max(120, baseInterval + jitter);

    this.timerId = setTimeout(() => {
      this.playTone();
      this.scheduleNextPulse();
    }, interval);
  }

  /**
   * Play single sonar ping, synth chirp or geiger click
   */
  public playTone(customFreq?: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const ratio = this.signalIndex / 100;

    if (this.onPulseCallback) {
      this.onPulseCallback(ratio);
    }

    if (this.currentMode === 'geiger') {
      // Ultra-short broadband click
      const bufferSize = this.ctx.sampleRate * 0.005; // 5ms burst
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800 + ratio * 2400, now);
      filter.Q.setValueAtTime(3.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.008);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + 0.01);
      return;
    }

    // Default: Sci-Fi Sonar Ping
    // Pitch scales with signal quality: 400Hz (poor) -> 1080Hz (optimal)
    const baseFreq = customFreq || (420 + ratio * 660);
    
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = this.currentMode === 'synth' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    // Slight downward pitch drop gives characteristic sonar drop
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.88, now + 0.18);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(baseFreq * 3, now);
    filter.Q.setValueAtTime(4.0, now);

    // Exponential decay envelope
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.35 + ratio * 0.25, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.36);
  }
}

export const sonarAudio = new SonarAudioService();
