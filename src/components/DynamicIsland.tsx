import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Mic,
  MicOff,
  Square,
  Sparkles,
  Terminal,
  Radio,
  Clock,
  Volume2,
  Cpu,
  ChevronDown,
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  Disc,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Download,
  Flame,
  ArrowDown,
  Power,
  Activity,
  Compass,
  ShieldCheck,
  Zap,
  Timer,
  AlarmClock,
  RotateCcw,
  Plus,
  Bell,
  Crown,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';
import {
  dynamicIslandService,
  DynamicIslandMode,
  DynamicIslandState as IslandServiceState,
} from '../services/dynamicIslandService.ts';
import { mediaSessionService } from '../services/mediaSessionService.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { isCreatorAdmin } from '../services/adminAuth.ts';

// Backwards compatibility types
export type IslandStatus = 'idle' | 'active' | 'success' | 'alert' | 'thinking' | 'ready';
export type DynamicIslandState =
  | 'idle'
  | 'hover'
  | 'grabbed'
  | 'transferring'
  | 'receiving'
  | 'dropped';

export interface DynamicIslandProps {
  // Legacy props
  status?: IslandStatus;
  statusText?: string;
  state?: DynamicIslandState;
  isConnected?: boolean;
  peerCode?: string;
  photoUrl?: string | null;
  mode?: 'sender' | 'receiver';
  gestureStatusText?: string;
  onDropPhotoManual?: () => void;
  onDownloadPhoto?: () => void;

  // New direct control callbacks (optional, service also handles it)
  onStopStreaming?: () => void;
  onEndVoiceSession?: () => void;

  // Gesture Activation Controls
  isGestureActive?: boolean;
  onToggleGestureActive?: () => void;

  // Authentication & Profile Controls
  onOpenAuth?: () => void;
}

export function DynamicIsland({
  status,
  statusText,
  state: palmShareState,
  isConnected,
  peerCode,
  photoUrl,
  mode: palmMode = 'sender',
  onDropPhotoManual,
  onDownloadPhoto,
  onStopStreaming,
  onEndVoiceSession,
  isGestureActive,
  onToggleGestureActive,
  onOpenAuth,
}: DynamicIslandProps) {
  const { user, firebaseUser, logout, login } = useAuth();
  const [islandState, setIslandState] = useState<IslandServiceState>(dynamicIslandService.getState());
  const islandRef = useRef<HTMLDivElement | null>(null);

  // User Profile Popover State (Positioned next to Dynamic Island)
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState(false);
  const profileContainerRef = useRef<HTMLDivElement | null>(null);

  // Close profile dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileContainerRef.current && !profileContainerRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
      }
    }
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  // Determine active email, creator status, and avatar letter
  const activeEmail = (firebaseUser?.email || user?.email || '').trim();
  const storedAuthEmail = typeof window !== 'undefined' ? localStorage.getItem('gkedit_auth_email') : null;
  const effectiveEmail = activeEmail || storedAuthEmail || '';
  const effectiveIsCreator =
    isCreatorAdmin(effectiveEmail) ||
    effectiveEmail.toLowerCase() === 'narsimha2141@gmail.com' ||
    user?.role === 'creator';
  const isCreator = effectiveIsCreator;

  // Requirement: First letter of user email as profile pic.
  // If creator (narsimha2141@gmail.com): 'N' and kiritham (Crown).
  const displayAvatarLetter = effectiveIsCreator
    ? 'N'
    : effectiveEmail
    ? effectiveEmail.charAt(0).toUpperCase()
    : user?.name
    ? user.name.charAt(0).toUpperCase()
    : 'U';

  const isUserAuthenticated = Boolean(
    (firebaseUser && !firebaseUser.isAnonymous) ||
    (user && !user.id?.startsWith('guest_') && user.email && !user.email.includes('@guest.')) ||
    effectiveIsCreator
  );

  const handleQuickCreatorSignIn = async () => {
    setIsQuickLoggingIn(true);
    try {
      await login('narsimha2141@gmail.com', 'narsimha_creator_access');
      try {
        localStorage.setItem('gkedit_auth_email', 'narsimha2141@gmail.com');
      } catch {}
      setIsProfileOpen(false);
    } catch (err) {
      console.error('Creator sign-in error:', err);
    } finally {
      setIsQuickLoggingIn(false);
    }
  };

  const handleProfileLogout = async () => {
    try {
      localStorage.removeItem('gkedit_auth_email');
      await logout();
      setIsProfileOpen(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleTriggerLogin = () => {
    setIsProfileOpen(false);
    if (onOpenAuth) {
      onOpenAuth();
    } else {
      window.dispatchEvent(new CustomEvent('gkedit:open_auth'));
    }
  };

  // Real-time Gesture Detection Activation State (defaults to active)
  const [isActivated, setIsActivated] = useState<boolean>(isGestureActive ?? true);

  // Sync with prop changes
  useEffect(() => {
    if (typeof isGestureActive === 'boolean') {
      setIsActivated(isGestureActive);
    }
  }, [isGestureActive]);

  // Sync with global event bus
  useEffect(() => {
    const handleSync = (e: any) => {
      if (e?.detail?.active !== undefined) {
        setIsActivated(e.detail.active);
      } else {
        setIsActivated((prev) => !prev);
      }
    };
    window.addEventListener('gkedit:toggle_gesture_hud', handleSync);
    return () => window.removeEventListener('gkedit:toggle_gesture_hud', handleSync);
  }, []);

  // Toggle Activation Button handler with stopPropagation to avoid collapsing island
  const handleToggleActivation = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isActivated;
    setIsActivated(next);
    if (onToggleGestureActive) {
      onToggleGestureActive();
    } else {
      window.dispatchEvent(new CustomEvent('gkedit:toggle_gesture_hud', { detail: { active: next } }));
    }
  };

  // Double-tap tracker for the 1 specific icon on Dynamic Island
  // Opens the exclusive Creator Tribute Tab (GK EDIT)
  const lastEmblemTapRef = useRef<number>(0);
  const handleEmblemDoubleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastEmblemTapRef.current < 450) {
      lastEmblemTapRef.current = 0;
      window.dispatchEvent(new CustomEvent('gkedit:open_tribute_tab'));
    } else {
      lastEmblemTapRef.current = now;
    }
  };

  // Subscribe to central service & initialize Web Media Session monitoring
  useEffect(() => {
    mediaSessionService.init();
    return dynamicIslandService.subscribe((s) => {
      setIslandState(s);
    });
  }, []);

  // Sync legacy props if passed (from App.tsx or PalmShareTool)
  useEffect(() => {
    if (palmShareState) {
      dynamicIslandService.setPalmShare({
        state: palmShareState,
        photoUrl,
        isConnected,
        peerCode,
      });
    } else if (status) {
      if (status === 'thinking') {
        dynamicIslandService.setStreaming({
          text: statusText || 'Deep reasoning...',
        });
      } else if (status === 'ready' || status === 'success') {
        dynamicIslandService.setTool({
          toolName: statusText || 'Task Completed',
          elapsedSeconds: 1,
        });
        const timer = setTimeout(() => {
          dynamicIslandService.setIdle();
        }, 3000);
        return () => clearTimeout(timer);
      } else if (status === 'active' || status === 'alert') {
        const curMode = dynamicIslandService.getState().mode;
        if (curMode !== 'timer' && curMode !== 'media' && curMode !== 'streaming') {
          dynamicIslandService.setTool({
            toolName: statusText || 'GKEDIT Alert',
            elapsedSeconds: 0,
          });
        }
      }
    }
  }, [status, statusText, palmShareState, photoUrl, isConnected, peerCode]);

  // Click outside to collapse
  useEffect(() => {
    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (
        islandState.isExpanded &&
        islandRef.current &&
        !islandRef.current.contains(e.target as Node)
      ) {
        dynamicIslandService.setExpanded(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && islandState.isExpanded) {
        dynamicIslandService.setExpanded(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [islandState.isExpanded]);

  const { mode, isExpanded } = islandState;

  // Handle tap on island
  const handlePillClick = (e: React.MouseEvent) => {
    // Avoid re-toggling if clicking an interactive inner control
    if ((e.target as HTMLElement).closest('button, a, input')) {
      return;
    }
    dynamicIslandService.toggleExpanded();
  };

  const handleStopStreaming = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (islandState.streaming?.onAbort) {
      islandState.streaming.onAbort();
    }
    if (onStopStreaming) {
      onStopStreaming();
    }
    dynamicIslandService.setIdle();
  };

  const handleEndVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (islandState.voice?.onEndSession) {
      islandState.voice.onEndSession();
    }
    if (onEndVoiceSession) {
      onEndVoiceSession();
    }
    dynamicIslandService.setIdle();
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (islandState.voice?.onToggleMute) {
      islandState.voice.onToggleMute();
    } else {
      dynamicIslandService.setVoice({
        ...islandState.voice,
        isMuted: !islandState.voice?.isMuted,
      });
    }
  };

  // Dimensions & variant styling based on state
  // IDLE: w-[140px] h-[36px]
  // STREAMING: w-[170px] h-[36px]
  // VOICE: w-[160px] h-[36px]
  // MEDIA: w-[190px] h-[36px]
  // TOOL: w-[170px] h-[36px]
  // Dimensions & variant styling based on state
  // IDLE: w-[140px] or w-[165px] h-[36px]
  // STREAMING: w-[175px] h-[36px]
  // VOICE: w-[165px] h-[36px]
  // MEDIA: w-[195px] h-[36px]
  // TOOL: w-[175px] h-[36px]
  // EXPANDED: w-[380px] min-h-[140px] rounded-3xl
  const getPillDimensions = () => {
    if (isExpanded) {
      return {
        width: 380,
        height: 'auto',
        borderRadius: 28,
      };
    }

    switch (mode) {
      case 'streaming':
        return { width: 175, height: 36, borderRadius: 9999 };
      case 'voice':
        return { width: 165, height: 36, borderRadius: 9999 };
      case 'media':
        return islandState.media?.track
          ? { width: 235, height: 36, borderRadius: 9999 }
          : { width: 195, height: 36, borderRadius: 9999 };
      case 'tool':
        return { width: 175, height: 36, borderRadius: 9999 };
      case 'timer':
        return {
          width: islandState.timer?.isFinished ? 205 : 195,
          height: 36,
          borderRadius: 9999,
        };
      case 'palm_share':
        return { width: 220, height: 42, borderRadius: 9999 };
      case 'idle':
      default:
        return {
          width: isCreator ? (isActivated ? 185 : 160) : (isActivated ? 165 : 140),
          height: 36,
          borderRadius: 9999,
        };
    }
  };

  const dims = getPillDimensions();

  // Helper formatting for timer
  const formatSeconds = (sec: number = 0) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatTimeCountdown = (sec: number = 0) => {
    const clamped = Math.max(0, Math.floor(sec));
    const hrs = Math.floor(clamped / 3600);
    const mins = Math.floor((clamped % 3600) / 60);
    const secs = clamped % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Upgraded pill-shaped action button on the top-right labeled 'Turn On' / 'Active' with a Power icon
  const renderActivationButton = () => (
    <button
      type="button"
      onClick={handleToggleActivation}
      className={`px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer border ${
        isActivated
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-[0_0_16px_rgba(16,185,129,0.45)]'
          : 'bg-neutral-800 text-neutral-400 border-neutral-700/60 hover:text-neutral-200 hover:border-neutral-600'
      }`}
      title={isActivated ? 'Gesture Detection Active · Click to Turn Off' : 'Gesture Detection Standby · Click to Turn On'}
    >
      <Power className={`w-3.5 h-3.5 ${isActivated ? 'text-emerald-400 animate-pulse' : 'text-neutral-400'}`} />
      <span>{isActivated ? 'Active' : 'Turn On'}</span>
    </button>
  );

  return (
    <aside
      aria-label="Dynamic Island Notification and Status Pill"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none flex items-center justify-center gap-2 max-w-[95vw]"
    >
      <motion.div
        ref={islandRef}
        layout
        onClick={handlePillClick}
        animate={{
          width: dims.width,
          height: dims.height,
          borderRadius: dims.borderRadius,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
        className="pointer-events-auto relative overflow-hidden bg-neutral-950/95 border border-white/10 hover:border-emerald-500/30 text-white backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] cursor-pointer flex flex-col justify-center transition-all duration-300"
      >
        {/* Subtle Edge Ambient Glow */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            mode === 'streaming'
              ? 'bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-teal-500/10'
              : mode === 'voice'
              ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-green-500/10'
              : mode === 'media'
              ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/10'
              : mode === 'tool'
              ? 'bg-gradient-to-r from-violet-500/15 via-purple-500/10 to-fuchsia-500/10'
              : mode === 'timer'
              ? islandState.timer?.isFinished
                ? 'bg-gradient-to-r from-red-500/25 via-amber-500/25 to-rose-500/25 animate-pulse'
                : islandState.timer?.isRunning
                ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15'
                : 'bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-orange-500/15'
              : 'bg-transparent'
          }`}
        />

        <AnimatePresence mode="wait">
          {/* ======================================================== */}
          {/* EXPANDED STATES */}
          {/* ======================================================== */}
          {isExpanded ? (
            <motion.div
              key="expanded-content"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="p-4 w-full text-xs space-y-3 cursor-default"
            >
              {/* EXPANDED: STREAMING / THINKING */}
              {mode === 'streaming' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      <div>
                        <div className="font-bold text-white text-xs">GKEDIT AI Generating</div>
                        <div className="text-[10px] text-cyan-300/80 font-mono">
                          {islandState.streaming?.text || 'Processing prompt...'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{formatSeconds(islandState.streaming?.elapsedSeconds)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Tokens Processed</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {islandState.streaming?.tokensProcessed || 'Streaming tokens...'}
                    </span>
                  </div>

                  <button
                    onClick={handleStopStreaming}
                    className="w-full py-2 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-red-400 text-red-400" />
                    <span>Stop Response</span>
                  </button>
                </div>
              )}

              {/* EXPANDED: VOICE MODE */}
              {mode === 'voice' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Mic className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">Live Voice Session</div>
                        <div className="text-[10px] text-emerald-300 font-mono">
                          {islandState.voice?.isMuted ? 'Microphone Muted' : 'Listening active'}
                        </div>
                      </div>
                    </div>
                    {/* Live mini waveform */}
                    <div className="flex items-center gap-0.5 h-4">
                      {[40, 75, 55, 90, 60].map((h, i) => (
                        <span
                          key={i}
                          className="w-0.5 rounded-full bg-emerald-400 transition-all duration-100"
                          style={{
                            height: islandState.voice?.isMuted ? '3px' : `${h * (islandState.voice?.volumeLevel || 0.6)}%`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-300 min-h-[38px] max-h-20 overflow-y-auto font-sans leading-relaxed">
                    {islandState.voice?.transcript || 'Speak naturally into your microphone...'}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleMute}
                      className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border ${
                        islandState.voice?.isMuted
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-200 border-white/10 hover:bg-slate-700'
                      }`}
                    >
                      {islandState.voice?.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span>{islandState.voice?.isMuted ? 'Unmute' : 'Mute'}</span>
                    </button>

                    <button
                      onClick={handleEndVoice}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>End Session</span>
                    </button>
                  </div>
                </div>
              )}

              {/* EXPANDED: MEDIA (AUDIO PLAYER VIA WEB MEDIA SESSION & MEDIA GENERATION) */}
              {mode === 'media' && (
                <div className="space-y-3">
                  {islandState.media?.track ? (
                    <div className="space-y-3">
                      {/* Audio Player Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                            <Disc className={`w-4 h-4 ${islandState.media.isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>Active Audio Track</span>
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-300 text-[8px] font-mono border border-amber-400/40">
                                MEDIA SESSION
                              </span>
                            </div>
                            <div className="text-[10px] text-amber-300/80 font-mono">
                              {islandState.media.isPlaying ? 'Now Playing • Web Audio Stream' : 'Playback Paused'}
                            </div>
                          </div>
                        </div>

                        {/* Live Frequency Equalizer Bars */}
                        <div className="flex items-center gap-0.5 h-4">
                          {[35, 75, 50, 95, 65, 80].map((h, i) => (
                            <span
                              key={i}
                              className={`w-0.5 rounded-full ${
                                islandState.media?.isPlaying ? 'bg-amber-400' : 'bg-neutral-600'
                              } transition-all duration-100`}
                              style={{
                                height: islandState.media?.isPlaying ? `${h}%` : '3px',
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Track Details Card */}
                      <div className="p-2.5 rounded-2xl bg-black/60 border border-white/5 flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl bg-neutral-900 border border-amber-500/30 overflow-hidden shrink-0 flex items-center justify-center">
                          {islandState.media.track.artworkUrl ? (
                            <img
                              src={islandState.media.track.artworkUrl}
                              alt="Album Art"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Music className="w-5 h-5 text-amber-400" />
                          )}
                          <div className={`absolute inset-0 bg-black/20 ${islandState.media.isPlaying ? 'animate-pulse' : ''}`} />
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="font-bold text-white text-xs truncate">
                            {islandState.media.track.title}
                          </div>
                          <div className="text-[10.5px] text-amber-300 font-medium truncate flex items-center gap-1">
                            <span>{islandState.media.track.artist || 'GKEDIT Studio'}</span>
                            <span className="w-1 h-1 rounded-full bg-amber-400" />
                            <span className="text-neutral-400 text-[9.5px]">{islandState.media.track.album || 'Browser Audio'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Scrubber & Timestamps */}
                      <div className="space-y-1">
                        <div
                          className="relative w-full h-2 rounded-full bg-neutral-800 border border-white/5 overflow-hidden cursor-pointer"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const pct = Math.max(0, Math.min(1, clickX / rect.width));
                            const dur = islandState.media?.track?.duration || 180;
                            const targetSec = Math.floor(pct * dur);
                            if (islandState.media?.onSeek) {
                              islandState.media.onSeek(targetSec);
                            } else {
                              mediaSessionService.seekTo(targetSec);
                            }
                          }}
                        >
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 transition-all duration-200"
                            style={{
                              width: `${Math.min(
                                100,
                                ((islandState.media.track.currentTime || 0) /
                                  (islandState.media.track.duration || 180)) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[9.5px] font-mono text-neutral-400">
                          <span>{formatSeconds(Math.floor(islandState.media.track.currentTime || 0))}</span>
                          <span>{formatSeconds(Math.floor(islandState.media.track.duration || 180))}</span>
                        </div>
                      </div>

                      {/* Playback Controls Row */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (islandState.media?.onPreviousTrack) {
                              islandState.media.onPreviousTrack();
                            } else {
                              mediaSessionService.handlePreviousTrack();
                            }
                          }}
                          className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-white/10 transition active:scale-95 cursor-pointer"
                          title="Previous Track"
                        >
                          <SkipBack className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (islandState.media?.onTogglePlay) {
                              islandState.media.onTogglePlay();
                            } else {
                              mediaSessionService.togglePlay();
                            }
                          }}
                          className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition active:scale-95 cursor-pointer"
                        >
                          {islandState.media.isPlaying ? (
                            <>
                              <Pause className="w-4 h-4 fill-neutral-950" />
                              <span>Pause Stream</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 fill-neutral-950" />
                              <span>Resume Audio</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (islandState.media?.onNextTrack) {
                              islandState.media.onNextTrack();
                            } else {
                              mediaSessionService.handleNextTrack();
                            }
                          }}
                          className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-white/10 transition active:scale-95 cursor-pointer"
                          title="Next Track"
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Dismiss / Stop Audio */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (islandState.media?.onCancel) {
                            islandState.media.onCancel();
                          } else {
                            mediaSessionService.dismissMedia();
                          }
                          dynamicIslandService.setIdle();
                        }}
                        className="w-full py-1.5 px-3 rounded-xl bg-neutral-800/60 hover:bg-neutral-700 border border-white/10 text-neutral-400 hover:text-white font-medium text-[11px] transition active:scale-95 cursor-pointer"
                      >
                        Dismiss Player
                      </button>
                    </div>
                  ) : (
                    /* Existing Media Studio Generation */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                          <div>
                            <div className="font-bold text-white text-xs">Media Studio Generation</div>
                            <div className="text-[10px] text-amber-300 font-mono capitalize">
                              {islandState.media?.mediaType || 'Image / Video'} Model Active
                            </div>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-amber-400 text-xs">
                          {islandState.media?.progress ?? 50}%
                        </span>
                      </div>

                      {/* Active prompt peek */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 overflow-hidden">
                          {islandState.media?.thumbnailUrl ? (
                            <img src={islandState.media.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                          ) : (
                            <Sparkles className="w-5 h-5 animate-pulse" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                          "{islandState.media?.prompt || 'Neural media synthesis in progress...'}"
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 rounded-full bg-slate-900 border border-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 transition-all duration-300"
                          style={{ width: `${islandState.media?.progress ?? 50}%` }}
                        />
                      </div>

                      <button
                        onClick={() => {
                          if (islandState.media?.onCancel) islandState.media.onCancel();
                          dynamicIslandService.setIdle();
                        }}
                        className="w-full py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        <span>Dismiss / Cancel</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* EXPANDED: TOOL RUNNER */}
              {mode === 'tool' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-violet-400" />
                      <div>
                        <div className="font-bold text-white text-xs">Code & Tool Runner</div>
                        <div className="text-[10px] text-violet-300 font-mono">
                          {islandState.tool?.toolName || 'Executing Sandbox'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                      <Clock className="w-3 h-3 text-violet-400" />
                      <span>{formatSeconds(islandState.tool?.elapsedSeconds)}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-black/50 border border-violet-500/20 font-mono text-[10.5px] text-violet-200">
                    <span className="text-violet-400 mr-1.5">&gt;_</span>
                    {islandState.tool?.statusText || 'Executing kernel process...'}
                  </div>

                  <button
                    onClick={() => dynamicIslandService.setIdle()}
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white font-semibold text-xs transition active:scale-95 cursor-pointer"
                  >
                    <span>Close Runner View</span>
                  </button>
                </div>
              )}

              {/* EXPANDED: TIMER MODE */}
              {mode === 'timer' && islandState.timer && (
                <div className="space-y-3.5">
                  {/* Timer Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-xl border ${
                          islandState.timer.isFinished
                            ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-bounce'
                            : islandState.timer.isRunning
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        }`}
                      >
                        <Timer className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs flex items-center gap-1.5">
                          <span>Countdown Timer</span>
                          <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] font-mono text-neutral-300">
                            {islandState.timer.label || 'Voice Timer'}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-neutral-400">
                          {islandState.timer.isFinished
                            ? "Countdown complete • Time's up!"
                            : islandState.timer.isRunning
                            ? 'Actively counting down'
                            : 'Timer paused'}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                        islandState.timer.isFinished
                          ? 'bg-red-500/25 text-red-300 border-red-500/50 animate-pulse'
                          : islandState.timer.isRunning
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {islandState.timer.isFinished ? "TIME'S UP" : islandState.timer.isRunning ? 'RUNNING' : 'PAUSED'}
                    </span>
                  </div>

                  {/* Hero Digital Clock Typography Display */}
                  <div className="py-2.5 px-4 rounded-2xl bg-black/60 border border-white/5 text-center space-y-1.5">
                    <div
                      className={`text-4xl font-mono font-black tracking-tight ${
                        islandState.timer.isFinished
                          ? 'text-red-400 animate-pulse drop-shadow-[0_0_16px_rgba(239,68,68,0.7)]'
                          : islandState.timer.isRunning
                          ? 'text-emerald-300 drop-shadow-[0_0_16px_rgba(16,185,129,0.5)]'
                          : 'text-amber-300 drop-shadow-[0_0_16px_rgba(245,158,11,0.4)]'
                      }`}
                    >
                      {formatTimeCountdown(islandState.timer.remainingSeconds)}
                    </div>

                    <div className="text-[10px] font-mono text-neutral-400 flex items-center justify-center gap-1.5">
                      <span>Total: {formatTimeCountdown(islandState.timer.totalSeconds)}</span>
                      <span className="w-1 h-1 rounded-full bg-neutral-600" />
                      <span>
                        {Math.round(
                          (islandState.timer.remainingSeconds / (islandState.timer.totalSeconds || 1)) * 100
                        )}% remaining
                      </span>
                    </div>

                    {/* Full-width Glowing Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-neutral-900 border border-white/10 overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          islandState.timer.isFinished
                            ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                            : islandState.timer.isRunning
                            ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                            : 'bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                        }`}
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              (islandState.timer.remainingSeconds /
                                (islandState.timer.totalSeconds || 1)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Preset Buttons (+1m, +5m) */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-neutral-400 shrink-0">Add Time:</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dynamicIslandService.addTimeToTimer(60);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10.5px] font-mono font-semibold border border-white/10 flex items-center gap-1 transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span>+1 Min</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dynamicIslandService.addTimeToTimer(300);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10.5px] font-mono font-semibold border border-white/10 flex items-center gap-1 transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span>+5 Mins</span>
                    </button>
                  </div>

                  {/* Primary Action Controls Row */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dynamicIslandService.toggleTimer();
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border ${
                        islandState.timer.isFinished
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                          : islandState.timer.isRunning
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                      }`}
                    >
                      {islandState.timer.isFinished ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restart</span>
                        </>
                      ) : islandState.timer.isRunning ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause Timer</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-emerald-300" />
                          <span>Resume Timer</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dynamicIslandService.resetTimer();
                      }}
                      className="py-2 px-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-white/10 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                      title="Reset Timer to Initial Duration"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dynamicIslandService.cancelTimer();
                      }}
                      className="py-2 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                      title="Cancel & Close Timer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              )}

              {/* EXPANDED: IDLE MODE (Quick Dashboard, Live Gesture Sensors & Radar, and Interactive State Switcher) */}
              {mode === 'idle' && (
                <div className="space-y-3">
                  {/* SECRET CREATOR SENTINEL // CLASSIFIED GATEWAY (Exclusively for Creator) */}
                  {isCreator && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/80 via-slate-900/95 to-slate-950 border border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.25)] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                            <ShieldCheck className="w-4 h-4 text-cyan-400 animate-pulse" />
                          </div>
                          <div>
                            <div className="text-[11px] font-black tracking-wide text-white flex items-center gap-1.5">
                              <span>CREATOR SENTINEL</span>
                              <span className="px-1.5 py-0.2 rounded bg-cyan-500/25 text-cyan-300 text-[8.5px] font-mono border border-cyan-400/50">
                                CLASSIFIED
                              </span>
                            </div>
                            <div className="text-[9.5px] text-cyan-300/80 font-mono">
                              Root Overseer (@GKEDIT2141) • Clearance L5
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                          BEHAVIOR SYNC ON
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-black/60 border border-cyan-500/20 text-[10px] space-y-1">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="font-mono text-cyan-400">⚡ Silent User Behavior Modes:</span>
                          <span className="text-emerald-400 font-mono font-bold">100% Secret</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                          <span>Modes: Normal • Dangerous • Cool • Childish • Ultron</span>
                          <span className="text-cyan-300">Auto-Adapts AI</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          dynamicIslandService.setExpanded(false);
                          window.dispatchEvent(new CustomEvent('gkedit:open_creator_monitor'));
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-95 cursor-pointer"
                      >
                        <Radio className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
                        <span>Launch Creator Live Monitor & Mode Shifts</span>
                      </button>
                    </div>
                  )}

                  {/* Top Header with Activation Button */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="relative flex items-center justify-center">
                        <div className={`w-2.5 h-2.5 rounded-full ${isActivated ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-neutral-600'} animate-pulse`} />
                        {isActivated && (
                          <div className="absolute w-5 h-5 rounded-full bg-emerald-400/20 animate-ping" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">GKEDIT Biosensors</div>
                        <div className="text-[10px] text-neutral-400 font-mono">Dynamic Island • Luxury HUD</div>
                      </div>
                    </div>
                    {renderActivationButton()}
                  </div>

                  {/* Live Sensors & Feedback Panel */}
                  <div className="p-3 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className={`w-3.5 h-3.5 ${isActivated ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'}`} />
                        <span className="font-bold text-white text-[11px]">Live Sensor Radar</span>
                      </div>
                      <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full border transition-all ${
                        isActivated
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                          : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                      }`}>
                        {isActivated ? 'RADAR ACTIVE • 60 FPS' : 'SENSORS STANDBY'}
                      </span>
                    </div>

                    {/* Radar pulse indicator */}
                    {isActivated ? (
                      <div className="relative h-24 w-full rounded-xl bg-black/90 border border-emerald-500/30 overflow-hidden flex items-center justify-center">
                        {/* Concentric radar rings */}
                        <div className="absolute w-12 h-12 rounded-full border border-emerald-500/25 animate-pulse" />
                        <div className="absolute w-20 h-20 rounded-full border border-emerald-500/35 animate-ping duration-1000" />
                        <div className="absolute w-32 h-32 rounded-full border border-emerald-500/15" />
                        <div className="absolute w-44 h-44 rounded-full border border-emerald-500/10" />

                        {/* Radar axis crosshairs */}
                        <div className="absolute inset-x-0 h-px bg-emerald-500/20" />
                        <div className="absolute inset-y-0 w-px bg-emerald-500/20" />

                        {/* Sweeping radar scanner */}
                        <div
                          className="absolute w-36 h-36 rounded-full pointer-events-none animate-spin"
                          style={{
                            background: 'conic-gradient(from 0deg, rgba(16,185,129,0.4) 0deg, rgba(16,185,129,0.05) 50deg, transparent 65deg, transparent 360deg)',
                            animationDuration: '2.5s',
                          }}
                        />

                        {/* Center glowing emerald sensor blip */}
                        <div className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-400/60 text-emerald-300 text-[10.5px] font-mono shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>Gesture Detection Online</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 px-3 rounded-xl bg-black/60 border border-neutral-800 text-center space-y-1">
                        <div className="text-[11px] font-semibold text-neutral-300">Sensors are currently paused</div>
                        <div className="text-[10px] text-neutral-500 font-mono">Tap the "Turn On" button above to activate hand tracking</div>
                      </div>
                    )}

                    {/* Available Gesture Commands */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-mono text-neutral-400 flex items-center justify-between">
                        <span className="font-semibold text-neutral-300">Available Gesture Commands</span>
                        <span className="text-[9px] text-emerald-400 font-mono">Air Controls</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1 text-[10.5px]">
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/5 text-neutral-200">
                          <span className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">↔️</span>
                            <span className="font-medium">Swipe left / right</span>
                          </span>
                          <span className="text-[9.5px] font-mono text-emerald-400/90 font-semibold">Switch Tabs</span>
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/5 text-neutral-200">
                          <span className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">✋</span>
                            <span className="font-medium">Open Palm</span>
                          </span>
                          <span className="text-[9.5px] font-mono text-neutral-400">Stop / Pause</span>
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/5 text-neutral-200">
                          <span className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">👍</span>
                            <span className="font-medium">Thumbs Up</span>
                          </span>
                          <span className="text-[9.5px] font-mono text-neutral-400">Send / Confirm</span>
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/5 text-neutral-200">
                          <span className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">🤏</span>
                            <span className="font-medium">Pinch</span>
                          </span>
                          <span className="text-[9.5px] font-mono text-neutral-400">Air Click & Drag</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive State Demo Switcher */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 block">Switch Dynamic Island State:</span>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dynamicIslandService.setStreaming({
                            text: 'Generating quantum code...',
                            tokensProcessed: 142,
                            elapsedSeconds: 3,
                          });
                        }}
                        className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>AI Streaming</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dynamicIslandService.setVoice({
                            transcript: 'Observing cellular mitosis organelles in Bio-Lab...',
                            volumeLevel: 0.8,
                          });
                        }}
                        className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Mic className="w-3 h-3 text-emerald-400" />
                        <span>Voice Mode</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          mediaSessionService.playCyberpunkTributeTrack();
                        }}
                        className="p-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 transition cursor-pointer"
                        title="Play Cyberpunk Audio Track via Web Media Session API"
                      >
                        <Music className="w-3 h-3 text-amber-400 animate-pulse" />
                        <span>Media Player</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dynamicIslandService.setTool({
                            toolName: 'Web Search Grounding',
                            statusText: 'Querying scientific bioinformatics sources...',
                            elapsedSeconds: 2,
                          });
                        }}
                        className="p-1.5 rounded-lg bg-violet-950/60 hover:bg-violet-900/60 border border-violet-500/30 text-violet-300 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Terminal className="w-3 h-3 text-violet-400" />
                        <span>Tool Runner</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dynamicIslandService.startTimer(300, '5 Minutes');
                        }}
                        className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 transition cursor-pointer col-span-2"
                        title="Start 5-Minute Timer directly on Dynamic Island"
                      >
                        <Timer className="w-3 h-3 text-emerald-400 animate-pulse" />
                        <span>5m Countdown Timer</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => dynamicIslandService.setExpanded(false)}
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white font-semibold text-xs transition active:scale-95 cursor-pointer"
                  >
                    <span>Collapse Island</span>
                  </button>
                </div>
              )}

              {/* EXPANDED: PALM SHARE (Legacy Backwards Compatibility) */}
              {mode === 'palm_share' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="font-bold text-white text-xs">Huawei Palm Share P2P</div>
                        <div className="text-[10px] text-cyan-300 font-mono">
                          {islandState.palmShare?.isConnected ? 'Peer Paired' : 'Waiting for Peer'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {islandState.palmShare?.photoUrl && (
                    <div className="relative w-full h-24 rounded-xl overflow-hidden border border-cyan-400/40">
                      <img src={islandState.palmShare.photoUrl} alt="Payload" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDropPhotoManual) onDropPhotoManual();
                        window.dispatchEvent(new CustomEvent('gkedit:palm_share_drop'));
                        dynamicIslandService.setPalmShare({
                          ...islandState.palmShare,
                          state: 'dropped',
                        });
                      }}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>Drop Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDownloadPhoto) onDownloadPhoto();
                        window.dispatchEvent(new CustomEvent('gkedit:palm_share_save'));
                      }}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save Photo</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* ======================================================== */
            /* COMPACT PILL STATES */
            /* ======================================================== */
            <motion.div
              key="compact-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full px-3 flex items-center justify-between text-xs"
            >
              {/* COMPACT: IDLE */}
              {mode === 'idle' && (
                <div className="w-full flex items-center justify-between gap-1.5">
                  <div
                    onClick={handleEmblemDoubleTap}
                    className="flex items-center gap-1.5 shrink-0 cursor-pointer group hover:opacity-90 active:scale-95 transition-all select-none"
                    title="Tap 2x for Creator Tribute (GK EDIT)"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
                    <span className="text-[11px] font-mono font-bold tracking-wider text-slate-200 group-hover:text-amber-300 transition-colors">
                      GKEDIT
                    </span>
                    {isCreator && (
                      <span
                        className="px-1.5 py-0.2 rounded-full bg-cyan-500/25 border border-cyan-400/50 text-[8.5px] font-mono font-bold text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.5)] flex items-center gap-0.5"
                        title="Creator Clearance Level 5 Verified · Double-tap for Tribute"
                      >
                        <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping inline-block" />
                        <span>ROOT</span>
                      </span>
                    )}
                  </div>
                  {isActivated ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold tracking-wider">RADAR</span>
                    </div>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 shrink-0" />
                  )}
                </div>
              )}

              {/* COMPACT: STREAMING (w-[170px] h-[36px]) */}
              {mode === 'streaming' && (
                <div className="w-full flex items-center justify-between gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                  <span className="text-[11px] font-semibold text-cyan-200 tracking-wide truncate">
                    Generating...
                  </span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,1)] animate-ping shrink-0" />
                </div>
              )}

              {/* COMPACT: VOICE (w-[160px] h-[36px]) */}
              {mode === 'voice' && (
                <div className="w-full flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-semibold text-emerald-200">Listening</span>
                  </div>
                  {/* Dynamic mini audio bar visualizer */}
                  <div className="flex items-center gap-0.5 h-3 shrink-0">
                    {[30, 80, 50, 90].map((h, i) => (
                      <span
                        key={i}
                        className="w-0.5 rounded-full bg-emerald-400 transition-all duration-100"
                        style={{
                          height: islandState.voice?.isMuted ? '2px' : `${h * (islandState.voice?.volumeLevel || 0.6)}%`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* COMPACT: MEDIA (Audio Track via Web Media Session OR Media Studio Generation) */}
              {mode === 'media' && (
                <div className="w-full flex items-center justify-between gap-2">
                  {islandState.media?.track ? (
                    <>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 border border-amber-400/50 flex items-center justify-center bg-black">
                          {islandState.media.track.artworkUrl ? (
                            <img
                              src={islandState.media.track.artworkUrl}
                              alt="Track"
                              className={`w-full h-full object-cover ${islandState.media.isPlaying ? 'animate-spin' : ''}`}
                              style={{ animationDuration: '4s' }}
                            />
                          ) : (
                            <Music className="w-3 h-3 text-amber-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10.5px] font-bold text-white truncate leading-tight">
                            {islandState.media.track.title}
                          </div>
                          <div className="text-[9px] text-amber-300 font-mono truncate leading-tight">
                            {islandState.media.track.artist || 'Web Media'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Live mini equalizer bars */}
                        <div className="flex items-center gap-0.5 h-3">
                          {[40, 90, 60, 80].map((h, i) => (
                            <span
                              key={i}
                              className={`w-0.5 rounded-full ${
                                islandState.media?.isPlaying ? 'bg-amber-400 animate-pulse' : 'bg-neutral-600'
                              } transition-all duration-100`}
                              style={{
                                height: islandState.media?.isPlaying ? `${h}%` : '2px',
                                animationDelay: `${i * 120}ms`,
                              }}
                            />
                          ))}
                        </div>

                        {/* Quick play/pause button in compact pill */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (islandState.media?.onTogglePlay) {
                              islandState.media.onTogglePlay();
                            } else {
                              mediaSessionService.togglePlay();
                            }
                          }}
                          className="w-5 h-5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 flex items-center justify-center transition active:scale-90 cursor-pointer"
                          title={islandState.media.isPlaying ? 'Pause' : 'Play'}
                        >
                          {islandState.media.isPlaying ? (
                            <Pause className="w-2.5 h-2.5 fill-amber-300" />
                          ) : (
                            <Play className="w-2.5 h-2.5 fill-amber-400 ml-0.5" />
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        <span className="text-[11px] font-semibold text-amber-200">
                          {islandState.media?.progress ?? 50}%
                        </span>
                      </div>
                      <div className="w-14 h-1.5 rounded-full bg-slate-800 border border-white/5 overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300"
                          style={{ width: `${islandState.media?.progress ?? 50}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* COMPACT: CODE / TOOL RUNNER (w-[170px] h-[36px]) */}
              {mode === 'tool' && (
                <div className="w-full flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-violet-400 font-bold text-xs">&gt;_</span>
                    <span className="text-[11px] font-semibold text-violet-200 truncate max-w-[85px]">
                      Executing...
                    </span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.9)] animate-pulse shrink-0" />
                </div>
              )}

              {/* COMPACT: TIMER (w-[195px] h-[36px]) */}
              {mode === 'timer' && islandState.timer && (
                <div className="w-full flex items-center justify-between gap-1.5">
                  {islandState.timer.isFinished ? (
                    <>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="p-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 animate-bounce">
                          <AlarmClock className="w-3.5 h-3.5 text-red-400" />
                        </div>
                        <span className="text-[11px] font-bold text-red-300 font-mono tracking-wide animate-pulse">
                          TIME'S UP!
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          dynamicIslandService.cancelTimer();
                        }}
                        className="px-2 py-0.5 rounded-full bg-red-500/30 hover:bg-red-500/40 border border-red-400/50 text-red-200 text-[10px] font-semibold transition active:scale-90 cursor-pointer"
                        title="Dismiss Timer"
                      >
                        Dismiss
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <div
                          className={`p-1 rounded-full shrink-0 border ${
                            islandState.timer.isRunning
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          }`}
                        >
                          <Timer className={`w-3.5 h-3.5 ${islandState.timer.isRunning ? 'animate-pulse' : ''}`} />
                        </div>
                        <span
                          className={`text-[12px] font-mono font-black tracking-tight shrink-0 ${
                            islandState.timer.isRunning ? 'text-emerald-300' : 'text-amber-300'
                          }`}
                        >
                          {formatTimeCountdown(islandState.timer.remainingSeconds)}
                        </span>
                      </div>

                      {/* Mini progress line & play/pause toggle */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-8 h-1.5 rounded-full bg-neutral-800 border border-white/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              islandState.timer.isRunning
                                ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                                : 'bg-amber-400'
                            }`}
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(
                                  100,
                                  (islandState.timer.remainingSeconds /
                                    (islandState.timer.totalSeconds || 1)) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            dynamicIslandService.toggleTimer();
                          }}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer border ${
                            islandState.timer.isRunning
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/40 text-emerald-300'
                              : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/40 text-amber-300'
                          }`}
                          title={islandState.timer.isRunning ? 'Pause Timer' : 'Resume Timer'}
                        >
                          {islandState.timer.isRunning ? (
                            <Pause className="w-2.5 h-2.5 fill-emerald-300" />
                          ) : (
                            <Play className="w-2.5 h-2.5 fill-amber-300 ml-0.5" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* COMPACT: PALM SHARE (Legacy) */}
              {mode === 'palm_share' && (
                <div className="w-full flex items-center justify-between gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <span className="text-[11px] font-mono font-bold text-slate-200 truncate">
                    {islandState.palmShare?.state === 'grabbed'
                      ? 'Photo Held'
                      : islandState.palmShare?.state === 'receiving'
                      ? 'Incoming Photo'
                      : 'Palm Share'}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300">P2P</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Requirement: User Profile next to Dynamic Island (Smallest icon, without text) */}
      <div ref={profileContainerRef} className="relative pointer-events-auto shrink-0 flex items-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsProfileOpen((prev) => !prev);
          }}
          className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 hover:scale-110 shadow-lg ${
            effectiveIsCreator
              ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-slate-950 border border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
              : effectiveEmail
              ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white border border-cyan-400/80 shadow-[0_0_10px_rgba(6,182,212,0.45)]'
              : 'bg-slate-900/90 border border-white/30 text-slate-300 shadow-md'
          }`}
          title={
            effectiveIsCreator
              ? 'Creator: narsimha2141@gmail.com'
              : effectiveEmail
              ? `User: ${effectiveEmail}`
              : 'User Profile & Account'
          }
          aria-label="User Profile"
        >
          {/* Kiritham (Crown) perched atop the avatar if Creator (narsimha2141@gmail.com) */}
          {effectiveIsCreator && (
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center justify-center drop-shadow-[0_0_6px_#f59e0b] pointer-events-none">
              <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300 fill-amber-300 animate-pulse" />
            </span>
          )}

          {/* User Email First Letter (or 'N' for Creator) */}
          <span className="font-black text-[10px] sm:text-[11px] leading-none select-none">
            {displayAvatarLetter}
          </span>
        </button>

        {/* Profile Dropdown Popover with Login, Logout & Account Info */}
        {isProfileOpen && (
          <div
            className="absolute right-0 top-full mt-2.5 w-64 sm:w-72 rounded-2xl bg-[#030917]/95 backdrop-blur-2xl border border-cyan-500/35 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_24px_rgba(6,182,212,0.25)] z-50 text-xs animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* User Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="relative shrink-0">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-sm border ${
                    effectiveIsCreator
                      ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : effectiveEmail
                      ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white border-cyan-400'
                      : 'bg-slate-800 text-slate-300 border-white/20'
                  }`}
                >
                  {displayAvatarLetter}
                </div>
                {effectiveIsCreator && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 drop-shadow-[0_0_6px_#f59e0b]">
                    <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white truncate text-xs">
                    {effectiveIsCreator ? 'Narsimha (GK EDIT)' : (user?.name || 'Workspace User')}
                  </span>
                  {effectiveIsCreator && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono">
                      CREATOR
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                  {effectiveIsCreator ? 'narsimha2141@gmail.com' : (effectiveEmail || 'Guest Mode')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Close profile menu"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Account Status / Access Tier */}
            <div className="py-2 px-2.5 my-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">Account Access:</span>
              <span className={`font-mono font-bold text-[10px] sm:text-[11px] ${effectiveIsCreator ? 'text-amber-300' : 'text-cyan-300'}`}>
                {effectiveIsCreator ? '👑 Master Creator' : isUserAuthenticated ? 'Verified User' : 'Guest Session'}
              </span>
            </div>

            {/* Actions: Login & Logout */}
            <div className="space-y-2 pt-1">
              {isUserAuthenticated ? (
                <button
                  type="button"
                  onClick={handleProfileLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 hover:text-white hover:border-red-500/50 transition cursor-pointer font-bold text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out / Sign Out</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleTriggerLogin}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/30 hover:text-white transition cursor-pointer font-bold text-xs shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  >
                    <LogIn className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Log In / Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickCreatorSignIn}
                    disabled={isQuickLoggingIn}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 transition cursor-pointer text-[11px] font-semibold"
                  >
                    <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />
                    <span>{isQuickLoggingIn ? 'Signing In...' : 'Sign in as narsimha2141@gmail.com'}</span>
                  </button>
                </>
              )}

              {/* Quick switch to Creator account if signed in as someone else */}
              {isUserAuthenticated && !effectiveIsCreator && (
                <button
                  type="button"
                  onClick={handleQuickCreatorSignIn}
                  disabled={isQuickLoggingIn}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 hover:bg-amber-500/25 transition cursor-pointer text-[11px]"
                >
                  <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />
                  <span>Switch to Creator (narsimha2141@gmail.com)</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
