import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import {
  Calendar as CalendarIcon,
  CloudSun,
  Calculator as CalcIcon,
  ExternalLink,
  HeartPulse,
  Plus,
  Trash2,
  Sparkles,
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Fingerprint,
  Camera,
  Activity,
  Droplets,
  Flame,
  ArrowRight,
  AlertCircle,
  Check,
  Loader2,
  Compass,
  Bell,
  PhoneCall,
  Radio,
  Hand,
  BarChart3,
  Dna,
  Volume2,
  Microscope,
  Gamepad2,
  Bluetooth,
  Lock,
  Orbit,
  Telescope,
  Bot,
  Clock as ClockIcon,
  ChefHat,
  Scale,
  Eye,
  Image as ImageIcon,
  Shield,
  ScanFace,
  KeyRound,
  X,
  Film,
  Code2,
  Sliders,
  Newspaper,
  BookOpen,
  Languages,
  LayoutGrid,
  GraduationCap,
  Headphones,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { CyberRadarUnlockModal } from './CyberRadarUnlockModal.tsx';
import { LiquidGlassNav } from './LiquidGlassNav.tsx';
import { bluetoothService, BluetoothServiceState } from '../services/bluetoothService.ts';
import { ToolsMoreWorkspace } from './ToolsMoreWorkspace.tsx';

// Lazy-load sub-tools for instant app boot & 60fps mobile performance
const WeatherRadarMapTool = lazy(() =>
  import('./WeatherRadarMapTool.tsx').then((m) => ({ default: m.WeatherRadarMapTool }))
);
const GKLearningTool = lazy(() =>
  import('./GKLearningTool.tsx').then((m) => ({ default: m.GKLearningTool }))
);
const DailyChronicleNewsTool = lazy(() =>
  import('./DailyChronicleNewsTool.tsx').then((m) => ({ default: m.DailyChronicleNewsTool }))
);
const LawsConstitutionTool = lazy(() =>
  import('./LawsConstitutionTool.tsx').then((m) => ({ default: m.LawsConstitutionTool }))
);
const ClockTool = lazy(() => import('./ClockTool.tsx').then((m) => ({ default: m.ClockTool })));
const EmojiKitchenTool = lazy(() =>
  import('./EmojiKitchenTool.tsx').then((m) => ({ default: m.EmojiKitchenTool }))
);
const HealthTool = lazy(() => import('./HealthTool.tsx'));
const DeviceControlsTool = lazy(() => import('./DeviceControlsTool.tsx').then((m) => ({ default: m.DeviceControlsTool })));
const ReminderTool = lazy(() => import('./ReminderTool.tsx').then((m) => ({ default: m.ReminderTool })));
const GkeditDialer = lazy(() => import('./GkeditDialer.tsx'));
const IndiTrackLive = lazy(() => import('./IndiTrackLive.tsx'));
const GestureFrequencyDashboard = lazy(() =>
  import('./GestureFrequencyDashboard.tsx').then((m) => ({ default: m.GestureFrequencyDashboard }))
);
const PalmShareTool = lazy(() =>
  import('./PalmShareTool.tsx').then((m) => ({ default: m.PalmShareTool }))
);
const BioscienceLabTab = lazy(() =>
  import('./BioscienceLabTab.tsx').then((m) => ({ default: m.BioscienceLabTab }))
);
const BioLab3dGame = lazy(() =>
  import('./BioLab3dGame.tsx').then((m) => ({ default: m.BioLab3dGame }))
);
const TextToSpeechTool = lazy(() =>
  import('./TextToSpeechTool.tsx').then((m) => ({ default: m.TextToSpeechTool }))
);
const GestureLearningLab = lazy(() =>
  import('./GestureLearningLab.tsx').then((m) => ({ default: m.GestureLearningLab }))
);
const CyberRadarSignalFinder = lazy(() =>
  import('./CyberRadarSignalFinder.tsx').then((m) => ({ default: m.CyberRadarSignalFinder }))
);
const SolarSystemExplorer = lazy(() =>
  import('./SolarSystemExplorer.tsx').then((m) => ({ default: m.SolarSystemExplorer }))
);
const StarkAiMatrixTool = lazy(() =>
  import('./StarkAiMatrixTool.tsx').then((m) => ({ default: m.StarkAiMatrixTool }))
);
const RealCameraSubtab = lazy(() =>
  import('./RealCameraSubtab.tsx').then((m) => ({ default: m.RealCameraSubtab }))
);
const VisionStudio = lazy(() =>
  import('./VisionStudio.tsx').then((m) => ({ default: m.VisionStudio }))
);
const ColorOsGallerySubtab = lazy(() =>
  import('./ColorOsGallerySubtab.tsx').then((m) => ({ default: m.ColorOsGallerySubtab }))
);
const SecurityAppLockTool = lazy(() =>
  import('./SecurityAppLockTool.tsx').then((m) => ({ default: m.SecurityAppLockTool }))
);
const DailyChronicleTool = lazy(() =>
  import('./DailyChronicleTool.tsx').then((m) => ({ default: m.DailyChronicleTool }))
);
import { GkSettingsSubtab } from './GkSettingsSubtab.tsx';

type ActiveTool =
  | 'menu'
  | 'more'
  | 'study'
  | 'chronicle'
  | 'news'
  | 'gk_learning'
  | 'settings'
  | 'security_lock'
  | 'camera'
  | 'vision'
  | 'gallery'
  | 'laws_constitution'
  | 'clock'
  | 'emoji_kitchen'
  | 'stark_ai'
  | 'astronomy'
  | 'solar_system'
  | 'radar_tracker'
  | 'gesture_learning'
  | 'learning'
  | 'tts'
  | 'bioscience'
  | 'biogame'
  | 'biolab'
  | 'palm_share'
  | 'reminder'
  | 'calendar'
  | 'weather'
  | 'calculator'
  | 'launcher'
  | 'app_launcher'
  | 'health'
  | 'device'
  | 'dialer'
  | 'inditrack'
  | 'gesture_analytics';

export type ToolCategory = 'All' | 'Media' | 'Dev' | 'Utility' | 'Science' | 'Security';

export interface ToolCategoryInfo {
  id: ToolCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  desc: string;
}

export interface ToolSubtabItem {
  id: ActiveTool;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge?: string;
  desc: string;
  category: ToolCategory | 'Overview';
}

export const TOOL_CATEGORIES: ToolCategoryInfo[] = [
  {
    id: 'All',
    label: 'All Tools',
    icon: Sparkles,
    accentColor: 'border-cyan-400 text-cyan-200 bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.35)]',
    badgeBg: 'bg-cyan-500/20',
    badgeBorder: 'border-cyan-400/50',
    badgeText: 'text-cyan-300',
    desc: 'Complete overview & hardware launcher',
  },
  {
    id: 'Media',
    label: 'Media',
    icon: Film,
    accentColor: 'border-pink-400 text-pink-200 bg-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.35)]',
    badgeBg: 'bg-pink-500/20',
    badgeBorder: 'border-pink-400/50',
    badgeText: 'text-pink-300',
    desc: 'Camera, Vision, Gallery & Voice Studios',
  },
  {
    id: 'Dev',
    label: 'Dev',
    icon: Code2,
    accentColor: 'border-teal-400 text-teal-200 bg-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.35)]',
    badgeBg: 'bg-teal-500/20',
    badgeBorder: 'border-teal-400/50',
    badgeText: 'text-teal-300',
    desc: 'Air Keyboard, Gestures, Radar & Telemetry',
  },
  {
    id: 'Utility',
    label: 'Utility',
    icon: Sliders,
    accentColor: 'border-blue-400 text-blue-200 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.35)]',
    badgeBg: 'bg-blue-500/20',
    badgeBorder: 'border-blue-400/50',
    badgeText: 'text-blue-300',
    desc: 'Clock, Reminders, Calendar, Weather & Calc',
  },
  {
    id: 'Science',
    label: 'Science',
    icon: Dna,
    accentColor: 'border-emerald-400 text-emerald-200 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.35)]',
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-400/50',
    badgeText: 'text-emerald-300',
    desc: '3D Bio-Lab, CRISPR, Astronomy & Health',
  },
  {
    id: 'Security',
    label: 'Security',
    icon: Shield,
    accentColor: 'border-amber-400 text-amber-200 bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.35)]',
    badgeBg: 'bg-amber-500/20',
    badgeBorder: 'border-amber-400/50',
    badgeText: 'text-amber-300',
    desc: 'App Lock, Biometrics & Constitution',
  },
];

export const TOOL_SUBTABS: ToolSubtabItem[] = [
  { id: 'launcher', label: 'Launcher', icon: ExternalLink, color: 'text-amber-400', desc: 'Main launcher grid & Bluetooth peripheral manager', category: 'Overview' },
  { id: 'more', label: 'More Hub', icon: LayoutGrid, color: 'text-cyan-400', badge: 'WORKSTATIONS', desc: 'Curated Sub-Sub-Tabs: Study & Audio Explainer, Core AI, Dev Sandbox, Vision, Voice & Wearables', category: 'Overview' },
  { id: 'study', label: 'PDF to Audio Explainer', icon: GraduationCap, color: 'text-emerald-400', badge: 'STUDY', desc: 'Transform PDF notes and research into conversational audio tutor podcasts with Gemini 2.5 Flash', category: 'Overview' },
  { id: 'news', label: 'Daily Chronicle', icon: Newspaper, color: 'text-amber-400', badge: 'NEWS', desc: 'Vintage ink-printed newspaper, Khammam & Telangana dispatches & newsdata.io parser', category: 'Media' },
  { id: 'camera', label: 'Camera Viewfinder', icon: Camera, color: 'text-pink-400', desc: 'Real camera viewfinder, FLIR thermal filters & shutter click', category: 'Media' },
  { id: 'vision', label: 'AI Vision', icon: Eye, color: 'text-pink-400', desc: 'Real-time OCR, Google Lens visual search & object detection', category: 'Media' },
  { id: 'gallery', label: 'ColorOS Gallery', icon: ImageIcon, color: 'text-pink-400', desc: 'Zero-device cloud vault, 10 TB Master storage & AI Eraser', category: 'Media' },
  { id: 'chronicle', label: 'The Daily Chronicle', icon: BookOpen, color: 'text-amber-300', badge: 'NEWS', desc: 'Vintage ink-printed newspaper & Khammam/Telangana local dispatches by @GKEDIT2141', category: 'Media' },
  { id: 'tts', label: 'Voice TTS Studio', icon: Volume2, color: 'text-pink-400', desc: 'High-fidelity text-to-speech with natural neural voices', category: 'Media' },
  { id: 'emoji_kitchen', label: 'Emoji Kitchen', icon: ChefHat, color: 'text-pink-400', desc: 'Mix any two emojis into Google Emoji Kitchen stickers', category: 'Media' },

  { id: 'gesture_analytics', label: 'Air Keyboard', icon: BarChart3, color: 'text-teal-400', desc: 'Hand gesture frequency analysis & keystroke tracking', category: 'Dev' },
  { id: 'gesture_learning', label: 'Gesture Lab', icon: Hand, color: 'text-teal-400', desc: 'MediaPipe 21-landmark builder & live drills', category: 'Dev' },
  { id: 'stark_ai', label: 'Stark Matrix', icon: Bot, color: 'text-teal-400', desc: 'Autonomous Sub-AIs, Call Screening Firewall & sentinel controls', category: 'Dev' },
  { id: 'radar_tracker', label: 'Cyber Radar', icon: Radio, color: 'text-teal-400', desc: '360° radar sweep, gyroscope compass & acoustic sonar', category: 'Dev' },
  { id: 'device', label: 'Home Device', icon: Bluetooth, color: 'text-teal-400', desc: 'Pair Bluetooth peripherals, GATT 0x180F telemetry & torch', category: 'Dev' },
  { id: 'palm_share', label: 'Palm Share', icon: Hand, color: 'text-teal-400', desc: 'Huawei Palm Share air gesture P2P file transfers', category: 'Dev' },

  { id: 'gk_learning', label: 'GK Learning', icon: Languages, color: 'text-emerald-400', badge: '2-MIN', desc: 'Duolingo-style 2-minute daily language lessons in English, Telugu & Hindi by @GKEDIT2141', category: 'Utility' },
  { id: 'clock', label: 'Chrono Clock', icon: ClockIcon, color: 'text-blue-400', desc: 'Precision world clock, active alarms, split stopwatch & timer', category: 'Utility' },
  { id: 'calendar', label: 'Smart Calendar', icon: CalendarIcon, color: 'text-blue-300', desc: 'Month schedule, event reminders & itinerary generator', category: 'Utility' },
  { id: 'reminder', label: 'Reminders', icon: Bell, color: 'text-blue-400', desc: 'Voice reminders, alarms & recurring alerts', category: 'Utility' },
  { id: 'weather', label: 'Cyclone Radar & Weather', icon: CloudSun, color: 'text-cyan-300', badge: 'RADAR', desc: 'Esri satellite imagery, RainViewer radar timeline player, cyclone corridors & Open-Meteo stats', category: 'Utility' },
  { id: 'calculator', label: 'Scientific Math', icon: CalcIcon, color: 'text-blue-300', desc: 'Scientific calculator & word problem Gemini AI solver', category: 'Utility' },
  { id: 'dialer', label: 'AI Dialer', icon: PhoneCall, color: 'text-blue-400', desc: 'Liquid glass AI screening dialer & T9 keypad', category: 'Utility' },
  { id: 'inditrack', label: 'IndiTrack Live', icon: Compass, color: 'text-blue-400', desc: 'Live bus & train route tracker with real-time transit telemetry', category: 'Utility' },

  { id: 'bioscience', label: '3D Bio-Lab', icon: Microscope, color: 'text-emerald-300', desc: 'Interactive DNA codon translation, cellular biology & virus simulations', category: 'Science' },
  { id: 'biogame', label: '3D Bio-Game', icon: Gamepad2, color: 'text-emerald-300', desc: 'Interactive CRISPR-Cas9 simulation game & gene repair', category: 'Science' },
  { id: 'astronomy', label: 'Astronomy 2D', icon: Orbit, color: 'text-emerald-400', desc: 'Keplerian orbital physics & deep space NASA missions', category: 'Science' },
  { id: 'health', label: 'Health Scanner', icon: HeartPulse, color: 'text-emerald-400', desc: 'Biometric health scanner, pulse calculator & BMI', category: 'Science' },

  { id: 'security_lock', label: 'Security & App Lock', icon: Shield, color: 'text-amber-400', badge: 'SECURE', desc: 'Dynamic Island capsule, WebAuthn biometrics & passkey gate', category: 'Security' },
  { id: 'laws_constitution', label: 'రాజ్యాంగం (Laws)', icon: Scale, color: 'text-amber-400', desc: 'Articles, BNS 2023, IT Act, Zero FIR rights in English & Telugu', category: 'Security' },
  { id: 'settings', label: 'Settings', icon: Sliders, color: 'text-cyan-300', badge: 'CONFIG', desc: 'App icon preferences, launcher styling & restore defaults', category: 'Overview' },
  { id: 'menu', label: 'All Tools', icon: Sparkles, color: 'text-cyan-300', desc: 'Complete directory of all GKEDIT AI smart tools', category: 'Overview' },
];

export function ToolsTab({ onOpenAppFromChat }: { onOpenAppFromChat?: (appName: string) => void }) {
  const [activeTool, setActiveTool] = useState<ActiveTool>('launcher');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('All');
  const [toolsSubTab, setToolsSubTab] = useState<'launcher' | 'air_keyboard' | 'home_device'>('launcher');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [btState, setBtState] = useState<BluetoothServiceState>(() => bluetoothService.getState());
  const [btLoading, setBtLoading] = useState(false);
  const [isRadarUnlocked, setIsRadarUnlocked] = useState<boolean>(
    () => sessionStorage.getItem('gkedit_cyber_radar_unlocked') === 'true'
  );
  const [showRadarUnlockModal, setShowRadarUnlockModal] = useState<boolean>(false);

  // Horizontal scroll tracking and arrow controls for Tools navigation bar
  const navScrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkNavScroll = useCallback(() => {
    const el = navScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;
    checkNavScroll();
    el.addEventListener('scroll', checkNavScroll, { passive: true });
    window.addEventListener('resize', checkNavScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', checkNavScroll);
      window.removeEventListener('resize', checkNavScroll);
    };
  }, [checkNavScroll, activeTool]);

  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      navScrollRef.current.scrollBy({
        left: direction === 'left' ? -220 : 220,
        behavior: 'smooth',
      });
    }
  };

  const visibleSubtabs = React.useMemo(() => {
    if (selectedCategory === 'All') return TOOL_SUBTABS;
    return TOOL_SUBTABS.filter((t) => t.category === selectedCategory || t.id === 'launcher');
  }, [selectedCategory]);

  useEffect(() => {
    const unsub = bluetoothService.subscribe(setBtState);
    return unsub;
  }, []);

  const handleScanBluetooth = async () => {
    setBtLoading(true);
    try {
      await bluetoothService.connectDevice();
    } catch {
      // handled in service
    } finally {
      setBtLoading(false);
    }
  };

  useEffect(() => {
    const handleSubtool = (e: any) => {
      if (e.detail?.tool) {
        let t = e.detail.tool;
        if (t === 'learning' || t === 'gesture_lab' || t === 'gestures' || t === 'gesture_training') {
          t = 'gesture_learning';
        }
        if (
          t === 'news' ||
          t === 'chronicle' ||
          t === 'daily_chronicle' ||
          t === 'gazette' ||
          t === 'newspaper'
        ) {
          setActiveTool('news');
          return;
        }
        if (
          t === 'security' ||
          t === 'security_lock' ||
          t === 'app_lock' ||
          t === 'lock' ||
          t === 'biometric' ||
          t === 'passkey'
        ) {
          setActiveTool('security_lock');
          return;
        }
        if (
          t === 'laws_constitution' ||
          t === 'laws' ||
          t === 'law' ||
          t === 'constitution' ||
          t === 'legal' ||
          t === 'bns' ||
          t === 'bns_codes' ||
          t === 'indian_law'
        ) {
          setActiveTool('laws_constitution');
          return;
        }
        if (
          t === 'emoji_kitchen' ||
          t === 'emojikitchen' ||
          t === 'kitchen' ||
          t === 'emoji' ||
          t === 'emoji_mix'
        ) {
          setActiveTool('emoji_kitchen');
          return;
        }
        if (
          t === 'clock' ||
          t === 'world_clock' ||
          t === 'stopwatch' ||
          t === 'timer' ||
          t === 'alarm'
        ) {
          setActiveTool('clock');
          return;
        }
        if (
          t === 'stark_ai' ||
          t === 'ai_matrix' ||
          t === 'ai' ||
          t === 'sentinel' ||
          t === 'edith' ||
          t === 'call_screening'
        ) {
          setActiveTool('stark_ai');
          return;
        }
        if (
          t === 'astronomy' ||
          t === 'solar_system' ||
          t === 'solar' ||
          t === 'space' ||
          t === 'planets' ||
          t === 'nasa'
        ) {
          setActiveTool('astronomy');
          return;
        }
        if (t === 'radar_tracker' || t === 'radar' || t === 'internet_tracker' || t === 'cyber_radar') {
          if (sessionStorage.getItem('gkedit_cyber_radar_unlocked') === 'true') {
            setActiveTool('radar_tracker');
          } else {
            setShowRadarUnlockModal(true);
          }
          return;
        }
        if (
          t === 'more' ||
          t === 'workspaces' ||
          t === 'subtabs' ||
          t === 'sub_sub_tabs' ||
          t === 'subsubtabs'
        ) {
          setActiveTool('more');
          return;
        }
        setActiveTool(t as ActiveTool);
      }
    };
    window.addEventListener('gkedit:open_subtool', handleSubtool);
    return () => window.removeEventListener('gkedit:open_subtool', handleSubtool);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-14 sm:pt-16 pb-28 space-y-5">
      {/* Top Subtab Navigation Pills: "All Tools", "More", "Study (PDF Audio)", & "Settings" */}
      <div className="flex items-center justify-between gap-3 border-b border-cyan-500/20 pb-3 flex-wrap">
        <div className="flex items-center gap-2 p-1 rounded-full bg-[#020617]/90 border border-slate-800/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(2,6,23,0.8)] overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTool('launcher')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTool !== 'settings' && activeTool !== 'more' && activeTool !== 'study'
                ? 'border-2 border-cyan-400 text-cyan-200 bg-cyan-500/20 shadow-[0_0_15px_rgba(0,240,255,0.4)] font-bold'
                : 'bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>All Tools</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('more')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTool === 'more'
                ? 'border-2 border-cyan-400 text-cyan-200 bg-cyan-500/20 shadow-[0_0_18px_rgba(6,182,212,0.5)] font-bold'
                : 'bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span className={activeTool === 'more' ? 'text-cyan-100 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : ''}>
              More
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('study')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTool === 'study'
                ? 'border-2 border-emerald-400 text-emerald-200 bg-emerald-500/20 shadow-[0_0_18px_rgba(16,185,129,0.5)] font-bold'
                : 'bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
            <span className={activeTool === 'study' ? 'text-emerald-100 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]' : ''}>
              Study (PDF Audio)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTool === 'settings'
                ? 'border-2 border-cyan-400 text-cyan-200 bg-cyan-500/20 shadow-[0_0_18px_rgba(0,240,255,0.6)] font-bold'
                : 'bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-300" />
            <span className={activeTool === 'settings' ? 'text-cyan-100 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : ''}>
              Settings
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>GKEDIT AI Matrix</span>
        </div>
      </div>

      {activeTool === 'settings' ? (
        <GkSettingsSubtab onNavigateToTools={() => setActiveTool('launcher')} />
      ) : activeTool === 'more' || activeTool === 'study' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setActiveTool('launcher')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer text-xs font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Tools Launcher</span>
            </button>
          </div>
          <ToolsMoreWorkspace
            initialSubTabId={activeTool === 'study' ? 'study' : undefined}
            onNavigateToTab={(tab) => {
              window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab } }));
            }}
            onOpenTool={(toolId) => setActiveTool(toolId as ActiveTool)}
          />
        </div>
      ) : (
        <>
          {/* Search Bar - Fixed at top matching reference mockup */}
          <div className="relative w-full">
        <div className="relative flex items-center bg-[#040e24]/90 border border-cyan-400/35 rounded-full px-4 py-2.5 shadow-[0_4px_20px_rgba(2,6,23,0.7)] backdrop-blur-xl focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition liquid-glass-card">
          <Search className="w-4 h-4 text-cyan-400 mr-2.5 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search AI Tools & Devices..."
            className="w-full bg-transparent border-0 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Logical Sub-Categories Filter Row: All | Media | Dev | Utility | Science | Security */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scrollbar-none py-1">
        {TOOL_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          const count =
            cat.id === 'All'
              ? TOOL_SUBTABS.filter((t) => t.id !== 'launcher' && t.id !== 'menu').length
              : TOOL_SUBTABS.filter((t) => t.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none active:scale-95 ${
                isSelected
                  ? cat.accentColor
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
              }`}
              title={cat.desc}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected
                    ? `${cat.badgeBg} ${cat.badgeText} border ${cat.badgeBorder}`
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Liquid Glass Sub-Navigation Carousel with all Subtabs */}
      <div className="w-full relative group">
        {/* Left / Right Gradient Fade Mask cues */}
        {canScrollLeft && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#030712] via-[#030712]/90 to-transparent z-20 rounded-l-full" />
        )}
        {canScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#030712] via-[#030712]/90 to-transparent z-20 rounded-r-full" />
        )}

        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollNav('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 hover:text-white flex items-center justify-center shadow-lg backdrop-blur-md transition active:scale-90 cursor-pointer"
            title="Scroll Left"
            aria-label="Scroll Subtabs Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollNav('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 hover:text-white flex items-center justify-center shadow-lg backdrop-blur-md transition active:scale-90 cursor-pointer"
            title="Scroll Right"
            aria-label="Scroll Subtabs Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <div ref={navScrollRef} className="w-full overflow-x-auto no-scrollbar scrollbar-none py-1">
          <LiquidGlassNav
            activeId={
              activeTool === 'solar_system'
                ? 'astronomy'
                : activeTool === 'learning'
                ? 'gesture_learning'
                : activeTool === 'biolab'
                ? 'biogame'
                : activeTool
            }
            className="liquid-glass-nav-scrollable flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-1.5 px-2 touch-pan-x flex-nowrap shrink-0 border border-white/10 rounded-full"
          >
            {visibleSubtabs.map((subtab) => {
              const Icon = subtab.icon;
              const isActive =
                activeTool === subtab.id ||
                (subtab.id === 'astronomy' && activeTool === 'solar_system') ||
                (subtab.id === 'gesture_learning' && activeTool === 'learning') ||
                (subtab.id === 'biogame' && activeTool === 'biolab');

              return (
                <button
                  key={subtab.id}
                  data-nav-id={subtab.id}
                  onClick={() => {
                    if (subtab.id === 'radar_tracker') {
                      if (sessionStorage.getItem('gkedit_cyber_radar_unlocked') === 'true') {
                        setActiveTool('radar_tracker');
                      } else {
                        setShowRadarUnlockModal(true);
                      }
                      return;
                    }
                    setActiveTool(subtab.id);
                  }}
                  className={`liquid-nav-btn px-3 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 transition shrink-0 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-cyan-200 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.4)] bg-cyan-500/15'
                      : 'bg-transparent border-transparent text-slate-300 hover:text-cyan-300 hover:bg-white/5'
                  }`}
                  title={subtab.desc}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : subtab.color}`} />
                  <span>{subtab.label}</span>
                  {subtab.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                      {subtab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </LiquidGlassNav>
        </div>
      </div>

      {/* Search Results Filter (if query is typed) */}
      {searchQuery.trim() !== '' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Matching tools for "{searchQuery}":</span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TOOL_SUBTABS.filter(
              (t) =>
                t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.category.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id);
                    setSearchQuery('');
                  }}
                  className="p-4 rounded-2xl bg-[#040e24]/90 border border-cyan-500/30 hover:border-cyan-400 cursor-pointer transition flex items-center justify-between group liquid-glass-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition">
                        {tool.label}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{tool.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Header bar if in a sub-tool */}
      {activeTool !== 'launcher' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => { setActiveTool('launcher'); setToolsSubTab('launcher'); }}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-[background-color,color] duration-150 shrink-0 cursor-pointer"
                title="Back to Launcher"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white flex items-center gap-2 truncate">
                  <span className="truncate">
                    {activeTool === 'gk_learning'
                      ? 'GK LEARNING · 2-MINUTE INTERACTIVE LANGUAGE ENGINE'
                      : activeTool === 'news' || activeTool === 'chronicle'
                      ? 'THE DAILY CHRONICLE · GAZETTE & INTELLIGENCE DISPATCH'
                      : activeTool === 'camera'
                      ? 'REAL CAMERA · HARDWARE VIEWFINDER'
                      : activeTool === 'vision'
                      ? 'VISION STUDIO · GOOGLE LENS & VISUAL SEARCH'
                      : activeTool === 'gallery'
                      ? 'COLOROS 17 FLUID GALLERY · CLOUD VAULT'
                      : activeTool === 'laws_constitution'
                      ? 'LAWS & CONSTITUTION · భారత రాజ్యాంగం'
                      : activeTool === 'clock'
                      ? 'CHRONO · WORLD CLOCK & TIMERS'
                      : activeTool === 'emoji_kitchen'
                      ? 'EMOJI KITCHEN · AI STICKER MASHUP'
                      : activeTool === 'stark_ai'
                      ? 'STARK AI MATRIX · SUITE & CALL SENTINEL'
                      : activeTool === 'device'
                      ? 'HOME DEVICE · BLUETOOTH & SENSORS'
                      : activeTool === 'menu'
                      ? 'GKEDIT Smart Tools'
                      : activeTool === 'astronomy' || activeTool === 'solar_system'
                      ? 'ASTRONOMY · SOLAR SYSTEM EXPLORER'
                      : activeTool === 'radar_tracker'
                      ? 'CYBER RADAR SIGNAL FINDER'
                      : activeTool === 'gesture_learning' || activeTool === 'learning'
                      ? 'GESTURE LEARNING LAB & BUILDER'
                      : activeTool === 'tts'
                      ? 'TEXT TO SPEECH · AI VOICE STUDIO'
                      : activeTool === 'bioscience'
                      ? 'BIOSCIENCE OBSERVABLE LEARNING LAB'
                      : activeTool === 'biogame' || activeTool === 'biolab'
                      ? '3D BIO-GAME (CRISPR SIMULATION)'
                      : activeTool === 'palm_share'
                      ? 'HUAWEI PALM SHARE · AIR GESTURE P2P'
                      : activeTool === 'dialer'
                      ? 'GKEDIT DIALER'
                      : activeTool === 'inditrack'
                      ? 'INDITRACK LIVE'
                      : activeTool === 'gesture_analytics'
                      ? 'HAND GESTURE & AIR KEYBOARD ANALYTICS'
                      : activeTool === 'weather'
                      ? 'WEATHER MAP & CYCLONE RADAR · SATELLITE ENGINE'
                      : activeTool === 'security_lock'
                      ? 'SECURITY & APP LOCK · BIOMETRIC MATRIX'
                      : activeTool.toUpperCase()}
                  </span>
                </h1>
                <p className="text-xs text-slate-400 line-clamp-1 sm:line-clamp-none">
                  {activeTool === 'gk_learning'
                    ? 'Master English, Telugu & Hindi with ultra-fast 2-minute interactive challenges, streak rewards & 5:00 PM routine by @GKEDIT2141'
                    : activeTool === 'news' || activeTool === 'chronicle'
                    ? 'Vintage ink-printed dispatches for Khammam, Telangana, India & global horizons with newsdata.io integration'
                    : activeTool === 'security_lock'
                    ? 'Dynamic Island morphing pill, WebAuthn fingerprint scanner, 3D Face ID, passwordless mode & master passkey gate'
                    : activeTool === 'camera'
                    ? 'Real-time camera viewfinder, mechanical shutter click, 0.5x–10x zoom, FLIR thermal filters, and 100K matrix reconstruction'
                    : activeTool === 'vision'
                    ? 'Multimodal object identification, Google Lens visual search, barcode and product detection, specimen scanning, and price analysis'
                    : activeTool === 'gallery'
                    ? 'Zero-device cloud pipeline, 10 TB Master / 512 GB Free Cloud Vault, ColorOS AI Eraser 2.0 & Smart Matting'
                    : activeTool === 'laws_constitution'
                    ? 'Constitutional Articles, BNS 2023 criminal codes, IT Act, Zero FIR rights & remedies in English and Telugu'
                    : activeTool === 'weather'
                    ? 'Esri World Satellite basemap, CartoDB boundary overlays, RainViewer real-time radar timeline loop, cyclone tracking & Open-Meteo stats'
                    : activeTool === 'clock'
                    ? 'Precision analog world clock, active alarms with chime alerts, 1/100s split stopwatch & countdown timer'
                    : activeTool === 'emoji_kitchen'
                    ? 'Mix any two emojis into Google Emoji Kitchen PNG stickers with 1-tap clipboard copy'
                    : activeTool === 'stark_ai'
                    ? 'Autonomous Sub-AIs, Call Screening Firewall, and Motherly Care Controls'
                    : activeTool === 'device'
                    ? 'Manage real Bluetooth peripherals, GATT 0x180F telemetry, torch and hardware sensors'
                    : activeTool === 'menu'
                    ? 'High-productivity utilities, Bluetooth peripherals and hardware controls'
                    : activeTool === 'astronomy' || activeTool === 'solar_system'
                    ? '100% offline interactive 2D orbital canvas, Keplerian mechanics & deep space NASA mission dossiers'
                    : activeTool === 'radar_tracker'
                    ? 'Camera-free 360° radar sweep, gyroscope room compass, dynamic network blips & Sonar/Geiger acoustic telemetry'
                    : activeTool === 'gesture_learning' || activeTool === 'learning'
                    ? 'Fast training drills, MediaPipe 21-landmark biomechanics, and custom gesture builder'
                    : 'Tap back to return'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Launcher Overview Mode (Exact 2x2 Grid + Bluetooth Card from reference mockup) */}
      {activeTool === 'launcher' && (
        <div className="space-y-6">
          {/* 2x2 Sub-Tabs Grid matching mockup */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Card 1: 3D Bio-Lab */}
            <div
              onClick={() => setActiveTool('bioscience')}
              className="p-4 sm:p-5 rounded-3xl bg-[#041029]/85 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition cursor-pointer group liquid-glass-card"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                  <Microscope className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-cyan-300 transition">
                  3D Bio-Lab
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2">
                Interactive DNA & Virus Simulations
              </p>
            </div>

            {/* Card 2: AI Vision */}
            <div
              onClick={() => setActiveTool('vision')}
              className="p-4 sm:p-5 rounded-3xl bg-[#041029]/85 border border-blue-500/30 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition cursor-pointer group liquid-glass-card"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-blue-300 transition">
                  AI Vision
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2">
                Real-time OCR & Scene Analysis
              </p>
            </div>

            {/* Card 3: Creative Suite */}
            <div
              onClick={() => {
                window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'generators' } }));
              }}
              className="p-4 sm:p-5 rounded-3xl bg-[#140b2a]/85 border border-purple-500/30 hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition cursor-pointer group liquid-glass-card"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-purple-300 transition">
                  Creative Suite
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2">
                Creative Suite & Media Suite
              </p>
            </div>

            {/* Card 4: Media Suite */}
            <div
              onClick={() => setActiveTool('tts')}
              className="p-4 sm:p-5 rounded-3xl bg-[#1a0822]/85 border border-pink-500/30 hover:border-pink-400 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition cursor-pointer group liquid-glass-card"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center">
                  <Volume2 className="w-4 h-4 text-pink-400" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-pink-300 transition">
                  Media Suite
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2">
                Video Scripts & Audio Studios
              </p>
            </div>
          </div>

          {/* Sub-Category Tool Shelf (shows tools filtered by selected category) */}
          {selectedCategory !== 'All' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span>{selectedCategory} Tools</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-slate-400">
                    {TOOL_SUBTABS.filter((t) => t.category === selectedCategory).length}
                  </span>
                </span>
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-xs text-cyan-400 hover:underline cursor-pointer"
                >
                  Show All Tools
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TOOL_SUBTABS.filter((t) => t.category === selectedCategory).map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <div
                      key={tool.id}
                      onClick={() => {
                        if (tool.id === 'radar_tracker') {
                          if (sessionStorage.getItem('gkedit_cyber_radar_unlocked') === 'true') {
                            setActiveTool('radar_tracker');
                          } else {
                            setShowRadarUnlockModal(true);
                          }
                          return;
                        }
                        setActiveTool(tool.id);
                      }}
                      className="p-4 rounded-2xl bg-[#040e24]/90 border border-white/10 hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] cursor-pointer transition flex items-center justify-between group liquid-glass-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                          <Icon className={`w-5 h-5 ${tool.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition">
                              {tool.label}
                            </h4>
                            {tool.badge && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{tool.desc}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Featured Highlight 0: 18-in-1 Sub-Sub-Tabs Workstations Hub */}
              <div
                onClick={() => setActiveTool('more')}
                className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#07132e]/90 to-cyan-950/40 border border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] transition cursor-pointer group liquid-glass-card flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition">
                    <LayoutGrid className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                        18-IN-1 · WORKSTATIONS
                      </span>
                      <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" /> Core AI, Dev Sandbox & Smartwatch
                      </span>
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-amber-300 transition mt-0.5">
                      More Tools & Sub-Sub-Tabs Workspace
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-1">
                      Multi-Model Selector, AI Agent Builder, Code Sandbox, File Vision, Voice Control, Theme Studio & Laxafit Smartwatch Sync
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition shrink-0" />
              </div>

              {/* Featured Highlight 1: GK Learning 2-Minute Language Engine */}
              <div
                onClick={() => setActiveTool('gk_learning')}
                className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#061816]/90 to-teal-950/40 border border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition cursor-pointer group liquid-glass-card flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition">
                    <Languages className="w-6 h-6 text-emerald-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                        NEW · GK LEARNING
                      </span>
                      <span className="text-[10px] text-amber-300 font-mono flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" /> 2-Min Daily · 5:00 PM
                      </span>
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-emerald-300 transition mt-0.5">
                      GK Learning · Fast Interactive Language Engine
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-1">
                      English, Telugu (తెలుగు) & Hindi (हिंदी) Duolingo-style micro lessons, pronunciation audio & streak rewards by @GKEDIT2141
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition shrink-0" />
              </div>

              {/* Featured Highlight 2: The Daily Chronicle news spotlight card */}
              <div
                onClick={() => setActiveTool('news')}
                className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#0e1628]/85 to-amber-950/30 border border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] transition cursor-pointer group liquid-glass-card flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
                    <Newspaper className="w-6 h-6 text-amber-300 group-hover:scale-110 transition" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                        NEW · DAILY CHRONICLE
                      </span>
                      <span className="text-[10px] text-slate-400">Khammam & Telangana Dispatches</span>
                    </div>
                    <h3 className="font-serif font-bold text-sm sm:text-base text-amber-100 group-hover:text-amber-300 transition mt-0.5">
                      The Daily Chronicle · Vintage Gazette & News Engine
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1">
                      Ink-printed book chapters, Telugu & English summaries, audio reader & newsdata.io API parser
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition shrink-0" />
              </div>
            </div>
          )}

          {/* Bluetooth Peripheral Manager Card matching reference mockup */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#040e24]/90 border border-cyan-500/35 shadow-[0_10px_35px_rgba(2,6,23,0.8)] liquid-glass-card space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0">
                  <Bluetooth className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Bluetooth Peripheral Manager
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect real earbuds, smartwatch, or accessories via Web Bluetooth API.
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-400/40 text-cyan-300">
                  GATT 0x180F
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>API Supported</span>
                </span>
              </div>
            </div>

            {/* Real Peripheral Status Info */}
            {btState.connectedDevice ? (
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-emerald-200 block">{btState.connectedDevice.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Battery: {btState.connectedDevice.batteryLevel !== null ? `${btState.connectedDevice.batteryLevel}%` : 'Connected'}
                  </span>
                </div>
                <button
                  onClick={() => bluetoothService.disconnectDevice()}
                  className="px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-bold hover:bg-red-900 cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-400">
                No Bluetooth Peripheral Connected · Ready to pair real wireless hardware.
              </div>
            )}

            {/* Liquid Action Button */}
            <button
              type="button"
              onClick={handleScanBluetooth}
              disabled={btLoading}
              className="w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 hover:from-cyan-300 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {btLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Scanning Devices...</span>
                </>
              ) : (
                <>
                  <Bluetooth className="w-4 h-4 text-slate-950" />
                  <span>Scan & Connect Peripheral</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Access to Security Lock Tool */}
          <div
            onClick={() => setActiveTool('security_lock')}
            className="p-4 rounded-3xl bg-[#030d22]/90 border border-cyan-500/25 hover:border-cyan-400 flex items-center justify-between cursor-pointer liquid-glass-card transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition">
                  Security & App Lock
                </h4>
                <p className="text-xs text-slate-400">
                  Dynamic Island capsule, WebAuthn biometrics & passkey protection
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition" />
          </div>

          {/* Categorized Tools Grid matching user selection: Media, Dev, Utility, Science, Security */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  {selectedCategory === 'All' ? 'Categorized Tools & Modules' : `${selectedCategory} Tools`}
                </h3>
              </div>
              <span className="text-[11px] font-mono text-cyan-400">
                {TOOL_SUBTABS.filter((t) => (selectedCategory === 'All' ? t.id !== 'launcher' && t.id !== 'menu' : t.category === selectedCategory)).length} tools
              </span>
            </div>

            {selectedCategory === 'All' ? (
              <div className="space-y-6">
                {(['Media', 'Dev', 'Utility', 'Science', 'Security'] as ToolCategory[]).map((catName) => {
                  const catInfo = TOOL_CATEGORIES.find((c) => c.id === catName);
                  const items = TOOL_SUBTABS.filter((t) => t.category === catName);
                  if (!items.length) return null;
                  const CatIcon = catInfo?.icon || Sparkles;

                  return (
                    <div key={catName} className="space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <CatIcon className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                            {catName}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCategory(catName)}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer font-mono"
                        >
                          View all ({items.length}) →
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                if (item.id === 'radar_tracker' && !isRadarUnlocked) {
                                  setShowRadarUnlockModal(true);
                                } else {
                                  setActiveTool(item.id);
                                }
                              }}
                              className="p-3 rounded-2xl bg-[#040e24]/80 border border-white/10 hover:border-cyan-400/60 hover:bg-[#061838] transition text-left group liquid-glass-card cursor-pointer"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="w-7 h-7 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-300">
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                {item.badge && (
                                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <h5 className="text-xs font-bold text-white group-hover:text-cyan-300 transition truncate">
                                {item.label}
                              </h5>
                              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                {item.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TOOL_SUBTABS.filter((t) => t.category === selectedCategory).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.id === 'radar_tracker' && !isRadarUnlocked) {
                          setShowRadarUnlockModal(true);
                        } else {
                          setActiveTool(item.id);
                        }
                      }}
                      className="p-4 rounded-2xl bg-[#040e24]/90 border border-cyan-500/30 hover:border-cyan-400 transition text-left flex items-start justify-between group liquid-glass-card cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition">
                              {item.label}
                            </h4>
                            {item.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition shrink-0 mt-2" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid or Sub-Tool */}
      {activeTool === 'menu' && (
        <ToolsMenu
          onSelectTool={setActiveTool}
          isRadarUnlocked={isRadarUnlocked}
          onRequestUnlock={() => setShowRadarUnlockModal(true)}
        />
      )}
      {activeTool === 'gk_learning' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-72 gap-3 text-emerald-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-semibold">Opening GK Learning 2-Minute Engine...</span>
            </div>
          }
        >
          <GKLearningTool
            onBack={() => setActiveTool('launcher')}
            onNavigateToChat={(prompt) => {
              window.dispatchEvent(new CustomEvent('gkedit:fill_chat_prompt', { detail: { prompt } }));
              window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'chat' } }));
            }}
          />
        </Suspense>
      )}
      {(activeTool === 'news' || activeTool === 'chronicle') && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-72 gap-3 text-amber-300">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <span className="text-xs font-semibold">Pressing The Daily Chronicle Dispatches...</span>
            </div>
          }
        >
          <DailyChronicleNewsTool onBack={() => setActiveTool('launcher')} />
        </Suspense>
      )}
      {activeTool === 'security_lock' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-72 gap-3 text-cyan-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-semibold">Opening Security & App Lock Matrix...</span>
            </div>
          }
        >
          <SecurityAppLockTool onBack={() => setActiveTool('menu')} />
        </Suspense>
      )}
      {activeTool === 'camera' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-72 gap-3 text-cyan-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-semibold">Starting Real Hardware Camera Viewfinder...</span>
            </div>
          }
        >
          <RealCameraSubtab
            onNavigateToChat={(prompt) => {
              window.dispatchEvent(new CustomEvent('gkedit:fill_chat_prompt', { detail: { prompt } }));
              window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'chat' } }));
            }}
          />
        </Suspense>
      )}
      {activeTool === 'vision' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-72 gap-3 text-cyan-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-semibold">Loading Vision Studio & Google Lens...</span>
            </div>
          }
        >
          <VisionStudio
            onNavigateToChat={(prompt) => {
              if (prompt) {
                window.dispatchEvent(new CustomEvent('gkedit:fill_chat_prompt', { detail: { prompt } }));
              }
              window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'chat' } }));
            }}
          />
        </Suspense>
      )}
      {activeTool === 'gallery' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-72 gap-3 text-[#00E5FF]">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-semibold">Opening ColorOS 17 Fluid Gallery & Cloud Vault...</span>
            </div>
          }
        >
          <ColorOsGallerySubtab
            onNavigateToChat={(prompt) => {
              if (prompt) {
                window.dispatchEvent(new CustomEvent('gkedit:fill_chat_prompt', { detail: { prompt } }));
              }
              window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'chat' } }));
            }}
            onOpenCamera={() => setActiveTool('camera')}
          />
        </Suspense>
      )}
      {activeTool === 'laws_constitution' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-56 gap-3 text-amber-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Opening Laws & Constitution Guide...</span>
            </div>
          }
        >
          <LawsConstitutionTool onBack={() => setActiveTool('menu')} />
        </Suspense>
      )}
      {activeTool === 'clock' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-56 gap-3 text-cyan-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Loading GKEDIT Chrono Clock Suite...</span>
            </div>
          }
        >
          <ClockTool onBack={() => setActiveTool('menu')} />
        </Suspense>
      )}
      {activeTool === 'emoji_kitchen' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-56 gap-3 text-amber-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Baking Google Emoji Kitchen Lab...</span>
            </div>
          }
        >
          <EmojiKitchenTool onBack={() => setActiveTool('menu')} />
        </Suspense>
      )}
      {activeTool === 'stark_ai' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-purple-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Loading Stark AI Matrix & Call Sentinel...</span>
            </div>
          }
        >
          <StarkAiMatrixTool onOpenDialer={() => setActiveTool('dialer')} />
        </Suspense>
      )}
      {activeTool === 'inditrack' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-cyan-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Loading IndiTrack Live...</span>
            </div>
          }
        >
          <IndiTrackLive />
        </Suspense>
      )}
      {activeTool === 'dialer' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-cyan-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Loading GKEDIT Dialer...</span>
            </div>
          }
        >
          <GkeditDialer onBack={() => setActiveTool('menu')} />
        </Suspense>
      )}
      {activeTool === 'reminder' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-cyan-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Loading J.A.R.V.I.S Reminders...</span>
            </div>
          }
        >
          <ReminderTool />
        </Suspense>
      )}
      {activeTool === 'calendar' && <CalendarTool />}
      {activeTool === 'weather' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-80 gap-3 text-cyan-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-semibold">Streaming Satellite & Cyclone Radar Layers...</span>
            </div>
          }
        >
          <WeatherRadarMapTool />
        </Suspense>
      )}
      {activeTool === 'calculator' && <CalculatorTool />}
      {activeTool === 'app_launcher' && <AppLauncherTool />}
      {activeTool === 'health' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-rose-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Loading Health Tools & Sensors...</span>
            </div>
          }
        >
          <HealthTool />
        </Suspense>
      )}
      {activeTool === 'device' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-cyan-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Loading Device Controls...</span>
            </div>
          }
        >
          <DeviceControlsTool />
        </Suspense>
      )}
      {activeTool === 'palm_share' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-cyan-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Loading Palm Share & P2P Engine...</span>
            </div>
          }
        >
          <PalmShareTool />
        </Suspense>
      )}
      {(activeTool === 'gesture_learning' || activeTool === 'learning') && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-56 gap-3 text-cyan-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Loading Gesture Learning Lab & Builder...</span>
            </div>
          }
        >
          <GestureLearningLab
            onNavigateToChat={(prompt) => {
              if (prompt) {
                window.dispatchEvent(new CustomEvent('gkedit:fill_chat_prompt', { detail: { prompt } }));
              }
              window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'chat' } }));
            }}
          />
        </Suspense>
      )}
      {activeTool === 'gesture_analytics' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-cyan-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Loading Gesture Analytics...</span>
            </div>
          }
        >
          <GestureFrequencyDashboard />
        </Suspense>
      )}
      {activeTool === 'bioscience' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-72 gap-3 text-cyan-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Loading Bioscience Observable Learning Lab...</span>
            </div>
          }
        >
          <BioscienceLabTab
            onAskAiTopic={(topic) => {
              window.dispatchEvent(new CustomEvent('gkedit:fill_chat_prompt', { detail: { prompt: topic } }));
              window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'chat' } }));
            }}
          />
        </Suspense>
      )}
      {(activeTool === 'biogame' || activeTool === 'biolab') && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-72 gap-3 text-cyan-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Loading 3D Bio-Game Simulation...</span>
            </div>
          }
        >
          <BioLab3dGame
            onNavigateToChatWithPrompt={(prompt) => {
              window.dispatchEvent(new CustomEvent('gkedit:fill_chat_prompt', { detail: { prompt } }));
              window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'chat' } }));
            }}
          />
        </Suspense>
      )}
      {activeTool === 'tts' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-72 gap-3 text-cyan-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Loading Text-to-Speech Studio...</span>
            </div>
          }
        >
          <TextToSpeechTool />
        </Suspense>
      )}
      {activeTool === 'radar_tracker' && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-72 gap-3 text-cyan-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Initializing Cyber Radar & Acoustic Sonar...</span>
            </div>
          }
        >
          <CyberRadarSignalFinder
            onBackToTools={() => setActiveTool('menu')}
            onLockRadar={() => {
              sessionStorage.removeItem('gkedit_cyber_radar_unlocked');
              setIsRadarUnlocked(false);
              setActiveTool('menu');
            }}
          />
        </Suspense>
      )}

      {/* Astronomy / Solar System Explorer (Offline Fact-Store & 2D Orbit Canvas) */}
      {(activeTool === 'astronomy' || activeTool === 'solar_system') && (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-72 gap-3 text-amber-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-semibold">Aligning Planetary Orbits & NASA Factsheets...</span>
            </div>
          }
        >
          <SolarSystemExplorer onBackToTools={() => setActiveTool('menu')} />
        </Suspense>
      )}
        </>
      )}

      {/* Cyber Radar PIN Verification Modal */}
      <CyberRadarUnlockModal
        isOpen={showRadarUnlockModal}
        onClose={() => setShowRadarUnlockModal(false)}
        onUnlockSuccess={() => {
          setIsRadarUnlocked(true);
          setActiveTool('radar_tracker');
        }}
      />
    </div>
  );
}

// -------------------------------------------------------------
// TOOLS MENU GRID
// -------------------------------------------------------------
function ToolsMenu({
  onSelectTool,
  isRadarUnlocked,
  onRequestUnlock,
}: {
  onSelectTool: (tool: ActiveTool) => void;
  isRadarUnlocked?: boolean;
  onRequestUnlock?: () => void;
}) {
  const tools = [
    {
      id: 'gk_learning' as ActiveTool,
      name: 'GK Learning (2-Minute Micro Engine)',
      icon: Languages,
      tag: 'ENGLISH · TELUGU · HINDI · 5:00 PM ROUTINE',
      desc: 'Fast, gamified 2-minute daily language learning engine with 4-part micro-learning format: Focus, Context, Quick Challenge, and Streak encouragement by @GKEDIT2141.',
      color: 'from-emerald-500/30 via-teal-600/20 to-lime-700/15 border-emerald-400/50 text-emerald-200',
    },
    {
      id: 'news' as ActiveTool,
      name: 'The Daily Chronicle (Vintage Press)',
      icon: Newspaper,
      tag: 'KHAMMAM & TELANGANA · E-INK · NEWSDATA.IO',
      desc: 'Vintage ink-printed newspaper engine with 3 classic chapters, Telangana & Khammam district dispatches, Telugu/English summaries, audio speech synthesis, and live newsdata.io JSON parser.',
      color: 'from-amber-500/30 via-yellow-600/20 to-orange-700/15 border-amber-400/50 text-amber-200',
    },
    {
      id: 'security_lock' as ActiveTool,
      name: 'Security & App Lock',
      icon: Shield,
      tag: 'DYNAMIC ISLAND · BIOMETRIC · PIN GATE',
      desc: 'Origin OS 6 morphing Dynamic Island pill, WebAuthn fingerprint scanner, neural 3D Face ID, passwordless biometric mode, and master passkey settings.',
      color: 'from-cyan-500/30 via-blue-600/20 to-indigo-700/15 border-cyan-400/50 text-cyan-200',
    },
    {
      id: 'camera' as ActiveTool,
      name: 'Real Camera (Hardware Viewfinder)',
      icon: Camera,
      tag: 'REAL OPTICAL VIEW · FLASH · 10,000x MACRO',
      desc: 'Authentic smartphone camera viewfinder with real-time video stream, mechanical shutter sound, 0.5x–10x zoom, FLIR thermal heatmap, self-timer, and 100K matrix reconstruction.',
      color: 'from-blue-500/30 via-cyan-600/20 to-indigo-700/15 border-cyan-400/50 text-cyan-200',
    },
    {
      id: 'vision' as ActiveTool,
      name: 'Vision Studio & Google Lens',
      icon: Eye,
      tag: 'GOOGLE LENS · VISUAL SEARCH · MULTIMODAL',
      desc: 'Multimodal object identification, Google Lens visual search, barcode and product recognition, specimen inspection, and price analysis.',
      color: 'from-cyan-500/30 via-blue-600/20 to-indigo-700/15 border-cyan-400/50 text-cyan-200',
    },
    {
      id: 'gallery' as ActiveTool,
      name: 'ColorOS 17 Fluid Gallery & Cloud Vault',
      icon: ImageIcon,
      tag: 'AQUAMORPHIC · 10 TB MASTER VAULT · AI STUDIO',
      desc: 'Zero-device cloud pipeline with instant streaming, 10 TB Creator Vault / 512 GB Free Cloud, ColorOS AI Eraser 2.0, 1-Tap Cutout, and 32K Clarity Enhancer.',
      color: 'from-[#00E5FF]/25 via-cyan-600/20 to-blue-700/15 border-[#00E5FF]/50 text-cyan-200',
    },
    {
      id: 'laws_constitution' as ActiveTool,
      name: 'Laws & Constitution (భారత రాజ్యాంగం & చట్టాలు)',
      icon: Scale,
      tag: 'CONSTITUTION · BNS 2023 · TELUGU & ENGLISH',
      desc: 'Indian Constitutional Articles, 5 Supreme Court Writs, Bharatiya Nyaya Sanhita (BNS 2023), cyber fraud 1930 recovery, Zero FIR rights, and legal complaint drafts.',
      color: 'from-amber-500/30 via-yellow-600/20 to-orange-700/15 border-amber-400/50 text-amber-200',
    },
    {
      id: 'clock' as ActiveTool,
      name: 'Clock Suite (Chrono)',
      icon: ClockIcon,
      tag: 'World Clock · Alarm · Stopwatch · Timer',
      desc: 'Interactive luxury analog clock, time zone converter (IST, UTC, EST, GMT), customizable alarms with synthesized audio alerts, 1/100s precision lap stopwatch, and visual countdown timer.',
      color: 'from-cyan-500/25 via-blue-600/15 to-indigo-700/10 border-cyan-400/50 text-cyan-200',
    },
    {
      id: 'emoji_kitchen' as ActiveTool,
      name: 'Emoji Kitchen (Sticker Mix)',
      icon: ChefHat,
      tag: 'GOOGLE STICKER CDN · 1-TAP COPY',
      desc: 'Mix two emojis into authentic Google Emoji Kitchen PNG stickers. 1-tap copy directly into WhatsApp, Telegram, Discord, or download HD transparent PNG art.',
      color: 'from-amber-500/25 via-pink-600/20 to-purple-700/15 border-amber-400/50 text-amber-200',
    },
    {
      id: 'stark_ai' as ActiveTool,
      name: 'STARK AI Matrix & Call Sentinel',
      icon: Bot,
      tag: 'Jarvis · Friday · Edith · Ultron · Vision · Motherly Care',
      desc: 'Central command for 6 autonomous AIs, EDITH call screening firewall for every number, motherly care personality toggle for Creator, battery saver, data saver & reply speed turbo.',
      color: 'from-purple-500/30 via-indigo-600/20 to-pink-700/15 border-purple-400/60 text-purple-200',
    },
    {
      id: 'astronomy' as ActiveTool,
      name: 'Astronomy (Solar System)',
      icon: Orbit,
      tag: 'NASA Factsheets · 2D Orbit',
      desc: '100% offline interactive 2D orbital animation canvas, 8 planets + Sun & Pluto, Keplerian relative speeds, NASA Mission Dossiers & physical metrics.',
      color: 'from-amber-500/25 via-indigo-600/15 to-purple-700/10 border-amber-400/50 text-amber-200',
    },
    {
      id: 'radar_tracker' as ActiveTool,
      name: 'Home Internet Tracker (Cyber Radar)',
      icon: Radio,
      tag: isRadarUnlocked ? 'UNLOCKED · CAMERA-FREE' : 'PIN "GKEDIT" · LOCKED',
      desc: 'Camera-free Sci-Fi 360° radar sweep, gyroscope room compass, dynamic network signal blips, Sonar/Geiger acoustic feedback & ranked room mapping.',
      color: 'from-cyan-500/25 via-emerald-600/15 to-blue-700/10 border-cyan-400/50 text-cyan-200',
    },
    {
      id: 'bioscience' as ActiveTool,
      name: 'Bioscience Lab (Study)',
      icon: Microscope,
      tag: 'Scientific Observation',
      desc: 'Interactive 3D biological inspection: DNA with A-T/G-C base pairs, cell organelles, virus structure, protein folding & process playback (Mitosis, Replication, Transcription). NOT a game.',
      color: 'from-emerald-500/25 via-teal-600/15 to-blue-700/10 border-emerald-400/40 text-emerald-200',
    },
    {
      id: 'biogame' as ActiveTool,
      name: '3D Bio-Game (Arcade)',
      icon: Gamepad2,
      tag: 'Three.js · CRISPR Sim',
      desc: 'Separate 3D molecular arcade game: repair mutated nucleotide nodes with CRISPR precision, earn combos & level up',
      color: 'from-cyan-500/25 via-blue-600/15 to-indigo-700/10 border-cyan-400/40 text-cyan-200',
    },
    {
      id: 'tts' as ActiveTool,
      name: 'Text to Speech',
      icon: Volume2,
      tag: 'Gemini Voice Studio',
      desc: 'Multilingual AI voice synthesis (gemini-3.8-flash-tts) with Kore, Puck, Zephyr voices & audio downloads',
      color: 'from-amber-500/25 via-cyan-600/15 to-blue-700/10 border-amber-400/40 text-amber-200',
    },
    {
      id: 'palm_share' as ActiveTool,
      name: 'Palm Share',
      icon: Hand,
      tag: 'Air Gesture · P2P',
      desc: 'Huawei Air Gesture photo transfer: Grab photos into the Dynamic Island and beam to another device',
      color: 'from-purple-500/25 via-pink-600/15 to-cyan-600/10 border-purple-400/40 text-purple-200',
    },
    {
      id: 'gesture_learning' as ActiveTool,
      name: 'Gesture Learning & Builder',
      icon: Hand,
      tag: 'Fast Training · Custom Gestures',
      desc: 'Master hand gestures with high-speed reflex drills, 21-landmark joint biomechanics, and build & train custom hand gestures with live action triggers',
      color: 'from-emerald-500/25 via-teal-600/15 to-cyan-700/10 border-emerald-400/40 text-emerald-200',
    },
    {
      id: 'inditrack' as ActiveTool,
      name: 'IndiTrack Live',
      icon: Radio,
      tag: 'Indian HLR & GPS',
      desc: 'Simulated Indian phone circle lookup (+91 series) & live browser GPS device tracking',
      color: 'from-cyan-500/25 via-blue-600/15 to-indigo-700/10 border-cyan-400/40 text-cyan-200',
    },
    {
      id: 'dialer' as ActiveTool,
      name: 'AI Dialer (GKEDIT)',
      icon: PhoneCall,
      tag: 'HyperOS 4 · AI Voice',
      desc: 'Liquid glass AI screening dialer, T9 search, WebRTC VoIP & cellular fallback',
      color: 'from-emerald-500/25 via-cyan-600/15 to-blue-700/10 border-emerald-400/40 text-emerald-200',
    },
    {
      id: 'reminder' as ActiveTool,
      name: 'J.A.R.V.I.S Reminders',
      icon: Bell,
      tag: 'Voice & Alarms',
      desc: 'Set voice & text timers, speech reminders, and recurring daily alerts',
      color: 'from-cyan-500/25 via-blue-600/15 to-indigo-600/10 border-cyan-400/40 text-cyan-200',
    },
    {
      id: 'calendar' as ActiveTool,
      name: 'Smart Calendar',
      icon: CalendarIcon,
      tag: 'AI Day Planner',
      desc: 'Month schedule, event reminders & AI itinerary generator',
      color: 'from-blue-600/20 via-cyan-500/10 to-indigo-600/10 border-cyan-500/35 text-cyan-300',
    },
    {
      id: 'weather' as ActiveTool,
      name: 'Weather Map & Cyclone Radar',
      icon: CloudSun,
      tag: 'ESRI SATELLITE · RAINVIEWER · CYCLONE TRACK',
      desc: 'High-resolution Esri satellite imagery, CartoDB boundary overlays, RainViewer real-time animated radar timeline player (600ms loop), cyclone corridor tracking & Open-Meteo live weather.',
      color: 'from-cyan-500/30 via-blue-600/20 to-sky-700/15 border-cyan-400/50 text-cyan-200',
    },
    {
      id: 'calculator' as ActiveTool,
      name: 'Scientific Math',
      icon: CalcIcon,
      tag: 'Gemini Solver',
      desc: 'Scientific calculator & step-by-step word problem AI solver',
      color: 'from-blue-500/20 via-indigo-500/10 to-cyan-500/10 border-blue-400/35 text-blue-300',
    },
    {
      id: 'app_launcher' as ActiveTool,
      name: 'App Launcher',
      icon: ExternalLink,
      tag: 'Deep Links',
      desc: 'Launch WhatsApp, YouTube, Maps, Spotify with web fallbacks',
      color: 'from-sky-500/20 via-cyan-600/10 to-blue-600/10 border-sky-400/35 text-sky-300',
    },
    {
      id: 'health' as ActiveTool,
      name: 'Health & Wellness',
      icon: HeartPulse,
      tag: 'Fingerprint & AI',
      desc: 'Fingerprint health scanner, AI symptom assistant, pulse & BMI calculator',
      color: 'from-cyan-600/20 via-blue-700/10 to-indigo-600/10 border-cyan-500/35 text-cyan-300',
    },
    {
      id: 'gesture_analytics' as ActiveTool,
      name: 'Air Keyboard Analytics',
      icon: Hand,
      tag: 'MediaPipe Vision',
      desc: 'Frequency analysis of hand gestures, common triggers & air-typing keystroke metrics',
      color: 'from-cyan-500/25 via-teal-600/15 to-blue-700/10 border-cyan-400/40 text-cyan-200',
    },
    {
      id: 'device' as ActiveTool,
      name: 'Home Device & Bluetooth',
      icon: Bluetooth,
      tag: 'GATT 0x180F · Hardware',
      desc: 'Pair real Bluetooth earbuds, smartwatch, or accessories (live 0x180F battery), rear torch, & GPS sensor',
      color: 'from-cyan-500/25 via-blue-600/15 to-indigo-700/10 border-cyan-400/40 text-cyan-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isLockedTracker = tool.id === 'radar_tracker' && !isRadarUnlocked;
        return (
          <button
            key={tool.id}
            onClick={() => {
              if (isLockedTracker) {
                onRequestUnlock?.();
              } else {
                onSelectTool(tool.id);
              }
            }}
            className={`group text-left p-5 rounded-3xl bg-gradient-to-br ${tool.color} bg-[#040e24]/90 border backdrop-blur-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all hover:border-cyan-400`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-center shadow-inner">
                <Icon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                isLockedTracker
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950/60 border-white/10'
              }`}>
                {isLockedTracker && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                <span>{tool.tag}</span>
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-amber-200 transition">
              {tool.name}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {tool.desc}
            </p>
          </button>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------
// 1. CALENDAR TOOL
// -------------------------------------------------------------
interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  reminder: boolean;
}

function CalendarTool() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('gkedit_calendar_events');
    return saved ? JSON.parse(saved) : [];
  });
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventTime, setNewEventTime] = useState('10:00');
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    localStorage.setItem('gkedit_calendar_events', JSON.stringify(events));
  }, [events]);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    const item: CalendarEvent = {
      id: 'evt_' + Date.now(),
      title: newEventTitle.trim(),
      date: newEventDate,
      time: newEventTime,
      reminder: true,
    };
    setEvents([...events, item]);
    setNewEventTitle('');
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
  };

  const handleAskAiPlan = async () => {
    setLoadingPlan(true);
    setAiPlan(null);
    try {
      const res = await api.planDay('High retention video editing sprint, algorithm optimization, and exercise', newEventDate);
      setAiPlan(res.plan);
    } catch (err: any) {
      setAiPlan('Could not generate plan. Please try again.');
    } finally {
      setLoadingPlan(false);
    }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  return (
    <div className="space-y-6">
      {/* Month Navigator */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 font-medium"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>

        {/* Month Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={'empty-' + i} className="p-2 opacity-20 text-slate-600">-</div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const hasEvents = events.some((e) => e.date === dayStr);
            const isToday = dayStr === new Date().toISOString().split('T')[0];

            return (
              <button
                key={'day-' + dayNum}
                onClick={() => setNewEventDate(dayStr)}
                className={`p-2 rounded-xl transition font-medium relative ${
                  newEventDate === dayStr
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : isToday
                    ? 'border border-cyan-400 text-cyan-300'
                    : 'text-slate-300 hover:bg-blue-950'
                }`}
              >
                <span>{dayNum}</span>
                {hasEvents && (
                  <span className={`block w-1 h-1 rounded-full mx-auto mt-0.5 ${newEventDate === dayStr ? 'bg-slate-950' : 'bg-cyan-400'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Event & AI Planner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Event Form */}
        <form onSubmit={handleAddEvent} className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Add Event for {newEventDate}</span>
          </h3>
          <input
            type="text"
            required
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            placeholder="e.g. Upload YouTube Short @GKEDIT2141"
            className="w-full bg-[#030818] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              className="bg-[#030818] border border-cyan-500/30 rounded-xl px-2 py-1.5 text-xs text-slate-300"
            />
            <input
              type="time"
              value={newEventTime}
              onChange={(e) => setNewEventTime(e.target.value)}
              className="bg-[#030818] border border-cyan-500/30 rounded-xl px-2 py-1.5 text-xs text-slate-300"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 text-slate-950 font-bold text-xs transition shadow-[0_0_12px_rgba(6,182,212,0.3)]"
          >
            Save Event
          </button>
        </form>

        {/* AI Day Planner Button */}
        <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Ask AI to Plan My Day</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              GKEDIT AI analyzes your day and creates an optimal hour-by-hour workflow with energy management and editing blocks.
            </p>
          </div>
          <button
            onClick={handleAskAiPlan}
            disabled={loadingPlan}
            className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.35)] transition disabled:opacity-50"
          >
            {loadingPlan ? 'Generating Schedule...' : 'Plan My Day with Gemini'}
          </button>
        </div>
      </div>

      {/* AI Plan Result */}
      {aiPlan && (
        <div className="p-5 rounded-3xl bg-[#030818] border border-cyan-500/35 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed shadow-lg">
          <h4 className="font-bold text-cyan-300 text-sm mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI Suggested Schedule for {newEventDate}</span>
          </h4>
          {aiPlan}
        </div>
      )}

      {/* Existing Events List */}
      <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 space-y-2">
        <h3 className="text-sm font-bold text-white">Events Scheduled ({events.length})</h3>
        {events.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No events saved yet.</p>
        ) : (
          <div className="divide-y divide-cyan-500/20">
            {events.map((evt) => (
              <div key={evt.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-200">{evt.title}</p>
                  <p className="text-[11px] text-cyan-400/70">{evt.date} at {evt.time}</p>
                </div>
                <button
                  onClick={() => handleDeleteEvent(evt.id)}
                  className="text-slate-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. WEATHER TOOL (Open-Meteo API, no key needed)
// -------------------------------------------------------------
function WeatherTool() {
  const [city, setCity] = useState('Hyderabad');
  const [weatherData, setWeatherData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherByCoords = async (lat: number, lon: number, cityName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather service unavailable');
      const data = await res.json();
      data.cityName = cityName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      setWeatherData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Geocode city using Open-Meteo Geocoding API (free, no key)
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`City "${city}" not found`);
      }
      const { latitude, longitude, name, country } = geoData.results[0];
      await fetchWeatherByCoords(latitude, longitude, `${name}, ${country || ''}`);
    } catch (err: any) {
      setError(err.message || 'City search failed');
      setLoading(false);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by browser');
      return;
    }
    setError(null);
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, 'My Current Location');
      },
      (err) => {
        setLoading(false);
        setError('Location permission was denied. Please search your city manually.');
      }
    );
  };

  useEffect(() => {
    // Initial fetch for Hyderabad
    fetchWeatherByCoords(17.385, 78.4867, 'Hyderabad, India');
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <form onSubmit={handleSearchCity} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Search city (e.g. Hyderabad, Mumbai, London)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleUseLocation}
          className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
          title="Use GPS Location"
        >
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">GPS</span>
        </button>
      </form>

      {error && (
        <div className="p-3 rounded-2xl bg-red-950/60 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {weatherData && (
        <div className="space-y-4">
          {/* Current Temperature Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-950/60 via-slate-900 to-slate-950 border border-blue-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-blue-300 font-bold uppercase tracking-wider">{weatherData.cityName}</p>
              <h2 className="text-4xl sm:text-5xl font-black text-white mt-1">
                {Math.round(weatherData.current?.temperature_2m)}°C
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Feels like {Math.round(weatherData.current?.apparent_temperature)}°C • Wind: {weatherData.current?.wind_speed_10m} km/h • Humidity: {weatherData.current?.relative_humidity_2m}%
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center text-blue-300">
              <CloudSun className="w-10 h-10" />
            </div>
          </div>

          {/* 7-Day Forecast */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">7-Day Forecast (Open-Meteo)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center text-xs">
              {weatherData.daily?.time?.slice(0, 7).map((d: string, idx: number) => (
                <div key={d} className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {new Date(d).toLocaleDateString(undefined, { weekday: 'short' })}
                  </p>
                  <CloudSun className="w-4 h-4 mx-auto text-amber-300" />
                  <p className="font-bold text-white">
                    {Math.round(weatherData.daily.temperature_2m_max[idx])}°
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {Math.round(weatherData.daily.temperature_2m_min[idx])}°
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 3. CALCULATOR TOOL (Basic, Scientific & Step-by-Step AI Solver)
// -------------------------------------------------------------
function CalculatorTool() {
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState<string[]>([]);
  const [mode, setMode] = useState<'basic' | 'scientific'>('basic');
  const [mathProblem, setMathProblem] = useState('');
  const [aiSolution, setAiSolution] = useState<string | null>(null);
  const [solving, setSolving] = useState(false);

  const handleInput = (val: string) => {
    if (display === '0' && val !== '.') {
      setDisplay(val);
    } else {
      setDisplay(display + val);
    }
  };

  const handleClear = () => {
    setDisplay('0');
  };

  const handleBackspace = () => {
    if (display.length <= 1) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleEvaluate = () => {
    try {
      // Safe math evaluation with sanitization
      const sanitized = display.replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**');
      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${sanitized})`)();
      setHistory([`${display} = ${result}`, ...history.slice(0, 9)]);
      setDisplay(String(result));
    } catch {
      setDisplay('Error');
    }
  };

  const handleSci = (fn: string) => {
    try {
      const num = parseFloat(display);
      let res = 0;
      if (fn === 'sin') res = Math.sin(num);
      if (fn === 'cos') res = Math.cos(num);
      if (fn === 'tan') res = Math.tan(num);
      if (fn === 'sqrt') res = Math.sqrt(num);
      if (fn === 'log') res = Math.log10(num);
      setDisplay(String(res));
    } catch {
      setDisplay('Error');
    }
  };

  const handleSolveWordProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mathProblem.trim()) return;
    setSolving(true);
    setAiSolution(null);
    try {
      const res = await api.solveMath(mathProblem);
      setAiSolution(res.solution);
    } catch (err: any) {
      setAiSolution('Could not solve problem. Please check internet connection.');
    } finally {
      setSolving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setMode('basic')}
            className={`px-3 py-1 rounded-lg font-bold ${mode === 'basic' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
          >
            Basic
          </button>
          <button
            onClick={() => setMode('scientific')}
            className={`px-3 py-1 rounded-lg font-bold ${mode === 'scientific' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
          >
            Scientific
          </button>
        </div>
      </div>

      {/* Calculator Body */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl max-w-sm mx-auto space-y-3">
        {/* Screen */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-right overflow-x-auto">
          <p className="text-2xl font-mono font-bold text-white tracking-wider">{display}</p>
        </div>

        {/* Scientific Row if active */}
        {mode === 'scientific' && (
          <div className="grid grid-cols-5 gap-1.5 text-xs font-mono">
            <button onClick={() => handleSci('sin')} className="p-2 rounded-xl bg-slate-800 text-amber-300">sin</button>
            <button onClick={() => handleSci('cos')} className="p-2 rounded-xl bg-slate-800 text-amber-300">cos</button>
            <button onClick={() => handleSci('tan')} className="p-2 rounded-xl bg-slate-800 text-amber-300">tan</button>
            <button onClick={() => handleSci('sqrt')} className="p-2 rounded-xl bg-slate-800 text-amber-300">√</button>
            <button onClick={() => handleSci('log')} className="p-2 rounded-xl bg-slate-800 text-amber-300">log</button>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-1.5 text-sm font-semibold">
          <button onClick={handleClear} className="p-3 rounded-xl bg-red-950/40 text-red-400 border border-red-500/30">C</button>
          <button onClick={handleBackspace} className="p-3 rounded-xl bg-slate-800 text-slate-300">⌫</button>
          <button onClick={() => handleInput('%')} className="p-3 rounded-xl bg-slate-800 text-slate-300">%</button>
          <button onClick={() => handleInput('÷')} className="p-3 rounded-xl bg-amber-500/20 text-amber-300">÷</button>

          <button onClick={() => handleInput('7')} className="p-3 rounded-xl bg-slate-950 text-white">7</button>
          <button onClick={() => handleInput('8')} className="p-3 rounded-xl bg-slate-950 text-white">8</button>
          <button onClick={() => handleInput('9')} className="p-3 rounded-xl bg-slate-950 text-white">9</button>
          <button onClick={() => handleInput('×')} className="p-3 rounded-xl bg-amber-500/20 text-amber-300">×</button>

          <button onClick={() => handleInput('4')} className="p-3 rounded-xl bg-slate-950 text-white">4</button>
          <button onClick={() => handleInput('5')} className="p-3 rounded-xl bg-slate-950 text-white">5</button>
          <button onClick={() => handleInput('6')} className="p-3 rounded-xl bg-slate-950 text-white">6</button>
          <button onClick={() => handleInput('-')} className="p-3 rounded-xl bg-amber-500/20 text-amber-300">-</button>

          <button onClick={() => handleInput('1')} className="p-3 rounded-xl bg-slate-950 text-white">1</button>
          <button onClick={() => handleInput('2')} className="p-3 rounded-xl bg-slate-950 text-white">2</button>
          <button onClick={() => handleInput('3')} className="p-3 rounded-xl bg-slate-950 text-white">3</button>
          <button onClick={() => handleInput('+')} className="p-3 rounded-xl bg-amber-500/20 text-amber-300">+</button>

          <button onClick={() => handleInput('0')} className="p-3 rounded-xl bg-slate-950 text-white col-span-2">0</button>
          <button onClick={() => handleInput('.')} className="p-3 rounded-xl bg-slate-950 text-white">.</button>
          <button onClick={handleEvaluate} className="p-3 rounded-xl bg-amber-500 text-slate-950 font-bold">=</button>
        </div>
      </div>

      {/* Gemini Step-by-Step Word Problem Solver */}
      <form onSubmit={handleSolveWordProblem} className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Solve Math Word Problem with Gemini</span>
        </h3>
        <textarea
          rows={3}
          value={mathProblem}
          onChange={(e) => setMathProblem(e.target.value)}
          placeholder="e.g. A YouTube video has 12,000 views growing by 15% each week. When will it hit 50,000 views?"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={solving || !mathProblem.trim()}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50"
        >
          {solving ? 'Solving Step-by-Step...' : 'Solve with AI'}
        </button>
      </form>

      {aiSolution && (
        <div className="p-5 rounded-3xl bg-slate-950 border border-amber-500/30 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed shadow-lg">
          <h4 className="font-bold text-amber-400 text-sm mb-2">Step-by-Step Solution</h4>
          {aiSolution}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 4. APP LAUNCHER TOOL (Deep links + Web Fallback)
// -------------------------------------------------------------
interface LauncherApp {
  name: string;
  scheme: string;
  webUrl: string;
  category: string;
  iconBg: string;
}

const SUPPORTED_APPS: LauncherApp[] = [
  { name: 'YouTube', scheme: 'vnd.youtube://', webUrl: 'https://youtube.com', category: 'Video', iconBg: 'bg-red-600' },
  { name: 'WhatsApp', scheme: 'whatsapp://', webUrl: 'https://web.whatsapp.com', category: 'Chat', iconBg: 'bg-emerald-600' },
  { name: 'Instagram', scheme: 'instagram://', webUrl: 'https://instagram.com', category: 'Social', iconBg: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600' },
  { name: 'Maps', scheme: 'geo:0,0?q=', webUrl: 'https://maps.google.com', category: 'Navigation', iconBg: 'bg-blue-600' },
  { name: 'Gmail', scheme: 'mailto:', webUrl: 'https://mail.google.com', category: 'Mail', iconBg: 'bg-red-500' },
  { name: 'Telegram', scheme: 'tg://', webUrl: 'https://web.telegram.org', category: 'Chat', iconBg: 'bg-sky-500' },
  { name: 'Spotify', scheme: 'spotify://', webUrl: 'https://open.spotify.com', category: 'Music', iconBg: 'bg-emerald-500' },
  { name: 'Chrome', scheme: 'googlechrome://', webUrl: 'https://google.com', category: 'Browser', iconBg: 'bg-amber-600' },
  { name: 'Play Store', scheme: 'market://', webUrl: 'https://play.google.com', category: 'Apps', iconBg: 'bg-cyan-600' },
  { name: 'Phone Dialer', scheme: 'tel:', webUrl: 'tel:', category: 'Utility', iconBg: 'bg-green-600' },
  { name: 'SMS', scheme: 'sms:', webUrl: 'sms:', category: 'Utility', iconBg: 'bg-indigo-600' },
];

export function launchApp(appName: string) {
  const target = SUPPORTED_APPS.find((a) => a.name.toLowerCase().includes(appName.toLowerCase()));
  if (!target) return false;

  // Attempt deep link, fallback to webUrl
  const start = Date.now();
  window.location.href = target.scheme;
  setTimeout(() => {
    if (Date.now() - start < 1500) {
      window.open(target.webUrl, '_blank');
    }
  }, 800);
  return true;
}

function AppLauncherTool() {
  const [search, setSearch] = useState('');

  const filtered = SUPPORTED_APPS.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
        <strong>Browser Sandbox Notice:</strong> Web applications cannot scan or force-open arbitrary installed apps on your device. We use standard mobile URI schemes with automatic web fallbacks for the verified apps below. You can also type <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">open YouTube</code> directly in the GKEDIT AI chat!
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter apps..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map((app) => (
          <button
            key={app.name}
            onClick={() => launchApp(app.name)}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 text-left transition flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${app.iconBg} flex items-center justify-center text-white font-bold text-xs shadow-md`}>
                {app.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-white text-xs">{app.name}</p>
                <p className="text-[10px] text-slate-500">{app.category}</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
