import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { Header } from './components/Header.tsx';
import { LiquidGlassBottomNav } from './components/LiquidGlassBottomNav.tsx';
import { ChatView } from './components/ChatView.tsx';
import { RealCameraSubtab } from './components/RealCameraSubtab.tsx';
import { ToolsTab } from './components/ToolsTab.tsx';
import { DevotionalTab } from './components/DevotionalTab.tsx';
import { SettingsTab } from './components/SettingsTab.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { CreatorHubModal } from './components/CreatorHubModal.tsx';
import { LiveVoiceModal } from './components/LiveVoiceModal.tsx';
import { CreatorLiveUserMonitor } from './components/CreatorLiveUserMonitor.tsx';
import { PWAInstallModal } from './components/PWAInstallModal.tsx';
import { HandGestureHUD } from './components/HandGestureHUD.tsx';
import { DynamicIsland, IslandStatus } from './components/DynamicIsland.tsx';
import { CreatorTributeTab } from './components/CreatorTributeTab.tsx';
import { NexusSettingsModal, DEFAULT_NEXUS_SYSTEM_INSTRUCTION } from './components/NexusSettingsModal.tsx';
import { ActiveTab } from './types/index.ts';
import { SecurityGateOverlay } from './components/SecurityGateOverlay.tsx';
import { Fingerprint, Loader2, Clock, Bell, X } from 'lucide-react';
import { useAuth } from './context/AuthContext.tsx';
import { notificationService, InAppToast } from './services/notificationService.ts';
import { wakeWordService } from './services/wakeWordService.ts';
import { reminderService } from './services/reminderService.ts';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal.tsx';
import { keyboardShortcutsService } from './services/keyboardShortcutsService.ts';
import { VoiceCommandShortcutModal } from './components/VoiceCommandShortcutModal.tsx';
import { voiceCommandShortcutService } from './services/voiceCommandShortcutService.ts';
import { themeService } from './services/themeService.ts';
import { useSwipeGestures } from './hooks/useSwipeGestures.ts';
import { PalmGesturePhotoShare } from './components/PalmGesturePhotoShare.tsx';
import { PalmShareReceiverModal } from './components/PalmShareReceiverModal.tsx';
import { ScreenTorchOverlay } from './components/ScreenTorchOverlay.tsx';

// Lazy-load heavier screens (Maps, Generators) for instant app boot & 60fps mobile
const MapsTab = lazy(() =>
  import('./components/MapsTab.tsx').then((m) => ({ default: m.MapsTab }))
);
const GeneratorsTab = lazy(() =>
  import('./components/GeneratorsTab.tsx').then((m) => ({ default: m.GeneratorsTab }))
);
const IndiTrackLive = lazy(() =>
  import('./components/IndiTrackLive.tsx').then((m) => ({ default: m.IndiTrackLive }))
);
import { DashboardTab } from './components/DashboardTab.tsx';

const BioscienceLabTab = lazy(() =>
  import('./components/BioscienceLabTab.tsx').then((m) => ({ default: m.BioscienceLabTab }))
);
const VideoEditingShowcase = lazy(() =>
  import('./components/VideoEditingShowcase.tsx').then((m) => ({ default: m.VideoEditingShowcase }))
);
const BookViewTab = lazy(() =>
  import('./components/BookViewTab.tsx').then((m) => ({ default: m.BookViewTab }))
);

const TAB_ORDER: ActiveTab[] = [
  'chat',
  'biolab',
  'camera',
  'tools',
  'bookview',
  'showcase',
  'dashboard',
  'settings',
  'generators',
  'maps',
  'devotional',
  'inditrack',
  'monitor',
];

function AppContent() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTabRaw] = useState<ActiveTab>('dashboard');
  const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');
  const prevTabRef = useRef<ActiveTab>('dashboard');

  // Strict RBAC Guard: If a regular non-admin user ever attempts to access the monitor tab, redirect immediately to dashboard
  useEffect(() => {
    if (activeTab === 'monitor' && !isAdmin) {
      setActiveTabRaw('dashboard');
    }
  }, [activeTab, isAdmin]);

  const setActiveTab = useCallback((newTab: ActiveTab) => {
    // 1. Terminate any running speech synthesis immediately on tab switch
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // 2. Broadcast tab switch event to allow inactive tools to pause loops & release memory
    window.dispatchEvent(
      new CustomEvent('gkedit:tab_switched', {
        detail: { activeTab: newTab, prevTab: prevTabRef.current },
      })
    );

    setActiveTabRaw((current) => {
      if (newTab === current) return current;
      const prevIdx = TAB_ORDER.indexOf(current);
      const nextIdx = TAB_ORDER.indexOf(newTab);
      setSlideDirection(nextIdx >= prevIdx ? 'right' : 'left');
      prevTabRef.current = newTab;
      return newTab;
    });
  }, []);

  // Handlers for switching tabs via mobile swipe gestures
  const handleSwipeLeft = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setActiveTabRaw((current) => {
      const currIdx = TAB_ORDER.indexOf(current);
      if (currIdx < TAB_ORDER.length - 1) {
        const nextTab = TAB_ORDER[currIdx + 1];
        setSlideDirection('right');
        prevTabRef.current = nextTab;
        window.dispatchEvent(
          new CustomEvent('gkedit:tab_switched', {
            detail: { activeTab: nextTab, prevTab: current },
          })
        );
        return nextTab;
      }
      return current;
    });
  }, []);

  const handleSwipeRight = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setActiveTabRaw((current) => {
      const currIdx = TAB_ORDER.indexOf(current);
      if (currIdx > 0) {
        const prevTab = TAB_ORDER[currIdx - 1];
        setSlideDirection('left');
        prevTabRef.current = prevTab;
        window.dispatchEvent(
          new CustomEvent('gkedit:tab_switched', {
            detail: { activeTab: prevTab, prevTab: current },
          })
        );
        return prevTab;
      }
      return current;
    });
  }, []);

  // Initialize swipe gestures on the main app screen
  const swipeHandlers = useSwipeGestures({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 45,
    maxVerticalRatio: 0.75,
    maxDurationMs: 500,
    minVelocity: 0.25,
  });
  const [islandStatus, setIslandStatus] = useState<IslandStatus>('idle');
  const [islandText, setIslandText] = useState<string>('Thinking...');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreatorHubOpen, setIsCreatorHubOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isMonitorOpen, setIsMonitorOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isGestureHUDOpen, setIsGestureHUDOpen] = useState(false);
  const [isNexusSettingsOpen, setIsNexusSettingsOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isPalmShareOpen, setIsPalmShareOpen] = useState(false);
  const [isTributeTabOpen, setIsTributeTabOpen] = useState(false);

  // Memoized modal opener callbacks to prevent Header & Navigation re-rendering
  const handleCloseTributeTab = useCallback(() => setIsTributeTabOpen(false), []);
  const handleOpenAuth = useCallback(() => setIsAuthModalOpen(true), []);
  const handleCloseAuth = useCallback(() => setIsAuthModalOpen(false), []);
  const handleOpenVoice = useCallback(() => setIsVoiceModalOpen(true), []);
  const handleCloseVoice = useCallback(() => setIsVoiceModalOpen(false), []);
  const handleOpenCreatorHub = useCallback(() => setIsCreatorHubOpen(true), []);
  const handleCloseCreatorHub = useCallback(() => setIsCreatorHubOpen(false), []);
  const handleOpenMonitor = useCallback(() => setIsMonitorOpen(true), []);
  const handleCloseMonitor = useCallback(() => setIsMonitorOpen(false), []);
  const handleOpenInstall = useCallback(() => setIsInstallModalOpen(true), []);
  const handleCloseInstall = useCallback(() => setIsInstallModalOpen(false), []);
  const handleToggleGestureHUD = useCallback(() => setIsGestureHUDOpen((prev) => !prev), []);
  const handleToggleSearchGrounding = useCallback(() => setNexusGroundingSearch((prev) => !prev), []);
  const handleOpenNexusSettings = useCallback(() => setIsNexusSettingsOpen(true), []);
  const handleCloseNexusSettings = useCallback(() => setIsNexusSettingsOpen(false), []);
  const [isVoiceShortcutsOpen, setIsVoiceShortcutsOpen] = useState(false);
  const handleCloseVoiceShortcuts = useCallback(() => setIsVoiceShortcutsOpen(false), []);

  // Modern Passkey / PIN Protection Security Gate state (stored in localStorage)
  const [isSessionActive, setIsSessionActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gkedit_session_active') === 'true';
    } catch {
      return false;
    }
  });

  const handleLockSession = useCallback(() => {
    try {
      localStorage.removeItem('gkedit_session_active');
    } catch {}
    setIsSessionActive(false);
    notificationService.showInAppToast('Security Gate Locked 🔒', 'Passkey required to enter system.', 'info');
  }, []);

  // Biometric Lock Screen state
  const [isLocked, setIsLocked] = useState(() => {
    return localStorage.getItem('gkedit_biometric_lock') === 'true';
  });

  const [receiverPeerId, setReceiverPeerId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('receive_from');
    } catch {
      return null;
    }
  });
  const [nexusSystemInstruction, setNexusSystemInstruction] = useState<string>(() => {
    try {
      return localStorage.getItem('nexus_core_system_instruction') || DEFAULT_NEXUS_SYSTEM_INSTRUCTION;
    } catch {
      return DEFAULT_NEXUS_SYSTEM_INSTRUCTION;
    }
  });
  const [nexusTemperature, setNexusTemperature] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_temperature');
      return saved ? parseFloat(saved) : 0.7;
    } catch {
      return 0.7;
    }
  });
  const [nexusModel, setNexusModel] = useState<string>('gemini-2.5-flash');
  const [nexusGroundingSearch, setNexusGroundingSearch] = useState<boolean>(false);

  const [currentLang, setCurrentLang] = useState<'adaptive' | 'telugu' | 'tanglish' | 'english'>('adaptive');
  const [toasts, setToasts] = useState<InAppToast[]>([]);

  // Initialize Theme and Subscribe to In-App Toasts & Palm Share URL Listener
  useEffect(() => {
    themeService.initTheme();

    const checkReceiveParam = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const rf = params.get('receive_from');
        if (rf) setReceiverPeerId(rf);
      } catch {
        // ignore
      }
    };

    const handleOpenPalmShare = () => setIsPalmShareOpen(true);
    window.addEventListener('gkedit:open_palm_share', handleOpenPalmShare);
    window.addEventListener('popstate', checkReceiveParam);

    const unsubToasts = notificationService.subscribeToasts(setToasts);

    return () => {
      unsubToasts();
      window.removeEventListener('gkedit:open_palm_share', handleOpenPalmShare);
      window.removeEventListener('popstate', checkReceiveParam);
    };
  }, []);

  // Initialize Global Keyboard Shortcuts Listener & Subscriptions
  useEffect(() => {
    keyboardShortcutsService.init();
    const unsubModal = keyboardShortcutsService.subscribeModal(setIsShortcutsModalOpen);

    const handleWakeWordActivated = (e: any) => {
      setIslandStatus('active');
      setIslandText('🎙️ Hey Jarvis Awakened');
      setIsVoiceModalOpen(true);
      setTimeout(() => {
        setIslandStatus('idle');
      }, 4000);
    };

    const handleToggleGestureHUD = () => {
      setIsGestureHUDOpen((prev) => {
        const next = !prev;
        notificationService.playSoftChime();
        notificationService.showInAppToast(
          next ? 'Gesture OS HUD Enabled 🖐️' : 'Gesture OS HUD Paused',
          next ? 'Tracking active via webcam' : 'Press Ctrl+Shift+H to re-enable',
          'info',
          { durationMs: 2500 }
        );
        return next;
      });
    };

    window.addEventListener('gkedit:wake_word_activated', handleWakeWordActivated);
    window.addEventListener('gkedit:toggle_gesture_hud', handleToggleGestureHUD);

    return () => {
      unsubModal();
      keyboardShortcutsService.destroy();
      window.removeEventListener('gkedit:wake_word_activated', handleWakeWordActivated);
      window.removeEventListener('gkedit:toggle_gesture_hud', handleToggleGestureHUD);
    };
  }, []);

  // Subscribe to J.A.R.V.I.S Reminders Fired
  useEffect(() => {
    const handleReminderFired = (e: any) => {
      const rem = e.detail?.reminder;
      if (!rem) return;
      setIslandStatus('active');
      setIslandText(`⏰ Reminder: ${rem.title}`);
      notificationService.showInAppToast(
        '⏰ J.A.R.V.I.S Reminder',
        rem.title,
        'alert',
        { reminderId: rem.id, isReminder: true, durationMs: 15000 }
      );
      setTimeout(() => {
        setIslandStatus('idle');
      }, 6000);
    };

    window.addEventListener('gkedit:reminder_fired', handleReminderFired);
    return () => {
      window.removeEventListener('gkedit:reminder_fired', handleReminderFired);
    };
  }, []);

  // Subscribe to Cross-Tab Navigation Events & GKEDIT Live voice trigger
  useEffect(() => {
    const handleNav = (e: any) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    const handleOpenLiveVoice = () => setIsVoiceModalOpen(true);

    window.addEventListener('gkedit:navigate_tab', handleNav);
    window.addEventListener('gkedit:open_live_voice', handleOpenLiveVoice);
    return () => {
      window.removeEventListener('gkedit:navigate_tab', handleNav);
      window.removeEventListener('gkedit:open_live_voice', handleOpenLiveVoice);
    };
  }, [setActiveTab]);

  // Subscribe to Wake Word Detection ("Hey Jarvis") and Voice Command Shortcuts
  useEffect(() => {
    wakeWordService.start();
    const unsubscribeWake = wakeWordService.subscribe(async (transcript, isWakeWordOnly) => {
      // If voice command contains speech, test against voice command shortcuts first
      if (!isWakeWordOnly && transcript) {
        const handled = await voiceCommandShortcutService.handleSpokenPhrase(transcript);
        if (handled) return;
      }

      // Show Dynamic island pill reaction & toast
      setIslandStatus('active');
      setIslandText('⚡ Hey Jarvis Detected');
      notificationService.showInAppToast(
        'JARVIS Awakened',
        isWakeWordOnly ? 'Listening for your voice command...' : `Command: "${transcript}"`,
        'info'
      );
      // Automatically open Live Voice Modal for conversation
      setIsVoiceModalOpen(true);
      setTimeout(() => {
        setIslandStatus('idle');
      }, 4000);
    });

    // Start Voice Command Shortcut Service (Web Speech API)
    voiceCommandShortcutService.start();
    const unsubVoiceState = voiceCommandShortcutService.subscribe((vState) => {
      if (vState.status === 'executed' && vState.lastExecution) {
        // Do not override island if a persistent timer was started
        if (vState.lastExecution.shortcutId !== 'set_timer') {
          setIslandStatus('active');
          setIslandText(`⚡ Voice: ${vState.lastExecution.shortcutName}`);
          setTimeout(() => {
            setIslandStatus('idle');
          }, 3000);
        }
      }
    });

    // Global event listeners for Voice Shortcuts
    const handleSwitchTab = (e: any) => {
      const targetTab = e.detail?.tab as ActiveTab;
      if (targetTab) {
        setActiveTab(targetTab);
      }
    };

    const handleLockAppEvent = () => {
      handleLockSession();
      setIsLocked(true);
    };

    const handleOpenVoiceShortcuts = () => {
      setIsVoiceShortcutsOpen(true);
    };

    const handleOpenCreatorMonitor = () => {
      if (isAdmin) {
        setIsMonitorOpen(true);
      }
    };

    const handleOpenTributeTab = () => {
      setIsTributeTabOpen(true);
    };

    const handleTimerComplete = (e: any) => {
      const detail = e.detail;
      notificationService.showInAppToast(
        '🔔 Timer Finished!',
        `Your countdown timer (${detail?.label || 'Timer'}) has ended!`,
        'alert'
      );
    };

    window.addEventListener('gkedit:switch_tab', handleSwitchTab);
    window.addEventListener('gkedit:lock_app', handleLockAppEvent);
    window.addEventListener('gkedit:open_auth', handleOpenAuth);
    window.addEventListener('gkedit:open_voice_shortcuts', handleOpenVoiceShortcuts);
    window.addEventListener('gkedit:open_creator_monitor', handleOpenCreatorMonitor);
    window.addEventListener('gkedit:open_tribute_tab', handleOpenTributeTab);
    window.addEventListener('gkedit:timer_complete', handleTimerComplete);

    return () => {
      unsubscribeWake();
      wakeWordService.stop();
      unsubVoiceState();
      voiceCommandShortcutService.stop();
      window.removeEventListener('gkedit:switch_tab', handleSwitchTab);
      window.removeEventListener('gkedit:lock_app', handleLockAppEvent);
      window.removeEventListener('gkedit:open_auth', handleOpenAuth);
      window.removeEventListener('gkedit:open_voice_shortcuts', handleOpenVoiceShortcuts);
      window.removeEventListener('gkedit:open_creator_monitor', handleOpenCreatorMonitor);
      window.removeEventListener('gkedit:open_tribute_tab', handleOpenTributeTab);
      window.removeEventListener('gkedit:timer_complete', handleTimerComplete);
    };
  }, [handleLockSession, setActiveTab, isAdmin, handleOpenAuth]);


  // Register PWA Service Worker (/sw.js) & Firebase Messaging SW
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // 1. PWA Service Worker for offline installability & caching
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('GKEDIT AI PWA Service Worker active:', reg.scope);
        })
        .catch((err) => {
          console.warn('PWA service worker registration notice:', err);
        });

      // 2. Firebase Messaging Service Worker
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((reg) => {
          console.log('Firebase messaging service worker active:', reg.scope);
        })
        .catch((err) => {
          console.warn('Firebase service worker registration note:', err);
        });
    }
  }, []);
  // Collapsible Top Model Panel State (Default: closed, remembered in localStorage with try/catch)
  const [showModelPanel, setShowModelPanel] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('gkedit_model_panel_open');
      return saved === 'true'; // Default false (closed)
    } catch {
      return false;
    }
  });

  const toggleModelPanel = () => {
    setShowModelPanel((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gkedit_model_panel_open', String(next));
      } catch (e) {
        console.warn('Could not save model panel state to localStorage', e);
      }
      return next;
    });
  };

  const handleSnoozeReminder = (toast: InAppToast) => {
    // Reschedule reminder for 10 minutes later in local state / storage
    const identifier = toast.reminderId || toast.message;
    const snoozed = reminderService.snoozeReminder(identifier, 10);
    notificationService.dismissToast(toast.id);

    // Provide immediate feedback in Dynamic Island and show confirmation toast
    setIslandStatus('active');
    setIslandText('💤 Snoozed for 10m');
    notificationService.showInAppToast(
      'Reminder Snoozed 💤',
      `"${snoozed.title}" will alert you again in 10 minutes (${new Date(snoozed.remindAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`,
      'success',
      { durationMs: 4000 }
    );
    setTimeout(() => {
      setIslandStatus('idle');
    }, 4000);
  };

  const handleUnlockBiometric = async () => {
    if (!window.PublicKeyCredential) {
      setIsLocked(false);
      return;
    }
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'preferred',
        },
      });
      if (assertion) {
        setIsLocked(false);
      }
    } catch {
      setIsLocked(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-[#00F2FE]/30 selection:text-cyan-200 overflow-x-hidden">
      {/* Deep cosmic dark theme with subtle radial animated gradient blurs (electric cyan #00F2FE and neon purple #9D4EDD) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 contain-strict">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full blur-[130px] bg-gradient-to-br from-[#00F2FE]/20 via-[#00F2FE]/10 to-transparent cosmic-radial-cyan" />
        <div className="absolute top-1/4 -right-32 w-[540px] h-[540px] rounded-full blur-[140px] bg-gradient-to-bl from-[#9D4EDD]/22 via-[#9D4EDD]/10 to-transparent cosmic-radial-purple" />
        <div className="absolute -bottom-36 left-1/4 w-[560px] h-[560px] rounded-full blur-[150px] bg-gradient-to-tr from-[#00FF87]/12 via-[#00F2FE]/08 to-transparent pointer-events-none" />
      </div>

      {/* GKEDIT AI - Security Gate Passkey / PIN Protection Overlay (Mounts before any sensitive feature) */}
      {!isSessionActive && (
        <SecurityGateOverlay
          onUnlock={() => setIsSessionActive(true)}
        />
      )}

      {/* iPhone-style Dynamic Island pill (Centered at top, tap to expand) */}
      <DynamicIsland
        status={islandStatus}
        statusText={islandText}
        isGestureActive={isGestureHUDOpen}
        onToggleGestureActive={() => setIsGestureHUDOpen((prev) => !prev)}
        onOpenAuth={handleOpenAuth}
      />

      {/* Biometric Lock Screen if enabled */}
      {isLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020713]/95 backdrop-blur-[8px]">
          <div className="max-w-sm w-full p-8 rounded-3xl bg-[#041029] border border-cyan-500/35 text-center space-y-6 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <div className="w-20 h-20 rounded-full bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 flex items-center justify-center mx-auto">
              <Fingerprint className="w-10 h-10 animate-pulse text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">GKEDIT AI Protected</h2>
              <p className="text-xs text-slate-400 mt-1">
                Touch your fingerprint sensor or verify biometrics to unlock.
              </p>
            </div>
            <button
              onClick={handleUnlockBiometric}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-[transform,opacity] active:scale-95 cursor-pointer"
            >
              Verify Biometrics / Unlock
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem('gkedit_biometric_lock');
                } catch {}
                setIsLocked(false);
              }}
              className="block w-full text-center text-xs text-slate-400 hover:text-cyan-300 transition underline cursor-pointer"
            >
              Reset Biometric Lock
            </button>
          </div>
        </div>
      )}

      {/* Floating In-App Notifications Toast Container */}
      <div className="fixed top-12 right-3 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-200 animate-in slide-in-from-top-2 ${
              toast.type === 'alert'
                ? 'bg-[#0f172a]/95 border-amber-400/50 text-amber-200 shadow-[0_4px_20px_rgba(245,158,11,0.3)]'
                : toast.type === 'success'
                ? 'bg-[#041c2c]/95 border-emerald-400/50 text-emerald-200 shadow-[0_4px_20px_rgba(16,185,129,0.3)]'
                : 'bg-[#040e24]/95 border-cyan-500/40 text-cyan-200 shadow-[0_4px_20px_rgba(6,182,212,0.3)]'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="flex items-center gap-1.5">
                {toast.type === 'alert' ? '⏰ J.A.R.V.I.S Alert' : '✨ GKEDIT AI'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-normal">Now</span>
                <button
                  onClick={() => notificationService.dismissToast(toast.id)}
                  className="p-0.5 rounded text-slate-400 hover:text-white transition"
                  title="Dismiss notification"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-xs text-white mt-1 leading-snug">{toast.message}</p>

            {/* Custom Action Button (e.g. Undo Delete Chat History) */}
            {toast.actionLabel && toast.onAction && (
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <span className="text-[10px] text-cyan-300 font-mono">1-Tap Action</span>
                <button
                  onClick={() => {
                    toast.onAction?.();
                    notificationService.dismissToast(toast.id);
                  }}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-[11px] shadow-[0_0_10px_rgba(6,182,212,0.4)] transition active:scale-95 flex items-center gap-1 cursor-pointer"
                >
                  <span>{toast.actionLabel}</span>
                </button>
              </div>
            )}

            {/* Snooze Action Button for Reminder Alerts */}
            {Boolean((toast.isReminder || toast.type === 'alert') && !toast.actionLabel) && (
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>Reschedule Alert</span>
                </span>
                <button
                  onClick={() => handleSnoozeReminder(toast)}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 text-slate-950 font-black text-[11px] shadow-[0_0_12px_rgba(6,182,212,0.4)] transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>💤 Snooze (10 min)</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Header with Liquid Blue Styling below Dynamic Island */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={handleOpenAuth}
        onOpenVoice={handleOpenVoice}
        onOpenCreatorHub={handleOpenCreatorHub}
        onOpenMonitor={handleOpenMonitor}
        onLockSession={handleLockSession}
        onOpenInstall={handleOpenInstall}
        currentLang={currentLang}
        onChangeLang={setCurrentLang}
        showModelPanel={showModelPanel}
        onToggleModelPanel={toggleModelPanel}
        isGestureHUDOpen={isGestureHUDOpen}
        onToggleGestureHUD={handleToggleGestureHUD}
        isSearchGrounding={nexusGroundingSearch}
        onToggleSearchGrounding={handleToggleSearchGrounding}
        onOpenNexusSettings={handleOpenNexusSettings}
      />

      {/* Active Tab Screen with Subtle Liquid-Glass Slide Transition & Touch/Pointer Swipe-to-Switch Support */}
      <main
        className="flex-1 relative z-10 overflow-y-auto overflow-x-hidden touch-swipe-container"
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchEnd={swipeHandlers.onTouchEnd}
        onTouchCancel={swipeHandlers.onTouchCancel}
        onPointerDown={swipeHandlers.onPointerDown}
        onPointerUp={swipeHandlers.onPointerUp}
        onPointerCancel={swipeHandlers.onPointerCancel}
      >
        <div
          key={activeTab}
          className={`min-h-full w-full ${
            slideDirection === 'right' ? 'animate-tab-slide-right' : 'animate-tab-slide-left'
          }`}
        >
          {activeTab === 'dashboard' && (
            <DashboardTab
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenVoice={() => setIsVoiceModalOpen(true)}
              onOpenCreatorHub={() => setIsCreatorHubOpen(true)}
              onOpenNexusSettings={() => setIsNexusSettingsOpen(true)}
            />
          )}

          {activeTab === 'chat' && (
            <ChatView
              onOpenCreatorHub={() => setIsCreatorHubOpen(true)}
              currentLang={currentLang}
              showModelPanel={showModelPanel}
              onToggleModelPanel={toggleModelPanel}
              systemInstruction={nexusSystemInstruction}
              temperature={nexusTemperature}
              globalGroundingSearch={nexusGroundingSearch}
              onOpenLiveVoice={() => setIsVoiceModalOpen(true)}
              onNavigateToBioLab={() => {
                setActiveTab('biolab');
              }}
              onIslandStatus={(status, text) => {
                setIslandStatus(status);
                if (text) setIslandText(text);
              }}
            />
          )}

          {activeTab === 'biolab' && (
            <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 pb-24">
              <Suspense
                fallback={
                  <div className="flex flex-col items-center justify-center h-96 gap-3 text-cyan-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-semibold">Initializing Bioscience Observable Learning Lab...</span>
                  </div>
                }
              >
                <BioscienceLabTab
                  onAskAiTopic={(topic) => {
                    setActiveTab('chat');
                    window.dispatchEvent(
                      new CustomEvent('gkedit:fill_chat_prompt', { detail: { prompt: topic } })
                    );
                  }}
                />
              </Suspense>
            </div>
          )}

          {activeTab === 'camera' && (
            <RealCameraSubtab
              onNavigateToChat={(prompt) => {
                window.dispatchEvent(new CustomEvent('gkedit:fill_chat_prompt', { detail: { prompt } }));
                setActiveTab('chat');
              }}
            />
          )}

          {activeTab === 'tools' && <ToolsTab />}

          {activeTab === 'bookview' && (
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center h-72 gap-3 text-amber-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-semibold">Opening Constitution Codex...</span>
                </div>
              }
            >
              <BookViewTab />
            </Suspense>
          )}

          {activeTab === 'showcase' && (
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center h-72 gap-3 text-cyan-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-semibold">Loading GK EDIT Video Editing Showcase...</span>
                </div>
              }
            >
              <VideoEditingShowcase
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenCreatorHub={() => setIsCreatorHubOpen(true)}
              />
            </Suspense>
          )}

          {activeTab === 'inditrack' && (
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center h-72 gap-3 text-cyan-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-semibold">Loading IndiTrack Live...</span>
                </div>
              }
            >
              <IndiTrackLive />
            </Suspense>
          )}

          {activeTab === 'maps' && (
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center h-72 gap-3 text-cyan-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-semibold">Loading Leaflet Maps...</span>
                </div>
              }
            >
              <MapsTab />
            </Suspense>
          )}

          {activeTab === 'devotional' && (
            <DevotionalTab onNavigateToChat={() => setActiveTab('chat')} />
          )}

          {activeTab === 'generators' && (
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center h-72 gap-3 text-cyan-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-semibold">Loading Studio Generators...</span>
                </div>
              }
            >
              <GeneratorsTab />
            </Suspense>
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              currentLang={currentLang}
              onChangeLang={setCurrentLang}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenCreatorHub={() => setIsCreatorHubOpen(true)}
              onOpenMonitor={() => setIsMonitorOpen(true)}
              onOpenInstall={() => setIsInstallModalOpen(true)}
              onLockSession={handleLockSession}
              onNavigateToTools={() => setActiveTab('tools')}
            />
          )}

          {/* SECURE ADMIN ACCESS CONTROL: Creator Live User Monitor Tab (Strictly for authorized admin narsimha2141@gmail.com) */}
          {activeTab === 'monitor' && isAdmin && (
            <CreatorLiveUserMonitor
              asTab={true}
              isOpen={true}
              onClose={() => setActiveTab('dashboard')}
            />
          )}
        </div>
      </main>

      {/* Liquid Glass Bottom Navigation Bar */}
      <LiquidGlassBottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Global Modals: Dynamically Unmounted from DOM when closed to free GPU memory & listeners */}
      {isAuthModalOpen && <AuthModal isOpen={true} onClose={handleCloseAuth} />}
      {isCreatorHubOpen && <CreatorHubModal isOpen={true} onClose={handleCloseCreatorHub} />}
      {isVoiceModalOpen && (
        <LiveVoiceModal
          isOpen={true}
          onClose={handleCloseVoice}
          currentLang={currentLang}
          onNavigateTab={setActiveTab}
          onReturnToChat={() => {
            handleCloseVoice();
            setActiveTab('chat');
          }}
        />
      )}
      {/* SECURE ADMIN ACCESS CONTROL: Only mount Creator Live User Monitor when admin evaluates to true */}
      {isAdmin && isMonitorOpen && (
        <CreatorLiveUserMonitor
          isOpen={true}
          onClose={handleCloseMonitor}
        />
      )}
      {isInstallModalOpen && (
        <PWAInstallModal
          isOpen={true}
          onClose={handleCloseInstall}
        />
      )}
      {isNexusSettingsOpen && (
        <NexusSettingsModal
          isOpen={true}
          onClose={handleCloseNexusSettings}
          systemInstruction={nexusSystemInstruction}
          onChangeSystemInstruction={setNexusSystemInstruction}
          temperature={nexusTemperature}
          onChangeTemperature={setNexusTemperature}
          model={nexusModel}
          onChangeModel={setNexusModel}
          groundingSearch={nexusGroundingSearch}
          onToggleGroundingSearch={handleToggleSearchGrounding}
        />
      )}
      {isShortcutsModalOpen && (
        <KeyboardShortcutsModal
          isOpen={true}
          onClose={() => keyboardShortcutsService.toggleModal(false)}
        />
      )}
      {isVoiceShortcutsOpen && (
        <VoiceCommandShortcutModal
          isOpen={true}
          onClose={handleCloseVoiceShortcuts}
        />
      )}

      {/* Real-time MediaPipe Hand Gesture Recognition HUD: Unmount when closed */}
      {isGestureHUDOpen && (
        <HandGestureHUD
          isOpen={true}
          onClose={handleToggleGestureHUD}
          onTriggerAction={(actionName, gesture) => {
            setIslandStatus('active');
            setIslandText(`⚡ Hand Gesture: ${gesture}`);
            notificationService.playSoftChime();
            setTimeout(() => {
              setIslandStatus('idle');
            }, 3000);
          }}
        />
      )}

      {/* All-in-One Palm Gesture Photo Share Module */}
      {isPalmShareOpen && (
        <PalmGesturePhotoShare
          isOpen={true}
          onClose={() => setIsPalmShareOpen(false)}
          onConnectReceiver={(senderId) => {
            setIsPalmShareOpen(false);
            setReceiverPeerId(senderId);
          }}
        />
      )}

      {/* P2P Photo Receiver Screen (opened when ?receive_from=<peerId> is in URL) */}
      {receiverPeerId && (
        <PalmShareReceiverModal
          senderPeerId={receiverPeerId}
          onClose={() => setReceiverPeerId(null)}
          onOpenPalmCapture={() => setIsPalmShareOpen(true)}
        />
      )}
      {/* Exclusive Creator Tribute Tab (Unlocked strictly via 2x tap on Dynamic Island icon) */}
      {isTributeTabOpen && (
        <CreatorTributeTab
          isOpen={true}
          onClose={handleCloseTributeTab}
        />
      )}

      {/* Full Screen High-Brightness Flashlight Overlay */}
      <ScreenTorchOverlay />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
