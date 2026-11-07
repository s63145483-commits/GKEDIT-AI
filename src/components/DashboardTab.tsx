import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Microscope,
  Camera,
  Wrench,
  Cpu,
  Settings,
  Sparkles,
  LogIn,
  Clock,
  Compass,
  Sliders,
  Maximize2,
  Minimize2,
  Move,
  Plus,
  Trash2,
  RotateCcw,
  Volume2,
  Check,
  ChevronRight,
  Flame,
  ShieldCheck,
  ExternalLink,
  Layers,
  Palette,
  Eye,
  Activity,
  Dna,
  Zap,
  MapPin,
  Train,
  Heart,
  Mic,
  Bluetooth,
  SlidersHorizontal,
  Film,
  BookOpen,
} from 'lucide-react';
import { ActiveTab } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { WaterWallpaper } from './WaterWallpaper.tsx';
import { LiquidGlassNav } from './LiquidGlassNav.tsx';

export type IconShape =
  | 'squircle'
  | 'circle'
  | 'teardrop'
  | 'hexagon'
  | 'diamond'
  | 'pebble'
  | 'capsule';

export type IconStyle =
  | 'neon_glass'
  | 'minimalist'
  | 'frosted'
  | 'cyber_glow';

export type WidgetSize = '1x1' | '2x1' | '1x2' | '2x2';

export interface DashboardShortcutItem {
  id: string;
  tabId: ActiveTab | 'voice' | 'creatorhub';
  label: string;
  subtitle: string;
  iconName: string;
  size: WidgetSize;
  colorScheme: string; // e.g. 'cyan', 'blue', 'emerald', 'violet', 'amber'
  enabled: boolean;
}

interface DashboardTabProps {
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAuth: () => void;
  onOpenVoice: () => void;
  onOpenCreatorHub: () => void;
  onOpenNexusSettings?: () => void;
}

const DEFAULT_SHORTCUTS: DashboardShortcutItem[] = [
  {
    id: 'sc_chat',
    tabId: 'chat',
    label: 'Chat',
    subtitle: 'GKEDIT AI Copilot',
    iconName: 'MessageSquare',
    size: '2x1',
    colorScheme: 'cyan',
    enabled: true,
  },
  {
    id: 'sc_biolab',
    tabId: 'biolab',
    label: 'Bio-Lab',
    subtitle: '3D Observable Science',
    iconName: 'Microscope',
    size: '2x2',
    colorScheme: 'emerald',
    enabled: true,
  },
  {
    id: 'sc_camera',
    tabId: 'camera',
    label: 'Camera',
    subtitle: 'Real Camera & Macro',
    iconName: 'Camera',
    size: '1x1',
    colorScheme: 'blue',
    enabled: true,
  },
  {
    id: 'sc_tools',
    tabId: 'tools',
    label: 'Home Device',
    subtitle: 'Bluetooth & Hardware',
    iconName: 'Bluetooth',
    size: '1x1',
    colorScheme: 'cyan',
    enabled: true,
  },
  {
    id: 'sc_generators',
    tabId: 'generators',
    label: 'Media',
    subtitle: 'Generators Studio',
    iconName: 'Cpu',
    size: '2x1',
    colorScheme: 'amber',
    enabled: true,
  },
  {
    id: 'sc_showcase',
    tabId: 'showcase',
    label: 'Video Showcase',
    subtitle: 'GK EDIT Masterclasses',
    iconName: 'Film',
    size: '2x1',
    colorScheme: 'red',
    enabled: true,
  },
  {
    id: 'sc_bookview',
    tabId: 'bookview',
    label: 'Constitution',
    subtitle: 'Law Codex & BNS',
    iconName: 'BookOpen',
    size: '1x1',
    colorScheme: 'amber',
    enabled: true,
  },
  {
    id: 'sc_settings',
    tabId: 'settings',
    label: 'Settings',
    subtitle: 'System & Models',
    iconName: 'Settings',
    size: '1x1',
    colorScheme: 'cyan',
    enabled: true,
  },
  {
    id: 'sc_maps',
    tabId: 'maps',
    label: 'Maps',
    subtitle: 'Leaflet Geospatial',
    iconName: 'MapPin',
    size: '1x1',
    colorScheme: 'emerald',
    enabled: true,
  },
  {
    id: 'sc_inditrack',
    tabId: 'inditrack',
    label: 'IndiTrack',
    subtitle: 'Live Railway Radar',
    iconName: 'Train',
    size: '1x1',
    colorScheme: 'blue',
    enabled: true,
  },
  {
    id: 'sc_devotional',
    tabId: 'devotional',
    label: 'Bhakti',
    subtitle: 'Mala & Mantras',
    iconName: 'Heart',
    size: '1x1',
    colorScheme: 'amber',
    enabled: true,
  },
  {
    id: 'sc_voice',
    tabId: 'voice',
    label: 'Live Voice',
    subtitle: 'Instant Conversational',
    iconName: 'Mic',
    size: '1x1',
    colorScheme: 'violet',
    enabled: true,
  },
];

export function DashboardTab({
  onNavigateTab,
  onOpenAuth,
  onOpenVoice,
  onOpenCreatorHub,
  onOpenNexusSettings,
}: DashboardTabProps) {
  const { user } = useAuth();

  // OriginOS 6 Customization State (Stored in localStorage)
  const [iconShape, setIconShape] = useState<IconShape>(() => {
    try {
      return (localStorage.getItem('gkedit_origin_icon_shape') as IconShape) || 'squircle';
    } catch {
      return 'squircle';
    }
  });

  const [iconStyle, setIconStyle] = useState<IconStyle>(() => {
    try {
      return (localStorage.getItem('gkedit_origin_icon_style') as IconStyle) || 'neon_glass';
    } catch {
      return 'neon_glass';
    }
  });

  const [iconCornerRadius, setIconCornerRadius] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('gkedit_origin_corner_radius');
      return saved ? parseInt(saved, 10) : 22;
    } catch {
      return 22;
    }
  });

  const [showLabels, setShowLabels] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('gkedit_origin_show_labels');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const [shortcuts, setShortcuts] = useState<DashboardShortcutItem[]>(() => {
    try {
      const saved = localStorage.getItem('gkedit_origin_shortcuts');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse origin shortcuts', e);
    }
    return DEFAULT_SHORTCUTS;
  });

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedGrid, setSelectedGrid] = useState<string>(() => {
    try {
      return localStorage.getItem('gkedit_origin_selected_grid') || '2x2';
    } catch {
      return '2x2';
    }
  });

  const handleSelectGrid = (grid: string) => {
    setSelectedGrid(grid);
    try {
      localStorage.setItem('gkedit_origin_selected_grid', grid);
    } catch {}
  };

  const [activeTabDrawer, setActiveTabDrawer] = useState<'shapes' | 'styles' | 'widgets' | 'items'>('shapes');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [greetingGreeting, setGreetingGreeting] = useState<string>('Welcome');

  // Long-press timer for OriginOS home screen edit mode trigger
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Live time ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );

      const hour = now.getHours();
      if (hour < 12) setGreetingGreeting('Good morning');
      else if (hour < 17) setGreetingGreeting('Good afternoon');
      else setGreetingGreeting('Good evening');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save changes to localStorage
  const saveShortcuts = (items: DashboardShortcutItem[]) => {
    setShortcuts(items);
    try {
      localStorage.setItem('gkedit_origin_shortcuts', JSON.stringify(items));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSetIconShape = (shape: IconShape) => {
    setIconShape(shape);
    try {
      localStorage.setItem('gkedit_origin_icon_shape', shape);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSetIconStyle = (style: IconStyle) => {
    setIconStyle(style);
    try {
      localStorage.setItem('gkedit_origin_icon_style', style);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSetCornerRadius = (val: number) => {
    setIconCornerRadius(val);
    try {
      localStorage.setItem('gkedit_origin_corner_radius', val.toString());
    } catch (e) {
      console.warn(e);
    }
  };

  const handleToggleLabels = () => {
    setShowLabels((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gkedit_origin_show_labels', next.toString());
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  const handleResetDefaults = () => {
    saveShortcuts(DEFAULT_SHORTCUTS);
    handleSetIconShape('squircle');
    handleSetIconStyle('neon_glass');
    handleSetCornerRadius(22);
    setShowLabels(true);
  };

  const handleShortcutClick = (item: DashboardShortcutItem) => {
    if (isEditMode) return;
    if (item.tabId === 'voice') {
      onOpenVoice();
    } else if (item.tabId === 'creatorhub') {
      onOpenCreatorHub();
    } else {
      onNavigateTab(item.tabId);
    }
  };

  // Long press detection for OriginOS edit mode
  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setIsEditMode(true);
    }, 550);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  // Resize shortcut on the grid (1x1 -> 2x1 -> 2x2 -> 1x1)
  const cycleWidgetSize = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSizeMap: Record<WidgetSize, WidgetSize> = {
      '1x1': '2x1',
      '2x1': '2x2',
      '2x2': '1x1',
      '1x2': '1x1',
    };
    const updated = shortcuts.map((s) => (s.id === id ? { ...s, size: nextSizeMap[s.size] || '1x1' } : s));
    saveShortcuts(updated);
  };

  // Move item in order
  const moveItem = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= shortcuts.length) return;
    const newItems = [...shortcuts];
    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;
    saveShortcuts(newItems);
  };

  // Toggle enable/disable
  const toggleItemEnabled = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = shortcuts.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    saveShortcuts(updated);
  };

  // Render Icon according to string name
  const renderIcon = (name: string, className: string = 'w-5 h-5') => {
    switch (name) {
      case 'MessageSquare':
        return <MessageSquare className={className} />;
      case 'Microscope':
        return <Microscope className={className} />;
      case 'Camera':
        return <Camera className={className} />;
      case 'Wrench':
        return <Wrench className={className} />;
      case 'Cpu':
        return <Cpu className={className} />;
      case 'Settings':
        return <Settings className={className} />;
      case 'MapPin':
        return <MapPin className={className} />;
      case 'Train':
        return <Train className={className} />;
      case 'Heart':
        return <Heart className={className} />;
      case 'Mic':
        return <Mic className={className} />;
      case 'Bluetooth':
        return <Bluetooth className={className} />;
      case 'Film':
        return <Film className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  // Shape style class generator
  const getShapeClasses = (shape: IconShape, customRadius: number) => {
    switch (shape) {
      case 'circle':
        return 'rounded-full';
      case 'teardrop':
        return 'rounded-2xl rounded-tr-none';
      case 'diamond':
        return 'rounded-xl rotate-45';
      case 'pebble':
        return 'rounded-[40%_60%_70%_30%/40%_40%_60%_60%]';
      case 'capsule':
        return 'rounded-3xl';
      case 'hexagon':
        return 'rounded-xl [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]';
      case 'squircle':
      default:
        return 'rounded-[24px]';
    }
  };

  // Icon visual styling classes
  const getStyleClasses = (style: IconStyle, colorScheme: string) => {
    const isCyan = colorScheme === 'cyan';
    const isEmerald = colorScheme === 'emerald';
    const isBlue = colorScheme === 'blue';
    const isViolet = colorScheme === 'violet';
    const isAmber = colorScheme === 'amber';

    switch (style) {
      case 'minimalist':
        return 'bg-slate-900/80 border border-slate-700/60 text-slate-200 hover:border-cyan-400/60';
      case 'frosted':
        return 'bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-[0_8px_32px_rgba(0,0,0,0.37)]';
      case 'cyber_glow':
        if (isEmerald) return 'bg-[#031c16]/90 border border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.45)]';
        if (isViolet) return 'bg-[#180a2a]/90 border border-violet-400 text-violet-300 shadow-[0_0_20px_rgba(167,139,250,0.45)]';
        if (isAmber) return 'bg-[#211403]/90 border border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.45)]';
        if (isBlue) return 'bg-[#04122d]/90 border border-blue-400 text-blue-300 shadow-[0_0_20px_rgba(96,165,250,0.45)]';
        return 'bg-[#031525]/90 border border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.45)]';
      case 'neon_glass':
      default:
        if (isEmerald)
          return 'bg-gradient-to-br from-emerald-500/25 via-teal-950/80 to-[#021310] border border-emerald-400/40 text-emerald-300 shadow-[0_4px_24px_rgba(16,185,129,0.25)]';
        if (isViolet)
          return 'bg-gradient-to-br from-violet-500/25 via-indigo-950/80 to-[#0c041a] border border-violet-400/40 text-violet-300 shadow-[0_4px_24px_rgba(139,92,246,0.25)]';
        if (isAmber)
          return 'bg-gradient-to-br from-amber-500/25 via-yellow-950/80 to-[#180e03] border border-amber-400/40 text-amber-300 shadow-[0_4px_24px_rgba(245,158,11,0.25)]';
        if (isBlue)
          return 'bg-gradient-to-br from-blue-500/25 via-indigo-950/80 to-[#030e24] border border-blue-400/40 text-blue-300 shadow-[0_4px_24px_rgba(59,130,246,0.25)]';
        return 'bg-gradient-to-br from-cyan-500/25 via-blue-950/80 to-[#020b1e] border border-cyan-400/40 text-cyan-300 shadow-[0_4px_24px_rgba(6,182,212,0.25)]';
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-130px)] w-full overflow-hidden flex flex-col items-center">
      {/* 1. Interactive Fluid Water Wallpaper Background */}
      <WaterWallpaper className="z-0" />

      {/* Main Container with clearance for floating side button */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-3 sm:px-6 pt-14 sm:pt-16 pb-32 flex flex-col gap-5">
        {/* Top Floating OriginOS Status Bar */}
        <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-cyan-300 font-bold tracking-wider">ORIGIN OS 6</span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">Liquid Glass Engine</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-lg cursor-pointer ${
                isEditMode
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/40 scale-105'
                  : 'bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200'
              }`}
              title="Toggle OriginOS Icon & Widget Customizer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isEditMode ? 'Done Editing' : 'Customize Layout'}</span>
            </button>
          </div>
        </div>

        {/* 2. Futuristic Hero Section & Featured AI Creative Card */}
        <div className="relative w-full space-y-4">
          {/* Main Glass Hero Card */}
          <div className="relative w-full rounded-[28px] sm:rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-[#061438]/90 via-[#030d26]/85 to-[#020718]/95 border border-cyan-400/35 shadow-[0_12px_40px_rgba(2,6,23,0.85),0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-2xl overflow-hidden transition-all duration-300 group">
            {/* Ambient Refraction Glows */}
            <div className="absolute -top-28 -right-28 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/30 transition-all duration-700" />
            <div className="absolute -bottom-28 -left-28 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Hero Content */}
              <div className="flex-1 space-y-3">
                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                    <Sparkles className="w-3 h-3 text-cyan-300 animate-spin" style={{ animationDuration: '6s' }} />
                    NEXT-GEN INTELLIGENCE
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {currentTime} • {currentDate}
                  </span>
                </div>

                {/* Hero Title & Signature Subtitle */}
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">
                    GKEDIT AI
                  </h1>
                  <p className="text-sm sm:text-base font-bold tracking-wide mt-1.5 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-violet-400">
                    Create • Edit • Transform
                  </p>
                </div>

                {/* Description / User Greeting */}
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  {user
                    ? `${greetingGreeting}, ${user.name}! Your workspace is active with Gemini 2.5 multimodal intelligence, real-time 3D CRISPR gene simulations, and high-velocity creative generators.`
                    : 'Your elite personal AI workstation. Explore interactive 3D bioscience, code synthesis, creative video editing scripts, and multimodal intelligence.'}
                </p>

                {/* Customise Grid Pills matching reference mockup */}
                <div className="pt-2 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Customise Grid
                  </span>
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2 max-w-sm">
                    {['1x2', '2x2', '2x3', '3x3', '2x4', '4x4'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleSelectGrid(g)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition border cursor-pointer ${
                          selectedGrid === g
                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigateTab('chat')}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 text-xs font-bold transition hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Launch Chat Copilot</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenVoice}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400 text-violet-200 text-xs font-bold transition hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                  >
                    <Mic className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                    <span>Live Voice</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Quick Status / Capabilities Pill */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 lg:w-56 shrink-0">
                <div
                  onClick={() => onNavigateTab('biolab')}
                  className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 transition cursor-pointer group/card"
                >
                  <div className="flex items-center gap-2">
                    <Microscope className="w-4 h-4 text-emerald-400 group-hover/card:scale-110 transition" />
                    <span className="text-xs font-bold text-white">3D Bio-Lab</span>
                  </div>
                  <p className="text-[10px] text-emerald-300/80 mt-1">Interactive DNA & Virus Simulations</p>
                </div>

                <div
                  onClick={() => onNavigateTab('camera')}
                  className="p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-400/30 transition cursor-pointer group/card"
                >
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-400 group-hover/card:scale-110 transition" />
                    <span className="text-xs font-bold text-white">AI Vision</span>
                  </div>
                  <p className="text-[10px] text-blue-300/80 mt-1">Real-time OCR & Scene Analysis</p>
                </div>

                <div
                  onClick={() => onNavigateTab('generators')}
                  className="p-3 rounded-2xl bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-400/30 transition cursor-pointer group/card"
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-fuchsia-400 group-hover/card:scale-110 transition" />
                    <span className="text-xs font-bold text-white">Media Suite</span>
                  </div>
                  <p className="text-[10px] text-fuchsia-300/80 mt-1">Video Scripts & Audio Studios</p>
                </div>
              </div>
            </div>
          </div>

          {/* Featured AI Creative Card */}
          <div className="relative w-full rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-cyan-950/40 via-violet-950/40 to-blue-950/40 border border-cyan-400/30 shadow-[0_8px_24px_rgba(2,6,23,0.7)] backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-400 to-violet-500 p-0.5 shadow-[0_0_16px_rgba(6,182,212,0.4)] shrink-0">
                <div className="w-full h-full rounded-[14px] bg-[#03091e] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-cyan-300" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                    ✦ FEATURED AI CREATIVE SUITE
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span className="text-[10px] text-slate-400">Gemini 2.5 Flash</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
                  Multimodal Neural Engine & Real-time Synthesis
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                  Translate mRNA codons, generate video scripts, render 3D molecular structures, and chat with Google Search grounding.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => onNavigateTab('chat')}
                className="px-3.5 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-bold transition active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.25)]"
              >
                Prompt Now →
              </button>
            </div>
          </div>
        </div>

        {/* Edit Mode Notification Banner */}
        {isEditMode && (
          <div className="w-full p-3 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-[0_0_25px_rgba(245,158,11,0.2)] animate-pulse">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="font-bold">OriginOS Edit Mode Active:</span>
              <span className="hidden sm:inline">Tap widget resize buttons (1x1, 2x1, 2x2) or customize icon shapes below.</span>
            </div>
            <button
              onClick={() => setIsEditMode(false)}
              className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 transition shrink-0"
            >
              Done
            </button>
          </div>
        )}

        {/* 3. Vivo OriginOS 6 / Oppo ColorOS Interactive Grid Launcher */}
        <div className="w-full">
          <div className={`grid ${
            selectedGrid === '1x2'
              ? 'grid-cols-1 sm:grid-cols-2'
              : selectedGrid === '2x2'
              ? 'grid-cols-2'
              : selectedGrid === '2x3' || selectedGrid === '3x3'
              ? 'grid-cols-2 sm:grid-cols-3'
              : 'grid-cols-2 sm:grid-cols-4'
          } gap-3.5 sm:gap-4 auto-rows-min transition-all duration-300`}>
            {shortcuts
              .filter((item) => item.enabled || isEditMode)
              .map((item, index) => {
                const shapeClass = getShapeClasses(iconShape, iconCornerRadius);
                const styleClass = getStyleClasses(iconStyle, item.colorScheme);

                // Grid span classes based on size
                let colSpan = 'col-span-1';
                let rowSpan = 'row-span-1 min-h-[105px]';

                if (item.size === '2x1') {
                  colSpan = 'col-span-2';
                  rowSpan = 'row-span-1 min-h-[105px]';
                } else if (item.size === '2x2') {
                  colSpan = 'col-span-2';
                  rowSpan = 'row-span-2 min-h-[225px]';
                } else if (item.size === '1x2') {
                  colSpan = 'col-span-1';
                  rowSpan = 'row-span-2 min-h-[225px]';
                }

                return (
                  <div
                    key={item.id}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleTouchStart}
                    onMouseUp={handleTouchEnd}
                    onClick={() => handleShortcutClick(item)}
                    className={`relative ${colSpan} ${rowSpan} p-4 rounded-3xl transition-all duration-300 select-none cursor-pointer flex flex-col justify-between overflow-hidden ${styleClass} ${
                      isEditMode ? 'ring-2 ring-amber-400/50 hover:scale-[1.02]' : 'hover:scale-[1.02] active:scale-[0.98]'
                    } ${!item.enabled ? 'opacity-40 grayscale' : ''}`}
                    style={
                      iconShape === 'squircle'
                        ? { borderRadius: `${iconCornerRadius}px` }
                        : undefined
                    }
                  >
                    {/* OriginOS Edit Overlay controls */}
                    {isEditMode && (
                      <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
                        {/* Size Cycle Button */}
                        <button
                          type="button"
                          onClick={(e) => cycleWidgetSize(item.id, e)}
                          className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-cyan-300 border border-cyan-400/40 text-[10px] font-mono font-bold shadow"
                          title="Resize Widget (1x1, 2x1, 2x2)"
                        >
                          {item.size}
                        </button>
                        {/* Reorder Buttons */}
                        <button
                          type="button"
                          onClick={(e) => moveItem(index, 'up', e)}
                          disabled={index === 0}
                          className="p-1 rounded-lg bg-black/60 text-slate-300 hover:text-white disabled:opacity-30"
                          title="Move Left"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={(e) => moveItem(index, 'down', e)}
                          disabled={index === shortcuts.length - 1}
                          className="p-1 rounded-lg bg-black/60 text-slate-300 hover:text-white disabled:opacity-30"
                          title="Move Right"
                        >
                          →
                        </button>
                        {/* Toggle Visibility */}
                        <button
                          type="button"
                          onClick={(e) => toggleItemEnabled(item.id, e)}
                          className={`p-1 rounded-lg ${item.enabled ? 'bg-emerald-500/30 text-emerald-300' : 'bg-red-500/30 text-red-300'}`}
                          title={item.enabled ? 'Hide Shortcut' : 'Show Shortcut'}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* WIDGET CONTENT RENDERING BASED ON SIZE */}

                    {/* 1x1 Compact Icon */}
                    {item.size === '1x1' && (
                      <div className="flex flex-col items-center justify-center text-center h-full gap-2">
                        <div
                          className={`w-12 h-12 flex items-center justify-center ${shapeClass} transition-all duration-300 shadow-md ${
                            item.colorScheme === 'emerald'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.colorScheme === 'violet'
                              ? 'bg-violet-500/20 text-violet-300'
                              : item.colorScheme === 'amber'
                              ? 'bg-amber-500/20 text-amber-300'
                              : item.colorScheme === 'blue'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-cyan-500/20 text-cyan-300'
                          }`}
                        >
                          <div className={iconShape === 'diamond' ? '-rotate-45' : ''}>
                            {renderIcon(item.iconName, 'w-6 h-6')}
                          </div>
                        </div>
                        {showLabels && (
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white tracking-tight block truncate">
                              {item.label}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {item.subtitle}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2x1 Horizontal Atomic Pill Widget */}
                    {item.size === '2x1' && (
                      <div className="flex items-center justify-between h-full gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-12 h-12 flex items-center justify-center ${shapeClass} shrink-0 transition-all duration-300 shadow-md ${
                              item.colorScheme === 'emerald'
                                ? 'bg-emerald-500/25 text-emerald-300'
                                : item.colorScheme === 'amber'
                                ? 'bg-amber-500/25 text-amber-300'
                                : 'bg-cyan-500/25 text-cyan-300'
                            }`}
                          >
                            <div className={iconShape === 'diamond' ? '-rotate-45' : ''}>
                              {renderIcon(item.iconName, 'w-6 h-6')}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-white tracking-tight truncate">
                                {item.label}
                              </span>
                              <span className="text-[9.5px] px-1.5 py-0.5 rounded-full font-mono font-semibold bg-white/10 text-cyan-300">
                                Atomic
                              </span>
                            </div>
                            <span className="text-xs text-slate-300 block truncate mt-0.5">
                              {item.subtitle}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs font-semibold text-cyan-400 hidden sm:inline">Launch</span>
                          <ChevronRight className="w-4 h-4 text-cyan-300" />
                        </div>
                      </div>
                    )}

                    {/* 2x2 Rich OriginOS Atomic Widget */}
                    {item.size === '2x2' && (
                      <div className="flex flex-col justify-between h-full gap-3">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-10 h-10 flex items-center justify-center ${shapeClass} ${
                                item.colorScheme === 'emerald'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-cyan-500/20 text-cyan-300'
                              }`}
                            >
                              <div className={iconShape === 'diamond' ? '-rotate-45' : ''}>
                                {renderIcon(item.iconName, 'w-5 h-5')}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">{item.label}</div>
                              <div className="text-[10px] text-slate-400">{item.subtitle}</div>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            LIVE
                          </span>
                        </div>

                        {/* Interactive Preview Body for 2x2 Cards */}
                        {item.tabId === 'biolab' ? (
                          <div className="flex-1 bg-black/40 rounded-2xl p-2.5 border border-emerald-500/20 flex flex-col justify-between text-xs">
                            <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
                              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                <Dna className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
                                DNA Double Helix
                              </span>
                              <span>pH: 7.4 | 37°C</span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2 my-1 leading-relaxed">
                              Observable Science Lab: 3D hydrogen bonding, base-pair rungs, and ecological adaptation layers.
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-emerald-300 font-semibold">Inspect Organelles →</span>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-lg">
                                Ready
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 bg-black/40 rounded-2xl p-2.5 border border-cyan-500/20 flex flex-col justify-between text-xs">
                            <div className="text-[11px] text-cyan-300 font-bold flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-cyan-400" />
                              Multimodal Neural AI
                            </div>
                            <p className="text-[11px] text-slate-300 line-clamp-2">
                              Instant code synthesis, Telugu/English scriptwriting, and image prompts.
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Ask anything</span>
                              <span className="text-cyan-400 font-semibold">Open →</span>
                            </div>
                          </div>
                        )}

                        {/* Bottom action trigger */}
                        <div className="w-full py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-center text-xs font-bold text-white transition flex items-center justify-center gap-1">
                          <span>Open {item.label}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* 4. OriginOS 6 Customization Drawer (Slide-up modal / panel) */}
        {isEditMode && (
          <div className="w-full mt-4 p-5 rounded-3xl bg-[#030d22]/95 border border-cyan-400/40 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all duration-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">OriginOS 6 Desktop Customizer</h3>
              </div>
              <button
                onClick={handleResetDefaults}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs transition"
                title="Reset layout to default"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            </div>

            {/* Sub-tab navigation with Liquid Glass Droplet indicator */}
            <LiquidGlassNav
              activeId={activeTabDrawer}
              className="flex items-center gap-2 mb-4 p-1 rounded-full border border-white/10"
            >
              <button
                data-nav-id="shapes"
                onClick={() => setActiveTabDrawer('shapes')}
                className={`liquid-nav-btn px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTabDrawer === 'shapes'
                    ? 'text-cyan-300 font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Icon Shape
              </button>
              <button
                data-nav-id="styles"
                onClick={() => setActiveTabDrawer('styles')}
                className={`liquid-nav-btn px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTabDrawer === 'styles'
                    ? 'text-cyan-300 font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Icon Style & Theme
              </button>
              <button
                data-nav-id="widgets"
                onClick={() => setActiveTabDrawer('widgets')}
                className={`liquid-nav-btn px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTabDrawer === 'widgets'
                    ? 'text-cyan-300 font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Size & Corner
              </button>
            </LiquidGlassNav>

            {/* 1. Shapes Sub-tab */}
            {activeTabDrawer === 'shapes' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Morph Icon Geometry (OriginOS 6 Morph Engine):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(
                    [
                      { id: 'squircle', label: 'Squircle', icon: 'Rounded' },
                      { id: 'circle', label: 'Circle', icon: 'Round' },
                      { id: 'teardrop', label: 'Teardrop', icon: 'Organic' },
                      { id: 'hexagon', label: 'Hexagon', icon: 'Geometric' },
                      { id: 'diamond', label: 'Diamond', icon: 'Angled' },
                      { id: 'pebble', label: 'Pebble', icon: 'Fluid' },
                      { id: 'capsule', label: 'Capsule', icon: 'Pill' },
                    ] as const
                  ).map((shapeItem) => (
                    <button
                      key={shapeItem.id}
                      onClick={() => handleSetIconShape(shapeItem.id)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                        iconShape === shapeItem.id
                          ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-white capitalize">{shapeItem.label}</div>
                        <div className="text-[10px] text-slate-400">{shapeItem.icon}</div>
                      </div>
                      {iconShape === shapeItem.id && <Check className="w-4 h-4 text-cyan-300" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Styles Sub-tab */}
            {activeTabDrawer === 'styles' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Visual Theme & Material Pack:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(
                    [
                      { id: 'neon_glass', label: '3D Neon Glass', desc: 'Specular neon borders with gradient depth' },
                      { id: 'frosted', label: 'Frosted OriginOS', desc: 'Frosted blur with gentle white light borders' },
                      { id: 'cyber_glow', label: 'Cyber Glow', desc: 'Vibrant edge emission and neon backdrop' },
                      { id: 'minimalist', label: 'Minimalist Outline', desc: 'Clean slate borders with subtle opacity' },
                    ] as const
                  ).map((styleItem) => (
                    <button
                      key={styleItem.id}
                      onClick={() => handleSetIconStyle(styleItem.id)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                        iconStyle === styleItem.id
                          ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-white">{styleItem.label}</div>
                        <div className="text-[10px] text-slate-400">{styleItem.desc}</div>
                      </div>
                      {iconStyle === styleItem.id && <Check className="w-4 h-4 text-cyan-300" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Widgets / Size Sub-tab */}
            {activeTabDrawer === 'widgets' && (
              <div className="space-y-4 text-xs">
                {/* Corner Radius Slider */}
                <div>
                  <div className="flex items-center justify-between text-slate-300 mb-1.5">
                    <span>Squircle Corner Radius:</span>
                    <span className="font-mono text-cyan-300 font-bold">{iconCornerRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="36"
                    value={iconCornerRadius}
                    onChange={(e) => handleSetCornerRadius(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Show/Hide Text Labels */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/10">
                  <div>
                    <span className="font-bold text-white block">App & Shortcut Labels</span>
                    <span className="text-[10px] text-slate-400">Display textual titles underneath app icons</span>
                  </div>
                  <button
                    onClick={handleToggleLabels}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                      showLabels
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {showLabels ? 'Enabled' : 'Hidden'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
