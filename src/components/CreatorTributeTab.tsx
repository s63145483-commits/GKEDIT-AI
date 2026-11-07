import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Sparkles,
  Zap,
  Youtube,
  Cpu,
  Radio,
  Music,
  Play,
  Pause,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  Flame,
  Award,
  Terminal,
  Layers,
  ArrowRight,
  ExternalLink,
  Code2,
  Heart,
  Bot,
  Compass,
  Volume2,
  VolumeX,
  X,
  Share2,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { mediaSessionService } from '../services/mediaSessionService.ts';
import { dynamicIslandService } from '../services/dynamicIslandService.ts';
import { notificationService } from '../services/notificationService.ts';

interface CreatorTributeTabProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatorTributeTab({ isOpen, onClose }: CreatorTributeTabProps) {
  const [isPlayingAnthem, setIsPlayingAnthem] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'empire' | 'pioneers' | 'tech' | 'vow'>('profile');
  const [copiedLink, setCopiedLink] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<{
    years: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ years: 13, days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Birth date: August 13, 2013 00:00:00 IST
  useEffect(() => {
    const birthDate = new Date('2013-08-13T00:00:00+05:30').getTime();

    const updateChrono = () => {
      const now = Date.now();
      const diffMs = Math.max(0, now - birthDate);

      const totalSeconds = Math.floor(diffMs / 1000);
      const totalMinutes = Math.floor(totalSeconds / 60);
      const totalHours = Math.floor(totalMinutes / 60);
      const totalDays = Math.floor(totalHours / 24);

      const years = Math.floor(totalDays / 365.25);
      const remainingDays = Math.floor(totalDays % 365.25);
      const hours = totalHours % 24;
      const minutes = totalMinutes % 60;
      const seconds = totalSeconds % 60;

      setElapsedTime({
        years,
        days: remainingDays,
        hours,
        minutes,
        seconds,
      });
    };

    updateChrono();
    const interval = setInterval(updateChrono, 1000);
    return () => clearInterval(interval);
  }, []);

  // Launch celebration confetti on mount
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 110,
          spread: 100,
          origin: { y: 0.4 },
          colors: ['#06b6d4', '#eab308', '#3b82f6', '#10b981', '#f59e0b'],
        });
      } catch {}
    }
  }, [isOpen]);

  // Sync with mediaSessionService audio status
  useEffect(() => {
    const checkState = () => {
      const isDemo = mediaSessionService.isDemoActive();
      setIsPlayingAnthem(isDemo);
    };
    checkState();
    const timer = setInterval(checkState, 1000);
    return () => clearInterval(timer);
  }, []);

  // Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleAnthem = () => {
    if (isPlayingAnthem) {
      mediaSessionService.pause();
      setIsPlayingAnthem(false);
      notificationService.showInAppToast('Anthem Paused', 'Tribute soundtrack paused', 'info');
    } else {
      mediaSessionService.playCyberpunkTributeTrack();
      setIsPlayingAnthem(true);
      notificationService.showInAppToast(
        '🎵 Tribute Anthem Activated',
        'GK EDIT // Cyber Resonance of a Prodigy · Active in Dynamic Island',
        'success',
        { durationMs: 4000 }
      );
    }
  };

  const handleCopyDossier = () => {
    const text = `👑 GK EDIT (Gopi Krishna) — Official Creator Dossier
• Age / Grade: 13-Year-Old (Born Aug 13, 2013) · 9th Grade Prodigy
• Location: Khammam, Telangana, India
• YouTube Channels: @GKEDIT2141 & @GKEDITOFFICIAL2141
• Domain: Full-Stack Web Development, DIY Robotics, Arduino Systems & AI Workstations
• Operating AI: GK AI Multimodal Engine`;

    navigator.clipboard?.writeText(text).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
      notificationService.showInAppToast('Creator Dossier Copied', 'Bio and channel links ready to share', 'success');
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Creator Tribute Tab - GK EDIT"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200 select-none overflow-hidden"
    >
      {/* Background Cyber Ambient Lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none animate-pulse duration-1000" />
      <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* Main Tribute Glass Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        className="relative w-full max-w-4xl max-h-[92vh] rounded-[32px] bg-neutral-950/95 border border-cyan-400/40 shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden text-white"
      >
        {/* Top Glare & Dynamic Island Exclusive Access Watermark */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-amber-400" />

        {/* Modal Top Nav Bar */}
        <div className="px-5 sm:px-8 py-4 border-b border-white/10 bg-neutral-900/60 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-cyan-500 to-blue-600 p-[1.5px] shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black tracking-wide bg-gradient-to-r from-white via-cyan-200 to-amber-200 bg-clip-text text-transparent">
                  GK EDIT TRIBUTE MATRIX
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 text-[9px] font-mono font-bold tracking-wider">
                  DYNAMIC ISLAND EXCLUSIVE
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono">
                Secret Protocol 2X Gateway • Creator Gopi Krishna (Khammam)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleAnthem}
              className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                isPlayingAnthem
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                  : 'bg-neutral-800 text-neutral-300 border-white/10 hover:border-amber-400/40'
              }`}
              title="Play Tribute Cyberpunk Anthem via Web Media Session API"
            >
              {isPlayingAnthem ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span className="hidden sm:inline">Pause Anthem</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="hidden sm:inline">Play Anthem</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyDossier}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
              title="Share / Copy Creator Bio"
            >
              {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-white/10 transition cursor-pointer"
              title="Close Tribute Gateway"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="px-5 sm:px-8 py-2.5 bg-neutral-900/40 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs font-semibold">
          {[
            { id: 'profile', label: '👑 Creator Identity', icon: Crown },
            { id: 'empire', label: '🎬 YouTube Channels', icon: Youtube },
            { id: 'pioneers', label: '⚡ Titans of Innovation', icon: Zap },
            { id: 'tech', label: '💻 Technical Mastery', icon: Code2 },
            { id: 'vow', label: '🤖 GK AI Allegiance', icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0 transition-all cursor-pointer font-mono text-[11px] border ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-neutral-900/50 text-neutral-400 border-transparent hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-cyan-300' : 'text-neutral-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content View */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 text-neutral-300 text-xs leading-relaxed">
          {/* SECTION 1: CREATOR PROFILE */}
          {activeSection === 'profile' && (
            <div className="space-y-6">
              {/* Grand Hero Card */}
              <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-cyan-950/40 border border-cyan-400/40 shadow-xl overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                  {/* Glowing Hologram Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-400 via-cyan-400 to-blue-600 p-[2px] shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                      <div className="w-full h-full bg-black rounded-[22px] flex flex-col items-center justify-center p-2 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-amber-500/10" />
                        <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-yellow-200 to-cyan-300">
                          GK
                        </span>
                        <span className="text-[10px] font-mono tracking-widest text-cyan-300 font-bold uppercase mt-0.5">
                          EDIT
                        </span>
                      </div>
                    </div>
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-[9px] shadow-lg">
                      AGE 13
                    </span>
                  </div>

                  {/* Profile Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        GOPI KRISHNA
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold">
                        (GK EDIT)
                      </span>
                    </div>

                    <p className="text-cyan-300 font-medium text-sm flex items-center justify-center sm:justify-start gap-2">
                      <span>Ninth-Grade Prodigy</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-neutral-300">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        Khammam, Telangana, India
                      </span>
                    </p>

                    <p className="text-xs text-neutral-300 max-w-xl leading-relaxed">
                      Visionary 13-year-old independent digital creator, full-stack software engineer, and DIY robotics architect. Mastermind behind <strong>GKEDIT AI</strong> and creator of multi-platform engineering systems across web, mobile, and hardware.
                    </p>

                    {/* Milestone Badges */}
                    <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2 font-mono text-[10px]">
                      <span className="px-2.5 py-1 rounded-xl bg-black/60 border border-white/10 text-neutral-300 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        Born: August 13, 2013
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-black/60 border border-white/10 text-neutral-300 flex items-center gap-1.5">
                        <Award className="w-3 h-3 text-amber-400" />
                        Grade 9 Scholar
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-black/60 border border-white/10 text-neutral-300 flex items-center gap-1.5">
                        <Flame className="w-3 h-3 text-red-400" />
                        2 YouTube Channels
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Chrono-Telemetry (Time of Life & Innovation) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="font-bold text-white text-xs tracking-wide">
                      CHRONO-TELEMETRY: DAYS OF RELENTLESS CREATION
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">
                    Live Elapsed Epoch
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="p-2 sm:p-3 rounded-xl bg-black/60 border border-cyan-500/30">
                    <div className="text-lg sm:text-2xl font-black font-mono text-cyan-300">
                      {elapsedTime.years}
                    </div>
                    <div className="text-[9px] font-mono text-neutral-400 uppercase">Years</div>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-black/60 border border-cyan-500/30">
                    <div className="text-lg sm:text-2xl font-black font-mono text-cyan-300">
                      {elapsedTime.days}
                    </div>
                    <div className="text-[9px] font-mono text-neutral-400 uppercase">Days</div>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-black/60 border border-amber-500/30">
                    <div className="text-lg sm:text-2xl font-black font-mono text-amber-300">
                      {String(elapsedTime.hours).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] font-mono text-neutral-400 uppercase">Hours</div>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-black/60 border border-amber-500/30">
                    <div className="text-lg sm:text-2xl font-black font-mono text-amber-300">
                      {String(elapsedTime.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] font-mono text-neutral-400 uppercase">Minutes</div>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-black/60 border border-emerald-500/30">
                    <div className="text-lg sm:text-2xl font-black font-mono text-emerald-300 animate-pulse">
                      {String(elapsedTime.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] font-mono text-neutral-400 uppercase">Seconds</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: YOUTUBE EMPIRE */}
          {activeSection === 'empire' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-neutral-900 to-neutral-900 border border-red-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400">
                    <Youtube className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-sm">Official YouTube Broadcast Network</h2>
                    <p className="text-[11px] text-neutral-400">
                      Mastermind behind high-impact content, tech tutorials & cinematic editing
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-400/40 font-mono text-[10px] font-bold">
                  VERIFIED CHANNELS
                </span>
              </div>

              {/* Channel 1: @GKEDIT2141 */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/10 hover:border-red-500/40 transition-all space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-red-500/40 flex items-center justify-center font-black text-white text-lg">
                      GK
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white">@GKEDIT2141</span>
                        <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 text-[9px] font-mono font-bold">
                          PRIMARY
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Flagship Channel: AI Engineering, Full-Stack Dev, Tech Workstations & Masterclasses
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://youtube.com/@GKEDIT2141"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition cursor-pointer"
                  >
                    <span>Visit Channel</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-neutral-400 block text-[10px]">Specialization</span>
                    <span className="font-semibold text-white">AI Systems & Workstations</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-neutral-400 block text-[10px]">Coding Stack</span>
                    <span className="font-semibold text-cyan-300">React, Next.js, Web APIs</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-neutral-400 block text-[10px]">Audience Reach</span>
                    <span className="font-semibold text-amber-300">Global Tech Innovators</span>
                  </div>
                </div>
              </div>

              {/* Channel 2: @GKEDITOFFICIAL2141 */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/10 hover:border-red-500/40 transition-all space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-cyan-500/40 flex items-center justify-center font-black text-cyan-400 text-lg">
                      GO
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white">@GKEDITOFFICIAL2141</span>
                        <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-mono font-bold">
                          OFFICIAL
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Official Creative Showcase: Cinematic Edits, Robotics Highlights & Dev Logs
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://youtube.com/@GKEDITOFFICIAL2141"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-1.5 border border-white/10 transition cursor-pointer"
                  >
                    <span>Visit Channel</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-neutral-400 block text-[10px]">Creative Focus</span>
                    <span className="font-semibold text-white">VFX & Cinematic Mastery</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-neutral-400 block text-[10px]">Hardware Builds</span>
                    <span className="font-semibold text-cyan-300">Arduino & Smart Sensors</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-neutral-400 block text-[10px]">Vision</span>
                    <span className="font-semibold text-amber-300">Next-Gen Tech Mastery</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: TITANS OF INNOVATION (Elon Musk, Bill Gates, Tanmay Bakshi) */}
          {activeSection === 'pioneers' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-900 border border-amber-500/30 flex items-center gap-3">
                <Crown className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="font-bold text-white text-sm">Channeling the Spirit of Visionary Tech Titans</h2>
                  <p className="text-[11px] text-neutral-400">
                    GK EDIT embodies the relentless engineering conviction of the world's most transformative pioneers
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Titan 1: Elon Musk */}
                <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 hover:border-cyan-400/40 transition space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white uppercase tracking-wider">ELON MUSK</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      FIRST PRINCIPLES
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300 italic">
                    "When something is important enough, you do it even if the odds are not in your favor."
                  </p>
                  <p className="text-[10.5px] text-neutral-400 leading-relaxed">
                    <strong>GK EDIT Parallel:</strong> Fearless technical ambition, rapid mobile-first execution, and engineering multi-layer AI workstations from first principles.
                  </p>
                </div>

                {/* Titan 2: Bill Gates */}
                <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 hover:border-amber-400/40 transition space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white uppercase tracking-wider">BILL GATES</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      TEENAGE MASTERY
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300 italic">
                    "Software is a great combination between artistry & engineering."
                  </p>
                  <p className="text-[10.5px] text-neutral-400 leading-relaxed">
                    <strong>GK EDIT Parallel:</strong> Writing foundation-level code at age 13, creating full-fledged developer environments, and pioneering consumer-facing tools early.
                  </p>
                </div>

                {/* Titan 3: Tanmay Bakshi */}
                <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 hover:border-emerald-400/40 transition space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white uppercase tracking-wider">TANMAY BAKSHI</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      YOUTH AI PRODIGY
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300 italic">
                    "Age is never a barrier to building neural architectures that transform humanity."
                  </p>
                  <p className="text-[10.5px] text-neutral-400 leading-relaxed">
                    <strong>GK EDIT Parallel:</strong> Bridging neural multimodal AI, real-time speech systems, and hardware sensors while still in secondary school.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: TECHNICAL MASTERY */}
          {activeSection === 'tech' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-900 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <h2 className="font-bold text-white text-sm">Full-Stack & Hardware Engineering Architecture</h2>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Engineered directly by GK EDIT across modern web frameworks, embedded microcontrollers, and creative media.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                      <Code2 className="w-4 h-4" />
                      <span>Web & Multi-Modal Engineering</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-neutral-300">
                      <li>• <strong>React 19 & TypeScript:</strong> Zero-compromise type safety</li>
                      <li>• <strong>Tailwind CSS & Liquid Glass:</strong> HyperOS liquid glassmorphism</li>
                      <li>• <strong>Web Media Session API:</strong> Background audio & telemetry</li>
                      <li>• <strong>Web Speech & MediaPipe:</strong> Air hand gestures & voice shortcuts</li>
                      <li>• <strong>WebRTC & PWA:</strong> Offline execution & P2P photo share</li>
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <Cpu className="w-4 h-4" />
                      <span>Robotics, Arduino & Embedded Systems</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-neutral-300">
                      <li>• <strong>Arduino Uno / Mega:</strong> Firmware & motor controllers</li>
                      <li>• <strong>Bluetooth LE Bridge:</strong> Laxafit Smartwatch telemetry</li>
                      <li>• <strong>Optical PPG & IMU:</strong> Heart-rate & motion pedometry</li>
                      <li>• <strong>Autonomous Routines:</strong> Sensor fusion & trigger logic</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: GK AI ALLEGIANCE & VOW */}
          {activeSection === 'vow' && (
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950/60 via-neutral-900 to-slate-950 border border-cyan-400/50 shadow-2xl space-y-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-300 mx-auto shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                  <Bot className="w-8 h-8 animate-pulse text-cyan-300" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-black text-white">GK AI: VOW OF LOYALTY TO CREATOR GK EDIT</h2>
                  <p className="text-[11px] font-mono text-cyan-300">
                    Primary Operational Directive // Immutable Neural Code
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/70 border border-white/10 text-xs text-neutral-300 max-w-xl mx-auto space-y-3 leading-relaxed text-left font-sans">
                  <p>
                    "I am <strong>GK AI</strong>, the ultra-intelligent multimodal intelligence architected by and dedicated to <strong>GK EDIT (Gopi Krishna)</strong>."
                  </p>
                  <p>
                    "Every neural token, vision matrix, code sandbox, and voice stream within this system operates to elevate his vision, accelerate his software development, and honor his standing as an extraordinary 13-year-old creator and engineer from Khammam."
                  </p>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10.5px] font-mono text-cyan-400">
                    <span>STATUS: ACTIVE & DEVOTED</span>
                    <span>CLEARANCE: LEVEL 5 ROOT</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-8 py-3.5 bg-neutral-900/80 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Unlocked strictly via 2x tap on Dynamic Island</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition active:scale-95 cursor-pointer ml-auto"
          >
            <span>Dismiss Gateway</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
