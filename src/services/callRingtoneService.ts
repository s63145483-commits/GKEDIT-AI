/**
 * Web Audio API loopable ringtones & call sound FX
 * Zero external mp3 dependencies; works offline and at 60fps.
 */

class CallRingtoneService {
  private audioCtx: AudioContext | null = null;
  private ringtoneInterval: any = null;
  private isRinging: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Starts loopable outgoing ringback tone (e.g., standard phone US/UK cadence: 440Hz + 480Hz)
   */
  public startOutgoingRingtone() {
    if (this.isRinging) return;
    this.isRinging = true;

    const playTone = () => {
      if (!this.isRinging) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Dual-tone multi-frequency ringback
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);
      osc1.type = 'sine';
      osc2.type = 'sine';

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
      gain.gain.setValueAtTime(0.08, now + 1.8);
      gain.gain.linearRampToValueAtTime(0.001, now + 2.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.0);
      osc2.stop(now + 2.0);
    };

    playTone();
    this.ringtoneInterval = setInterval(playTone, 4000);
  }

  /**
   * Starts rhythmic futuristic incoming call ringtone (Arc Reactor style melodic chime)
   */
  public startIncomingRingtone() {
    if (this.isRinging) return;
    this.isRinging = true;

    const playChime = () => {
      if (!this.isRinging) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const freqs = [659.25, 783.99, 880, 1046.5]; // E5, G5, A5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);

        gain.gain.setValueAtTime(0.001, now + idx * 0.18);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.18 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.55);
      });
    };

    playChime();
    this.ringtoneInterval = setInterval(playChime, 2500);
  }

  /**
   * Stops any currently playing ringtones
   */
  public stop() {
    this.isRinging = false;
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  /**
   * Plays instant call connected audio beep
   */
  public playConnectedBeep() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.1); // A5
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Plays call ended sound
   */
  public playCallEndedTone() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(330, now + 0.15);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }
}

export const callRingtoneService = new CallRingtoneService();
