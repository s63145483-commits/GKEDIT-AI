// ========================================================================
// DYNAMIC ISLAND SERVICE
// Reactive state coordinator for Apple-style Dynamic Island
// ========================================================================

export type DynamicIslandMode =
  | 'idle'
  | 'streaming'
  | 'voice'
  | 'media'
  | 'tool'
  | 'palm_share'
  | 'timer';

export interface DynamicIslandStreamingData {
  text?: string;
  tokensProcessed?: number;
  elapsedSeconds?: number;
  onAbort?: () => void;
}

export interface DynamicIslandVoiceData {
  transcript?: string;
  isMuted?: boolean;
  volumeLevel?: number; // 0 to 1
  onToggleMute?: () => void;
  onEndSession?: () => void;
}

export interface DynamicIslandAudioTrack {
  title: string;
  artist?: string;
  album?: string;
  artworkUrl?: string;
  isPlaying?: boolean;
  duration?: number;
  currentTime?: number;
  playbackRate?: number;
  sourceType?: 'mediaSession' | 'audioElement' | 'synth';
}

export interface DynamicIslandMediaData {
  progress?: number; // 0 - 100
  prompt?: string;
  thumbnailUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  onCancel?: () => void;
  // Audio Track Information from Web Media Session API
  track?: DynamicIslandAudioTrack;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onNextTrack?: () => void;
  onPreviousTrack?: () => void;
  onSeek?: (seconds: number) => void;
}

export interface DynamicIslandToolData {
  toolName?: string;
  elapsedSeconds?: number;
  statusText?: string;
  outputPreview?: string;
}

export interface DynamicIslandTimerData {
  totalSeconds: number;
  remainingSeconds: number;
  label?: string;
  isRunning: boolean;
  isFinished?: boolean;
  startedAt?: number;
  onPause?: () => void;
  onResume?: () => void;
  onReset?: () => void;
  onCancel?: () => void;
  onAddSeconds?: (seconds: number) => void;
}

export interface DynamicIslandState {
  mode: DynamicIslandMode;
  isExpanded: boolean;
  streaming?: DynamicIslandStreamingData;
  voice?: DynamicIslandVoiceData;
  media?: DynamicIslandMediaData;
  tool?: DynamicIslandToolData;
  timer?: DynamicIslandTimerData;
  // Legacy / Palm Share backwards compatibility
  palmShare?: {
    state?: string;
    photoUrl?: string | null;
    isConnected?: boolean;
    peerCode?: string;
  };
}

type DynamicIslandListener = (state: DynamicIslandState) => void;

class DynamicIslandService {
  private state: DynamicIslandState = {
    mode: 'idle',
    isExpanded: false,
  };

  private listeners: Set<DynamicIslandListener> = new Set();
  private timerInterval: any = null;
  private countdownInterval: any = null;

  public getState(): DynamicIslandState {
    return { ...this.state };
  }

  public subscribe(listener: DynamicIslandListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const current = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(current);
      } catch (err) {
        console.error('Error in DynamicIsland listener:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('gkedit:dynamic_island_change', { detail: current })
      );
    }
  }

  public setExpanded(expanded: boolean) {
    this.state.isExpanded = expanded;
    this.notify();
  }

  public toggleExpanded() {
    this.state.isExpanded = !this.state.isExpanded;
    this.notify();
  }

  public setIdle() {
    this.stopTimer();
    this.stopCountdown();
    this.state = {
      mode: 'idle',
      isExpanded: false,
    };
    this.notify();
  }

  public setStreaming(data: DynamicIslandStreamingData) {
    this.stopTimer();
    let elapsed = data.elapsedSeconds || 0;
    this.state = {
      mode: 'streaming',
      isExpanded: this.state.isExpanded,
      streaming: {
        ...data,
        elapsedSeconds: elapsed,
      },
    };
    this.notify();

    // Auto-tick elapsed seconds for live thinking timer
    this.timerInterval = setInterval(() => {
      if (this.state.mode === 'streaming' && this.state.streaming) {
        elapsed += 1;
        this.state.streaming.elapsedSeconds = elapsed;
        this.notify();
      } else {
        this.stopTimer();
      }
    }, 1000);
  }

  public updateStreamingTokens(tokens: number, text?: string) {
    if (this.state.mode === 'streaming' && this.state.streaming) {
      this.state.streaming.tokensProcessed = tokens;
      if (text) this.state.streaming.text = text;
      this.notify();
    }
  }

  public setVoice(data: DynamicIslandVoiceData) {
    this.stopTimer();
    this.state = {
      mode: 'voice',
      isExpanded: this.state.isExpanded,
      voice: {
        volumeLevel: 0.5,
        ...data,
      },
    };
    this.notify();
  }

  public updateVoiceVolume(vol: number) {
    if (this.state.mode === 'voice' && this.state.voice) {
      this.state.voice.volumeLevel = Math.max(0, Math.min(1, vol));
      this.notify();
    }
  }

  public updateVoiceTranscript(transcript: string) {
    if (this.state.mode === 'voice' && this.state.voice) {
      this.state.voice.transcript = transcript;
      this.notify();
    }
  }

  public setMedia(data: DynamicIslandMediaData) {
    this.stopTimer();
    this.state = {
      mode: 'media',
      isExpanded: this.state.isExpanded,
      media: {
        progress: 0,
        ...data,
      },
    };
    this.notify();
  }

  public updateMediaProgress(progress: number) {
    if (this.state.mode === 'media' && this.state.media) {
      this.state.media.progress = Math.min(100, Math.max(0, progress));
      this.notify();
    }
  }

  public setAudioMedia(
    track: DynamicIslandAudioTrack,
    actions?: {
      onTogglePlay?: () => void;
      onNextTrack?: () => void;
      onPreviousTrack?: () => void;
      onSeek?: (seconds: number) => void;
      onCancel?: () => void;
    }
  ) {
    this.stopTimer();
    this.state = {
      mode: 'media',
      isExpanded: this.state.isExpanded,
      media: {
        track,
        isPlaying: track.isPlaying ?? true,
        mediaType: 'audio',
        onTogglePlay: actions?.onTogglePlay,
        onNextTrack: actions?.onNextTrack,
        onPreviousTrack: actions?.onPreviousTrack,
        onSeek: actions?.onSeek,
        onCancel: actions?.onCancel,
      },
    };
    this.notify();
  }

  public updateAudioTrack(track: DynamicIslandAudioTrack, isPlaying?: boolean) {
    if (this.state.mode === 'media' && this.state.media) {
      this.state.media.track = {
        ...this.state.media.track,
        ...track,
      };
      if (typeof isPlaying === 'boolean') {
        this.state.media.isPlaying = isPlaying;
        if (this.state.media.track) {
          this.state.media.track.isPlaying = isPlaying;
        }
      }
      this.notify();
    }
  }

  public setTool(data: DynamicIslandToolData) {
    this.stopTimer();
    let elapsed = data.elapsedSeconds || 0;
    this.state = {
      mode: 'tool',
      isExpanded: this.state.isExpanded,
      tool: {
        ...data,
        elapsedSeconds: elapsed,
      },
    };
    this.notify();

    this.timerInterval = setInterval(() => {
      if (this.state.mode === 'tool' && this.state.tool) {
        elapsed += 1;
        this.state.tool.elapsedSeconds = elapsed;
        this.notify();
      } else {
        this.stopTimer();
      }
    }, 1000);
  }

  public setPalmShare(data: { state?: string; photoUrl?: string | null; isConnected?: boolean; peerCode?: string }) {
    this.stopTimer();
    this.state = {
      mode: 'palm_share',
      isExpanded: this.state.isExpanded,
      palmShare: data,
    };
    this.notify();
  }

  // ========================================================================
  // TIMER & COUNTDOWN CONTROLLER
  // ========================================================================
  public startTimer(seconds: number, label?: string) {
    this.stopTimer();
    this.stopCountdown();
    const initialSeconds = Math.max(1, Math.round(seconds));
    const timerLabel = label || `${Math.round(initialSeconds / 60)} Minutes`;

    this.state = {
      mode: 'timer',
      isExpanded: this.state.isExpanded,
      timer: {
        totalSeconds: initialSeconds,
        remainingSeconds: initialSeconds,
        label: timerLabel,
        isRunning: true,
        isFinished: false,
        startedAt: Date.now(),
      },
    };
    this.notify();

    this.startCountdownTicker();
  }

  public pauseTimer() {
    if (this.state.mode === 'timer' && this.state.timer) {
      this.state.timer.isRunning = false;
      this.notify();
    }
  }

  public resumeTimer() {
    if (this.state.mode === 'timer' && this.state.timer) {
      if (this.state.timer.remainingSeconds > 0) {
        this.state.timer.isRunning = true;
        this.state.timer.isFinished = false;
        if (!this.countdownInterval) {
          this.startCountdownTicker();
        }
        this.notify();
      }
    }
  }

  public toggleTimer() {
    if (this.state.mode === 'timer' && this.state.timer) {
      if (this.state.timer.isFinished) {
        this.resetTimer();
      } else if (this.state.timer.isRunning) {
        this.pauseTimer();
      } else {
        this.resumeTimer();
      }
    }
  }

  public resetTimer() {
    if (this.state.mode === 'timer' && this.state.timer) {
      this.stopCountdown();
      this.state.timer.remainingSeconds = this.state.timer.totalSeconds;
      this.state.timer.isRunning = true;
      this.state.timer.isFinished = false;
      this.startCountdownTicker();
      this.notify();
    }
  }

  public addTimeToTimer(seconds: number) {
    if (this.state.mode === 'timer' && this.state.timer) {
      this.state.timer.remainingSeconds += seconds;
      this.state.timer.totalSeconds += seconds;
      this.state.timer.isFinished = false;
      if (!this.state.timer.isRunning) {
        this.state.timer.isRunning = true;
      }
      if (!this.countdownInterval) {
        this.startCountdownTicker();
      }
      this.notify();
    }
  }

  public cancelTimer() {
    this.stopCountdown();
    if (this.state.mode === 'timer') {
      this.state = {
        mode: 'idle',
        isExpanded: false,
      };
      this.notify();
    }
  }

  private startCountdownTicker() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      if (this.state.mode === 'timer' && this.state.timer) {
        if (!this.state.timer.isRunning) return;

        if (this.state.timer.remainingSeconds > 1) {
          this.state.timer.remainingSeconds -= 1;
          this.notify();
        } else {
          // Timer finished
          this.state.timer.remainingSeconds = 0;
          this.state.timer.isRunning = false;
          this.state.timer.isFinished = true;
          this.stopCountdown();
          this.notify();

          // Sound alarm
          this.playTimerAlarm();

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('gkedit:timer_complete', {
                detail: {
                  label: this.state.timer.label,
                  totalSeconds: this.state.timer.totalSeconds,
                },
              })
            );
          }
        }
      } else {
        this.stopCountdown();
      }
    }, 1000);
  }

  private stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  public playTimerAlarm() {
    if (typeof window === 'undefined') return;
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([250, 100, 250, 100, 500]);
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // 3 Harmonic Arpeggiated Alarm Beeps (A5, C6, E6)
      const notes = [880, 1046.5, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.16;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.09, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.15);
      });

      // Second burst
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + 0.55 + idx * 0.16;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.15);
      });

      setTimeout(() => {
        try {
          ctx.close();
        } catch {}
      }, 1600);
    } catch {}
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

export const dynamicIslandService = new DynamicIslandService();
