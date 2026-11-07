/**
 * GKEDIT Live Voice Settings Service
 * Manages customizable AI voice persona, speech rate, verbosity, and language preferences.
 */

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Female' | 'Male' | 'Neutral';
  style: string;
  description: string;
  previewText: string;
}

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    style: 'Warm & Natural',
    description: 'Balanced, conversational, and universally clear for all topics.',
    previewText: 'Hello! I am Kore, your GKEDIT AI voice companion.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male',
    style: 'Deep & Cinematic',
    description: 'Authoritative, resonant, and confident tone for complex science & code.',
    previewText: 'Greetings. I am Fenrir, ready for high-precision intelligence.',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Male',
    style: 'Enthusiastic & Friendly',
    description: 'Energetic, fast-paced, and engaging for creative brainstorming.',
    previewText: 'Hey there! Puck here, let’s build something incredible today!',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'Female',
    style: 'Melodic & Elegant',
    description: 'Sophisticated, expressive cadence suited for storytelling & literature.',
    previewText: 'Welcome. I am Aoede, here to inspire your creative imagination.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Male',
    style: 'Calm & Professional',
    description: 'Steady, measured pacing for analytical tasks and clear instructions.',
    previewText: 'Charon initialized. Awaiting your operational directives.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Female',
    style: 'Soft & Gentle',
    description: 'Relaxed, ambient, and thoughtful tone for relaxed conversations.',
    previewText: 'Hi, I’m Zephyr. Take your time, I am right here with you.',
  },
  {
    id: 'Orbit',
    name: 'Orbit',
    gender: 'Neutral',
    style: 'Futuristic & Crisp',
    description: 'Sci-fi synthetic clarity with high definition articulation.',
    previewText: 'GKEDIT Orbit online. Core systems and live telemetry linked.',
  },
];

export type VoiceVerbosity = 'concise' | 'balanced' | 'detailed';

export interface VoiceSettings {
  voiceId: string;
  speakingRate: number; // 0.8 to 1.5 (default 1.0)
  verbosity: VoiceVerbosity;
  spokenLanguage: string; // 'auto', 'en', 'te', 'hi', 'es', 'fr'
  autoListenAfterReply: boolean;
  hapticFeedback: boolean;
}

const STORAGE_KEY = 'gkedit_voice_settings_v2';

const DEFAULT_SETTINGS: VoiceSettings = {
  voiceId: 'Kore',
  speakingRate: 1.0,
  verbosity: 'concise',
  spokenLanguage: 'auto',
  autoListenAfterReply: true,
  hapticFeedback: true,
};

type Listener = (settings: VoiceSettings) => void;

class VoiceSettingsService {
  private settings: VoiceSettings;
  private listeners: Set<Listener> = new Set();
  private previewAudio: HTMLAudioElement | null = null;

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): VoiceSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to parse voice settings from localStorage:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  public getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  public getActiveVoice(): VoiceOption {
    return (
      AVAILABLE_VOICES.find((v) => v.id === this.settings.voiceId) ||
      AVAILABLE_VOICES[0]
    );
  }

  public updateSettings(partial: Partial<VoiceSettings>): VoiceSettings {
    this.settings = { ...this.settings, ...partial };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save voice settings:', e);
    }
    this.notify();
    return { ...this.settings };
  }

  public setVoice(voiceId: string) {
    this.updateSettings({ voiceId });
  }

  public setSpeakingRate(rate: number) {
    const clamped = Math.max(0.75, Math.min(1.5, Math.round(rate * 100) / 100));
    this.updateSettings({ speakingRate: clamped });
  }

  public setVerbosity(verbosity: VoiceVerbosity) {
    this.updateSettings({ verbosity });
  }

  public setLanguage(spokenLanguage: string) {
    this.updateSettings({ spokenLanguage });
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getSettings());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const current = this.getSettings();
    this.listeners.forEach((listener) => {
      try {
        listener(current);
      } catch (err) {
        console.error('VoiceSettings listener error:', err);
      }
    });
  }

  /**
   * Preview a voice by speaking its preview text via Gemini TTS API or browser speech.
   */
  public async previewVoice(
    voiceId: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    this.stopPreview();

    const voice = AVAILABLE_VOICES.find((v) => v.id === voiceId) || AVAILABLE_VOICES[0];
    onStart?.();

    try {
      // Call backend TTS with chosen voice
      const res = await fetch('/api/audio/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('gkedit_auth_token') || ''}`,
        },
        body: JSON.stringify({
          text: voice.previewText,
          voiceName: voice.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audio.playbackRate = this.settings.speakingRate;
          this.previewAudio = audio;

          audio.onended = () => {
            this.previewAudio = null;
            onEnd?.();
          };
          audio.onerror = () => {
            this.previewAudio = null;
            onEnd?.();
          };

          await audio.play();
          return;
        }
      }
    } catch (e) {
      console.warn('Server TTS preview failed, using speech synthesis fallback:', e);
    }

    // Fallback to speech synthesis preview
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(voice.previewText);
      utterance.rate = this.settings.speakingRate;
      utterance.pitch = voice.gender === 'Female' ? 1.1 : 0.9;
      utterance.onend = () => onEnd?.();
      utterance.onerror = () => onEnd?.();
      window.speechSynthesis.speak(utterance);
    } else {
      onEnd?.();
    }
  }

  public stopPreview() {
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceSettingsService = new VoiceSettingsService();
