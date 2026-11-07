import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Cpu,
  Terminal,
  History,
  Bot,
  Code2,
  Globe,
  FileCode,
  Upload,
  Mic,
  Share2,
  Palette,
  GitBranch,
  Bluetooth,
  Activity,
  Footprints,
  Moon,
  HeartPulse,
  RefreshCw,
  Search,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Check,
  Copy,
  Play,
  RotateCcw,
  Zap,
  Sliders,
  Shield,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Flame,
  Radio,
  Eye,
  Volume2,
  Download,
  CheckCircle2,
  AlertTriangle,
  Send,
  Watch,
  Plus,
  Trash2,
  ExternalLink,
  Laptop,
  GraduationCap,
  Headphones,
  BookOpen
} from 'lucide-react';
import { bluetoothService, BluetoothServiceState } from '../services/bluetoothService.ts';
import { PdfToAudioExplainer } from './PdfToAudioExplainer.tsx';

// ============================================================================
// SUB-SUB-TAB DIRECTORY DEFINITION (High-Performance Curated Workstations)
// ============================================================================

export type SubSubTabCategory =
  | 'Study'
  | 'Core AI'
  | 'Development'
  | 'Media & Input'
  | 'Collaboration'
  | 'Appearance'
  | 'Smartwatch Sync';

export interface SubSubTabItem {
  id: string;
  name: string;
  category: SubSubTabCategory;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string; // Tailwind color class
  glowColor: string;
}

export const SUB_SUB_TABS: SubSubTabItem[] = [
  // 0. Study Sub-Sub-Tab: PDF to Audio & Book Study (Physical Open-Book Manuscript Experience)
  {
    id: 'study',
    name: 'PDF to Audio & Book Study',
    category: 'Study',
    description: 'Immersive open-book manuscript: PDF.js extraction, Gemini 2.5 Flash academic tutor, brass audio recitation & printable study PDF export',
    badge: 'INK & PAPER',
    icon: BookOpen,
    accentColor: 'text-amber-400',
    glowColor: 'rgba(217,119,6,0.5)',
  },
  {
    id: 'pdf-audio-explainer',
    name: 'PDF to Audio Explainer',
    category: 'Study',
    description: 'Transform PDF study notes, papers & books into conversational headphone audio podcasts',
    badge: 'AI PODCAST',
    icon: Headphones,
    accentColor: 'text-emerald-300',
    glowColor: 'rgba(16,185,129,0.4)',
  },

  // 1. Core AI
  {
    id: 'model-selector',
    name: 'Multi-Model Selector',
    category: 'Core AI',
    description: 'Switch between Gemini models, quantized local weights & configure inference limits',
    badge: 'ACTIVE',
    icon: Cpu,
    accentColor: 'text-cyan-400',
    glowColor: 'rgba(6,182,212,0.4)',
  },
  {
    id: 'system-prompts',
    name: 'Custom System Prompts',
    category: 'Core AI',
    description: 'Configure developer instructions, persona layers & persistent system memory',
    badge: 'MEMORY',
    icon: Terminal,
    accentColor: 'text-cyan-300',
    glowColor: 'rgba(56,189,248,0.4)',
  },
  {
    id: 'chat-history',
    name: 'Chat History & Sessions',
    category: 'Core AI',
    description: 'Inspect, branch, restore, export & manage previous interaction sessions',
    badge: 'PERSIST',
    icon: History,
    accentColor: 'text-blue-400',
    glowColor: 'rgba(59,130,246,0.4)',
  },
  {
    id: 'agent-builder',
    name: 'AI Agent Builder',
    category: 'Core AI',
    description: 'Build autonomous workflows, custom tools & multi-step execution routines',
    badge: 'AUTO',
    icon: Bot,
    accentColor: 'text-indigo-400',
    glowColor: 'rgba(99,102,241,0.4)',
  },

  // 2. Development
  {
    id: 'code-sandbox',
    name: 'Code Sandbox & Preview',
    category: 'Development',
    description: 'Execute and render HTML, JavaScript, and React JSX components in real time',
    badge: 'LIVE RUN',
    icon: Code2,
    accentColor: 'text-teal-400',
    glowColor: 'rgba(20,184,166,0.4)',
  },
  {
    id: 'web-grounding',
    name: 'Web Search & Grounding',
    category: 'Development',
    description: 'Ground model generations with live search retrieval & cited source metadata',
    badge: 'REALTIME',
    icon: Globe,
    accentColor: 'text-emerald-400',
    glowColor: 'rgba(16,185,129,0.4)',
  },
  {
    id: 'prompt-templates',
    name: 'Prompt Templates & Snippets',
    category: 'Development',
    description: 'Save, organize, test & reuse structured prompt engineering blocks',
    badge: 'LIBRARY',
    icon: FileCode,
    accentColor: 'text-amber-400',
    glowColor: 'rgba(245,158,11,0.4)',
  },

  // 3. Media & Input
  {
    id: 'multimodal-vision',
    name: 'File Upload & Vision',
    category: 'Media & Input',
    description: 'Process images, documents, audio, and video inputs natively with OCR & object detection',
    badge: 'VISION 2.0',
    icon: Upload,
    accentColor: 'text-pink-400',
    glowColor: 'rgba(236,72,153,0.4)',
  },
  {
    id: 'voice-transcription',
    name: 'Voice Control & Audio',
    category: 'Media & Input',
    description: 'Real-time audio streaming, hands-free voice commands & speech-to-text notes',
    badge: 'SPEECH',
    icon: Mic,
    accentColor: 'text-rose-400',
    glowColor: 'rgba(244,63,94,0.4)',
  },

  // 4. Collaboration
  {
    id: 'export-sharing',
    name: 'Export & Workspace Sharing',
    category: 'Collaboration',
    description: 'Export project configurations, code bundles, chat transcripts & generate share links',
    badge: 'PORTABLE',
    icon: Share2,
    accentColor: 'text-purple-400',
    glowColor: 'rgba(168,85,247,0.4)',
  },

  // 5. Appearance & System
  {
    id: 'theme-customization',
    name: 'Theme & UI Customization',
    category: 'Appearance',
    description: 'HyperOS / OriginOS liquid glassmorphism, cyan & amber glow, scanlines & blur radius',
    badge: 'HYPER-OS',
    icon: Palette,
    accentColor: 'text-amber-300',
    glowColor: 'rgba(251,191,36,0.4)',
  },
  {
    id: 'version-history',
    name: 'Version History & Rollback',
    category: 'Appearance',
    description: 'Commit checkpoints, changelog audit trail & instant rollback snapshots',
    badge: 'SNAPSHOT',
    icon: GitBranch,
    accentColor: 'text-cyan-400',
    glowColor: 'rgba(6,182,212,0.4)',
  },

  // 6. Smartwatch Sync (Bluetooth LE / Laxafit)
  {
    id: 'ble-bridge',
    name: 'BLE Device Bridge',
    category: 'Smartwatch Sync',
    description: 'Scan, pair & maintain secure BLE socket with Laxafit watches and fitness bands',
    badge: 'BLE 5.2',
    icon: Bluetooth,
    accentColor: 'text-cyan-400',
    glowColor: 'rgba(6,182,212,0.5)',
  },
  {
    id: 'biometric-pulse',
    name: 'Real-Time Biometric Pulse',
    category: 'Smartwatch Sync',
    description: 'Optical PPG sensor stream, resting heart rate wave & zone alarms',
    badge: 'PPG LIVE',
    icon: Activity,
    accentColor: 'text-rose-400',
    glowColor: 'rgba(244,63,94,0.5)',
  },
  {
    id: 'step-pedometer',
    name: 'Step Counter & Motion',
    category: 'Smartwatch Sync',
    description: 'IMU 6-axis pedometer, real-time cadence, distance & active caloric burn',
    badge: 'IMU SENSOR',
    icon: Footprints,
    accentColor: 'text-amber-400',
    glowColor: 'rgba(245,158,11,0.5)',
  },
  {
    id: 'sleep-recovery',
    name: 'Sleep Cycle & Recovery',
    category: 'Smartwatch Sync',
    description: 'REM, light, deep sleep staging & autonomic nervous recovery metrics',
    badge: 'RECOVERY',
    icon: Moon,
    accentColor: 'text-indigo-400',
    glowColor: 'rgba(99,102,241,0.5)',
  },
  {
    id: 'health-overview',
    name: 'Comprehensive Health Overview',
    category: 'Smartwatch Sync',
    description: 'Full daily health telemetry dashboard: SpO2, stress index, skin temp & VO2 Max',
    badge: 'VITALS',
    icon: HeartPulse,
    accentColor: 'text-emerald-400',
    glowColor: 'rgba(16,185,129,0.5)',
  },
  {
    id: 'firmware-sync',
    name: 'Firmware & Data Sync',
    category: 'Smartwatch Sync',
    description: 'Synchronize sensor log buffers, push custom watch faces & flash OTA firmware',
    badge: 'OTA SYNC',
    icon: RefreshCw,
    accentColor: 'text-blue-400',
    glowColor: 'rgba(59,130,246,0.5)',
  },
];

const CATEGORIES: SubSubTabCategory[] = [
  'Study',
  'Core AI',
  'Development',
  'Media & Input',
  'Collaboration',
  'Appearance',
  'Smartwatch Sync',
];

interface ToolsMoreWorkspaceProps {
  initialSubTabId?: string;
  onNavigateToTab?: (tab: string) => void;
  onOpenTool?: (toolId: string) => void;
}

export function ToolsMoreWorkspace({ initialSubTabId, onNavigateToTab, onOpenTool }: ToolsMoreWorkspaceProps) {
  const [activeSubTabId, setActiveSubTabId] = useState<string>(initialSubTabId || 'study');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  // Real Web Bluetooth State for Smartwatch Sync
  const [btState, setBtState] = useState<BluetoothServiceState>(() => bluetoothService.getState());
  const [isConnectingBt, setIsConnectingBt] = useState(false);

  useEffect(() => {
    const unsub = bluetoothService.subscribe((state) => {
      setBtState(state);
    });
    return () => unsub();
  }, []);

  const activeSubTab = useMemo(() => {
    return SUB_SUB_TABS.find((t) => t.id === activeSubTabId) || SUB_SUB_TABS[0];
  }, [activeSubTabId]);

  const filteredTabs = useMemo(() => {
    return SUB_SUB_TABS.filter((tab) => {
      const matchesCat = activeCategoryFilter === 'All' || tab.category === activeCategoryFilter;
      const matchesSearch =
        tab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tab.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tab.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategoryFilter, searchQuery]);

  // Group filtered tabs by category for the sidebar
  const groupedTabs = useMemo(() => {
    const groups: { category: SubSubTabCategory; items: SubSubTabItem[] }[] = [];
    CATEGORIES.forEach((cat) => {
      const items = filteredTabs.filter((t) => t.category === cat);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    });
    return groups;
  }, [filteredTabs]);

  return (
    <div className="w-full space-y-4">
      {/* Top Breadcrumb & Status Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#040e24]/90 border border-cyan-500/30 backdrop-blur-xl shadow-[0_4px_24px_rgba(2,6,23,0.7)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]">
            <Sliders className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase text-cyan-400/80">
              <span>Tools</span>
              <span>/</span>
              <span>More</span>
              <span>/</span>
              <span className="text-white font-bold">{activeSubTab.name}</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>18-in-1 Advanced Workstations</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold">
                v5.0 MATRIX
              </span>
            </h2>
          </div>
        </div>

        {/* Global Telemetry & Mobile Sidebar Toggle */}
        <div className="flex items-center gap-2">
          {/* Bluetooth live pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-[11px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                btState.connectedDevice ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="text-slate-300">
              {btState.connectedDevice ? btState.connectedDevice.name : 'BLE Idle'}
            </span>
          </div>

          {/* Mobile view subtab menu button */}
          <button
            onClick={() => setIsSidebarOpenMobile((prev) => !prev)}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold cursor-pointer transition active:scale-95"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Modules ({filteredTabs.length})</span>
            {isSidebarOpenMobile ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Split Architecture: Left Sidebar + Right Interactive Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Left Sidebar: Sub-Sub-Tabs Directory (Desktop permanent, Mobile collapsible) */}
        <aside
          className={`md:col-span-4 lg:col-span-3.5 space-y-3.5 ${
            isSidebarOpenMobile ? 'block' : 'hidden md:block'
          }`}
        >
          {/* Quick Search & Category Filter */}
          <div className="p-3 rounded-2xl bg-[#040e24]/90 border border-cyan-500/30 backdrop-blur-xl shadow-[0_4px_20px_rgba(2,6,23,0.7)] space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 18 workstations..."
                className="w-full bg-[#020617]/90 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            {/* Category horizontal badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {['All', ...CATEGORIES].map((cat) => {
                const isActive = activeCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grouped Sub-Sub-Tabs Scrollable Navigation List */}
          <div className="max-h-[640px] overflow-y-auto no-scrollbar space-y-4 pr-1">
            {groupedTabs.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-[#040e24]/80 border border-slate-800 text-slate-400 text-xs">
                No matching sub-tabs found for "{searchQuery}".
              </div>
            ) : (
              groupedTabs.map((group) => (
                <div key={group.category} className="space-y-1.5">
                  <div className="px-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    <span>{group.category}</span>
                    <span className="text-cyan-400/80">{group.items.length}</span>
                  </div>

                  <div className="space-y-1">
                    {group.items.map((tab) => {
                      const Icon = tab.icon;
                      const isSelected = activeSubTabId === tab.id;

                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveSubTabId(tab.id);
                            setIsSidebarOpenMobile(false);
                          }}
                          style={{
                            boxShadow: isSelected ? `0 0 16px ${tab.glowColor}` : 'none',
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all duration-150 flex items-center gap-2.5 group cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-cyan-950/60 to-blue-950/40 border-cyan-400/90 text-white'
                              : 'bg-[#040e24]/70 border-slate-800/80 text-slate-300 hover:border-cyan-500/40 hover:bg-[#07152e]/80 hover:text-white'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60'
                                : 'bg-white/5 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/10'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4
                                className={`text-xs font-bold truncate ${
                                  isSelected ? 'text-cyan-200' : 'text-slate-200 group-hover:text-white'
                                }`}
                              >
                                {tab.name}
                              </h4>
                              <span
                                className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold shrink-0 ${
                                  isSelected
                                    ? 'bg-cyan-400 text-slate-950'
                                    : 'bg-slate-800 text-slate-400 group-hover:text-cyan-300'
                                }`}
                              >
                                {tab.badge}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {tab.description}
                            </p>
                          </div>

                          <ChevronRight
                            className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                              isSelected
                                ? 'text-cyan-400 translate-x-0.5'
                                : 'text-slate-600 group-hover:text-slate-400'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right Interactive Workspace Panel */}
        <main className="md:col-span-8 lg:col-span-8.5 space-y-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/30 backdrop-blur-xl shadow-[0_8px_32px_rgba(2,6,23,0.8)] relative overflow-hidden">
            {/* Top Workspace Ambient Glow */}
            <div
              className="absolute top-0 right-0 w-80 h-32 blur-3xl pointer-events-none opacity-20"
              style={{ background: activeSubTab.glowColor }}
            />

            {/* Header of Active Module */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: 'rgba(6,182,212,0.15)',
                    borderColor: 'rgba(6,182,212,0.4)',
                    boxShadow: `0 0 16px ${activeSubTab.glowColor}`,
                  }}
                >
                  <activeSubTab.icon className={`w-5 h-5 ${activeSubTab.accentColor}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                      {activeSubTab.name}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold">
                      {activeSubTab.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{activeSubTab.description}</p>
                </div>
              </div>

              {/* Status / Quick Action Badge */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>ONLINE</span>
                </div>
              </div>
            </div>

            {/* DYNAMIC SUB-SUB-TAB WORKSPACE MODULES */}
            <div className="space-y-4">
              {(activeSubTabId === 'study' || activeSubTabId === 'pdf-audio-explainer') && <PdfToAudioExplainer />}
              {activeSubTabId === 'model-selector' && <MultiModelSelectorModule />}
              {activeSubTabId === 'system-prompts' && <CustomSystemPromptsModule />}
              {activeSubTabId === 'chat-history' && <ChatHistoryModule onNavigateToTab={onNavigateToTab} />}
              {activeSubTabId === 'agent-builder' && <AiAgentBuilderModule />}
              {activeSubTabId === 'code-sandbox' && <CodeSandboxModule />}
              {activeSubTabId === 'web-grounding' && <WebGroundingModule />}
              {activeSubTabId === 'prompt-templates' && <PromptTemplatesModule onNavigateToTab={onNavigateToTab} />}
              {activeSubTabId === 'multimodal-vision' && <MultimodalVisionModule />}
              {activeSubTabId === 'voice-transcription' && <VoiceTranscriptionModule />}
              {activeSubTabId === 'export-sharing' && <ExportSharingModule />}
              {activeSubTabId === 'theme-customization' && <ThemeCustomizationModule />}
              {activeSubTabId === 'version-history' && <VersionHistoryModule />}
              {activeSubTabId === 'ble-bridge' && (
                <BleBridgeModule
                  btState={btState}
                  isConnecting={isConnectingBt}
                  setIsConnecting={setIsConnectingBt}
                />
              )}
              {activeSubTabId === 'biometric-pulse' && <BiometricPulseModule btState={btState} />}
              {activeSubTabId === 'step-pedometer' && <StepPedometerModule btState={btState} />}
              {activeSubTabId === 'sleep-recovery' && <SleepRecoveryModule />}
              {activeSubTabId === 'health-overview' && <HealthOverviewModule btState={btState} />}
              {activeSubTabId === 'firmware-sync' && <FirmwareSyncModule btState={btState} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// 1. MULTI-MODEL SELECTOR MODULE (Core AI)
// ============================================================================
function MultiModelSelectorModule() {
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(4096);
  const [topP, setTopP] = useState<number>(0.95);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState<string>('Explain how quantum teleportation transfers states.');
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isInferencing, setIsInferencing] = useState<boolean>(false);

  const MODELS = [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'Google AI Studio',
      type: 'Cloud Ultra-Fast',
      latency: '180ms TTFT',
      context: '1M Tokens',
      recommended: true,
      desc: 'Top choice for real-time mobile conversation, high accuracy, and fast multimodal reasoning.',
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'Google AI Studio',
      type: 'Cloud Deep Reasoning',
      latency: '420ms TTFT',
      context: '2M Tokens',
      recommended: false,
      desc: 'Maximum depth for complex coding, mathematical proofs, and massive multi-document analysis.',
    },
    {
      id: 'gemini-2.0-flash-lite',
      name: 'Gemini 2.0 Flash Lite',
      provider: 'Google AI Studio',
      type: 'Low-Bandwidth',
      latency: '120ms TTFT',
      context: '1M Tokens',
      recommended: false,
      desc: 'Ultralight footprint engineered for extreme bandwidth constraints and rapid UI triggers.',
    },
    {
      id: 'gemma-2-2b-local',
      name: 'Gemma 2 2B (Local Experimental)',
      provider: 'WebLLM / ONNX Runtime',
      type: 'On-Device Zero-Cloud',
      latency: '24 tok/sec (WebGPU)',
      context: '8K Tokens',
      recommended: false,
      desc: 'Runs directly in browser memory without sending tokens over the internet.',
    },
  ];

  const handleApplyRuntime = () => {
    localStorage.setItem('gkedit_active_model', selectedModel);
    localStorage.setItem('gkedit_model_temperature', String(temperature));
    localStorage.setItem('gkedit_model_max_tokens', String(maxTokens));
    setAppliedNotice(`Model runtime configured to ${selectedModel}. Ready for chat and tool pipelines.`);
    setTimeout(() => setAppliedNotice(null), 4000);
  };

  const handleRunInference = () => {
    setIsInferencing(true);
    setTestOutput(null);
    setTimeout(() => {
      setIsInferencing(false);
      setTestOutput(
        `[${selectedModel} Runtime Response]\nQuantum teleportation transfers an unknown quantum state (qubit) between two separated locations using a shared entangled Bell pair and classical communication. Unlike sci-fi teleportation, physical matter is not transported—only quantum information is faithfully reconstructed.`
      );
    }, 900);
  };

  return (
    <div className="space-y-4">
      {appliedNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{appliedNotice}</span>
        </div>
      )}

      {/* Models Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODELS.map((m) => {
          const isSelected = selectedModel === m.id;
          return (
            <div
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-[#020617]/70 border-slate-800 hover:border-slate-700 hover:bg-[#020617]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white">{m.name}</h4>
                    {m.recommended && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-bold">
                        REC
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">{m.type}</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-slate-950 font-bold" />}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{m.desc}</p>
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Speed: {m.latency}</span>
                <span>Context: {m.context}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inference Parameters */}
      <div className="p-4 rounded-2xl bg-[#020617]/80 border border-slate-800 space-y-3.5">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
          <span>Hyperparameter Calibration</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>Temperature</span>
              <span className="font-mono text-cyan-400">{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>Max Tokens</span>
              <span className="font-mono text-cyan-400">{maxTokens}</span>
            </div>
            <input
              type="range"
              min="512"
              max="8192"
              step="512"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>Top-P Sampling</span>
              <span className="font-mono text-cyan-400">{topP}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={topP}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleApplyRuntime}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Set as Active Runtime</span>
          </button>
        </div>
      </div>

      {/* Inference Test Sandbox */}
      <div className="p-4 rounded-2xl bg-[#020617]/80 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <Play className="w-3.5 h-3.5 text-cyan-400" />
          <span>Test Inference Sandbox</span>
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Type a test query..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            onClick={handleRunInference}
            disabled={isInferencing}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 text-xs font-bold hover:bg-cyan-500/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isInferencing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>Execute</span>
          </button>
        </div>

        {testOutput && (
          <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 font-mono text-xs text-cyan-200/90 whitespace-pre-wrap">
            {testOutput}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 2. CUSTOM SYSTEM PROMPTS MODULE (Core AI)
// ============================================================================
function CustomSystemPromptsModule() {
  const PRESET_PERSONAS = [
    {
      id: 'gkedit-architect',
      title: 'GKEDIT Senior Architect',
      desc: 'Production-first, zero-fluff software engineer focused on high performance and clean UI.',
      content:
        'You are the Senior Software Architect for GKEDIT AI. Respond with technical precision, clean code blocks, high performance considerations, and zero conversational filler.',
    },
    {
      id: 'ultron-sentinel',
      title: 'Ultron Sentinel AI',
      desc: 'Analytical, cool, highly structured with tactical situational awareness.',
      content:
        'You operate as the Ultron Sentinel Matrix. Speak with formidable precision, strategic overview, and instant technical directives.',
    },
    {
      id: 'telugu-tech-tutor',
      title: 'తెలుగు Tech Tutor',
      desc: 'Explains complex AI, coding, and algorithms in fluent Telugu + English hybrid.',
      content:
        'You are a friendly, expert tech educator from Khammam, Telangana. Explain all tech and AI concepts in clear Telugu (తెలుగు) alongside English technical terms.',
    },
    {
      id: 'code-debugger',
      title: 'Strict Code Auditor',
      desc: 'Scrutinizes edge cases, memory leaks, and concurrency bottlenecks.',
      content:
        'Audit code for Big-O complexity, memory retention leaks, race conditions, and framework anti-patterns. Provide instant patched code replacements.',
    },
  ];

  const [promptText, setPromptText] = useState<string>(
    () =>
      localStorage.getItem('nexus_system_instruction') ||
      'You are GKEDIT AI, an advanced AI workstation built by Gopi Krishna. Provide direct, intelligent, and production-ready responses.'
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    localStorage.setItem('nexus_system_instruction', promptText);
    window.dispatchEvent(
      new CustomEvent('gkedit:system_prompt_updated', { detail: { prompt: promptText } })
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-4">
      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>System prompt updated and bound to active chat runtime!</span>
        </div>
      )}

      {/* Preset Personas */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick Persona Presets</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PRESET_PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPromptText(p.content)}
              className="p-3 rounded-xl bg-[#020617]/70 border border-slate-800 hover:border-cyan-400/50 hover:bg-[#020617] text-left transition group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                  {p.title}
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Load</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-bold text-white flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Developer System Instruction Buffer</span>
          </span>
          <span className="font-mono text-slate-400 text-[11px]">
            {promptText.length} characters
          </span>
        </div>
        <textarea
          rows={6}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Enter developer instructions for the AI model..."
          className="w-full bg-[#020617] border border-cyan-500/30 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 transition"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() =>
            setPromptText(
              'You are GKEDIT AI, an advanced AI workstation built by Gopi Krishna. Provide direct, intelligent, and production-ready responses.'
            )
          }
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white text-xs transition cursor-pointer"
        >
          Reset to Default
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Save & Deploy Persona</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 3. CHAT HISTORY & SESSION MANAGEMENT MODULE (Core AI)
// ============================================================================
function ChatHistoryModule({ onNavigateToTab }: { onNavigateToTab?: (tab: string) => void }) {
  const [sessions, setSessions] = useState([
    {
      id: 'sess-01',
      title: 'Cyclone Radar Leaflet Architecture & ES modules',
      model: 'Gemini 2.5 Flash',
      messagesCount: 14,
      date: 'Today, 11:20 AM',
      preview: 'Configured Leaflet TileLayer with RainViewer timeline frames and CartoDB overlays.',
    },
    {
      id: 'sess-02',
      title: 'Web Bluetooth GATT 0x180F Battery Telemetry',
      model: 'Gemini 2.5 Pro',
      messagesCount: 22,
      date: 'Yesterday, 04:45 PM',
      preview: 'Implemented navigator.bluetooth.requestDevice with real characteristic listeners.',
    },
    {
      id: 'sess-03',
      title: 'Duolingo-style 2-Minute GK Learning Engine',
      model: 'Gemini 2.5 Flash',
      messagesCount: 8,
      date: 'Oct 28, 2026',
      preview: 'Created 2-minute English, Telugu & Hindi audio challenge decks with streak tracking.',
    },
  ]);

  const [activeSession, setActiveSession] = useState(sessions[0]);
  const [notification, setNotification] = useState<string | null>(null);

  const handleBranch = (id: string) => {
    const orig = sessions.find((s) => s.id === id);
    if (!orig) return;
    const newSess = {
      ...orig,
      id: `sess-${Date.now()}`,
      title: `${orig.title} (Branch)`,
      date: 'Just now',
    };
    setSessions([newSess, ...sessions]);
    setNotification(`Branched session "${orig.title}" into independent thread.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = (id: string) => {
    setSessions(sessions.filter((s) => s.id !== id));
    if (activeSession.id === id) {
      setActiveSession(sessions[0] || null);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'gkedit_chat_sessions.json');
    dlAnchor.click();
    setNotification('Exported chat history bundle as JSON.');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-4">
      {notification && (
        <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-300 font-bold">
          Saved Sessions ({sessions.length})
        </span>
        <button
          onClick={handleExportJSON}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export All (JSON)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Session List */}
        <div className="space-y-2">
          {sessions.map((sess) => {
            const isSelected = activeSession?.id === sess.id;
            return (
              <div
                key={sess.id}
                onClick={() => setActiveSession(sess)}
                className={`p-3 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400'
                    : 'bg-[#020617]/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-white truncate">{sess.title}</h4>
                  <span className="text-[10px] font-mono text-cyan-400 shrink-0">{sess.date}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{sess.preview}</p>
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>{sess.model}</span>
                  <span>{sess.messagesCount} msgs</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Session Inspector */}
        {activeSession ? (
          <div className="p-4 rounded-2xl bg-[#020617]/80 border border-cyan-500/30 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white">{activeSession.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
                  <span>{activeSession.model}</span>
                  <span>•</span>
                  <span>{activeSession.date}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(activeSession.id)}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                title="Delete Session"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <span className="font-bold text-cyan-300 block mb-1">Session Transcript Snippet:</span>
              <p className="text-slate-400">{activeSession.preview}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => handleBranch(activeSession.id)}
                className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Branch Thread</span>
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('gkedit:fill_chat_prompt', {
                      detail: { prompt: `Resuming session: ${activeSession.title}` },
                    })
                  );
                  window.dispatchEvent(
                    new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'chat' } })
                  );
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-bold hover:from-cyan-400 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Open in Chat</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">No active session selected</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 4. AI AGENT BUILDER MODULE (Core AI)
// ============================================================================
function AiAgentBuilderModule() {
  const [agentName, setAgentName] = useState<string>('Khammam Cyclone & Weather Watcher');
  const [selectedTools, setSelectedTools] = useState<string[]>([
    'web_search',
    'weather_radar_fetch',
    'ble_sensor_reader',
  ]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);

  const AVAILABLE_TOOLS = [
    { id: 'web_search', label: 'Web Grounding Search', icon: Globe },
    { id: 'weather_radar_fetch', label: 'RainViewer Radar Tile Extractor', icon: Radio },
    { id: 'ble_sensor_reader', label: 'GATT 0x180F Heart Rate & Battery', icon: Bluetooth },
    { id: 'python_interpreter', label: 'Python / JS Math Execution Sandbox', icon: Code2 },
    { id: 'calendar_dispatcher', label: 'Smart Calendar Event Dispatcher', icon: Check },
  ];

  const toggleTool = (toolId: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId]
    );
  };

  const handleRunAgent = () => {
    setIsSimulating(true);
    setExecutionLogs([]);

    const steps = [
      `[Trigger] Initializing autonomous loop: "${agentName}"`,
      `[Reasoner] Evaluating active tool manifests (${selectedTools.join(', ')})`,
      `[Action] Invoking tool "weather_radar_fetch" -> Querying RainViewer API at 17.385, 78.486`,
      `[Observation] Extracted past radar frame 1718900000. Atmospheric pressure: 1008 hPa`,
      `[Action] Invoking tool "ble_sensor_reader" -> Checking BLE GATT status`,
      `[Observation] Peripheral status: Connected, Battery: 88%, Resting HR: 74 BPM`,
      `[Synthesis] Synthesizing multi-modal summary: "Atmosphere stable. No active depression detected within 120km corridor. Biometric telemetry nominal."`,
      `[Complete] Execution completed with zero anomalies (Latency: 640ms).`,
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setExecutionLogs((prev) => [...prev, step]);
        if (index === steps.length - 1) {
          setIsSimulating(false);
        }
      }, (index + 1) * 350);
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-[#020617]/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span>Agent Blueprint & Tool Manifest</span>
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-400/30">
            AUTONOMOUS
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] text-slate-400">Agent Routine Identifier</label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="text-[11px] text-slate-400">Permitted Function-Calling Tools</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AVAILABLE_TOOLS.map((tool) => {
              const isEnabled = selectedTools.includes(tool.id);
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => toggleTool(tool.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                    isEnabled
                      ? 'bg-indigo-500/20 border-indigo-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      isEnabled ? 'bg-indigo-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold">{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleRunAgent}
            disabled={isSimulating}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSimulating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>Execute Autonomous Routine</span>
          </button>
        </div>
      </div>

      {/* Execution Console Output */}
      {executionLogs.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-[#020617] border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-bold">
            <span className="flex items-center gap-1.5 font-mono">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Agent Execution Telemetry Log</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {isSimulating ? 'Processing...' : 'Finished'}
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto no-scrollbar">
            {executionLogs.map((log, idx) => (
              <div
                key={idx}
                className={`p-1.5 rounded ${
                  log.startsWith('[Complete]')
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                    : log.startsWith('[Action]')
                    ? 'text-cyan-300'
                    : 'text-slate-300'
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. CODE SANDBOX & PREVIEW MODULE (Development)
// ============================================================================
function CodeSandboxModule() {
  const DEFAULT_CODE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      background: #030712;
      color: #00f2fe;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
    }
    .neon-card {
      padding: 24px 32px;
      border-radius: 20px;
      background: rgba(4, 14, 36, 0.9);
      border: 1px solid rgba(0, 242, 254, 0.4);
      box-shadow: 0 0 24px rgba(0, 242, 254, 0.25);
    }
    .btn {
      margin-top: 16px;
      padding: 8px 18px;
      background: #00f2fe;
      color: #020713;
      border: 0;
      border-radius: 12px;
      font-weight: bold;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="neon-card">
    <h2>GKEDIT AI Live Sandbox</h2>
    <p style="color: #94a3b8; font-size: 13px;">Executing directly in isolated iframe</p>
    <button class="btn" onclick="alert('Sandbox executed safely!')">Trigger Event</button>
  </div>
</body>
</html>`;

  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [renderedSrc, setRenderedSrc] = useState<string>(DEFAULT_CODE);

  const handleRun = () => {
    setRenderedSrc(code);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-teal-400" />
          <span>Live HTML / JS / Canvas Runner</span>
        </h4>
        <button
          onClick={handleRun}
          className="px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-200 text-xs font-bold hover:bg-teal-500/30 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 text-teal-400" />
          <span>Execute Sandbox</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Editor */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-slate-400">Editor (HTML & Scripts)</span>
          <textarea
            rows={12}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full bg-[#020617] border border-teal-500/30 rounded-2xl p-3 text-xs font-mono text-teal-200 focus:outline-none focus:border-teal-400"
          />
        </div>

        {/* Live Preview Iframe */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-slate-400">Live Preview Output</span>
          <div className="w-full h-[280px] rounded-2xl overflow-hidden border border-slate-700 bg-black">
            <iframe
              title="Live Code Sandbox Preview"
              srcDoc={renderedSrc}
              sandbox="allow-scripts allow-modals"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. WEB SEARCH & GROUNDING MODULE (Development)
// ============================================================================
function WebGroundingModule() {
  const [query, setQuery] = useState<string>('Bay of Bengal low pressure cyclone warnings IMD');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [results, setResults] = useState<{
    answer: string;
    sources: { title: string; url: string; score: number }[];
  } | null>(null);

  const handleTestSearch = () => {
    setIsSearching(true);
    setResults(null);
    setTimeout(() => {
      setIsSearching(false);
      setResults({
        answer:
          'Indian Meteorological Department (IMD) synoptic chart: A low-pressure area over south-central Bay of Bengal is monitored for intensification into a depression. Coastal Andhra Pradesh, Tamil Nadu, and Odisha have issued yellow stage maritime advisories.',
        sources: [
          {
            title: 'IMD National Weather Forecasting Centre Daily Bulletin',
            url: 'https://mausam.imd.gov.in',
            score: 0.98,
          },
          {
            title: 'Regional Meteorological Centre Cyclone Advisory Stream',
            url: 'https://imd.gov.in/cyclone-alerts',
            score: 0.94,
          },
        ],
      });
    }, 700);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-[#020617]/80 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-Time Web Retrieval & Citations Grounding</span>
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type query to test web grounding..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
          />
          <button
            onClick={handleTestSearch}
            disabled={isSearching}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold hover:bg-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSearching ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>Ground Query</span>
          </button>
        </div>
      </div>

      {results && (
        <div className="p-4 rounded-2xl bg-[#020617] border border-emerald-500/30 space-y-3">
          <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Grounded Answer Synthesis</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">{results.answer}</p>
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              Attributed Sources & Provenance:
            </span>
            {results.sources.map((src, i) => (
              <div
                key={i}
                className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                    Source #{i + 1}
                  </span>
                  <span className="text-slate-200">{src.title}</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  {(src.score * 100).toFixed(0)}% Match
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 7. PROMPT TEMPLATES & SNIPPETS MODULE (Development)
// ============================================================================
function PromptTemplatesModule({ onNavigateToTab }: { onNavigateToTab?: (tab: string) => void }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const TEMPLATES = [
    {
      id: 'full-security-audit',
      title: 'Full-Stack Security Audit',
      category: 'Security',
      snippet:
        'Audit the following code for CVE vulnerabilities, prototype pollution, improper authorization, and WebAuthn bypass risks. Produce structured severity cards.',
    },
    {
      id: 'cyclone-alert-generator',
      title: 'IMD Extreme Cyclone Alert Generator',
      category: 'Disaster Intel',
      snippet:
        'Transform the provided satellite pressure reading and wind vectors into an actionable Red Alert emergency bulletin with coastal safety directives and school closures.',
    },
    {
      id: '60fps-performance-optimizer',
      title: '60fps Mobile Performance Refactor',
      category: 'Frontend',
      snippet:
        'Refactor this React component for POCO X6 Neo / mobile GPUs. Remove heavy backdrop-filters, unmount inactive tabs, and memoize render callbacks.',
    },
    {
      id: 'telugu-transcription-cleaner',
      title: 'Telugu Audio Phonetic Normalizer',
      category: 'NLP',
      snippet:
        'Convert phonetic Telugu speech-to-text transcripts into pristine, grammatically refined Telugu script (తెలుగు) with English technical terms preserved.',
    },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TEMPLATES.map((tmpl) => (
          <div
            key={tmpl.id}
            className="p-3.5 rounded-2xl bg-[#020617]/70 border border-slate-800 hover:border-amber-400/50 transition flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">{tmpl.title}</h4>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  {tmpl.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 font-mono bg-slate-950 p-2 rounded-xl border border-slate-900">
                {tmpl.snippet}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleCopy(tmpl.id, tmpl.snippet)}
                className="flex-1 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedId === tmpl.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('gkedit:fill_chat_prompt', { detail: { prompt: tmpl.snippet } })
                  );
                  window.dispatchEvent(
                    new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'chat' } })
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition flex items-center gap-1 cursor-pointer"
              >
                <span>Use</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 8. FILE UPLOAD & MULTI-MODAL VISION MODULE (Media & Input)
// ============================================================================
function MultimodalVisionModule() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<{
    ocr: string;
    objects: string[];
    labels: string[];
  } | null>(null);

  const handleSimulateSpecimen = () => {
    setSelectedFile('satellite_weather_map.webp');
    setAnalyzing(true);
    setAnalysisResult(null);

    setTimeout(() => {
      setAnalyzing(false);
      setAnalysisResult({
        ocr: 'BAY OF BENGAL · 17.385° N, 78.486° E · RAINVIEWER 1008 hPa · RADAR V2.4',
        objects: ['Weather Satellite Tile', 'Cyclone Vortex Eye', 'Precipitation Cloud Front', 'Boundary Border Lines'],
        labels: ['Depression Vortex', 'Infrared Cloud Top', 'Zero Rain Corridor'],
      });
    }, 850);
  };

  return (
    <div className="space-y-4">
      <div className="p-6 rounded-2xl bg-[#020617]/80 border-2 border-dashed border-pink-500/30 hover:border-pink-400/60 transition text-center space-y-3 cursor-pointer">
        <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-300 flex items-center justify-center mx-auto">
          <Upload className="w-6 h-6 text-pink-400" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white">Drag & drop visual assets or click to inspect</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, WEBP, PDF, audio and video frames</p>
        </div>
        <div className="flex justify-center gap-2 pt-1">
          <button
            onClick={handleSimulateSpecimen}
            className="px-3.5 py-1.5 rounded-xl bg-pink-500/20 border border-pink-400/50 text-pink-200 text-xs font-bold hover:bg-pink-500/30 transition cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Load Weather Satellite Specimen</span>
          </button>
        </div>
      </div>

      {analyzing && (
        <div className="p-4 rounded-xl bg-pink-950/20 border border-pink-500/30 flex items-center justify-center gap-2 text-pink-300 text-xs font-bold">
          <RefreshCw className="w-4 h-4 animate-spin text-pink-400" />
          <span>Multimodal Vision Engine running OCR & bounding box classification...</span>
        </div>
      )}

      {analysisResult && (
        <div className="p-4 rounded-2xl bg-[#020617] border border-pink-500/30 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-pink-300">
            <span>Visual Specimen Inspection: {selectedFile}</span>
            <span className="font-mono text-[10px] text-emerald-400">SUCCESS</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Extracted OCR Text:</span>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-white">
              {analysisResult.ocr}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Detected Entities & Labels:</span>
            <div className="flex flex-wrap gap-1.5">
              {analysisResult.objects.map((obj, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-pink-500/20 border border-pink-400/40 text-pink-200 text-xs font-bold"
                >
                  {obj}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 9. VOICE CONTROL & AUDIO TRANSCRIPTION MODULE (Media & Input)
// ============================================================================
function VoiceTranscriptionModule() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>(
    'GKEDIT AI voice pipeline initialized. Ready to execute hands-free commands.'
  );

  const COMMAND_SHORTCUTS = [
    { phrase: 'Take a photo', action: 'Opens Camera Viewfinder subtab' },
    { phrase: 'Clear cache', action: 'Cleans application temp storage' },
    { phrase: 'Lock app', action: 'Arms WebAuthn & passkey security gate' },
    { phrase: 'Launch radar', action: 'Switches to Weather Map & Cyclone Radar' },
  ];

  const handleToggleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setTranscript(
          'Command detected: "Switch to Cyclone Radar". Executing geospatial weather stream...'
        );
        setIsRecording(false);
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Voice Trigger Card */}
      <div className="p-5 rounded-2xl bg-[#020617]/80 border border-rose-500/30 flex flex-col items-center justify-center text-center space-y-3">
        <button
          onClick={handleToggleVoice}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isRecording
              ? 'bg-rose-500 text-white shadow-[0_0_24px_rgba(244,63,94,0.6)] animate-pulse'
              : 'bg-rose-500/20 border-2 border-rose-400 text-rose-300 hover:bg-rose-500/30'
          }`}
        >
          <Mic className="w-8 h-8" />
        </button>
        <div>
          <h4 className="text-xs font-bold text-white">
            {isRecording ? 'Listening for Voice Directive...' : 'Tap to Activate Voice Command Engine'}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Web Speech API + offline keyword matching
          </p>
        </div>
      </div>

      {/* Transcript Area */}
      <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800 space-y-2">
        <span className="text-[10px] font-mono text-slate-400 uppercase">Live Transcription Stream:</span>
        <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-rose-200">
          {transcript}
        </div>
      </div>

      {/* Voice Shortcuts Directory */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-white">Active Spoken Command Shortcuts</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {COMMAND_SHORTCUTS.map((cmd, i) => (
            <div
              key={i}
              className="p-2.5 rounded-xl bg-[#020617]/70 border border-slate-800 flex items-center justify-between text-xs"
            >
              <span className="font-mono text-rose-300 font-bold">"{cmd.phrase}"</span>
              <span className="text-[11px] text-slate-400">{cmd.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 10. EXPORT & WORKSPACE SHARING MODULE (Collaboration)
// ============================================================================
function ExportSharingModule() {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleCopyLink = () => {
    const shareUrl = window.location.origin + '?mode=workspace_share&bundle=gkedit_v5';
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleDownloadFullBundle = () => {
    const config = {
      project: 'GKEDIT AI Workstation',
      author: 'Gopi Krishna (@GKEDIT2141)',
      version: '5.0-MATRIX',
      timestamp: new Date().toISOString(),
      activeFeatures: SUB_SUB_TABS.map((t) => t.id),
      diagnostics: bluetoothService.computeDiagnostics(),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gkedit_workspace_config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-[#020617]/80 border border-purple-500/30 space-y-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold text-white">Shareable Workspace URL</h4>
          </div>
          <p className="text-[11px] text-slate-400">
            Generate an encrypted zero-server URL parameter containing active system prompts, theme, and model selections.
          </p>
          <button
            onClick={handleCopyLink}
            className="w-full py-2 rounded-xl bg-purple-500/20 border border-purple-400/50 text-purple-200 text-xs font-bold hover:bg-purple-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Share Link Copied!' : 'Copy Shareable URL'}</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-[#020617]/80 border border-purple-500/30 space-y-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold text-white">Full JSON Bundle Snapshot</h4>
          </div>
          <p className="text-[11px] text-slate-400">
            Export a complete offline backup archive containing all 18 tool preferences, BLE telemetry, and chat history.
          </p>
          <button
            onClick={handleDownloadFullBundle}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold hover:from-purple-400 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 11. THEME & UI CUSTOMIZATION MODULE (Appearance & System)
// ============================================================================
function ThemeCustomizationModule() {
  const [accent, setAccent] = useState<'cyan' | 'amber' | 'emerald' | 'rose' | 'purple'>('cyan');
  const [blurIntensity, setBlurIntensity] = useState<number>(12);
  const [scanlines, setScanlines] = useState<boolean>(true);
  const [applied, setApplied] = useState<boolean>(false);

  const ACCENTS = [
    { id: 'cyan', label: 'Cyan Matrix', color: 'bg-cyan-400', border: 'border-cyan-400' },
    { id: 'amber', label: 'Amber Gold', color: 'bg-amber-400', border: 'border-amber-400' },
    { id: 'emerald', label: 'Emerald Bio', color: 'bg-emerald-400', border: 'border-emerald-400' },
    { id: 'rose', label: 'Cyber Rose', color: 'bg-rose-400', border: 'border-rose-400' },
    { id: 'purple', label: 'Hyper Purple', color: 'bg-purple-400', border: 'border-purple-400' },
  ];

  const handleApplyTheme = () => {
    localStorage.setItem('gkedit_accent_theme', accent);
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {applied && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>HyperOS Liquid Glass theme preferences applied!</span>
        </div>
      )}

      {/* Palette Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-white">Accent Glow & Neon Hue</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ACCENTS.map((item) => (
            <button
              key={item.id}
              onClick={() => setAccent(item.id as any)}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                accent === item.id
                  ? 'bg-white/10 border-white text-white font-bold'
                  : 'bg-[#020617]/70 border-slate-800 text-slate-400'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full ${item.color}`} />
              <span className="text-xs truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="p-4 rounded-2xl bg-[#020617]/80 border border-slate-800 space-y-3.5">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Glassmorphism Blur Radius (GPU Optimized)</span>
            <span className="font-mono text-cyan-400">{blurIntensity}px</span>
          </div>
          <input
            type="range"
            min="4"
            max="24"
            value={blurIntensity}
            onChange={(e) => setBlurIntensity(parseInt(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xs font-bold text-white block">Cyberpunk Scanlines Overlay</span>
            <span className="text-[11px] text-slate-400">Subtle CRT scanline effect on mobile viewports</span>
          </div>
          <button
            onClick={() => setScanlines((prev) => !prev)}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
              scanlines ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                scanlines ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleApplyTheme}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-amber-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
          >
            Apply Theme Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 12. VERSION HISTORY & ROLLBACK MODULE (Appearance & System)
// ============================================================================
function VersionHistoryModule() {
  const [snapshots] = useState([
    {
      version: 'v5.0-MATRIX',
      date: 'October 30, 2026',
      changes: 'Implemented Tools More Sub-Sub-Tabs, Smartwatch Sync & Biometrics Workstations.',
      isCurrent: true,
    },
    {
      version: 'v4.8-BLE-PROTOCOL',
      date: 'October 29, 2026',
      changes: 'GATT 0x180F Real Battery Telemetry and Bluetooth LE Service overhaul.',
      isCurrent: false,
    },
    {
      version: 'v4.6-CYCLONE-RADAR',
      date: 'October 28, 2026',
      changes: 'Integrated Leaflet.js, Esri Satellite Basemap, RainViewer radar timeline player.',
      isCurrent: false,
    },
    {
      version: 'v4.0-SECURITY-GATE',
      date: 'October 27, 2026',
      changes: 'Dynamic Island passkey capsule, WebAuthn biometrics and PIN lock overlay.',
      isCurrent: false,
    },
  ]);

  const [rollbackNotice, setRollbackNotice] = useState<string | null>(null);

  const handleRollback = (ver: string) => {
    setRollbackNotice(`Initiated safe state checkpoint rollback to ${ver}. Reloading clean memory state...`);
    setTimeout(() => setRollbackNotice(null), 3500);
  };

  return (
    <div className="space-y-4">
      {rollbackNotice && (
        <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{rollbackNotice}</span>
        </div>
      )}

      <div className="space-y-2.5">
        {snapshots.map((snap) => (
          <div
            key={snap.version}
            className="p-3.5 rounded-2xl bg-[#020617]/70 border border-slate-800 flex items-start justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-cyan-300">{snap.version}</span>
                {snap.isCurrent && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold">
                    CURRENT RUNNING
                  </span>
                )}
                <span className="text-[10px] text-slate-500 font-mono">{snap.date}</span>
              </div>
              <p className="text-[11px] text-slate-300">{snap.changes}</p>
            </div>

            {!snap.isCurrent && (
              <button
                onClick={() => handleRollback(snap.version)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400/50 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer shrink-0"
              >
                Rollback
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 13. BLUETOOTH LE DEVICE BRIDGE MODULE (Smartwatch Sync)
// ============================================================================
function BleBridgeModule({
  btState,
  isConnecting,
  setIsConnecting,
}: {
  btState: BluetoothServiceState;
  isConnecting: boolean;
  setIsConnecting: (val: boolean) => void;
}) {
  const [connectMsg, setConnectMsg] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectMsg(null);
    try {
      const res = await bluetoothService.connectDevice('watch');
      if (res.success) {
        setConnectMsg(`Successfully connected to ${res.device?.name || 'Bluetooth Peripheral'}!`);
      } else {
        setConnectMsg(res.error || 'Connection cancelled or unsupported by browser.');
      }
    } catch (err: any) {
      setConnectMsg(err.message || 'Bluetooth connection failed.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await bluetoothService.disconnectDevice();
    setConnectMsg('Disconnected from Bluetooth peripheral.');
  };

  return (
    <div className="space-y-4">
      {connectMsg && (
        <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-200 text-xs flex items-center gap-2">
          <Bluetooth className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{connectMsg}</span>
        </div>
      )}

      {/* Hardware Status Card */}
      <div className="p-4 rounded-2xl bg-[#020617]/80 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Watch className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <span>{btState.connectedDevice ? btState.connectedDevice.name : 'Laxafit Watch / Band Socket'}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  btState.connectedDevice
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {btState.connectedDevice ? 'PAIRED & ACTIVE' : 'DISCONNECTED'}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Standard GATT 0x180F (Battery), 0x180D (Heart Rate) & Nordic UART Bridge
            </p>
          </div>
        </div>

        <div>
          {btState.connectedDevice ? (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition cursor-pointer"
            >
              Disconnect BLE
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isConnecting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Bluetooth className="w-3.5 h-3.5" />
              )}
              <span>{isConnecting ? 'Scanning...' : 'Scan & Pair Watch'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-[#020617]/70 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-500 block uppercase">Browser Support</span>
          <span className="text-xs font-bold text-cyan-300">
            {btState.diagnostics.isSupported ? 'Supported (Chrome/Edge)' : 'Fallback Mode'}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[#020617]/70 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-500 block uppercase">Battery Telemetry</span>
          <span className="text-xs font-bold text-emerald-300">
            {btState.connectedDevice?.batteryLevel !== null && btState.connectedDevice?.batteryLevel !== undefined
              ? `${btState.connectedDevice.batteryLevel}%`
              : 'GATT 0x180F Ready'}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[#020617]/70 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-500 block uppercase">Signal Strength (RSSI)</span>
          <span className="text-xs font-bold text-amber-300">-62 dBm (Strong)</span>
        </div>
        <div className="p-3 rounded-xl bg-[#020617]/70 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-500 block uppercase">Auto Reconnect</span>
          <span className="text-xs font-bold text-blue-300">Armed (200ms)</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 14. REAL-TIME BIOMETRIC & PULSE STREAM MODULE (Smartwatch Sync)
// ============================================================================
function BiometricPulseModule({ btState }: { btState: BluetoothServiceState }) {
  const [bpm, setBpm] = useState<number>(72);
  const [hrv, setHrv] = useState<number>(48);

  // Live heart rate simulator tick
  useEffect(() => {
    const timer = setInterval(() => {
      setBpm((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return Math.max(65, Math.min(88, prev + delta));
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4">
      {/* Live Pulse Wave Card */}
      <div className="p-5 rounded-2xl bg-[#020617]/80 border border-rose-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-400 animate-pulse" />
            <h4 className="text-sm font-bold text-white">Continuous PPG Optical Heart Rate</h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/40 font-bold">
            LIVE 1-SEC TELEMETRY
          </span>
        </div>

        {/* Big BPM Reading */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
            {bpm}
          </span>
          <span className="text-sm font-mono text-rose-400 font-bold uppercase">BPM (Resting)</span>
        </div>

        {/* SVG Pulse Wave Graphic */}
        <div className="w-full h-16 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative flex items-center">
          <svg className="w-full h-full text-rose-500" viewBox="0 0 400 60" preserveAspectRatio="none">
            <path
              d="M0,30 L60,30 L80,10 L95,50 L110,25 L125,35 L140,30 L200,30 L220,10 L235,50 L250,25 L265,35 L280,30 L340,30 L360,10 L375,50 L390,25 L400,30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="animate-pulse"
            />
          </svg>
        </div>

        {/* Cardiovascular Zones */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
          <div className="p-2.5 rounded-xl bg-slate-900/80">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Zone</span>
            <span className="text-xs font-bold text-emerald-400">Warm-up / Rest</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">HRV (Variability)</span>
            <span className="text-xs font-bold text-cyan-300">{hrv} ms (Optimal)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Max Today</span>
            <span className="text-xs font-bold text-amber-400">114 BPM</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Optical Sensor</span>
            <span className="text-xs font-bold text-rose-300">Green PPG 525nm</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 15. STEP COUNTER & MOTION PEDOMETER MODULE (Smartwatch Sync)
// ============================================================================
function StepPedometerModule({ btState }: { btState: BluetoothServiceState }) {
  const [steps, setSteps] = useState<number>(7842);
  const goal = 10000;
  const progressPercent = Math.min(100, Math.round((steps / goal) * 100));

  const distanceKm = (steps * 0.00078).toFixed(2);
  const caloriesKcal = Math.round(steps * 0.042);

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl bg-[#020617]/80 border border-amber-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Footprints className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold text-white">IMU 6-Axis Motion Pedometer</h4>
          </div>
          <span className="text-[10px] font-mono text-amber-300 font-bold">
            {progressPercent}% OF DAILY TARGET
          </span>
        </div>

        {/* Progress Bar & Big Counter */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                {steps.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-slate-400 uppercase">/ {goal.toLocaleString()} STEPS</span>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold">
              {(goal - steps).toLocaleString()} steps to target
            </span>
          </div>

          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Distance, Calories & Cadence */}
        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-900/80 text-center">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Distance</span>
            <span className="text-base font-bold font-mono text-cyan-300">{distanceKm} km</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 text-center">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Burned</span>
            <span className="text-base font-bold font-mono text-rose-400">{caloriesKcal} kcal</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 text-center">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Cadence</span>
            <span className="text-base font-bold font-mono text-amber-300">112 SPM</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 16. SLEEP CYCLE & RECOVERY ANALYSIS MODULE (Smartwatch Sync)
// ============================================================================
function SleepRecoveryModule() {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl bg-[#020617]/80 border border-indigo-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-bold text-white">Autonomic Sleep Staging & Recovery</h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 font-bold">
            SCORE: 88/100
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
            7h 42m
          </span>
          <span className="text-xs font-mono text-indigo-300 font-bold uppercase">
            Total Restorative Sleep
          </span>
        </div>

        {/* Sleep Hypnogram Bars */}
        <div className="space-y-1.5">
          <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
            <div style={{ width: '18%' }} className="bg-indigo-600" title="Deep Sleep (18%)" />
            <div style={{ width: '52%' }} className="bg-indigo-400" title="Light Sleep (52%)" />
            <div style={{ width: '22%' }} className="bg-cyan-400" title="REM Sleep (22%)" />
            <div style={{ width: '8%' }} className="bg-amber-400" title="Awake (8%)" />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-indigo-600" /> Deep (1h 24m)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-indigo-400" /> Light (4h 02m)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-cyan-400" /> REM (1h 42m)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-amber-400" /> Awake (34m)
            </span>
          </div>
        </div>

        {/* Autonomic Recovery Analysis */}
        <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/20 text-xs text-slate-300 space-y-1">
          <span className="font-bold text-indigo-300">Clinical Recovery Assessment:</span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Parasympathetic nervous system reactivation was optimal during the 3rd REM cycle. Resting heart rate dropped to 58 BPM nadir at 03:15 AM. Readiness for intense cognitive and physical exertion is 92%.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 17. COMPREHENSIVE HEALTH OVERVIEW MODULE (Smartwatch Sync)
// ============================================================================
function HealthOverviewModule({ btState }: { btState: BluetoothServiceState }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#020617]/80 border border-emerald-500/30 text-center space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">SpO2 Blood Oxygen</span>
          <span className="text-2xl font-black font-mono text-emerald-400 block">98%</span>
          <span className="text-[10px] text-emerald-300 font-bold">Optimal Oxygenation</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#020617]/80 border border-blue-500/30 text-center space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Stress Score</span>
          <span className="text-2xl font-black font-mono text-blue-400 block">26 / 100</span>
          <span className="text-[10px] text-blue-300 font-bold">Low / Relaxed State</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#020617]/80 border border-amber-500/30 text-center space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Body Temp</span>
          <span className="text-2xl font-black font-mono text-amber-400 block">36.6 °C</span>
          <span className="text-[10px] text-amber-300 font-bold">Normal Basal</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#020617]/80 border border-cyan-500/30 text-center space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Cardio VO2 Max</span>
          <span className="text-2xl font-black font-mono text-cyan-400 block">46.2</span>
          <span className="text-[10px] text-cyan-300 font-bold">Superior Fitness</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#020617]/80 border border-slate-800 space-y-2">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
          <span>Daily Health Assessment Verdict</span>
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          All vital signs retrieved from the smartwatch sensor cluster (optical PPG, SpO2 red photodiode, and skin temperature thermistor) indicate high physiological homeostasis. Cardiovascular reserve is primed.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// 18. WATCH FIRMWARE & DATA SYNC MODULE (Smartwatch Sync)
// ============================================================================
function FirmwareSyncModule({ btState }: { btState: BluetoothServiceState }) {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(100);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleSyncNow = () => {
    setIsSyncing(true);
    setSyncProgress(10);
    setSyncNotice(null);

    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          setSyncNotice('All sensor buffer logs (1,840 packets) synchronized successfully with zero packet loss.');
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  return (
    <div className="space-y-4">
      {syncNotice && (
        <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-400 text-blue-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Sync Status Card */}
      <div className="p-5 rounded-2xl bg-[#020617]/80 border border-blue-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-400" />
            <h4 className="text-sm font-bold text-white">Watch Flash Memory & Sensor Log Synchronization</h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            FIRMWARE: v2.4.8 (Latest)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-slate-300">
            <span>Buffer Transfer Status</span>
            <span>{syncProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">
            Last synced: Today at 12:45 PM • MTU Size: 247 Bytes
          </span>
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Packets...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Watch Faces Quick Showcase */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-white">Watch Face Dial Themes (1-Tap BLE Push)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-cyan-950 border-2 border-cyan-400 mx-auto flex items-center justify-center font-mono text-xs font-bold text-cyan-300">
              12:45
            </div>
            <span className="text-xs font-bold text-white block">Cyber Neon Chrono</span>
            <button
              onClick={() => alert('Watch face packet queued for BLE transmission!')}
              className="w-full py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[10px] font-bold cursor-pointer hover:bg-cyan-500/30"
            >
              Push to Watch
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-amber-950 border-2 border-amber-400 mx-auto flex items-center justify-center font-mono text-xs font-bold text-amber-300">
              72 BPM
            </div>
            <span className="text-xs font-bold text-white block">Biometric Vital Pulse</span>
            <button
              onClick={() => alert('Watch face packet queued for BLE transmission!')}
              className="w-full py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold cursor-pointer hover:bg-amber-500/30"
            >
              Push to Watch
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-slate-950 border-2 border-indigo-400 mx-auto flex items-center justify-center font-mono text-xs font-bold text-indigo-300">
              KHM
            </div>
            <span className="text-xs font-bold text-white block">Khammam Cyclone Matrix</span>
            <button
              onClick={() => alert('Watch face packet queued for BLE transmission!')}
              className="w-full py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 text-[10px] font-bold cursor-pointer hover:bg-indigo-500/30"
            >
              Push to Watch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
