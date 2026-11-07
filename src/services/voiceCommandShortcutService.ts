/**
 * GKEDIT AI - Voice Command Shortcut System
 * 
 * Maps specific spoken phrases (e.g. 'Take a photo', 'Clear cache', 'Lock app')
 * directly to application functions using the native Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 * Includes fuzzy matching, custom user shortcuts, audio chimes, and visual status dispatch.
 */

import { notificationService } from './notificationService.ts';
import { deviceControls } from './deviceControls.ts';
import { dynamicIslandService } from './dynamicIslandService.ts';

export interface VoiceShortcut {
  id: string;
  name: string;
  phrases: string[];
  category: 'Media & Camera' | 'System & Security' | 'Navigation' | 'Device & Tools';
  description: string;
  feedbackSpeech: string;
  iconName: string;
  isCustom?: boolean;
  enabled: boolean;
  actionId: string;
}

export interface VoiceShortcutState {
  isListening: boolean;
  isSupported: boolean;
  continuousMode: boolean;
  lastTranscript: string;
  lastExecution: {
    shortcutId: string;
    shortcutName: string;
    phrase: string;
    timestamp: number;
    success: boolean;
    message: string;
  } | null;
  status: 'idle' | 'listening' | 'recognizing' | 'executed' | 'unmatched' | 'error';
  errorMessage: string | null;
  audioFeedbackEnabled: boolean;
  voiceConfirmationEnabled: boolean;
  shortcuts: VoiceShortcut[];
}

export type VoiceShortcutListener = (state: VoiceShortcutState) => void;

export const WORD_TO_NUMBER: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  half: 0.5,
  quarter: 0.25,
  a: 1,
  an: 1,
};

export interface ParsedTimerCommand {
  totalSeconds: number;
  label: string;
}

/**
 * Parses spoken phrases such as:
 * - "set a timer for 5 minutes"
 * - "set timer for 10 minutes"
 * - "timer for 3 minutes"
 * - "timer 5 minutes"
 * - "set 15 minute timer"
 * - "timer 30 seconds"
 * - "set a timer for 1 hour"
 * - "set a timer for two minutes"
 * - "set a timer for half an hour"
 */
export function parseTimerCommand(input: string): ParsedTimerCommand | null {
  const text = input.toLowerCase().trim();

  // Check if phrase indicates timer intent
  if (!text.includes('timer') && !text.includes('countdown')) {
    return null;
  }

  // Pattern 1: (set a)? timer (for)? <amount> <unit>
  const p1 = /(?:set\s+(?:a\s+)?)?(?:timer|countdown)(?:\s+for)?\s+([a-z0-9.]+)\s*(minutes?|mins?|seconds?|secs?|hours?|hrs?)/i;

  // Pattern 2: (set a)? <amount> <unit> timer
  const p2 = /(?:set\s+(?:a\s+)?)?([a-z0-9.]+)\s*(minute|min|second|sec|hour|hr)s?\s+(?:timer|countdown)/i;

  // Pattern 3: (set a)? timer for (half an hour|an hour|a minute)
  const p3 = /(?:set\s+(?:a\s+)?)?(?:timer|countdown)(?:\s+for)?\s+(half\s+an\s+hour|an\s+hour|a\s+minute|half\s+a\s+minute)/i;

  // Pattern 4: timer <number> (defaults to minutes, e.g. "timer 5", "set timer 10")
  const p4 = /(?:set\s+(?:a\s+)?)?(?:timer|countdown)(?:\s+for)?\s+([0-9]+(?:\.[0-9]+)?)/i;

  const m3 = text.match(p3);
  if (m3) {
    const spec = m3[1].toLowerCase();
    if (spec.includes('half an hour')) return { totalSeconds: 1800, label: '30 Minutes' };
    if (spec.includes('an hour')) return { totalSeconds: 3600, label: '1 Hour' };
    if (spec.includes('a minute')) return { totalSeconds: 60, label: '1 Minute' };
    if (spec.includes('half a minute')) return { totalSeconds: 30, label: '30 Seconds' };
  }

  let amountStr = '';
  let unitStr = '';

  const m1 = text.match(p1);
  if (m1) {
    amountStr = m1[1];
    unitStr = m1[2];
  } else {
    const m2 = text.match(p2);
    if (m2) {
      amountStr = m2[1];
      unitStr = m2[2];
    } else {
      const m4 = text.match(p4);
      if (m4) {
        amountStr = m4[1];
        unitStr = 'minutes';
      }
    }
  }

  if (amountStr) {
    let numericAmount = parseFloat(amountStr);
    if (isNaN(numericAmount)) {
      numericAmount = WORD_TO_NUMBER[amountStr.toLowerCase()] ?? NaN;
    }

    if (!isNaN(numericAmount) && numericAmount > 0) {
      let multiplier = 60; // default minutes
      const u = unitStr.toLowerCase();
      if (u.startsWith('sec')) {
        multiplier = 1;
      } else if (u.startsWith('hour') || u.startsWith('hr')) {
        multiplier = 3600;
      }

      const totalSeconds = Math.round(numericAmount * multiplier);
      let label = `${numericAmount} ${unitStr}`;
      if (multiplier === 60) {
        label = `${numericAmount} ${numericAmount === 1 ? 'Minute' : 'Minutes'}`;
      } else if (multiplier === 1) {
        label = `${numericAmount} ${numericAmount === 1 ? 'Second' : 'Seconds'}`;
      } else if (multiplier === 3600) {
        label = `${numericAmount} ${numericAmount === 1 ? 'Hour' : 'Hours'}`;
      }

      return { totalSeconds, label };
    }
  }

  // Fallback for generic "set a timer", "set timer", "timer"
  if (
    text === 'set a timer' ||
    text === 'set timer' ||
    text === 'start timer' ||
    text === 'start a timer' ||
    text === 'timer'
  ) {
    return { totalSeconds: 300, label: '5 Minutes' };
  }

  return null;
}

export const DEFAULT_VOICE_SHORTCUTS: VoiceShortcut[] = [
  {
    id: 'set_timer',
    name: 'Set Timer',
    phrases: [
      'set a timer for 5 minutes',
      'set a timer for 10 minutes',
      'set a timer',
      'set timer',
      'timer for 5 minutes',
      'timer 5 minutes',
      '5 minute timer',
      'countdown timer',
      'cancel timer',
      'stop timer',
      'టైమర్ పెట్టు',
      'timer lagao',
    ],
    category: 'Device & Tools',
    description: 'Starts an active countdown timer on the Dynamic Island with live controls and audible alert.',
    feedbackSpeech: 'Timer set for five minutes.',
    iconName: 'Timer',
    enabled: true,
    actionId: 'set_timer',
  },
  {
    id: 'take_photo',
    name: 'Take a Photo',
    phrases: [
      'take a photo',
      'take photo',
      'snap photo',
      'capture photo',
      'click photo',
      'take picture',
      'snap picture',
      'capture image',
      'shoot photo',
      'photo capture',
      'ఫోటో తీయి',
      'photo kheecho',
      'photo le lo',
    ],
    category: 'Media & Camera',
    description: 'Switches to the camera viewfinder and captures an instant high-resolution photo.',
    feedbackSpeech: 'Capturing photo.',
    iconName: 'Camera',
    enabled: true,
    actionId: 'take_photo',
  },
  {
    id: 'clear_cache',
    name: 'Clear Cache',
    phrases: [
      'clear cache',
      'clean cache',
      'wipe cache',
      'delete cache',
      'clear memory',
      'purge cache',
      'clear storage',
      'clean memory',
      'క్యాష్ క్లియర్ చేయి',
      'cache saaf karo',
    ],
    category: 'System & Security',
    description: 'Purges CacheStorage buffers, session memory, and runtime temporary cache.',
    feedbackSpeech: 'Application cache cleared.',
    iconName: 'Trash2',
    enabled: true,
    actionId: 'clear_cache',
  },
  {
    id: 'lock_app',
    name: 'Lock App',
    phrases: [
      'lock app',
      'lock application',
      'lock screen',
      'lock session',
      'secure app',
      'secure screen',
      'close session',
      'lock system',
      'యాప్ లాక్ చేయి',
      'app lock karo',
    ],
    category: 'System & Security',
    description: 'Immediately locks the security gate and engages the biometric passkey shield.',
    feedbackSpeech: 'App locked. Security gate active.',
    iconName: 'Lock',
    enabled: true,
    actionId: 'lock_app',
  },
  {
    id: 'torch_on',
    name: 'Turn on Flashlight',
    phrases: [
      'turn on flashlight',
      'torch on',
      'flashlight on',
      'turn on torch',
      'enable flashlight',
      'light on',
      'turn flashlight on',
      'లైట్ ఆన్ చేయి',
      'torch chalu karo',
    ],
    category: 'Device & Tools',
    description: 'Activates the rear LED camera torch or screen high-intensity floodlight.',
    feedbackSpeech: 'Flashlight turned on.',
    iconName: 'Flame',
    enabled: true,
    actionId: 'torch_on',
  },
  {
    id: 'torch_off',
    name: 'Turn off Flashlight',
    phrases: [
      'turn off flashlight',
      'torch off',
      'flashlight off',
      'turn off torch',
      'disable flashlight',
      'light off',
      'turn flashlight off',
      'లైట్ ఆఫ్ చేయి',
      'torch band karo',
    ],
    category: 'Device & Tools',
    description: 'Extinguishes the active camera torch or screen floodlight.',
    feedbackSpeech: 'Flashlight turned off.',
    iconName: 'Flame',
    enabled: true,
    actionId: 'torch_off',
  },
  {
    id: 'open_chat',
    name: 'Open AI Chat',
    phrases: [
      'open chat',
      'go to chat',
      'ask gk',
      'ai chat',
      'start chat',
      'open copilot',
      'chat with ai',
    ],
    category: 'Navigation',
    description: 'Navigates directly to the AI Chat screen and focuses the query prompt.',
    feedbackSpeech: 'Opening AI Chat.',
    iconName: 'MessageSquare',
    enabled: true,
    actionId: 'open_chat',
  },
  {
    id: 'open_dashboard',
    name: 'Go to Dashboard',
    phrases: [
      'go to dashboard',
      'open dashboard',
      'dashboard',
      'go home',
      'home screen',
      'main menu',
    ],
    category: 'Navigation',
    description: 'Returns to the central Origin OS 6 hub and app launcher dashboard.',
    feedbackSpeech: 'Returning to Dashboard.',
    iconName: 'LayoutGrid',
    enabled: true,
    actionId: 'open_dashboard',
  },
  {
    id: 'open_maps',
    name: 'Cyclone Radar & Maps',
    phrases: [
      'open maps',
      'weather radar',
      'cyclone radar',
      'show map',
      'weather map',
      'radar',
      'storm tracker',
    ],
    category: 'Navigation',
    description: 'Opens Leaflet satellite view, RainViewer radar timeline, and weather intel.',
    feedbackSpeech: 'Opening Cyclone Radar and Maps.',
    iconName: 'CloudSun',
    enabled: true,
    actionId: 'open_maps',
  },
  {
    id: 'open_news',
    name: 'Daily Chronicle News',
    phrases: [
      'daily news',
      'open news',
      'newspaper',
      'open chronicle',
      'daily chronicle',
      'read news',
      'telangana news',
    ],
    category: 'Navigation',
    description: 'Opens the Daily Chronicle vintage newspaper and local dispatches.',
    feedbackSpeech: 'Opening Daily Chronicle Newspaper.',
    iconName: 'Newspaper',
    enabled: true,
    actionId: 'open_news',
  },
  {
    id: 'open_biolab',
    name: '3D Bio-Lab',
    phrases: [
      'open bio lab',
      'bio lab',
      'dna lab',
      'crispr lab',
      '3d bio lab',
      'bioscience lab',
    ],
    category: 'Navigation',
    description: 'Launches the 3D Observable Bioscience Learning Lab & CRISPR simulation.',
    feedbackSpeech: 'Initializing 3D Bioscience Lab.',
    iconName: 'Microscope',
    enabled: true,
    actionId: 'open_biolab',
  },
  {
    id: 'start_lesson',
    name: '2-Minute Language Lesson',
    phrases: [
      'start lesson',
      'gk learning',
      'language lesson',
      'daily lesson',
      'learn telugu',
      'learn english',
      'learn hindi',
      '2 minute lesson',
    ],
    category: 'Navigation',
    description: 'Launches the rapid 2-minute daily language learning micro-task.',
    feedbackSpeech: 'Starting 2-minute language session.',
    iconName: 'BookOpen',
    enabled: true,
    actionId: 'start_lesson',
  },
  {
    id: 'toggle_fullscreen',
    name: 'Toggle Fullscreen',
    phrases: [
      'toggle fullscreen',
      'fullscreen mode',
      'enter fullscreen',
      'exit fullscreen',
      'full screen',
    ],
    category: 'Device & Tools',
    description: 'Toggles full-screen immersive display on supported desktop and mobile devices.',
    feedbackSpeech: 'Toggling fullscreen.',
    iconName: 'Maximize',
    enabled: true,
    actionId: 'toggle_fullscreen',
  },
  {
    id: 'open_settings',
    name: 'Open Settings',
    phrases: ['open settings', 'go to settings', 'settings', 'app settings', 'preferences'],
    category: 'Navigation',
    description: 'Opens app icon selection, biometric locks, and voice customizers.',
    feedbackSpeech: 'Opening Settings.',
    iconName: 'Sliders',
    enabled: true,
    actionId: 'open_settings',
  },
  {
    id: 'show_shortcuts',
    name: 'Show Voice Shortcuts',
    phrases: [
      'show shortcuts',
      'voice shortcuts',
      'voice commands',
      'show voice commands',
      'shortcut list',
      'help commands',
    ],
    category: 'System & Security',
    description: 'Displays the interactive Voice Command Shortcuts catalog and testing modal.',
    feedbackSpeech: 'Displaying Voice Shortcuts.',
    iconName: 'Mic',
    enabled: true,
    actionId: 'show_shortcuts',
  },
  {
    id: 'open_dialer',
    name: 'Open AI Dialer',
    phrases: ['open dialer', 'phone dialer', 'make a call', 'call dialer', 'dial pad'],
    category: 'Device & Tools',
    description: 'Opens the liquid glass AI screening dialer with T9 keypad and DTMF audio.',
    feedbackSpeech: 'Opening AI Dialer.',
    iconName: 'PhoneCall',
    enabled: true,
    actionId: 'open_dialer',
  },
];

class VoiceCommandShortcutService {
  private recognition: any = null;
  private listeners: Set<VoiceShortcutListener> = new Set();
  private restartTimeout: any = null;
  private recognitionCooldown = false;

  private state: VoiceShortcutState = {
    isListening: false,
    isSupported: false,
    continuousMode: true,
    lastTranscript: '',
    lastExecution: null,
    status: 'idle',
    errorMessage: null,
    audioFeedbackEnabled: true,
    voiceConfirmationEnabled: true,
    shortcuts: DEFAULT_VOICE_SHORTCUTS,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.state.isSupported = !!SpeechRec;

      // Load saved preferences
      try {
        const savedShortcuts = localStorage.getItem('gkedit_voice_shortcuts');
        if (savedShortcuts) {
          const parsed = JSON.parse(savedShortcuts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.state.shortcuts = parsed;
          }
        }
        const savedContinuous = localStorage.getItem('gkedit_voice_continuous');
        if (savedContinuous !== null) {
          this.state.continuousMode = savedContinuous === 'true';
        }
        const savedAudio = localStorage.getItem('gkedit_voice_audio_chime');
        if (savedAudio !== null) {
          this.state.audioFeedbackEnabled = savedAudio === 'true';
        }
        const savedVoice = localStorage.getItem('gkedit_voice_confirmation');
        if (savedVoice !== null) {
          this.state.voiceConfirmationEnabled = savedVoice === 'true';
        }
      } catch (e) {
        console.warn('Failed loading voice shortcut preferences:', e);
      }

      // Pause speech recognition when tab is hidden to conserve battery
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stop();
        } else if (this.state.continuousMode) {
          this.start();
        }
      });
    }
  }

  public getState(): VoiceShortcutState {
    return { ...this.state };
  }

  public subscribe(listener: VoiceShortcutListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((fn) => fn(s));
  }

  // -------------------------------------------------------------
  // RECOGNITION LIFECYCLE (Web Speech API)
  // -------------------------------------------------------------
  public start() {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      this.state.isSupported = false;
      this.state.errorMessage = 'Web Speech API is not supported in this browser.';
      this.notify();
      return;
    }

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
    }

    try {
      const recog = new SpeechRec();
      recog.continuous = this.state.continuousMode;
      recog.interimResults = true;
      recog.maxAlternatives = 3;
      recog.lang = 'en-US';

      recog.onstart = () => {
        this.state.isListening = true;
        this.state.status = 'listening';
        this.state.errorMessage = null;
        this.notify();
      };

      recog.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          transcript += res[0].transcript;
          if (res.isFinal) isFinal = true;
        }

        const trimmed = transcript.trim();
        if (!trimmed) return;

        this.state.lastTranscript = trimmed;
        this.state.status = 'recognizing';
        this.notify();

        if (isFinal) {
          this.handleSpokenPhrase(trimmed);
        }
      };

      recog.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Voice command recognition error:', event.error);
          this.state.errorMessage = `Microphone: ${event.error}`;
          this.state.status = 'error';
          this.notify();
        }
      };

      recog.onend = () => {
        this.state.isListening = false;
        if (this.state.continuousMode && !document.hidden) {
          clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            this.start();
          }, 800);
        } else {
          this.state.status = 'idle';
        }
        this.notify();
      };

      recog.start();
      this.recognition = recog;
      this.playChime('activate');
    } catch (err: any) {
      this.state.errorMessage = err.message || 'Microphone access denied.';
      this.state.status = 'error';
      this.notify();
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
    this.state.isListening = false;
    this.state.status = 'idle';
    this.notify();
  }

  public toggleListening(): boolean {
    if (this.state.isListening) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public setContinuousMode(enable: boolean) {
    this.state.continuousMode = enable;
    try {
      localStorage.setItem('gkedit_voice_continuous', String(enable));
    } catch {}
    this.notify();
    if (enable && !this.state.isListening) {
      this.start();
    } else if (!enable && this.state.isListening) {
      this.stop();
    }
  }

  public setAudioFeedback(enable: boolean) {
    this.state.audioFeedbackEnabled = enable;
    try {
      localStorage.setItem('gkedit_voice_audio_chime', String(enable));
    } catch {}
    this.notify();
  }

  public setVoiceConfirmation(enable: boolean) {
    this.state.voiceConfirmationEnabled = enable;
    try {
      localStorage.setItem('gkedit_voice_confirmation', String(enable));
    } catch {}
    this.notify();
  }

  // -------------------------------------------------------------
  // PHRASE MATCHING & SHORTCUT EXECUTION
  // -------------------------------------------------------------
  public async handleSpokenPhrase(rawText: string): Promise<boolean> {
    if (this.recognitionCooldown) return false;
    const clean = rawText
      .toLowerCase()
      .replace(/[.,?!;:()[\]{}"']/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean) return false;

    // Remove conversational wake prefixes if present (e.g., "hey jarvis take a photo" -> "take a photo")
    const prefixes = ['hey jarvis', 'jarvis', 'ok jarvis', 'okay jarvis', 'please', 'can you', 'alexa', 'siri', 'gk'];
    let normalized = clean;
    for (const prefix of prefixes) {
      if (normalized.startsWith(prefix)) {
        normalized = normalized.slice(prefix.length).trim();
      }
    }

    // 0. Dynamic timer commands (e.g. "set a timer for 5 minutes", "timer 10 mins", "set 3 minute timer")
    const timerCmd = parseTimerCommand(normalized) || parseTimerCommand(clean);
    if (timerCmd) {
      this.recognitionCooldown = true;
      setTimeout(() => {
        this.recognitionCooldown = false;
      }, 1200);

      await this.executeTimerShortcut(timerCmd.totalSeconds, timerCmd.label, rawText);
      return true;
    }

    // Timer cancel / stop
    if (
      normalized.includes('cancel timer') ||
      normalized.includes('stop timer') ||
      normalized.includes('clear timer') ||
      normalized.includes('dismiss timer') ||
      clean.includes('cancel timer') ||
      clean.includes('stop timer')
    ) {
      dynamicIslandService.cancelTimer();
      this.playChime('activate');
      if (this.state.voiceConfirmationEnabled) {
        this.speakFeedback('Timer cancelled.');
      }
      notificationService.showInAppToast('Timer Dismissed', 'Active timer cancelled and reset', 'info');
      return true;
    }

    // Timer pause
    if (normalized.includes('pause timer') || clean.includes('pause timer')) {
      dynamicIslandService.pauseTimer();
      this.playChime('activate');
      if (this.state.voiceConfirmationEnabled) {
        this.speakFeedback('Timer paused.');
      }
      notificationService.showInAppToast('Timer Paused', 'Countdown paused on Dynamic Island', 'info');
      return true;
    }

    // Timer resume
    if (
      normalized.includes('resume timer') ||
      normalized.includes('continue timer') ||
      clean.includes('resume timer')
    ) {
      dynamicIslandService.resumeTimer();
      this.playChime('activate');
      if (this.state.voiceConfirmationEnabled) {
        this.speakFeedback('Timer resumed.');
      }
      notificationService.showInAppToast('Timer Resumed', 'Countdown resumed on Dynamic Island', 'info');
      return true;
    }

    const enabledShortcuts = this.state.shortcuts.filter((s) => s.enabled);

    // 1. Exact match test
    let matchedShortcut = enabledShortcuts.find((s) =>
      s.phrases.some((p) => {
        const pClean = p.toLowerCase().trim();
        return normalized === pClean || clean === pClean;
      })
    );

    // 2. Contains match test (e.g. "please take a photo now" contains "take a photo")
    if (!matchedShortcut) {
      matchedShortcut = enabledShortcuts.find((s) =>
        s.phrases.some((p) => {
          const pClean = p.toLowerCase().trim();
          return normalized.includes(pClean) || clean.includes(pClean);
        })
      );
    }

    if (matchedShortcut) {
      this.recognitionCooldown = true;
      setTimeout(() => {
        this.recognitionCooldown = false;
      }, 1200);

      await this.executeShortcut(matchedShortcut, normalized);
      return true;
    } else {
      this.state.status = 'unmatched';
      this.playChime('unmatched');
      this.notify();
      setTimeout(() => {
        if (this.state.status === 'unmatched') {
          this.state.status = this.state.isListening ? 'listening' : 'idle';
          this.notify();
        }
      }, 2500);
      return false;
    }
  }

  public async executeShortcut(shortcut: VoiceShortcut, matchedPhrase?: string): Promise<void> {
    try {
      this.state.status = 'executed';
      this.playChime('success');

      // Verbal confirmation feedback
      if (this.state.voiceConfirmationEnabled && shortcut.feedbackSpeech) {
        this.speakFeedback(shortcut.feedbackSpeech);
      }

      // Execute specific mapped application action
      let message = `Executed: ${shortcut.name}`;
      switch (shortcut.actionId) {
        case 'take_photo':
          message = await this.actionTakePhoto();
          break;
        case 'clear_cache':
          message = await this.actionClearCache();
          break;
        case 'lock_app':
          message = this.actionLockApp();
          break;
        case 'torch_on':
          message = await this.actionTorch(true);
          break;
        case 'torch_off':
          message = await this.actionTorch(false);
          break;
        case 'open_chat':
          this.dispatchTabSwitch('chat');
          window.dispatchEvent(new CustomEvent('gkedit:focus_chat_input'));
          message = 'Switched to AI Chat view.';
          break;
        case 'open_dashboard':
          this.dispatchTabSwitch('dashboard');
          message = 'Navigated to Origin OS 6 Dashboard.';
          break;
        case 'open_maps':
          this.dispatchTabSwitch('maps');
          message = 'Navigated to Cyclone Radar & Maps.';
          break;
        case 'open_news':
          this.dispatchTabSwitch('tools');
          window.dispatchEvent(new CustomEvent('gkedit:switch_tool_subtab', { detail: { subtab: 'news' } }));
          message = 'Opened Daily Chronicle vintage news.';
          break;
        case 'open_biolab':
          this.dispatchTabSwitch('biolab');
          message = 'Launched 3D Bioscience Observable Lab.';
          break;
        case 'start_lesson':
          this.dispatchTabSwitch('tools');
          window.dispatchEvent(new CustomEvent('gkedit:switch_tool_subtab', { detail: { subtab: 'gk_learning' } }));
          message = 'Started 2-minute GK Learning lesson.';
          break;
        case 'toggle_fullscreen':
          await deviceControls.toggleFullscreen();
          message = 'Toggled fullscreen display mode.';
          break;
        case 'open_settings':
          this.dispatchTabSwitch('settings');
          message = 'Opened GKEDIT Settings.';
          break;
        case 'show_shortcuts':
          window.dispatchEvent(new CustomEvent('gkedit:open_voice_shortcuts'));
          message = 'Opened Voice Command Shortcuts catalog.';
          break;
        case 'open_dialer':
          this.dispatchTabSwitch('tools');
          window.dispatchEvent(new CustomEvent('gkedit:switch_tool_subtab', { detail: { subtab: 'dialer' } }));
          message = 'Opened AI Screen Dialer.';
          break;
        case 'set_timer':
          await this.executeTimerShortcut(300, '5 Minutes');
          message = 'Started 5-minute countdown timer on Dynamic Island.';
          break;
        default:
          window.dispatchEvent(
            new CustomEvent('gkedit:custom_voice_action', { detail: { actionId: shortcut.actionId } })
          );
          message = `Executed custom action ${shortcut.name}`;
      }

      this.state.lastExecution = {
        shortcutId: shortcut.id,
        shortcutName: shortcut.name,
        phrase: matchedPhrase || shortcut.phrases[0],
        timestamp: Date.now(),
        success: true,
        message,
      };

      notificationService.showInAppToast(`⚡ Voice Shortcut: ${shortcut.name}`, message, 'info');

      // Notify window listeners
      window.dispatchEvent(
        new CustomEvent('gkedit:voice_shortcut_executed', {
          detail: {
            shortcut,
            phrase: matchedPhrase,
            message,
          },
        })
      );
    } catch (err: any) {
      console.error('Failed executing voice shortcut:', err);
      this.state.lastExecution = {
        shortcutId: shortcut.id,
        shortcutName: shortcut.name,
        phrase: matchedPhrase || shortcut.phrases[0],
        timestamp: Date.now(),
        success: false,
        message: err.message || 'Execution failed',
      };
      this.playChime('unmatched');
      notificationService.showInAppToast('Voice Action Failed', err.message || 'Error executing command', 'alert');
    }

    this.notify();

    setTimeout(() => {
      if (this.state.status === 'executed') {
        this.state.status = this.state.isListening ? 'listening' : 'idle';
        this.notify();
      }
    }, 2800);
  }

  public async executeTimerShortcut(totalSeconds: number, label: string, rawText?: string): Promise<void> {
    try {
      this.state.status = 'executed';
      this.playChime('success');

      // Engage countdown directly on Dynamic Island
      dynamicIslandService.startTimer(totalSeconds, label);

      if (this.state.voiceConfirmationEnabled) {
        this.speakFeedback(`Timer set for ${label}.`);
      }

      const message = `Started ${label} countdown timer directly on Dynamic Island.`;
      this.state.lastExecution = {
        shortcutId: 'set_timer',
        shortcutName: 'Set Timer',
        phrase: rawText || `set a timer for ${label}`,
        timestamp: Date.now(),
        success: true,
        message,
      };

      notificationService.showInAppToast(`⏳ Timer Set: ${label}`, message, 'info');

      window.dispatchEvent(
        new CustomEvent('gkedit:voice_shortcut_executed', {
          detail: {
            shortcut: {
              id: 'set_timer',
              name: 'Set Timer',
              category: 'Device & Tools',
              description: 'Starts a countdown timer on Dynamic Island',
              feedbackSpeech: `Timer set for ${label}.`,
              iconName: 'Timer',
              enabled: true,
              actionId: 'set_timer',
              phrases: [`set a timer for ${label}`],
            },
            phrase: rawText || `set a timer for ${label}`,
            message,
          },
        })
      );
    } catch (err: any) {
      console.error('Failed starting timer:', err);
    }

    this.notify();

    setTimeout(() => {
      if (this.state.status === 'executed') {
        this.state.status = this.state.isListening ? 'listening' : 'idle';
        this.notify();
      }
    }, 2800);
  }

  // -------------------------------------------------------------
  // SPECIFIC ACTION HANDLERS
  // -------------------------------------------------------------
  private async actionTakePhoto(): Promise<string> {
    // 1. Dispatch tab switch to camera
    this.dispatchTabSwitch('camera');

    // 2. Allow camera viewfinder DOM to mount, then trigger mechanical photo capture
    await new Promise((res) => setTimeout(res, 450));
    window.dispatchEvent(new CustomEvent('gkedit:trigger_photo_capture'));
    return 'Camera viewfinder triggered. Photo captured with Leica watermark.';
  }

  private async actionClearCache(): Promise<string> {
    let clearedCount = 0;

    // 1. Purge CacheStorage API
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        clearedCount += cacheNames.length;
      } catch (e) {
        console.warn('CacheStorage purge notice:', e);
      }
    }

    // 2. Clear Session Storage
    try {
      sessionStorage.clear();
    } catch {}

    // 3. Purge non-essential localStorage caches (preserve credentials, locks, and persistent settings)
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith('gkedit_cache_') ||
            key.startsWith('weather_') ||
            key.startsWith('gkedit_radar_') ||
            key.startsWith('temp_') ||
            key.includes('search_cache') ||
            key.includes('draft'))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      clearedCount += keysToRemove.length;
    } catch {}

    return `System cache cleared: ${clearedCount} memory buffers and cached queries purged.`;
  }

  private actionLockApp(): string {
    // 1. Revoke active session
    try {
      localStorage.removeItem('gkedit_session_active');
      localStorage.setItem('gkedit_biometric_lock', 'true');
    } catch {}

    // 2. Dispatch global lock event for App.tsx
    window.dispatchEvent(new CustomEvent('gkedit:lock_app'));
    return 'Security Gate engaged: Passkey / Biometrics required to proceed.';
  }

  private async actionTorch(enable: boolean): Promise<string> {
    if (enable) {
      await deviceControls.turnOnTorch();
      return 'Flashlight activated.';
    } else {
      deviceControls.turnOffTorch();
      return 'Flashlight extinguished.';
    }
  }

  private dispatchTabSwitch(tab: string) {
    window.dispatchEvent(new CustomEvent('gkedit:switch_tab', { detail: { tab } }));
  }

  // -------------------------------------------------------------
  // CUSTOM SHORTCUT MANAGEMENT
  // -------------------------------------------------------------
  public addCustomShortcut(
    name: string,
    spokenPhrase: string,
    actionId: string,
    category: VoiceShortcut['category'] = 'System & Security',
    feedbackSpeech = 'Command executed.'
  ): VoiceShortcut {
    const newId = `custom_${Date.now()}`;
    const newShortcut: VoiceShortcut = {
      id: newId,
      name,
      phrases: [spokenPhrase.toLowerCase().trim()],
      category,
      description: `Custom command triggering ${actionId}`,
      feedbackSpeech,
      iconName: 'Sparkles',
      isCustom: true,
      enabled: true,
      actionId,
    };

    this.state.shortcuts = [newShortcut, ...this.state.shortcuts];
    this.saveShortcuts();
    this.notify();
    return newShortcut;
  }

  public deleteCustomShortcut(id: string) {
    this.state.shortcuts = this.state.shortcuts.filter((s) => s.id !== id);
    this.saveShortcuts();
    this.notify();
  }

  public toggleShortcutEnabled(id: string, enabled?: boolean) {
    this.state.shortcuts = this.state.shortcuts.map((s) =>
      s.id === id ? { ...s, enabled: enabled !== undefined ? enabled : !s.enabled } : s
    );
    this.saveShortcuts();
    this.notify();
  }

  public restoreDefaultShortcuts() {
    this.state.shortcuts = DEFAULT_VOICE_SHORTCUTS;
    try {
      localStorage.removeItem('gkedit_voice_shortcuts');
    } catch {}
    this.notify();
  }

  private saveShortcuts() {
    try {
      localStorage.setItem('gkedit_voice_shortcuts', JSON.stringify(this.state.shortcuts));
    } catch {}
  }

  // -------------------------------------------------------------
  // AUDIO & SPEECH SYNTHESIS ENGINE
  // -------------------------------------------------------------
  private playChime(type: 'activate' | 'success' | 'unmatched') {
    if (!this.state.audioFeedbackEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === 'activate') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'success') {
        // High dual harmonic chime (C5 -> G5)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.setValueAtTime(783.99, now + 0.08); // G5
        osc2.frequency.setValueAtTime(1046.5, now + 0.08); // C6

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.08);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
      } else {
        // Low soft blip
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      }

      setTimeout(() => {
        try {
          ctx.close();
        } catch {}
      }, 450);
    } catch {}
  }

  private speakFeedback(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.05;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }
}

export const voiceCommandShortcutService = new VoiceCommandShortcutService();
