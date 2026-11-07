import React, { useState, useEffect } from 'react';
import {
  Settings,
  Globe,
  Fingerprint,
  Youtube,
  User,
  ShieldCheck,
  Award,
  Sparkles,
  ExternalLink,
  GraduationCap,
  Check,
  Bell,
  BellOff,
  BellRing,
  Heart,
  Droplets,
  Utensils,
  Moon,
  BookOpen,
  Eye,
  AlertTriangle,
  Info,
  Volume2,
  Cloud,
  Smartphone,
  Mic,
  Camera,
  Download,
  Trash2,
  RefreshCw,
  Users,
  Clock,
  Radio,
  CheckCircle2,
  Activity,
  Palette,
  RotateCcw,
  Zap,
  Sliders,
  Keyboard,
  Command,
  Play,
  Square,
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Shield,
  ShieldAlert,
  Cpu,
  Battery,
  Wifi,
  HeartOff,
  Bot,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { notificationService } from '../services/notificationService.ts';
import { chatHistoryService } from '../services/chatHistoryService.ts';
import { wakeWordService } from '../services/wakeWordService.ts';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { aiSettingsService, AiSettingsState } from '../services/aiSettingsService.ts';
import { authStorage } from '../services/api.ts';
import {
  googleContactsService,
  GoogleSyncInfo,
} from '../services/googleContactsService.ts';
import {
  themeService,
  ACCENT_PRESETS,
  AccentThemeId,
  AccentPreset,
} from '../services/themeService.ts';
import { keyboardShortcutsService } from '../services/keyboardShortcutsService.ts';
import { voiceCommandShortcutService, VoiceShortcutState } from '../services/voiceCommandShortcutService.ts';
import {
  voiceSettingsService,
  AVAILABLE_VOICES,
  VoiceOption,
  VoiceVerbosity,
  VoiceSettings,
} from '../services/voiceSettingsService.ts';
import confetti from 'canvas-confetti';
import { GkSettingsSubtab } from './GkSettingsSubtab.tsx';

function formatSyncTime(timestamp: number | null): { relative: string; exact: string } {
  if (!timestamp) {
    return { relative: 'Never Synced', exact: 'No sync record detected' };
  }
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  const exact = new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  if (diffSec < 5) return { relative: 'Just now', exact };
  if (diffSec < 60) return { relative: `${diffSec}s ago`, exact };
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return { relative: `${diffMin}m ago`, exact };
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return { relative: `${diffHr}h ago`, exact };
  const diffDays = Math.floor(diffHr / 24);
  return { relative: `${diffDays}d ago`, exact };
}

interface SettingsTabProps {
  currentLang: string;
  onChangeLang: (lang: any) => void;
  onOpenAuth: () => void;
  onOpenCreatorHub: () => void;
  onOpenMonitor?: () => void;
  onOpenInstall?: () => void;
  onLockSession?: () => void;
  onNavigateToTools?: () => void;
}

export function SettingsTab({
  currentLang,
  onChangeLang,
  onOpenAuth,
  onOpenCreatorHub,
  onOpenMonitor,
  onOpenInstall,
  onLockSession,
  onNavigateToTools,
}: SettingsTabProps) {
  const { user, isAdmin, logout } = useAuth();
  const [showAdvancedSystem, setShowAdvancedSystem] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [chatHistoryCleared, setChatHistoryCleared] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(() => {
    return localStorage.getItem('gkedit_biometric_lock') === 'true';
  });

  // Notification state
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    notificationService.getPermissionStatus()
  );
  const [notificationsOn, setNotificationsOn] = useState(notificationService.notificationsEnabled);
  const [notifError, setNotifError] = useState<string | null>(null);

  // Wake Word ("Hey Jarvis") State
  const [wakeWordOn, setWakeWordOn] = useState<boolean>(() => wakeWordService.enabled);
  const { isInstalled, isInstallable } = usePWAInstall();

  // Google People API Sync Status & Polling Engine
  const [syncInfo, setSyncInfo] = useState<GoogleSyncInfo>(() => googleContactsService.getSyncInfo());
  const [googleUser, setGoogleUser] = useState<any>(() => googleContactsService.getCurrentUser());
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(() => !!googleContactsService.getAccessToken());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pollCountdown, setPollCountdown] = useState<number>(30);
  const [, setTick] = useState<number>(0);

  // Theme Accent Customization State
  const [currentAccent, setCurrentAccent] = useState<AccentPreset>(() => themeService.getCurrentPreset());
  const [previewSlider, setPreviewSlider] = useState<number>(75);

  // GKEDIT Live Voice Customization State
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => voiceSettingsService.getSettings());
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  // EDITH Protocol Call Sentinel & Stark AI Matrix State
  const [aiSettings, setAiSettings] = useState<AiSettingsState>(() => aiSettingsService.getState());
  const [routingPhoneInput, setRoutingPhoneInput] = useState<string>(() => aiSettingsService.getState().screeningUserNumber);
  const [phoneSaved, setPhoneSaved] = useState<boolean>(false);
  const [isPlayingSentinelSpeech, setIsPlayingSentinelSpeech] = useState<boolean>(false);
  const [isSimulatingCall, setIsSimulatingCall] = useState<boolean>(false);
  const [simulatedVerdict, setSimulatedVerdict] = useState<any | null>(null);
  const [simulatedCallerType, setSimulatedCallerType] = useState<'spam' | 'delivery' | 'family'>('spam');
  const [simulatedTranscript, setSimulatedTranscript] = useState<Array<{ sender: 'ai' | 'caller'; text: string }>>([]);

  const [voiceShortcutState, setVoiceShortcutState] = useState<VoiceShortcutState>(() =>
    voiceCommandShortcutService.getState()
  );

  useEffect(() => {
    return voiceCommandShortcutService.subscribe(setVoiceShortcutState);
  }, []);

  useEffect(() => {
    return themeService.subscribe((preset) => {
      setCurrentAccent(preset);
    });
  }, []);

  useEffect(() => {
    return voiceSettingsService.subscribe((settings) => {
      setVoiceSettings(settings);
    });
  }, []);

  useEffect(() => {
    return aiSettingsService.subscribe((settings) => {
      setAiSettings(settings);
      setRoutingPhoneInput(settings.screeningUserNumber);
    });
  }, []);

  // Subscribe to Google Auth and Sync changes
  useEffect(() => {
    const unsubSync = googleContactsService.subscribeSync((info) => {
      setSyncInfo(info);
      if (info.error) {
        setSyncError(info.error);
      }
    });
    const unsubAuth = googleContactsService.subscribeAuth((u, token) => {
      setGoogleUser(u);
      setIsGoogleConnected(!!token);
    });
    return () => {
      unsubSync();
      unsubAuth();
    };
  }, []);

  // Timer to keep relative timestamps fresh
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Automated Google People API Polling Cycle (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setPollCountdown((prev) => {
        if (prev <= 1) {
          // Poll Google People API when authenticated
          if (googleContactsService.getAccessToken()) {
            googleContactsService.pollSync().catch((err) => {
              console.warn('Auto-poll Google People API notice:', err?.message || err);
            });
          }
          return 30; // reset 30s countdown
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Initial sync check on component mount if user has active token
  useEffect(() => {
    if (googleContactsService.getAccessToken()) {
      googleContactsService.pollSync().catch(() => {});
    }
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      await googleContactsService.pollSync();
      setPollCountdown(30);
      notificationService.playSoftChime();
      notificationService.showInAppToast(
        'Contacts Synced ✓',
        'Google People API polled successfully. Count and sync timestamp refreshed.',
        'success'
      );
    } catch (err: any) {
      setSyncError(err?.message || 'Failed to sync with Google People API.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setIsSyncing(true);
      setSyncError(null);
      await googleContactsService.signIn();
      await googleContactsService.pollSync();
      setPollCountdown(30);
      notificationService.playSoftChime();
      notificationService.showInAppToast(
        'Google Connected ⚡',
        'Google People API connected. Live polling activated.',
        'success'
      );
    } catch (err: any) {
      console.error('Google Sign-in failed in Settings:', err);
      setSyncError(err?.message || 'Google authentication was cancelled or failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await googleContactsService.signOut();
      notificationService.showInAppToast(
        'Google Disconnected',
        'Google session cleared and polling stopped.',
        'info'
      );
    } catch (err: any) {
      console.error('Sign-out failed:', err);
    }
  };

  useEffect(() => {
    setNotifPermission(notificationService.getPermissionStatus());
    setNotificationsOn(notificationService.notificationsEnabled);
  }, []);

  const handleToggleWakeWord = () => {
    const next = !wakeWordOn;
    setWakeWordOn(next);
    wakeWordService.setEnabled(next);
  };

  const handleConfetti = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#3b82f6', '#60a5fa', '#38bdf8'],
    });
  };

  const handleOneTapDeleteChatHistory = () => {
    chatHistoryService.createBackup();
    chatHistoryService.clearAllSessions(false);
    setChatHistoryCleared(true);
    notificationService.playSoftChime();
    notificationService.showInAppToast(
      '🗑️ చాట్ హిస్టరీ తొలగించబడింది (1-Tap)',
      'చాట్ హిస్టరీ మాత్రమే విజయవంతంగా తొలగించబడింది. మీ ఖాతా వివరాలు లేదా ఇతర సెట్టింగ్‌లు అలాగే ఉన్నాయి.',
      'success',
      {
        actionLabel: 'Undo (రద్దు చేయి)',
        onAction: () => {
          chatHistoryService.restoreBackup();
          setChatHistoryCleared(false);
        },
      }
    );
    setTimeout(() => setChatHistoryCleared(false), 3000);
  };

  const handleClearCache = () => {
    localStorage.removeItem('gkedit_calendar_events');
    setCleared(true);
    setTimeout(() => setCleared(false), 2500);
  };

  const handleToggleBiometrics = () => {
    const next = !biometricEnabled;
    setBiometricEnabled(next);
    if (next) {
      localStorage.setItem('gkedit_biometric_lock', 'true');
    } else {
      localStorage.removeItem('gkedit_biometric_lock');
    }
  };

  const handleRequestNotifications = async () => {
    setNotifError(null);
    try {
      const granted = await notificationService.requestNotificationPermission();
      setNotifPermission(notificationService.getPermissionStatus());
      setNotificationsOn(granted);
      if (!granted) {
        setNotifError('Notification permission was blocked or dismissed by your browser.');
      }
    } catch (err: any) {
      setNotifError(err.message || 'Could not request notification permission.');
    }
  };

  const handleToggleNotifications = () => {
    if (notifPermission !== 'granted') {
      handleRequestNotifications();
      return;
    }
    const next = !notificationsOn;
    setNotificationsOn(next);
    notificationService.setNotificationsEnabled(next);
  };

  const handleTestChime = () => {
    notificationService.playSoftChime();
    notificationService.sendChromeNotification('Test Chrome Alert ⚡', 'Real Chrome system notifications are working properly.');
    notificationService.showInAppToast('Chrome Notification Sent', 'Check your screen or Chrome notification center ✓', 'success');
  };

  const handleSelectAccent = (id: AccentThemeId) => {
    const newPreset = themeService.setAccent(id);
    notificationService.playSoftChime();
    notificationService.showInAppToast(
      `Theme Accent: ${newPreset.name} 🎨`,
      `Aesthetic switched to ${newPreset.subtitle}. Ambient glow and borders updated.`,
      'success'
    );
  };

  const handleResetAccent = () => {
    themeService.resetToDefault();
    notificationService.playSoftChime();
    notificationService.showInAppToast(
      'Default Accent Restored ⚡',
      'Reset back to Cyber Cyan (#06b6d4).',
      'info'
    );
  };

  // -------------------------------------------------------------
  // EDITH PROTOCOL & STARK AI MATRIX HANDLERS
  // -------------------------------------------------------------
  const isCreatorVerified = user?.role === 'creator';
  const isCreatorFull = isAdmin || isCreatorVerified;

  const handleToggleCallSentinel = () => {
    const nextState = !aiSettings.callScreeningActive;
    aiSettingsService.setCallScreeningActive(nextState);
    notificationService.playSoftChime();
    notificationService.showInAppToast(
      nextState ? '🛡️ EDITH Call Sentinel Activated' : '⚠️ EDITH Sentinel Paused',
      nextState
        ? 'Incoming calls will now be automatically screened and verified by AI.'
        : 'Sentinel deactivated. Incoming calls will ring through directly.',
      nextState ? 'info' : 'warning'
    );
  };

  const handleSaveRoutingNumber = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = routingPhoneInput.trim();
    if (!clean) {
      notificationService.showInAppToast(
        'Invalid Number',
        'Please enter a valid phone number with country code (e.g. +91 98490 21410).',
        'warning'
      );
      return;
    }
    aiSettingsService.setScreeningUserNumber(clean);
    setPhoneSaved(true);
    setTimeout(() => setPhoneSaved(false), 2500);
    notificationService.showInAppToast(
      'Primary Phone Number Saved',
      `Routing address set to ${clean}. VIP whitelist and direct carrier forward synced.`,
      'info'
    );
  };

  const handleToggleCallTarget = (target: 'all' | 'unknown') => {
    aiSettingsService.setCallScreenTarget(target);
    notificationService.showInAppToast(
      target === 'all' ? 'Screen All Calls Engaged' : 'Screen Unknown Only Engaged',
      target === 'all'
        ? 'All incoming calls (family, work & unknown) will undergo AI interrogation.'
        : 'Only unknown or suspected telemarketing callers will be screened.',
      'info'
    );
  };

  const handlePlaySentinelSpeech = async () => {
    if (isPlayingSentinelSpeech) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlayingSentinelSpeech(false);
      return;
    }

    setIsPlayingSentinelSpeech(true);
    const textToSpeak = aiSettings.screeningAiSpeech.trim();
    const token = authStorage.getToken() || '';

    try {
      const res = await fetch('/api/audio/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text: textToSpeak,
          voiceName: 'Fenrir',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audio.onended = () => setIsPlayingSentinelSpeech(false);
          audio.onerror = () => {
            fallbackSpeak(textToSpeak);
          };
          await audio.play();
          return;
        }
      }
    } catch (e) {
      console.warn('TTS server fallback:', e);
    }

    fallbackSpeak(textToSpeak);
  };

  const fallbackSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setIsPlayingSentinelSpeech(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.95;
    utterance.onend = () => setIsPlayingSentinelSpeech(false);
    utterance.onerror = () => setIsPlayingSentinelSpeech(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSimulateCallScreening = (type: 'spam' | 'delivery' | 'family') => {
    setSimulatedCallerType(type);
    setIsSimulatingCall(true);
    setSimulatedTranscript([]);
    setSimulatedVerdict(null);

    setTimeout(() => {
      setSimulatedTranscript([
        {
          sender: 'ai',
          text: "Hello, you have reached GK EDIT's AI Sentinel. GK EDIT is currently occupied. State your identity, organization, and the precise purpose of this call.",
        },
      ]);
    }, 500);

    setTimeout(() => {
      if (type === 'spam') {
        setSimulatedTranscript((prev) => [
          ...prev,
          {
            sender: 'caller',
            text: 'Hello sir! I am calling from FastCash Finance. You are approved for a ₹15 Lakh instant personal credit card with zero processing fees! Are you interested?',
          },
        ]);
      } else if (type === 'delivery') {
        setSimulatedTranscript((prev) => [
          ...prev,
          {
            sender: 'caller',
            text: 'Hello, this is Amazon Logistics delivery associate. I am downstairs with your order package. Please confirm OTP or come collect.',
          },
        ]);
      } else {
        setSimulatedTranscript((prev) => [
          ...prev,
          {
            sender: 'caller',
            text: 'Hi beta! It is your family calling. Call back when you finish your study session, wanted to ask about dinner.',
          },
        ]);
      }
    }, 1600);

    setTimeout(() => {
      setIsSimulatingCall(false);
      if (type === 'spam') {
        setSimulatedVerdict({
          event: 'INCOMING_CALL_SCREEN',
          caller_id: '+91 14099 87654 (FastCash Loans)',
          intent_summary: 'Unsolicited pre-approved personal loan promotion',
          verdict: 'SPAM',
          action: 'DECLINE_CALL',
          confidence_score: 98,
          system_message: 'Call terminated by EDITH Sentinel. Blocked from disturbing user.',
        });
      } else if (type === 'delivery') {
        setSimulatedVerdict({
          event: 'INCOMING_CALL_SCREEN',
          caller_id: '+91 98765 43210 (Amazon Delivery)',
          intent_summary: 'Doorstep parcel delivery verification',
          verdict: 'USEFUL',
          action: 'ALERT_USER',
          confidence_score: 95,
          system_message: 'High priority courier delivery verified. Alerting user immediately.',
        });
      } else {
        setSimulatedVerdict({
          event: 'INCOMING_CALL_SCREEN',
          caller_id: '+91 94401 23456 (Family Member)',
          intent_summary: 'Direct family call regarding home and dinner',
          verdict: 'USEFUL',
          action: 'ALERT_USER',
          confidence_score: 99,
          system_message: 'Family member verified on VIP contact whitelist. Passing call through.',
        });
      }
    }, 2800);
  };

  const handleToggleMotherly = () => {
    if (!isCreatorFull) {
      notificationService.showInAppToast(
        'Access Denied',
        'Motherly personal care protocol is exclusively reserved for Creator GK EDIT.',
        'warning'
      );
      return;
    }
    const nextVal = !aiSettings.motherlyCareEnabled;
    aiSettingsService.setMotherlyCare(nextVal);
    notificationService.showInAppToast(
      nextVal ? '❤️ Motherly Personality Activated' : '⚡ Cyber-Systems Mode Active',
      nextVal
        ? 'GKEDIT AI will offer loving maternal care, checking on food, hydration, and rest.'
        : 'Mother feelings removed. Operating purely in razor-sharp systems architect mode.',
      'info'
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Sleek Futuristic Mockup Settings Subtab (App Icon Preferences, Reset & Restore, Save Changes) */}
      <GkSettingsSubtab
        onNavigateToTools={() => {
          if (onNavigateToTools) {
            onNavigateToTools();
          } else {
            window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'tools' } }));
          }
        }}
        onOpenAdvancedSettings={() => setShowAdvancedSystem((prev) => !prev)}
      />

      {/* Advanced Hardware, Session & Account Controls (Collapsible Suite) */}
      <div className="max-w-3xl mx-auto px-4 pb-28 space-y-6">
        <div className="p-4 rounded-2xl bg-[#040e24]/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">System, Security & Hardware Controls</h3>
              <p className="text-xs text-slate-400">Account session, biometrics, wake word & Google People API sync</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvancedSystem((prev) => !prev)}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold transition cursor-pointer"
          >
            {showAdvancedSystem ? 'Collapse Suite ▲' : 'Expand Suite ▼'}
          </button>
        </div>

        {showAdvancedSystem && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                <span>GKEDIT AI Hardware & Session Parameters</span>
              </h2>
              <p className="text-xs text-slate-400">
                Preferences, browser permissions, and personalized care systems
              </p>
            </div>

            {/* Account Section with Liquid Blue Styling */}
            <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" />
          <span>User Session (JWT Protected)</span>
        </h3>

        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-950 border border-cyan-500/30 flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-cyan-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{user.name}</p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
                <span className="text-[10px] text-cyan-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3 h-3" /> Role: {user.role} (Server Verified)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && onOpenMonitor && (
                <button
                  onClick={onOpenMonitor}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-[#38bdf8]/60 text-[#38bdf8] text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(56,189,248,0.3)] cursor-pointer"
                  title="Open Creator Live User Monitor Dashboard"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-[#38bdf8] animate-pulse" />
                  <span>⚡ Creator Live Monitor</span>
                </button>
              )}
              {onLockSession && (
                <button
                  type="button"
                  onClick={onLockSession}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Lock Security Gate (PIN 2141 required)"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lock Gate</span>
                </button>
              )}
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-xl bg-blue-950 hover:bg-red-950/60 hover:text-red-400 border border-cyan-500/20 text-xs font-semibold text-slate-300 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Not signed in (Guest Mode Active)</p>
            <div className="flex items-center gap-2">
              {onLockSession && (
                <button
                  type="button"
                  onClick={onLockSession}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  title="Lock Security Gate"
                >
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Lock Gate</span>
                </button>
              )}
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                Sign In / Register
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* EDITH PROTOCOL: ZERO-SPAM CALL SENTINEL & STARK AI MATRIX    */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#06102b] via-[#040e24] to-[#0a183d] border border-cyan-500/35 shadow-[0_10px_35px_rgba(0,0,0,0.5)] space-y-6 relative overflow-hidden">
        {/* Ambient Cyan Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header with Main Sentinel Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 font-mono">
                  <span>[EDITH PROTOCOL] ZERO-SPAM CALL SENTINEL</span>
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Version 2026 Ultra
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated VoIP & incoming audio firewall: interrogates callers, auto-screens telemarketing bots, and safeguards creator focus.
              </p>
            </div>
          </div>

          {/* Master Call Sentinel Toggle Switch */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleToggleCallSentinel}
              className={`px-4 py-2 rounded-2xl border text-xs font-bold font-mono transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                aiSettings.callScreeningActive
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border-slate-700/80'
              }`}
            >
              {aiSettings.callScreeningActive ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span>SENTINEL ACTIVE</span>
                </>
              ) : (
                <>
                  <PhoneOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>SENTINEL PAUSED</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* User Primary Phone Number for Routing Input */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#03091e]/90 border border-cyan-500/25 space-y-3 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-cyan-400 shrink-0" />
              <label htmlFor="primaryPhoneRoutingInput" className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Primary Phone Number (Direct Call Routing & VIP Whitelist)
              </label>
            </div>
            <span className="text-[10px] text-cyan-400/80 font-mono">
              Active: {aiSettings.screeningUserNumber || 'Not configured'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Enter your primary mobile or VoIP line. Incoming carrier streams and forwarded VoIP calls will be filtered through this number, passing verified family and urgent deliveries straight through.
          </p>

          <form onSubmit={handleSaveRoutingNumber} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <div className="relative flex-1">
              <input
                id="primaryPhoneRoutingInput"
                type="tel"
                value={routingPhoneInput}
                onChange={(e) => setRoutingPhoneInput(e.target.value)}
                placeholder="+91 98490 21410"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/90 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white font-mono text-xs placeholder:text-slate-600 outline-none transition"
              />
            </div>
            <button
              type="submit"
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95 ${
                phoneSaved
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              }`}
            >
              {phoneSaved ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Number Saved ✓</span>
                </>
              ) : (
                <>
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Save & Route Calls</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Screening Scope & Target Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
          <div
            onClick={() => handleToggleCallTarget('all')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-1 ${
              aiSettings.callScreenTarget === 'all'
                ? 'bg-cyan-950/40 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Screen Every Number</span>
              </span>
              {aiSettings.callScreenTarget === 'all' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Interrogate all incoming callers (family, deliveries, and unknown) through the AI Sentinel interrogation protocol.
            </p>
          </div>

          <div
            onClick={() => handleToggleCallTarget('unknown')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-1 ${
              aiSettings.callScreenTarget === 'unknown'
                ? 'bg-cyan-950/40 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Screen Unknown Only</span>
              </span>
              {aiSettings.callScreenTarget === 'unknown' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Saved contacts and family bypass the sentinel directly. Only unrecognized or suspicious numbers undergo screening.
            </p>
          </div>
        </div>

        {/* AI Sentinel Interrogation Speech Script */}
        <div className="p-4 rounded-2xl bg-[#03091e]/80 border border-slate-800 space-y-2.5 relative z-10">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>EDITH AUTOMATED CALL INTERROGATION SCRIPT</span>
            </span>
            <button
              type="button"
              onClick={handlePlaySentinelSpeech}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isPlayingSentinelSpeech
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300'
              }`}
            >
              {isPlayingSentinelSpeech ? (
                <>
                  <Square className="w-3 h-3 fill-slate-950" />
                  <span>Playing Voice...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 text-cyan-400" />
                  <span>Test Voice Audio</span>
                </>
              )}
            </button>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-xs text-slate-300 leading-relaxed italic">
            "{aiSettings.screeningAiSpeech}"
          </div>
        </div>

        {/* Interactive Call Screening Simulator & Live Machine-Readable Verdict */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#020617] border border-cyan-500/30 space-y-3 relative z-10">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Live Sentinel Call Simulation & Verdict Inspector
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Simulates Real VoIP Call Stream
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Test how EDITH interrogates incoming calls, analyzes their intent, and outputs the automated verdict block.
          </p>

          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              type="button"
              disabled={isSimulatingCall}
              onClick={() => handleSimulateCallScreening('spam')}
              className="px-3 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <PhoneOff className="w-3.5 h-3.5 text-red-400" />
              <span>Test Spam Loan Bot</span>
            </button>

            <button
              type="button"
              disabled={isSimulatingCall}
              onClick={() => handleSimulateCallScreening('delivery')}
              className="px-3 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <PhoneIncoming className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Amazon Delivery</span>
            </button>

            <button
              type="button"
              disabled={isSimulatingCall}
              onClick={() => handleSimulateCallScreening('family')}
              className="px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Heart className="w-3.5 h-3.5 text-emerald-400" />
              <span>Test Family Call</span>
            </button>
          </div>

          {/* Simulation Progress or Verdict Box */}
          {isSimulatingCall && (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center gap-3 text-cyan-300 text-xs font-mono">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
              <span>EDITH Sentinel interrogating caller & analyzing acoustic speech telemetry...</span>
            </div>
          )}

          {simulatedTranscript.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Live Audio Interrogation Transcript:</span>
              {simulatedTranscript.map((t, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className={`font-mono font-bold shrink-0 ${t.sender === 'ai' ? 'text-cyan-400' : 'text-amber-400'}`}>
                    {t.sender === 'ai' ? '[EDITH SENTINEL]:' : '[CALLER]:'}
                  </span>
                  <span className="text-slate-300">{t.text}</span>
                </div>
              ))}
            </div>
          )}

          {simulatedVerdict && (
            <div className="p-3.5 rounded-xl bg-[#03091e] border border-cyan-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold font-mono text-cyan-300 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Automated Machine-Readable Sentinel Verdict Block:</span>
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase font-mono ${
                    simulatedVerdict.verdict === 'SPAM'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {simulatedVerdict.action}
                </span>
              </div>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto no-scrollbar">
                {JSON.stringify(simulatedVerdict, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Stark AI Matrix Suite Performance Controls & Motherly Care */}
        <div className="pt-2 border-t border-slate-800/80 space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Stark Matrix Device Guardian & Power Optimizers</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Battery Saver */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Battery className={`w-4 h-4 ${aiSettings.batterySaver ? 'text-emerald-400' : 'text-slate-400'}`} />
                <div>
                  <span className="text-xs font-bold text-white block">Battery Saver</span>
                  <span className="text-[10px] text-slate-400 block">Throttles heavy background loops</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => aiSettingsService.setBatterySaver(!aiSettings.batterySaver)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  aiSettings.batterySaver
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {aiSettings.batterySaver ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Internet / Data Saver */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wifi className={`w-4 h-4 ${aiSettings.dataSaver ? 'text-cyan-400' : 'text-slate-400'}`} />
                <div>
                  <span className="text-xs font-bold text-white block">Internet / Data Saver</span>
                  <span className="text-[10px] text-slate-400 block">Compresses audio & stream payload</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => aiSettingsService.setDataSaver(!aiSettings.dataSaver)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  aiSettings.dataSaver
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {aiSettings.dataSaver ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Reply Speed Turbo */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${aiSettings.replySpeedTurbo ? 'text-amber-400' : 'text-slate-400'}`} />
                <div>
                  <span className="text-xs font-bold text-white block">Reply Speed Turbo</span>
                  <span className="text-[10px] text-slate-400 block">Prioritizes low-latency token streaming</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => aiSettingsService.setReplySpeedTurbo(!aiSettings.replySpeedTurbo)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  aiSettings.replySpeedTurbo
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {aiSettings.replySpeedTurbo ? 'TURBO' : 'NORMAL'}
              </button>
            </div>

            {/* AI Security Shield */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-4 h-4 ${aiSettings.aiSecurityShield ? 'text-cyan-400' : 'text-slate-400'}`} />
                <div>
                  <span className="text-xs font-bold text-white block">AI Security Firewall</span>
                  <span className="text-[10px] text-slate-400 block">Real-time prompt injection perimeter</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => aiSettingsService.setAiSecurityShield(!aiSettings.aiSecurityShield)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  aiSettings.aiSecurityShield
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {aiSettings.aiSecurityShield ? 'ARMED' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Motherly Personality Care Protocol (Creator-Exclusive) */}
          <div className="p-4 rounded-2xl bg-[#030818] border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                {aiSettings.motherlyCareEnabled ? <Heart className="w-4 h-4 text-pink-400" /> : <HeartOff className="w-4 h-4 text-purple-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Creator Protocol: Motherly Care & Feelings</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold border border-purple-500/30">
                    Creator Only
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isCreatorFull
                    ? aiSettings.motherlyCareEnabled
                      ? 'Active: GKEDIT AI provides warm, maternal health and hydration check-ins for GK EDIT.'
                      : 'Deactivated: Mother feelings removed. AI responds with pure razor-sharp cyber-systems logic.'
                    : 'Exclusive to creator GK EDIT. Standard users operate with cyber-systems intelligence.'}
                </p>
              </div>
            </div>

            {isCreatorFull ? (
              <button
                type="button"
                onClick={handleToggleMotherly}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  aiSettings.motherlyCareEnabled
                    ? 'bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/50 text-pink-300 shadow-[0_0_12px_rgba(244,114,182,0.3)]'
                    : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300'
                }`}
              >
                {aiSettings.motherlyCareEnabled ? 'Motherly ON' : 'Mother Feelings Removed'}
              </button>
            ) : (
              <span className="text-[11px] font-mono text-slate-500 px-2 py-1 rounded bg-slate-900 border border-slate-800 shrink-0">
                Restricted to GK EDIT
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Theme Accent Customization Studio */}
      <div
        className="p-5 rounded-3xl bg-[#040e24]/90 border shadow-xl space-y-4 transition-colors duration-300"
        style={{ borderColor: 'var(--accent-border)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-colors duration-300 shrink-0"
              style={{
                background: 'var(--accent-bg-subtle)',
                border: '1px solid var(--accent-border)',
                color: 'var(--accent-color-light)',
              }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Theme Accent Presets</span>
                </h3>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider transition-colors duration-300"
                  style={{
                    backgroundColor: 'var(--accent-bg-subtle)',
                    color: 'var(--accent-color-light)',
                    border: '1px solid var(--accent-border)',
                  }}
                >
                  Active: {currentAccent.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle between vibrant chromatic presets (Emerald, Violet, Orange, etc.) to transform ambient glows, borders, glass cards, and controls.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAccent}
            disabled={currentAccent.id === 'cyan'}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition duration-150 self-start sm:self-center ${
              currentAccent.id === 'cyan'
                ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-500'
                : 'hover:bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white cursor-pointer active:scale-95'
            }`}
            title="Reset back to default Cyber Cyan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Cyan</span>
          </button>
        </div>

        {/* Preset Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {ACCENT_PRESETS.map((preset) => {
            const isSelected = currentAccent.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectAccent(preset.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[#061536] shadow-lg ring-1'
                    : 'bg-[#03091e]/80 hover:bg-[#05112e] border-slate-800/80 hover:border-slate-700'
                }`}
                style={{
                  borderColor: isSelected ? preset.primaryHex : undefined,
                  boxShadow: isSelected ? `0 0 16px ${preset.glowRgba}` : undefined,
                  outlineColor: isSelected ? preset.primaryHex : undefined,
                }}
              >
                {/* Top Row: Color Swatch Circle & Meta */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    {/* Swatch Circle */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-md shrink-0"
                      style={{
                        background: preset.gradient,
                        boxShadow: `0 0 10px ${preset.glowRgba}`,
                        border: '2px solid rgba(255, 255, 255, 0.25)',
                      }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-cyan-200 transition-colors">
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {preset.primaryHex}
                      </span>
                    </div>
                  </div>

                  {/* Badge */}
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-semibold"
                    style={{
                      backgroundColor: isSelected ? preset.bgSubtleRgba : 'rgba(15, 23, 42, 0.6)',
                      color: isSelected ? preset.lightHex : '#94a3b8',
                      border: `1px solid ${isSelected ? preset.borderRgba : 'rgba(51, 65, 85, 0.4)'}`,
                    }}
                  >
                    {preset.badge}
                  </span>
                </div>

                {/* Subtitle / Vibe */}
                <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                  {preset.subtitle}
                </p>

                {/* Live Color Bar Strip */}
                <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-900">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      background: preset.gradient,
                      width: isSelected ? '100%' : '35%',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Interactive Accent Preview Sandbox */}
        <div
          className="p-4 rounded-2xl border transition-all duration-300 space-y-3.5"
          style={{
            backgroundColor: 'rgba(2, 6, 23, 0.6)',
            borderColor: 'var(--accent-border)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent-color-light)' }} />
              <span>Live Interactive Accent Sandbox</span>
            </span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
              style={{
                backgroundColor: 'var(--accent-bg-subtle)',
                color: 'var(--accent-color-light)',
                border: '1px solid var(--accent-border)',
              }}
            >
              {currentAccent.primaryHex} · {currentAccent.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            {/* Sample Button 1: Solid Accent Gradient */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Primary Button
              </label>
              <button
                type="button"
                onClick={() => {
                  notificationService.playSoftChime();
                  notificationService.showInAppToast(
                    `Accent Action Fired ⚡`,
                    `Styled dynamically with ${currentAccent.name} (${currentAccent.primaryHex})!`,
                    'success'
                  );
                }}
                className="w-full py-2 px-3 rounded-xl font-bold text-xs text-slate-950 flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md cursor-pointer"
                style={{
                  background: 'var(--accent-gradient)',
                  boxShadow: '0 0 14px var(--accent-glow)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Primary Action</span>
              </button>
            </div>

            {/* Sample Button 2: Subtle Outlined Accent */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Ghost / Secondary
              </label>
              <button
                type="button"
                onClick={() => {
                  notificationService.sendChromeNotification(
                    'Theme Notification Test',
                    `Testing browser notification with ${currentAccent.name} active.`
                  );
                  notificationService.showInAppToast(
                    'Notification Dispatched',
                    `Check your system notification center for ${currentAccent.name} test.`,
                    'info'
                  );
                }}
                className="w-full py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-bg-subtle)',
                  borderColor: 'var(--accent-border)',
                  borderWidth: '1px',
                  color: 'var(--accent-color-light)',
                }}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Test Alert Toast</span>
              </button>
            </div>

            {/* Interactive Slider Gauge */}
            <div>
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-slate-400 uppercase tracking-wider">Dynamic Gauge</span>
                <span className="font-mono font-bold" style={{ color: 'var(--accent-color-light)' }}>
                  {previewSlider}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={previewSlider}
                onChange={(e) => setPreviewSlider(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-800"
                style={{
                  accentColor: 'var(--accent-color)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* J.A.R.V.I.S Phone Edition & PWA Hub */}
      <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Smartphone className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>J.A.R.V.I.S Phone Edition (PWA)</span>
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {isInstalled ? 'Installed' : 'Standalone'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Install as a real phone app directly from your browser. Fullscreen, no address bar, offline ready.
              </p>
            </div>
          </div>

          {onOpenInstall && !isInstalled && (
            <button
              onClick={onOpenInstall}
              className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition hover:from-cyan-300 flex items-center gap-1.5 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}
        </div>

        {/* Wake Word ("Hey Jarvis") Always Listening Mode */}
        <div className="pt-3 border-t border-cyan-500/15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-950/80 border border-cyan-500/25 flex items-center justify-center">
              <Mic className={`w-4 h-4 ${wakeWordOn ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Wake Word ("Hey Jarvis")</span>
                <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold uppercase ${
                  wakeWordOn ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {wakeWordOn ? 'Listening' : 'Off'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Say "Hey Jarvis" or "Jarvis" aloud to wake the assistant and issue hands-free voice commands.
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleWakeWord}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-200 ${
              wakeWordOn ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
            }`}
            title="Toggle Wake Word"
            aria-label="Toggle Wake Word"
          >
            <div className="w-6 h-6 rounded-full bg-white shadow-md transform transition-transform" />
          </button>
        </div>
      </div>

      {/* GKEDIT Live AI Voice & Personality Hub */}
      <div
        className="p-5 sm:p-6 rounded-3xl bg-[#030c24]/90 border shadow-xl space-y-5 transition-colors duration-300 backdrop-blur-xl"
        style={{ borderColor: 'var(--accent-border)' }}
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-600 to-violet-600 p-0.5 shadow-lg shadow-cyan-500/30 shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#020718] flex items-center justify-center">
                <Radio className="w-5 h-5 text-cyan-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white tracking-tight">
                  GKEDIT Live AI Voice & Audio Personas
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                  7 Personas Available
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize your Gemini Live real-time conversational voice, pacing, verbosity, and multilingual settings.
              </p>
            </div>
          </div>
        </div>

        {/* 1. Voice Persona Grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Select AI Voice Persona</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {AVAILABLE_VOICES.map((voice) => {
              const isSelected = voiceSettings.voiceId === voice.id;
              const isPreviewing = previewingVoiceId === voice.id;

              return (
                <div
                  key={voice.id}
                  onClick={() => {
                    voiceSettingsService.setVoice(voice.id);
                    notificationService.playSoftChime();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-gradient-to-b from-cyan-500/20 via-blue-900/30 to-violet-950/40 border-cyan-400 text-white shadow-[0_0_18px_rgba(6,182,212,0.35)] scale-[1.01]'
                      : 'bg-white/5 border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{voice.name}</span>
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded font-mono font-semibold bg-white/10 text-cyan-300">
                          {voice.gender}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-cyan-300/90 block mt-0.5">
                        {voice.style}
                      </span>
                    </div>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0 shadow-[0_0_8px_#38bdf8]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {voice.description}
                  </p>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {isSelected ? 'Active Persona' : 'Click to Select'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPreviewing) {
                          voiceSettingsService.stopPreview();
                          setPreviewingVoiceId(null);
                        } else {
                          voiceSettingsService.previewVoice(
                            voice.id,
                            () => setPreviewingVoiceId(voice.id),
                            () => setPreviewingVoiceId(null)
                          );
                        }
                      }}
                      className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        isPreviewing
                          ? 'bg-cyan-400 text-slate-950 border-cyan-300 animate-pulse'
                          : 'bg-white/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
                      }`}
                      title={`Preview ${voice.name} voice`}
                    >
                      {isPreviewing ? (
                        <>
                          <Square className="w-3 h-3 fill-slate-950" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-cyan-300" />
                          <span>Preview</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Speaking Rate (Speed) Slider & Presets */}
        <div className="pt-3 border-t border-cyan-500/15 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Speaking Speed (Pacing)</span>
            </label>
            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
              {voiceSettings.speakingRate.toFixed(2)}x
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-500">0.8x</span>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.05"
              value={voiceSettings.speakingRate}
              onChange={(e) => voiceSettingsService.setSpeakingRate(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-400 cursor-pointer h-1.5 rounded-lg bg-slate-800"
            />
            <span className="text-[11px] font-mono text-slate-500">1.5x</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[0.8, 1.0, 1.15, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => voiceSettingsService.setSpeakingRate(rate)}
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
                  Math.abs(voiceSettings.speakingRate - rate) < 0.03
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {rate === 1.0 ? '1.0x (Normal)' : `${rate}x`}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Response Verbosity Setting */}
        <div className="pt-3 border-t border-cyan-500/15 space-y-2.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Response Spoken Verbosity</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'concise', label: 'Concise (Recommended)', desc: 'Punchy 1-2 sentence voice answers for rapid interaction.' },
              { id: 'balanced', label: 'Balanced', desc: 'Natural conversational depth with clear explanations.' },
              { id: 'detailed', label: 'Detailed', desc: 'Comprehensive spoken answers for research & literature.' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => voiceSettingsService.setVerbosity(item.id as VoiceVerbosity)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  voiceSettings.verbosity === item.id
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{item.label}</span>
                  {voiceSettings.verbosity === item.id && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Multilingual Spoken Language Preference */}
        <div className="pt-3 border-t border-cyan-500/15 space-y-2.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Spoken Language & Accent</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'auto', label: '🌐 Auto-Detect' },
              { id: 'en', label: '🇺🇸 English (Global)' },
              { id: 'te', label: '🇮🇳 Telugu (తెలుగు)' },
              { id: 'hi', label: '🇮🇳 Hindi (हिंदी)' },
              { id: 'es', label: '🇪🇸 Spanish (Español)' },
              { id: 'fr', label: '🇫🇷 French (Français)' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => voiceSettingsService.setLanguage(lang.id)}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold transition cursor-pointer ${
                  voiceSettings.spokenLanguage === lang.id
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Global Keyboard Shortcuts Hub */}
      <div
        className="p-5 rounded-3xl bg-[#040e24]/90 border shadow-xl space-y-4 transition-colors duration-300"
        style={{ borderColor: 'var(--accent-border)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
              style={{
                background: 'var(--accent-bg-subtle)',
                border: '1px solid var(--accent-border)',
                color: 'var(--accent-color-light)',
              }}
            >
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Global Keyboard Hotkeys</span>
                </h3>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-md font-mono uppercase font-bold"
                  style={{
                    backgroundColor: 'var(--accent-bg-subtle)',
                    color: 'var(--accent-color-light)',
                    border: '1px solid var(--accent-border)',
                  }}
                >
                  Enabled Everywhere
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Keyboard shortcuts execute system-wide actions instantly, even while typing inside other inputs.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => keyboardShortcutsService.toggleModal(true)}
            className="px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer self-start sm:self-center"
            style={{
              backgroundColor: 'var(--accent-bg-subtle)',
              borderColor: 'var(--accent-border)',
              color: 'var(--accent-color-light)',
            }}
          >
            <Command className="w-3.5 h-3.5" />
            <span>Open Cheat Sheet (Ctrl+/)</span>
          </button>
        </div>

        {/* Quick Hotkey Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Hotkey 1: Ctrl+K Focus Chat */}
          <div className="p-3.5 rounded-2xl bg-[#03091e]/80 border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center gap-1 shrink-0">
                <kbd className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px] font-mono font-bold text-cyan-300">
                  Ctrl
                </kbd>
                <span className="text-slate-600 text-xs">+</span>
                <kbd className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px] font-mono font-bold text-cyan-300">
                  K
                </kbd>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">Focus Chat Input</span>
                <span className="text-[11px] text-slate-400 block truncate">Navigates to chat and selects input</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => keyboardShortcutsService.executeFocusChat()}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition active:scale-95 shrink-0 cursor-pointer"
            >
              Test
            </button>
          </div>

          {/* Hotkey 2: Ctrl+J Wake Word */}
          <div className="p-3.5 rounded-2xl bg-[#03091e]/80 border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center gap-1 shrink-0">
                <kbd className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px] font-mono font-bold text-emerald-300">
                  Ctrl
                </kbd>
                <span className="text-slate-600 text-xs">+</span>
                <kbd className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px] font-mono font-bold text-emerald-300">
                  J
                </kbd>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">Activate Wake-Word</span>
                <span className="text-[11px] text-slate-400 block truncate">Wakes JARVIS voice mic & chime</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => keyboardShortcutsService.executeActivateWakeWord()}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition active:scale-95 shrink-0 cursor-pointer"
            >
              Test
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          VOICE COMMAND SHORTCUTS (WEB SPEECH API)
      ------------------------------------------------------------------ */}
      <div className="p-5 rounded-3xl bg-[#030a1c]/90 border border-cyan-500/25 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Mic className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Voice Command Shortcuts</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  WEB SPEECH API
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Maps spoken phrases like <strong className="text-cyan-300">&apos;Take a photo&apos;</strong>, <strong className="text-cyan-300">&apos;Clear cache&apos;</strong>, and <strong className="text-cyan-300">&apos;Lock app&apos;</strong> directly to app functions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('gkedit:open_voice_shortcuts'))}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 text-slate-950 text-xs font-black flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-[0_0_14px_rgba(6,182,212,0.4)] self-start sm:self-center"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Manage Shortcuts ({voiceShortcutState.shortcuts.length})</span>
          </button>
        </div>

        {/* Quick Voice Command Triggers & Audio Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Card 1: Take a photo */}
          <div className="p-3.5 rounded-2xl bg-[#020715]/80 border border-cyan-500/20 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>Take a Photo</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                &ldquo;Take a photo&rdquo;
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Switches to Xiaomi HyperOS camera viewfinder and fires shutter.
            </p>
            <button
              type="button"
              onClick={async () => {
                const s = voiceShortcutState.shortcuts.find((i) => i.actionId === 'take_photo');
                if (s) await voiceCommandShortcutService.executeShortcut(s);
              }}
              className="w-full py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current text-cyan-400" />
              <span>Simulate Command</span>
            </button>
          </div>

          {/* Card 2: Clear cache */}
          <div className="p-3.5 rounded-2xl bg-[#020715]/80 border border-cyan-500/20 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Clear Cache</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                &ldquo;Clear cache&rdquo;
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Purges CacheStorage API, session buffers, and temporary memory.
            </p>
            <button
              type="button"
              onClick={async () => {
                const s = voiceShortcutState.shortcuts.find((i) => i.actionId === 'clear_cache');
                if (s) await voiceCommandShortcutService.executeShortcut(s);
              }}
              className="w-full py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current text-amber-400" />
              <span>Simulate Command</span>
            </button>
          </div>

          {/* Card 3: Lock app */}
          <div className="p-3.5 rounded-2xl bg-[#020715]/80 border border-cyan-500/20 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Lock App</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20">
                &ldquo;Lock app&rdquo;
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Immediately locks Security Gate and engages biometric shield.
            </p>
            <button
              type="button"
              onClick={async () => {
                const s = voiceShortcutState.shortcuts.find((i) => i.actionId === 'lock_app');
                if (s) await voiceCommandShortcutService.executeShortcut(s);
              }}
              className="w-full py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current text-rose-400" />
              <span>Simulate Command</span>
            </button>
          </div>
        </div>

        {/* Listening Status & Toggles bar */}
        <div className="pt-2 border-t border-cyan-500/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${voiceShortcutState.isListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
            <span className="text-slate-400">
              Speech Engine: <strong className="text-white">{voiceShortcutState.isListening ? 'Active (Continuous)' : 'Idle'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={voiceShortcutState.continuousMode}
                onChange={(e) => voiceCommandShortcutService.setContinuousMode(e.target.checked)}
                className="rounded accent-cyan-400"
              />
              <span>Continuous Listening</span>
            </label>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={voiceShortcutState.voiceConfirmationEnabled}
                onChange={(e) => voiceCommandShortcutService.setVoiceConfirmation(e.target.checked)}
                className="rounded accent-cyan-400"
              />
              <span>Spoken Voice Feedback</span>
            </label>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          GOOGLE PEOPLE API: CONTACTS SYNC STATUS & POLLING INDICATOR
      ------------------------------------------------------------------ */}
      <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 shadow-xl space-y-4 relative overflow-hidden">
        {/* Glow ambient background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Google Contacts Sync Status</span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Google People API v1 polling telemetry & real-time address book synchronization
              </p>
            </div>
          </div>

          {/* Dynamic Sync Status Badge */}
          <div className="flex items-center gap-2">
            {isSyncing || syncInfo.status === 'polling' ? (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                <span>Polling API...</span>
              </span>
            ) : isGoogleConnected && syncInfo.status === 'synced' ? (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Live & Synced</span>
              </span>
            ) : isGoogleConnected ? (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Idle / Ready</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-slate-500" />
                <span>Disconnected</span>
              </span>
            )}
          </div>
        </div>

        {/* 3 Metrics Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
          {/* Card 1: Total Contact Count */}
          <div className="p-4 rounded-2xl bg-[#03091e] border border-cyan-500/20 hover:border-cyan-500/40 transition space-y-1.5 group">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Total Contacts</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                People API
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-cyan-300 font-mono tracking-tight group-hover:text-cyan-200 transition">
                {isGoogleConnected ? syncInfo.totalContactCount : '—'}
              </span>
              {isGoogleConnected && (
                <span className="text-xs text-slate-400 font-medium">contacts synced</span>
              )}
            </div>
            <p className="text-[10.5px] text-slate-400">
              {isGoogleConnected
                ? `${syncInfo.totalContactCount} verified entries in dialer memory`
                : 'Connect account to load address book'}
            </p>
          </div>

          {/* Card 2: Last Synchronization Timestamp */}
          <div className="p-4 rounded-2xl bg-[#03091e] border border-cyan-500/20 hover:border-cyan-500/40 transition space-y-1.5 group">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Last Sync Time</span>
              </span>
              {syncInfo.lastSyncTimestamp && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Updated
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white tracking-tight">
                {formatSyncTime(syncInfo.lastSyncTimestamp).relative}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-mono truncate" title={formatSyncTime(syncInfo.lastSyncTimestamp).exact}>
              {formatSyncTime(syncInfo.lastSyncTimestamp).exact}
            </p>
          </div>

          {/* Card 3: Polling Telemetry Rate */}
          <div className="p-4 rounded-2xl bg-[#03091e] border border-cyan-500/20 hover:border-cyan-500/40 transition space-y-1.5 group">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Radio className={`w-3.5 h-3.5 ${isGoogleConnected ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                <span>Auto-Poll Engine</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-cyan-300 border border-cyan-500/30">
                30s Cadence
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-cyan-200">
                {isGoogleConnected ? (
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Every 30s</span>
                  </span>
                ) : (
                  <span className="text-slate-500 font-normal">Offline</span>
                )}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400">
              {isGoogleConnected ? (
                <span>Next API query in <strong className="text-cyan-300 font-mono">{pollCountdown}s</strong></span>
              ) : (
                <span>Auto-polling starts when connected</span>
              )}
            </p>
          </div>
        </div>

        {/* Connected Account & Controls Strip */}
        <div className="pt-3 border-t border-cyan-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          {isGoogleConnected ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-300 overflow-hidden">
                {googleUser?.photoURL ? (
                  <img src={googleUser.photoURL} alt={googleUser.displayName || 'Google User'} className="w-full h-full object-cover" />
                ) : (
                  googleUser?.displayName?.charAt(0) || googleUser?.email?.charAt(0) || 'G'
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-white truncate">
                    {googleUser?.displayName || 'Google Account'}
                  </p>
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    OAuth 2.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {googleUser?.email || 'contacts.readonly authenticated'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Google Account not linked. Connect to sync contacts with GKEDIT DIALER.</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {isGoogleConnected ? (
              <>
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-black text-xs shadow-[0_0_12px_rgba(6,182,212,0.3)] transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectGoogle}
                  className="px-3 py-1.5 rounded-xl bg-blue-950/80 hover:bg-red-950/50 hover:text-red-300 border border-cyan-500/20 text-xs font-semibold text-slate-400 transition cursor-pointer"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isSyncing}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>{isSyncing ? 'Connecting...' : 'Connect Google Account'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Error Notice if any */}
        {syncError && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">Google People API Polling Notice</p>
                <p className="text-[11px] text-amber-200/80 mt-0.5">{syncError}</p>
              </div>
            </div>
            <button
              onClick={handleManualSync}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-[11px] font-bold text-amber-200 transition shrink-0"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* PART 3: User Notifications Section */}
      <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              {notificationsOn && notifPermission === 'granted' ? (
                <BellRing className="w-5 h-5 text-cyan-400 animate-pulse" />
              ) : (
                <BellOff className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span>Notifications</span>
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    notifPermission === 'granted' && notificationsOn
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : notifPermission === 'denied'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {notifPermission === 'granted' && notificationsOn ? 'Active' : notifPermission === 'denied' ? 'Blocked' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sends browser push notifications when AI reply is ready while the tab is hidden, plus in-app toasts.
              </p>
            </div>
          </div>

          {/* On/Off Switch */}
          <button
            onClick={handleToggleNotifications}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-200 ${
              notificationsOn && notifPermission === 'granted' ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
            }`}
            title="Toggle Notifications"
            aria-label="Toggle Notifications"
          >
            <div className="w-6 h-6 rounded-full bg-white shadow-md transform transition-transform" />
          </button>
        </div>

        {/* Permission Action Button if not granted */}
        {notifPermission !== 'granted' && (
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-blue-950/40 border border-cyan-500/30">
            <div>
              <p className="text-xs font-bold text-cyan-200">Permission Required</p>
              <p className="text-[11px] text-slate-300">
                Tap to grant browser notification access (required by browser policy).
              </p>
            </div>
            <button
              onClick={handleRequestNotifications}
              className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-md transition whitespace-nowrap"
            >
              Enable Notifications
            </button>
          </div>
        )}

        {/* Friendly Error when blocked */}
        {(notifPermission === 'denied' || notifError) && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Notifications blocked in browser settings</p>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                To allow notifications: Tap the lock/tune icon next to the URL in your browser's address bar &gt; Site Settings / Permissions &gt; set <strong>Notifications</strong> to <strong>Allow</strong>, then reload this page.
              </p>
            </div>
          </div>
        )}

        {/* Audio Chime Test */}
        <div className="pt-1 flex items-center justify-between text-xs border-t border-cyan-500/15 pt-3">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>Harmonic Audio Chime (Offline Web Audio)</span>
          </span>
          <button
            onClick={handleTestChime}
            className="px-3 py-1 rounded-xl bg-blue-950 hover:bg-blue-900 border border-cyan-500/20 text-cyan-300 font-semibold"
          >
            Play Test Sound
          </button>
        </div>
      </div>


      {/* PART 3: Firebase Cloud Messaging (FCM) & Push Setup Info */}
      <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Cloud className="w-4 h-4 text-cyan-400" />
          <span>Background Push Notifications (FCM Architecture)</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Service worker <code className="text-cyan-300 font-mono text-[11px]">firebase-messaging-sw.js</code> has been created in the public directory to handle push messages when the browser is closed.
        </p>
        <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-cyan-500/25 space-y-2 text-xs">
          <p className="font-bold text-cyan-200 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>Setup Checklist for Production Background Push:</span>
          </p>
          <ol className="list-decimal list-inside text-slate-300 text-[11px] space-y-1">
            <li>Generate your <strong>VAPID Web Push Key</strong> in Firebase Console &gt; Project Settings &gt; Cloud Messaging &gt; Web configuration.</li>
            <li>Fill your Firebase config keys into <code className="text-cyan-300 font-mono">public/firebase-messaging-sw.js</code>.</li>
            <li>Tokens are registered to the backend at <code className="text-cyan-300 font-mono">POST /api/notifications/fcm-token</code>.</li>
            <li><strong>AI Studio Preview Constraint</strong>: Background push via service workers requires top-level HTTPS execution. Inside the iframe preview, foreground notifications & in-app alerts fire directly.</li>
          </ol>
        </div>
      </div>

      {/* Language Preference */}
      <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>Language Preference</span>
        </h3>
        <p className="text-xs text-slate-400">
          Choose your preferred conversation tone. GKEDIT AI automatically understands and responds in all chosen languages (Telugu, English, Hindi, Tanglish).
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            { id: 'adaptive', label: 'Adaptive (Auto)' },
            { id: 'telugu', label: 'Telugu (తెలుగు)' },
            { id: 'tanglish', label: 'Tanglish (Latin)' },
            { id: 'english', label: 'English' },
          ].map((l) => (
            <button
              key={l.id}
              onClick={() => onChangeLang(l.id)}
              className={`p-2.5 rounded-2xl border text-center transition font-semibold ${
                currentLang === l.id
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'border-cyan-500/20 text-slate-400 hover:bg-blue-950/40 hover:text-white'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Biometric App Lock */}
      <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-cyan-400" />
              <span>Biometric App Security (WebAuthn)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Require device fingerprint / Face ID when opening GKEDIT AI.
            </p>
          </div>
          <button
            onClick={handleToggleBiometrics}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              biometricEnabled
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'bg-blue-950 border border-cyan-500/20 text-slate-300'
            }`}
          >
            {biometricEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Creator Honor (Privacy Preserved) */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#06193d] via-[#040e24] to-[#031535] border border-cyan-400/35 shadow-[0_10px_35px_rgba(0,0,0,0.6)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-4 h-4 text-cyan-400" />
            <span>Master & Creator: GK EDIT (9th Class Prodigy)</span>
          </div>
          <span className="text-[10px] text-cyan-400/70 font-mono">
            AI Birthday: Aug 13, 2026
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          GKEDIT AI was conceptualized and developed by GK EDIT, currently studying in <strong>9th Class</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="https://youtube.com/@GKEDIT2141"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleConfetti}
            className="p-3.5 rounded-2xl bg-[#030818] border border-cyan-500/30 hover:border-cyan-400 transition flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <Youtube className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-bold text-white text-xs">@GKEDIT2141</p>
                <p className="text-[10px] text-slate-400">Main YouTube Channel</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
          </a>

          <a
            href="https://youtube.com/@GKEDITOFFICIAL2141"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleConfetti}
            className="p-3.5 rounded-2xl bg-[#030818] border border-cyan-500/30 hover:border-cyan-400 transition flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <Youtube className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-bold text-white text-xs">@GKEDITOFFICIAL2141</p>
                <p className="text-[10px] text-slate-400">Official Releases Channel</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
          </a>
        </div>
      </div>

      {/* 1-Tap Chat History Delete (చాట్ హిస్టరీ మాత్రమే తొలగించు) */}
      <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-red-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xl">
        <div className="space-y-1">
          <p className="font-bold text-white flex items-center gap-1.5 text-sm">
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>Chat History Matram Delete (1-Tap)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
              చాట్ హిస్టరీ మాత్రమే
            </span>
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            ఒక్క ట్యాప్‌తో మీ చాట్ హిస్టరీని మాత్రమే పూర్తిగా తొలగిస్తుంది. ఖాతా వివరాలు, పుష్ నోటిఫికేషన్‌లు, బయోమెట్రిక్ లాక్ మరియు రిమైండర్‌లు భద్రంగా అలాగే ఉంటాయి.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOneTapDeleteChatHistory}
          className="px-4 py-2.5 rounded-2xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 hover:text-white font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-md whitespace-nowrap cursor-pointer"
        >
          {chatHistoryCleared ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>తొలగించబడింది ✓</span>
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>1-Tap Delete Chat History</span>
            </>
          )}
        </button>
      </div>

      {/* Clear Cache */}
      <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 flex items-center justify-between text-xs">
        <div>
          <p className="font-bold text-white">Reset Local Storage Cache</p>
          <p className="text-[11px] text-slate-400">Clears offline calendar events & settings.</p>
        </div>
        <button
          onClick={handleClearCache}
          className="px-3.5 py-1.5 rounded-xl bg-blue-950 border border-cyan-500/30 hover:bg-blue-900 text-cyan-300 font-semibold"
        >
          {cleared ? <Check className="w-4 h-4 text-emerald-400 inline" /> : 'Clear Cache'}
        </button>
      </div>
          </div>
        )}
      </div>
    </div>
  );
}
