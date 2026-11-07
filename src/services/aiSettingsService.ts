// ============================================================================
// STARK AI MATRIX & NEXUS ENGINE SETTINGS SERVICE
// Controls: Motherly personality toggle (Creator only), Battery Saver,
// Internet/Data Saver, Reply Speed Turbo, AI Security, and Call Screening
// ============================================================================

export type StarkAiId = 'jarvis' | 'friday' | 'edith' | 'ultron' | 'vision' | 'gkedit';

export interface AiSettingsState {
  motherlyCareEnabled: boolean;
  batterySaver: boolean;
  dataSaver: boolean;
  replySpeedTurbo: boolean;
  aiSecurityShield: boolean;
  callScreeningActive: boolean;
  callScreenTarget: 'all' | 'unknown';
  screeningUserNumber: string;
  screeningAiSpeech: string;
  activeAiPersona: StarkAiId;
}

const STORAGE_KEY = 'gkedit_stark_ai_settings_v1';

const DEFAULT_STATE: AiSettingsState = {
  motherlyCareEnabled: true,
  batterySaver: false,
  dataSaver: false,
  replySpeedTurbo: false,
  aiSecurityShield: true,
  callScreeningActive: true,
  callScreenTarget: 'all',
  screeningUserNumber: '+91 98490 21410',
  screeningAiSpeech:
    "Hello, you have reached GK EDIT's AI Sentinel. GK EDIT is currently occupied. State your identity, organization, and the precise purpose of this call.",
  activeAiPersona: 'gkedit',
};

class AiSettingsService {
  private state: AiSettingsState;
  private listeners: Set<(s: AiSettingsState) => void> = new Set();

  constructor() {
    this.state = this.loadState();
    this.applyGlobalEffects();
  }

  private loadState(): AiSettingsState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_STATE, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load AI settings from storage', e);
    }
    return { ...DEFAULT_STATE };
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save AI settings to storage', e);
    }
    this.applyGlobalEffects();
    this.notify();
  }

  private applyGlobalEffects() {
    if (typeof document !== 'undefined') {
      if (this.state.batterySaver) {
        document.documentElement.classList.add('battery-saver-active');
      } else {
        document.documentElement.classList.remove('battery-saver-active');
      }

      if (this.state.dataSaver) {
        document.documentElement.classList.add('data-saver-active');
      } else {
        document.documentElement.classList.remove('data-saver-active');
      }
    }
  }

  public getState(): AiSettingsState {
    return { ...this.state };
  }

  public updateState(partial: Partial<AiSettingsState>) {
    this.state = { ...this.state, ...partial };
    this.saveState();
  }

  public setMotherlyCare(enabled: boolean) {
    this.updateState({ motherlyCareEnabled: enabled });
  }

  public setBatterySaver(enabled: boolean) {
    this.updateState({ batterySaver: enabled });
  }

  public setDataSaver(enabled: boolean) {
    this.updateState({ dataSaver: enabled });
  }

  public setReplySpeedTurbo(enabled: boolean) {
    this.updateState({ replySpeedTurbo: enabled });
  }

  public setAiSecurityShield(enabled: boolean) {
    this.updateState({ aiSecurityShield: enabled });
  }

  public setCallScreeningActive(enabled: boolean) {
    this.updateState({ callScreeningActive: enabled });
  }

  public setCallScreenTarget(target: 'all' | 'unknown') {
    this.updateState({ callScreenTarget: target });
  }

  public setScreeningUserNumber(num: string) {
    this.updateState({ screeningUserNumber: num });
  }

  public setScreeningAiSpeech(speech: string) {
    this.updateState({ screeningAiSpeech: speech });
  }

  public setActiveAiPersona(persona: StarkAiId) {
    this.updateState({ activeAiPersona: persona });
  }

  public subscribe(cb: (s: AiSettingsState) => void): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.getState());
      } catch (err) {
        console.error('Error notifying aiSettings subscriber', err);
      }
    }
  }
}

export const aiSettingsService = new AiSettingsService();
