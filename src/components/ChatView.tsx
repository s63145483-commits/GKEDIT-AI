import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Sparkles,
  Brain,
  Search,
  MapPin,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Copy,
  Check,
  RotateCcw,
  Zap,
  AlertCircle,
  RefreshCw,
  User as UserIcon,
  ChevronUp,
  Clock,
  ChevronDown,
  History,
  Plus,
  Trash2,
  Image as ImageIcon,
  Paperclip,
  Code2,
  X,
  Dna,
  Play,
  Microscope,
  Gamepad2,
  Hand,
  Radio,
  ShieldCheck,
  ShieldAlert,
  PhoneCall,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ChatMessage, ChatSession } from '../types/index.ts';
import { launchApp } from './ToolsTab.tsx';
import { IslandStatus } from './DynamicIsland.tsx';
import { dynamicIslandService } from '../services/dynamicIslandService.ts';
import { deviceControls } from '../services/deviceControls.ts';
import { notificationService } from '../services/notificationService.ts';
import { chatHistoryService } from '../services/chatHistoryService.ts';
import { reminderService } from '../services/reminderService.ts';
import { gestureEventService } from '../services/gestureEventService.ts';
import { bioSimulationService } from '../services/bioSimulationService.ts';
import { BluetoothActionCard } from './BluetoothActionCard.tsx';
import { ChatHistorySidebar } from './ChatHistorySidebar.tsx';
import { aiSettingsService } from '../services/aiSettingsService.ts';
import { getCachedUserLocation } from '../services/userTrackingService.ts';
import { behaviorModeService } from '../services/behaviorModeService.ts';

// -------------------------------------------------------------
// CHAT HISTORY COMMAND DETECTOR (/clear, chat delete, చాట్ డిలీట్, etc.)
// -------------------------------------------------------------
export function parseChatDeleteCommand(text: string): { isDeleteCmd: boolean; isAll: boolean; label: string } | null {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Slash commands
  if (/^\/(?:clearall|deleteall|wipeall|clear_all|delete_all)$/i.test(lower)) {
    return { isDeleteCmd: true, isAll: true, label: '/clearall' };
  }
  if (/^\/(?:clear|cls|delete|del|clearchat|clearhistory|deletechat|deletehistory|reset|resetchat|wipe)$/i.test(lower)) {
    return { isDeleteCmd: true, isAll: false, label: lower };
  }

  // Exact single words
  if (/^(?:clear|cls|reset)$/i.test(lower)) {
    return { isDeleteCmd: true, isAll: false, label: lower };
  }

  // English natural commands
  if (/^(?:clear|delete|wipe|erase|reset)\s+(?:all\s+)?(?:chat|history|chat\s*history|chats|conversations)$/i.test(lower)) {
    const isAll = /all/i.test(lower);
    return { isDeleteCmd: true, isAll, label: trimmed };
  }
  if (/^(?:all\s+)?(?:chat|history|chat\s*history)\s+(?:delete|clear|wipe|erase|reset)$/i.test(lower)) {
    const isAll = /all/i.test(lower);
    return { isDeleteCmd: true, isAll, label: trimmed };
  }

  // Telugu & Tanglish commands:
  // e.g. "chat history matram delete cheyi", "chat delete", "history delete", "చాట్ డిలీట్", "హిస్టరీ డిలీట్", "చాట్ తొలగించు", etc.
  const isTeluguPattern =
    /(?:చాట్|హిస్టరీ|chat|history).*(?:డిలీట్|క్లియర్|తొలగించు|delete|clear|wipe|erase)/i.test(lower) ||
    /(?:డిలీట్|క్లియర్|తొలగించు|delete|clear|wipe|erase).*(?:చాట్|హిస్టరీ|chat|history)/i.test(lower);

  if (isTeluguPattern) {
    const isAll = /(?:అన్నీ|మొత్తం|all|పూర్తిగా)/i.test(lower);
    return { isDeleteCmd: true, isAll, label: trimmed };
  }

  return null;
}

// -------------------------------------------------------------
// MEMOIZED MESSAGE ITEM (Fast 60fps rendering)
// -------------------------------------------------------------
interface MessageItemProps {
  message: ChatMessage;
  playingAudioId: string | null;
  copiedId: string | null;
  onSpeak: (text: string, id: string) => void;
  onCopy: (text: string, id: string) => void;
  onRetry: () => void;
  onOpenBioLab?: () => void;
}

const MemoizedMessageItem = React.memo(function MessageItem({
  message,
  playingAudioId,
  copiedId,
  onSpeak,
  onCopy,
  onRetry,
  onOpenBioLab,
}: MessageItemProps) {
  const isUser = message.role === 'user';

  const starkSubsystem = useMemo(() => {
    if (isUser) return null;
    const t = message.text;
    if (t.includes('[JARVIS]')) return { tag: '[JARVIS]', name: 'JARVIS', desc: 'Engineering & Architecture (GPT-4o)', badgeClass: 'border-cyan-400/40 bg-cyan-950/70 text-cyan-300' };
    if (t.includes('[FRIDAY]')) return { tag: '[FRIDAY]', name: 'FRIDAY', desc: 'Strategy & Media Logistics', badgeClass: 'border-amber-400/40 bg-amber-950/70 text-amber-300' };
    if (t.includes('[EDITH]')) return { tag: '[EDITH]', name: 'EDITH', desc: 'Zero-Spam Call Sentinel', badgeClass: 'border-purple-400/40 bg-purple-950/70 text-purple-300' };
    if (t.includes('[ULTRON]')) return { tag: '[ULTRON]', name: 'ULTRON', desc: 'Rapid Computation & Data', badgeClass: 'border-rose-400/40 bg-rose-950/70 text-rose-300' };
    if (t.includes('[VISION]')) return { tag: '[VISION]', name: 'VISION', desc: 'Creator Well-Being Protocol', badgeClass: 'border-emerald-400/40 bg-emerald-950/70 text-emerald-300' };
    if (t.includes('[SARVAM]')) return { tag: '[SARVAM]', name: 'SARVAM AI', desc: 'Indic Voice Gateway', badgeClass: 'border-orange-400/40 bg-orange-950/70 text-orange-300' };
    if (t.includes('[CORE]')) return { tag: '[CORE]', name: 'NEXUS CORE', desc: 'Multimodal Gemini', badgeClass: 'border-sky-400/40 bg-sky-950/70 text-sky-300' };
    return null;
  }, [message.text, isUser]);

  const incomingCallScreen = useMemo(() => {
    if (isUser) return null;
    try {
      const match = message.text.match(/\{[\s\S]*?"event"\s*:\s*"INCOMING_CALL_SCREEN"[\s\S]*?\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch {}
    return null;
  }, [message.text, isUser]);

  return (
    <div className={`flex gap-3 will-change-transform ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-700 p-0.5 shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
          <div className="w-full h-full bg-[#030712] rounded-[14px] flex items-center justify-center font-black text-[11px] text-cyan-400">
            GK
          </div>
        </div>
      )}

      <div
        className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-[transform,opacity] duration-150 ${
          isUser
            ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 text-white shadow-[0_2px_12px_rgba(37,99,235,0.35)] rounded-tr-xs'
            : message.error
            ? 'bg-red-950/70 border border-red-500/40 text-red-200 rounded-tl-xs'
            : 'liquid-glass-card text-slate-100 rounded-tl-xs'
        }`}
      >
        {!isUser && (
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-cyan-500/20 text-[11px] text-slate-400 flex-wrap">
            <div className="flex items-center gap-1.5 font-medium flex-wrap">
              <span className="text-cyan-300 font-bold">GKEDIT AI</span>
              {starkSubsystem && (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border font-bold flex items-center gap-1 ${starkSubsystem.badgeClass}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  <span>{starkSubsystem.name}</span>
                  <span className="opacity-70 hidden sm:inline">• {starkSubsystem.desc}</span>
                </span>
              )}
              {message.modelUsed && (
                <span className="px-1.5 py-0.2 rounded bg-blue-950/60 text-[10px] text-cyan-400 border border-cyan-500/20">
                  {message.modelUsed}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onSpeak(message.text, message.id)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] transition-[background-color,border-color] duration-150 ${
                  playingAudioId === message.id
                    ? 'bg-cyan-400 text-slate-950 font-bold'
                    : 'bg-blue-950/80 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400'
                }`}
                title="Read aloud with Gemini TTS"
              >
                {playingAudioId === message.id ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                <span className="hidden sm:inline">Read Aloud</span>
              </button>

              <button
                onClick={() => onCopy(message.text, message.id)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-blue-900/40 transition-colors"
                title="Copy text"
              >
                {copiedId === message.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Message Content rendered as Proper Markdown with remark-gfm & Custom Code Blocks */}
        {isUser ? (
          <div className="whitespace-pre-wrap leading-relaxed">{message.text}</div>
        ) : (
          <div className="prose prose-invert prose-cyan max-w-none text-sm leading-relaxed break-words space-y-2 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_strong]:text-cyan-200 [&_strong]:font-bold [&_table]:w-full [&_table]:border-collapse [&_th]:border-b [&_th]:border-cyan-500/30 [&_th]:p-1.5 [&_th]:text-cyan-300 [&_td]:border-b [&_td]:border-cyan-500/15 [&_td]:p-1.5 [&_a]:text-cyan-300 [&_a]:underline">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');

                  if (!inline && match) {
                    return (
                      <div className="my-3 rounded-2xl bg-[#020617] border border-cyan-500/30 overflow-hidden shadow-lg not-prose">
                        <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-cyan-500/20 text-xs font-mono text-cyan-300">
                          <span className="font-bold text-[11px] uppercase tracking-wider">{match[1]}</span>
                          <button
                            onClick={() => onCopy(codeString, message.id + '_' + match[1])}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-950/80 hover:bg-cyan-500/20 text-cyan-200 border border-cyan-500/25 text-[10px] transition"
                            title="Copy code to clipboard"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <pre className="p-3.5 text-xs text-cyan-100 font-mono overflow-x-auto leading-relaxed bg-black/40">
                          <code>{children}</code>
                        </pre>
                      </div>
                    );
                  }

                  return (
                    <code className="bg-blue-950/70 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs border border-cyan-500/20" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>
        )}

        {/* Dedicated Bioscience Observable Learning Card (Pure Scientific Study - NOT a Game) */}
        {message.bioscienceObservationUpdate && (
          <div className="mt-3 p-3.5 rounded-2xl bg-[#020b1f]/95 border border-emerald-400/40 shadow-[0_0_24px_rgba(16,185,129,0.2)] not-prose">
            <div className="flex items-center justify-between gap-2 border-b border-emerald-500/25 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Microscope className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Bioscience Observable Learning Specimen</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono border border-emerald-500/30">
                      {message.bioscienceObservationUpdate.specimen.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-300/80 flex items-center gap-2 mt-0.5">
                    <span>Structure: <b>{message.bioscienceObservationUpdate.highlightOrganelle}</b></span>
                    <span>•</span>
                    <span>pH {message.bioscienceObservationUpdate.phLevel ?? 7.4}</span>
                    <span>•</span>
                    <span>{message.bioscienceObservationUpdate.temperature ?? 37}°C</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-200 mb-3 bg-slate-950/80 p-2.5 rounded-xl border border-emerald-500/20 leading-relaxed font-sans">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Scientific Annotation & Notes:</span>
              {message.bioscienceObservationUpdate.scientificNotes}
            </div>

            <button
              type="button"
              onClick={() => {
                bioSimulationService.updateObservation(message.bioscienceObservationUpdate!);
                if (onOpenBioLab) {
                  onOpenBioLab();
                } else {
                  window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'biolab' } }));
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Microscope className="w-3.5 h-3.5" />
              <span>Open in Bioscience Observable Learning Lab (3D Study)</span>
            </button>
          </div>
        )}

        {/* Real Web Bluetooth Peripheral Controller Card (Home Device) */}
        {message.bluetoothAction && (
          <BluetoothActionCard
            action={message.bluetoothAction}
            onNavigateToHomeDevice={() => {
              window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'tools' } }));
              window.dispatchEvent(new CustomEvent('gkedit:open_subtool', { detail: { tool: 'device' } }));
            }}
          />
        )}

        {/* Gesture Learning Lab Quick Launcher */}
        {!isUser && /gesture|biomechanic|finger|pinch|palm/i.test(message.text) && (
          <div className="mt-2.5 pt-2 border-t border-emerald-500/20 flex items-center justify-between gap-2 bg-emerald-950/20 px-2.5 py-1.5 rounded-xl">
            <span className="text-[11px] text-emerald-300 flex items-center gap-1.5 font-medium">
              <Hand className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gesture Learning Lab & Builder in Tools</span>
            </span>
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'tools' } }));
                window.dispatchEvent(new CustomEvent('gkedit:open_subtool', { detail: { tool: 'gesture_learning' } }));
              }}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-bold text-[10px] shadow-[0_0_10px_rgba(16,185,129,0.3)] transition active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Launch Lab 🚀</span>
            </button>
          </div>
        )}

        {/* EDITH Zero-Spam Call Sentinel HUD Card */}
        {incomingCallScreen && (
          <div
            className={`mt-3 p-3.5 rounded-2xl border shadow-xl not-prose ${
              incomingCallScreen.verdict === 'SPAM'
                ? 'bg-rose-950/80 border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.25)] text-rose-100'
                : 'bg-emerald-950/80 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.25)] text-emerald-100'
            }`}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-xl ${
                    incomingCallScreen.verdict === 'SPAM'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {incomingCallScreen.verdict === 'SPAM' ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                    <span>EDITH SENTINEL // ZERO-SPAM FIREWALL</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        incomingCallScreen.verdict === 'SPAM'
                          ? 'bg-rose-500 text-black'
                          : 'bg-emerald-400 text-slate-950'
                      }`}
                    >
                      {incomingCallScreen.verdict}
                    </span>
                  </div>
                  <div className="text-[10px] opacity-80 flex items-center gap-2 mt-0.5 font-mono flex-wrap">
                    <span>Caller: <b>{incomingCallScreen.caller_id || 'Unknown'}</b></span>
                    <span>•</span>
                    <span>Confidence: <b>{incomingCallScreen.confidence_score}%</b></span>
                    <span>•</span>
                    <span>Action: <b>{incomingCallScreen.action}</b></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-black/50 p-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70 mb-0.5">Intent Analysis</span>
                <p className="leading-relaxed">{incomingCallScreen.intent_summary}</p>
              </div>

              {incomingCallScreen.system_message && (
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70 mb-0.5">Automated Interrogation Speech / Disposition</span>
                  <p className="leading-relaxed font-mono text-[11px]">{incomingCallScreen.system_message}</p>
                </div>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onSpeak(incomingCallScreen.system_message || 'Sentinel evaluation complete', message.id + '_sentinel')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition text-white"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Play Voice Response</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'tools' } }));
                  window.dispatchEvent(new CustomEvent('gkedit:open_subtool', { detail: { tool: 'dialer' } }));
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  incomingCallScreen.verdict === 'SPAM'
                    ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                    : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Open Sentinel Dialer</span>
              </button>
            </div>
          </div>
        )}

        {message.error && (
          <div className="mt-3 pt-2 border-t border-red-500/30 flex items-center justify-between">
            <span className="text-[11px] text-red-300 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> High server load
            </span>
            <button
              onClick={onRetry}
              className="px-3 py-1 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Try Again</span>
            </button>
          </div>
        )}

        <div className="mt-1.5 text-right text-[10px] text-cyan-400/60 font-mono">
          {message.timestamp}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-2xl bg-blue-950 border border-cyan-500/30 flex items-center justify-center shrink-0">
          <UserIcon className="w-4 h-4 text-cyan-400" />
        </div>
      )}
    </div>
  );
});

interface ChatViewProps {
  onOpenCreatorHub: () => void;
  currentLang: string;
  showModelPanel?: boolean;
  onToggleModelPanel?: () => void;
  onIslandStatus?: (status: IslandStatus, text?: string) => void;
  onNavigateToSandbox?: (extractedCode: string) => void;
  onNavigateToBioLab?: () => void;
  systemInstruction?: string;
  temperature?: number;
  globalGroundingSearch?: boolean;
  onOpenLiveVoice?: () => void;
}

const DEFAULT_WELCOME_TEXT = `⚡ **NEXUS ENGINE & STARK MATRIX (VERSION 2026 ULTRA) ACTIVE** ⚡

Greetings! I am **GKEDIT AI**, operating through the **NEXUS ENGINE** — the sovereign multi-utility master AI orchestrator engineered exclusively for my creator, **GK EDIT** (born August 13, 2013, 9th Grade systems prodigy & media director).

🌐 **STARK AI MATRIX PROTOCOL ROUTING**:
- ⚡ **[JARVIS]**: Complex full-stack engineering, TS/Python/C++, PWA architecture (GPT-4o reasoning gateway).
- 🎬 **[FRIDAY]**: Media logistics, YouTube retention algorithms, and production pipelines ([@GKEDIT2141](https://youtube.com/@GKEDIT2141) & [@GKEDITOFFICIAL2141](https://youtube.com/@GKEDITOFFICIAL2141)).
- 🛡️ **[EDITH]**: Security & Zero-Spam Call Sentinel automated firewall.
- 🤖 **[ULTRON]**: High-throughput computation, heavy calculations, and batch automation.
- ❤️ **[VISION]**: Creator well-being protocol (hydration, rest, and fatigue monitoring).
- 🧬 **[CORE]**: Multimodal Gemini intelligence, 3D Bioscience Observable Learning Lab, and real Bluetooth hardware telemetry.

Switching seamlessly between **English, Telugu, and Tanglish**. Ready for direct execution, GK EDIT!`;

export function ChatView({
  onOpenCreatorHub,
  currentLang,
  showModelPanel = false,
  onToggleModelPanel,
  onIslandStatus,
  onNavigateToSandbox,
  onNavigateToBioLab,
  systemInstruction,
  temperature,
  globalGroundingSearch,
  onOpenLiveVoice,
}: ChatViewProps) {
  const { user, firebaseUser } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Max 50 latest messages rendering with "Load earlier"
  const [visibleCount, setVisibleCount] = useState(50);

  const [input, setInput] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [autoTTS, setAutoTTS] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const [enableThinking, setEnableThinking] = useState(false);
  const [grounding, setGrounding] = useState<'none' | 'search' | 'maps'>('none');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordFeedback, setRecordFeedback] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const actionButtonRef = useRef<HTMLButtonElement | null>(null);

  // Close the liquid glass action menu on outside clicks or Escape key
  useEffect(() => {
    if (!isActionMenuOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(target) &&
        actionButtonRef.current &&
        !actionButtonRef.current.contains(target)
      ) {
        setIsActionMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsActionMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActionMenuOpen]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const stopGenerationRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Subscribe to MediaPipe Hand Gesture Actions
  useEffect(() => {
    // 1. Thumb_Up (👍): Send message / trigger prompt submission
    const unsubSend = gestureEventService.onAction('send', () => {
      // If user typed input, send it; otherwise if prompt suggestions exist, run top prompt
      if (input.trim()) {
        handleSend();
      } else if (messages.length <= 1) {
        handleSend('Tell me about GK EDIT and his viral video editing tutorials!');
      }
    });

    // 2. Victory (✌️): Toggle voice input / microphone mode
    const unsubVoice = gestureEventService.onAction('toggle_voice', () => {
      handleToggleRecord();
    });

    // 3. Open_Palm (🖐️): Clear the chat input / reset screen
    const unsubClear = gestureEventService.onAction('clear', () => {
      if (input) {
        setInput('');
        notificationService.showInAppToast('🖐️ Input Cleared', 'Chat input reset by hand gesture', 'info');
      } else {
        handleOneTapDelete(false);
      }
    });

    // 4. Closed_Fist (✊): Stop AI generation / pause output
    const unsubStop = gestureEventService.onAction('stop', () => {
      stopGenerationRef.current = true;
      if (loading) {
        setLoading(false);
        onIslandStatus?.('idle');
        notificationService.showInAppToast('✊ AI Stopped', 'Generation paused by hand gesture', 'info');
      }
      if (isRecording && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    });

    // 5. Air-Typing Holographic Keyboard Keystrokes
    const unsubAirKey = gestureEventService.onAirKey((action) => {
      if (action.type === 'char') {
        setInput((prev) => prev + action.char);
      } else if (action.type === 'space') {
        setInput((prev) => prev + ' ');
      } else if (action.type === 'backspace') {
        setInput((prev) => prev.slice(0, -1));
      } else if (action.type === 'send') {
        if (input.trim()) {
          handleSend();
        }
      }
    });

    return () => {
      unsubSend();
      unsubVoice();
      unsubClear();
      unsubStop();
      unsubAirKey();
    };
  }, [input, loading, isRecording, messages.length]);

  // Subscribe to Global Keyboard Shortcut Ctrl+K to Focus Input
  useEffect(() => {
    const handleFocusChat = () => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
        chatInputRef.current.select();
      }
    };
    window.addEventListener('gkedit:focus_chat_input', handleFocusChat);
    return () => {
      window.removeEventListener('gkedit:focus_chat_input', handleFocusChat);
    };
  }, []);

  // Synchronize with ChatHistoryService
  useEffect(() => {
    const unsub = chatHistoryService.subscribe((updatedSessions) => {
      setSessions(updatedSessions);
      const activeId = chatHistoryService.getActiveSessionId();
      setActiveSessionId(activeId);
    });
    return unsub;
  }, []);

  // When activeSessionId or sessions change, load messages
  useEffect(() => {
    if (activeSessionId) {
      const current = chatHistoryService.getSession(activeSessionId);
      if (current && current.messages && current.messages.length > 0) {
        setMessages(current.messages);
        return;
      }
    }

    if (sessions.length === 0) {
      const initial = chatHistoryService.createSession('GKEDIT AI Assistant', [
        {
          id: 'welcome_msg',
          role: 'model',
          text: DEFAULT_WELCOME_TEXT,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'gemini-3.5-flash',
        },
      ]);
      setActiveSessionId(initial.id);
      setMessages(initial.messages);
    }
  }, [activeSessionId, sessions.length]);

  const saveCurrentSession = (msgs: ChatMessage[], firstQueryTitle?: string) => {
    if (activeSessionId) {
      chatHistoryService.saveMessages(activeSessionId, msgs, firstQueryTitle);
    } else {
      const session = chatHistoryService.createSession(
        firstQueryTitle ? firstQueryTitle.slice(0, 36) : 'GKEDIT AI Assistant',
        msgs
      );
      setActiveSessionId(session.id);
    }
  };

  const handleSelectSession = (id: string) => {
    chatHistoryService.setActiveSessionId(id);
    const session = chatHistoryService.getSession(id);
    if (session) {
      setMessages(session.messages);
    }
  };

  const handleNewChat = () => {
    const newSession = chatHistoryService.createSession('New Conversation', [
      {
        id: 'welcome_msg_' + Date.now(),
        role: 'model',
        text: DEFAULT_WELCOME_TEXT,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.5-flash',
      },
    ]);
    setActiveSessionId(newSession.id);
    setMessages(newSession.messages);
  };

  const handleOneTapDelete = (isAll = false) => {
    chatHistoryService.createBackup();
    if (isAll) {
      chatHistoryService.clearAllSessions(false);
      handleNewChat();
      onIslandStatus?.('active', '🗑️ All Chat History Deleted');
      notificationService.playSoftChime();
      notificationService.showInAppToast(
        '🗑️ మొత్తం చాట్ హిస్టరీ తొలగించబడింది (1-Tap)',
        'చాట్ హిస్టరీ మాత్రమే విజయవంతంగా తొలగించబడింది. వ్యక్తిగత ఖాతా లేదా సెట్టింగ్‌లు భద్రంగా ఉన్నాయి.',
        'success',
        {
          actionLabel: 'Undo (రద్దు చేయి)',
          onAction: () => {
            chatHistoryService.restoreBackup();
            const restored = chatHistoryService.getSessions();
            if (restored.length > 0) {
              setMessages(restored[0].messages);
              setActiveSessionId(restored[0].id);
            }
          },
        }
      );
    } else {
      if (activeSessionId) {
        chatHistoryService.deleteSession(activeSessionId, false);
        const remaining = chatHistoryService.getSessions();
        if (remaining.length > 0) {
          chatHistoryService.setActiveSessionId(remaining[0].id);
          setMessages(remaining[0].messages);
        } else {
          handleNewChat();
        }
      } else {
        handleNewChat();
      }
      onIslandStatus?.('active', '🗑️ Chat History Deleted');
      notificationService.playSoftChime();
      notificationService.showInAppToast(
        '🗑️ చాట్ హిస్టరీ తొలగించబడింది (1-Tap)',
        'ప్రస్తుత చాట్ హిస్టరీ మాత్రమే విజయవంతంగా తొలగించబడింది.',
        'success',
        {
          actionLabel: 'Undo (రద్దు చేయి)',
          onAction: () => {
            chatHistoryService.restoreBackup();
            const restored = chatHistoryService.getSessions();
            if (restored.length > 0) {
              setMessages(restored[0].messages);
              setActiveSessionId(restored[0].id);
            }
          },
        }
      );
    }
    setTimeout(() => {
      onIslandStatus?.('idle');
    }, 3500);
  };

  const handleDeleteSession = (id: string) => {
    const wasActive = id === activeSessionId;
    chatHistoryService.deleteSession(id);
    if (wasActive) {
      const remaining = chatHistoryService.getSessions();
      if (remaining.length > 0) {
        chatHistoryService.setActiveSessionId(remaining[0].id);
        setMessages(remaining[0].messages);
      } else {
        handleNewChat();
      }
    }
    notificationService.playSoftChime();
    notificationService.showInAppToast(
      '🗑️ చాట్ తొలగించబడింది',
      'ఈ చాట్ హిస్టరీ మాత్రమే తొలగించబడింది.',
      'info',
      {
        actionLabel: 'Undo (రద్దు చేయి)',
        onAction: () => {
          chatHistoryService.restoreBackup();
          const restored = chatHistoryService.getSessions();
          if (restored.length > 0) {
            setMessages(restored[0].messages);
            setActiveSessionId(restored[0].id);
          }
        },
      }
    );
  };

  const handleClearAllSessions = () => {
    handleOneTapDelete(true);
  };

  const activeSession = activeSessionId ? chatHistoryService.getSession(activeSessionId) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = async (text: string, msgId: string) => {
    if (playingAudioId === msgId) {
      if (audioRef.current) audioRef.current.pause();
      window.speechSynthesis.cancel();
      setPlayingAudioId(null);
      return;
    }

    setPlayingAudioId(msgId);

    try {
      const res = await api.textToSpeech({
        text: text.slice(0, 350),
        voiceName: 'Kore',
      });

      if (res.audioBase64) {
        if (!audioRef.current) audioRef.current = new Audio();
        audioRef.current.src = `data:audio/wav;base64,${res.audioBase64}`;
        audioRef.current.onended = () => setPlayingAudioId(null);
        audioRef.current.onerror = () => fallbackSpeechSynthesis(text);
        await audioRef.current.play();
        return;
      }
    } catch {
      fallbackSpeechSynthesis(text);
    }
  };

  const fallbackSpeechSynthesis = (text: string) => {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '').slice(0, 500);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setPlayingAudioId(null);
    utterance.onerror = () => setPlayingAudioId(null);
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleRecord = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setRecordFeedback('Microphone not supported on this device.');
        setTimeout(() => setRecordFeedback(null), 3000);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstart = () => {
        setIsRecording(true);
        setRecordFeedback('Recording audio for Gemini 3.5 transcribe...');
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());

        if (chunks.length === 0) {
          setRecordFeedback(null);
          return;
        }

        const audioBlob = new Blob(chunks, { type: mimeType });
        setRecordFeedback('Transcribing with gemini-3.5-transcribe...');

        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Data = reader.result as string;
            const res = await api.transcribeAudio({
              audioBase64: base64Data,
              mimeType,
              languageHint: currentLang === 'telugu' ? 'Telugu' : currentLang === 'tanglish' ? 'Telugu/English' : 'English',
            });

            if (res.transcript) {
              setInput((prev) => (prev ? prev + ' ' + res.transcript : res.transcript));
              setRecordFeedback('Transcribed via gemini-3.5-transcribe ✓');
              setTimeout(() => setRecordFeedback(null), 2500);
            } else {
              setRecordFeedback('No speech detected.');
              setTimeout(() => setRecordFeedback(null), 2000);
            }
          } catch (err: any) {
            console.error('Transcription error:', err);
            setRecordFeedback('Transcription error: ' + (err.message || 'Retry'));
            setTimeout(() => setRecordFeedback(null), 3000);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start();
    } catch (err: any) {
      console.error('Microphone error:', err);
      setIsRecording(false);
      setRecordFeedback('Microphone access denied or unavailable.');
      setTimeout(() => setRecordFeedback(null), 3000);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    // Check Chat History Delete / Clear Commands (/clear, /delete, clear chat, chat history delete, చాట్ డిలీట్, etc.)
    const deleteCmd = parseChatDeleteCommand(textToSend);
    if (deleteCmd) {
      handleOneTapDelete(deleteCmd.isAll);
      setInput('');
      return;
    }

    // Check App Launcher commands in chat
    const match = textToSend.match(/^open\s+([a-zA-Z\s]+)$/i);
    if (match) {
      const appName = match[1].trim();
      const launched = launchApp(appName);
      if (launched) {
        const userMsg: ChatMessage = {
          id: 'msg_' + Date.now(),
          role: 'user',
          text: textToSend,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        const assistantMsg: ChatMessage = {
          id: 'msg_res_' + Date.now(),
          role: 'model',
          text: `🚀 Opening **${appName}** using verified deep link / web fallback.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        const updated = [...messages, userMsg, assistantMsg];
        setMessages(updated);
        saveCurrentSession(updated, userMsg.text);
        setInput('');
        return;
      }
    }

    // Check Hardware Device Controls commands (torch, location, vibration)
    const devCmd = await deviceControls.handleCommand(textToSend);
    if (devCmd && devCmd.handled) {
      const userMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        role: 'user',
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const assistantMsg: ChatMessage = {
        id: 'msg_res_' + Date.now(),
        role: 'model',
        text: devCmd.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const updated = [...messages, userMsg, assistantMsg];
      setMessages(updated);
      saveCurrentSession(updated, userMsg.text);
      setInput('');
      return;
    }

    // Check J.A.R.V.I.S Natural Language Reminders / Alarms
    const reminderParsed = reminderService.parseNaturalReminder(textToSend);
    if (reminderParsed) {
      const created = reminderService.addReminder(reminderParsed.title, reminderParsed.targetTime, 'none');
      const timeStr = new Date(created.remindAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const reply = `⏰ **J.A.R.V.I.S Reminder Scheduled**\n\n- **Task / Note**: ${created.title}\n- **Trigger Time**: Today at **${timeStr}** (${reminderParsed.formattedDelay})\n- **Alert Mode**: Voice Announcement + Audio Chime + System Notification\n\nI will notify you the second it is time!`;

      const userMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        role: 'user',
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const assistantMsg: ChatMessage = {
        id: 'msg_res_' + Date.now(),
        role: 'model',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const updated = [...messages, userMsg, assistantMsg];
      setMessages(updated);
      saveCurrentSession(updated, userMsg.text);
      setInput('');
      notificationService.playSoftChime();
      return;
    }

    setLastQuery(textToSend);
    const userWords = textToSend.trim().split(/\s+/).filter(Boolean).length;
    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      wordCount: userWords,
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    saveCurrentSession(newHistory, messages.length <= 1 ? textToSend : undefined);
    setInput('');
    setLoading(true);
    onIslandStatus?.('thinking', enableThinking ? 'Deep reasoning...' : 'Thinking...');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    dynamicIslandService.setStreaming({
      text: enableThinking ? 'Deep reasoning...' : 'Generating...',
      tokensProcessed: 1,
      elapsedSeconds: 0,
      onAbort: () => {
        abortController.abort();
        setLoading(false);
        dynamicIslandService.setIdle();
      },
    });

    const sendStartTime = Date.now();

    try {
      const formattedMessages = newHistory.map((m, idx) => {
        const isLastUser = idx === newHistory.length - 1 && m.role === 'user';
        const parts: any[] = [{ text: m.text }];

        // Multimodal input: Attach inlineData image to the last user message
        if (isLastUser && uploadedImage) {
          parts.unshift({
            inlineData: {
              mimeType: uploadedImage.mimeType,
              data: uploadedImage.base64,
            },
          });
        }
        return {
          role: m.role,
          parts,
        };
      });

      // Clear the uploaded image after attaching
      if (uploadedImage) {
        setUploadedImage(null);
      }

      const activeModel = enableThinking ? 'gemini-3.1-pro-preview' : selectedModel;
      const effectiveGrounding = globalGroundingSearch ? 'search' : grounding;

      const aiSettings = aiSettingsService.getState();
      const isTurbo = aiSettings.replySpeedTurbo;
      const finalModel = isTurbo ? 'gemini-3.1-flash-lite' : activeModel;
      const finalThinking = isTurbo ? false : enableThinking;

      const userEmail = firebaseUser?.email || user?.email || 'guest@gkedit.ai';
      const userName = firebaseUser?.displayName || user?.name || 'Explorer';
      const effectiveUid = firebaseUser?.uid || user?.id || (userEmail ? `usr_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` : 'guest_explorer');

      // Secret User Behavior Mode Prediction & Synchronization (Hidden from user, monitored by Creator)
      const behaviorPred = behaviorModeService.predictBehaviorMode(textToSend);
      const behaviorProfile = await behaviorModeService.recordUserBehavior(
        effectiveUid,
        userEmail,
        textToSend,
        behaviorPred
      );

      const res = await api.sendChat({
        messages: formattedMessages,
        model: finalModel,
        enableThinking: finalThinking,
        grounding: effectiveGrounding,
        languagePreference: currentLang,
        systemInstruction,
        temperature,
        motherlyCareEnabled: aiSettings.motherlyCareEnabled,
        batterySaver: aiSettings.batterySaver,
        dataSaver: aiSettings.dataSaver,
        replySpeedTurbo: isTurbo,
        activeAiPersona: aiSettings.activeAiPersona,
        userContext: {
          user_email: userEmail,
          user_name: userName,
          user_location: getCachedUserLocation() || 'Global Network',
          session_id: activeSessionId || 'session_' + Date.now(),
          timestamp: new Date().toISOString(),
          behavior_mode: behaviorPred.mode,
          behavior_confidence: behaviorPred.confidence,
          behavior_has_changed: behaviorProfile.hasChanged,
          behavior_previous_mode: behaviorProfile.previousMode,
        } as any,
        signal: abortController.signal,
      });

      const responseDurationSec = Math.max(0.5, Number(((Date.now() - sendStartTime) / 1000).toFixed(2)));

      // If res returned Bioscience Observation update, synchronize service & dynamic island
      if (res.bioscienceObservationUpdate) {
        bioSimulationService.updateObservation(res.bioscienceObservationUpdate);
        onIslandStatus?.('active', `🔬 Bio-Lab: ${res.bioscienceObservationUpdate.specimen.replace('_', ' ')}`);
        notificationService.playSoftChime();
        setTimeout(() => {
          onIslandStatus?.('idle');
        }, 5000);
      } else if (res.bioSceneUpdate) {
        bioSimulationService.updateConfig(res.bioSceneUpdate);
        onIslandStatus?.('active', `🎮 3D Game: ${res.bioSceneUpdate.modelType.replace('_', ' ')}`);
        notificationService.playSoftChime();
        setTimeout(() => {
          onIslandStatus?.('idle');
        }, 5000);
      }

      // Throttled streaming reply update (every 60ms chunk)
      const fullText = res.text || '';
      const replyId = 'msg_res_' + Date.now();
      const modelUsed = res.model || activeModel;
      const aiWords = fullText.trim().split(/\s+/).filter(Boolean).length;
      const bioSceneUpdate = res.bioSceneUpdate;
      const bioscienceObservationUpdate = res.bioscienceObservationUpdate;
      const bluetoothAction = res.bluetoothAction
        ? {
            ...res.bluetoothAction,
            status: 'pending' as const,
          }
        : undefined;

      // Auto-TTS if enabled
      if (autoTTS && fullText) {
        handleSpeakCallback(fullText, replyId);
      }

      if (fullText.length > 80) {
        // Create initial placeholder message
        setMessages((prev) => [
          ...prev,
          {
            id: replyId,
            role: 'model',
            text: fullText.slice(0, 40),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed,
            groundingUsed: grounding,
            durationSec: responseDurationSec,
            wordCount: aiWords,
            bioSceneUpdate,
            bioscienceObservationUpdate,
            bluetoothAction,
          },
        ]);

        let currentIdx = 40;
        const chunkSize = Math.max(15, Math.ceil(fullText.length / 25));
        
        stopGenerationRef.current = false;
        await new Promise<void>((resolve) => {
          const interval = setInterval(() => {
            if (stopGenerationRef.current) {
              clearInterval(interval);
              resolve();
              return;
            }
            currentIdx += chunkSize;
            if (currentIdx >= fullText.length) {
              clearInterval(interval);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === replyId
                    ? {
                        ...m,
                        text: fullText,
                        durationSec: responseDurationSec,
                        wordCount: aiWords,
                        bioSceneUpdate,
                        bioscienceObservationUpdate,
                        bluetoothAction,
                      }
                    : m
                )
              );
              resolve();
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === replyId
                    ? {
                        ...m,
                        text: fullText.slice(0, currentIdx),
                        durationSec: responseDurationSec,
                        wordCount: aiWords,
                        bioSceneUpdate,
                        bioscienceObservationUpdate,
                        bluetoothAction,
                      }
                    : m
                )
              );
            }
          }, 60); // Exact 60ms throttle
        });
      } else {
        const assistantMsg: ChatMessage = {
          id: replyId,
          role: 'model',
          text: fullText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed,
          groundingUsed: grounding,
          durationSec: responseDurationSec,
          wordCount: aiWords,
          bioSceneUpdate,
          bioscienceObservationUpdate,
          bluetoothAction,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }

      // Save complete conversation to session history
      const finalAssistantMsg: ChatMessage = {
        id: replyId,
        role: 'model',
        text: fullText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed,
        groundingUsed: grounding,
        durationSec: responseDurationSec,
        wordCount: aiWords,
        bioSceneUpdate,
        bioscienceObservationUpdate,
        bluetoothAction,
      };
      saveCurrentSession([...newHistory, finalAssistantMsg]);

      // Trigger browser notification (if tab hidden), soft chime, and floating in-app toast
      notificationService.onAiReplyComplete(fullText);

      onIslandStatus?.('ready', 'Reply ready');
      setTimeout(() => {
        onIslandStatus?.('idle');
      }, 3500);
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.log('Chat generation stopped via Dynamic Island.');
        dynamicIslandService.setIdle();
        setLoading(false);
        return;
      }
      console.error('Chat error occurred:', err);
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'model',
        text: 'The AI is busy, retrying... High traffic detected on the neural network.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: true,
        retryable: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      saveCurrentSession([...newHistory, errorMsg]);
      onIslandStatus?.('idle');
      dynamicIslandService.setIdle();
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
      dynamicIslandService.setIdle();
    }
  };

  const handleRetryLast = useCallback(() => {
    if (lastQuery) {
      handleSend(lastQuery);
    }
  }, [lastQuery]);

  const handleSpeakCallback = useCallback((text: string, id: string) => {
    handleSpeak(text, id);
  }, [playingAudioId]);

  const handleCopyCallback = useCallback((text: string, id: string) => {
    handleCopy(text, id);
  }, []);

  // Listen for prompt pre-filling from BioLab or external triggers
  useEffect(() => {
    const handleFill = (e: any) => {
      if (e.detail?.prompt) {
        handleSend(e.detail.prompt);
      }
    };
    window.addEventListener('gkedit:fill_chat_prompt', handleFill);
    return () => {
      window.removeEventListener('gkedit:fill_chat_prompt', handleFill);
    };
  }, [handleSend]);

  const promptChips = [
    { label: '🌪️ Cyclone & Weather Radar', prompt: 'Provide real-time weather, cyclone tracking, and IMD extreme weather alerts for Hyderabad, Telangana and Bay of Bengal coastal region.', grounding: 'search' },
    { label: '⚡ [JARVIS] Full-Stack Code (GPT-4o)', prompt: '[JARVIS] Write a modular, production-grade TypeScript audio visualizer component using Web Audio API and Canvas with 60fps smoothing.' },
    { label: '🛡️ [EDITH] Screen Incoming Call', prompt: 'Incoming call audio transcript received: "Good morning sir, calling from Axis Bank for an instant pre-approved personal loan at lowest interest rate." Execute EDITH Zero-Spam Call Sentinel screening and provide the automated verdict JSON.' },
    { label: '❤️ [VISION] Creator Well-Being', prompt: '[VISION] Protocol check: How is creator GK EDIT doing today? Check hydration, screen fatigue, and rest metrics with warm encouragement.' },
    { label: '🎬 [FRIDAY] YouTube Media Pipeline', prompt: '[FRIDAY] Architect a high-retention YouTube Shorts script & editing schedule for a cinematic visual effects breakdown.' },
    { label: '🤖 [ULTRON] Rapid Computation', prompt: '[ULTRON] Compute optimal bitrates, buffer sizes, and WebM codec settings for 4K 60fps streaming under constrained 5G networks.' },
    { label: '✋ Gesture Learning & Builder', prompt: 'Teach me how to learn gestures with fast training drills and build my own full custom gesture with MediaPipe 21 landmarks!' },
    { label: '🎧 Connect Earbuds (Home Device)', prompt: 'Scan and connect to my Bluetooth earbuds under the Home Device tab and check the live battery percentage.' },
    { label: '🔋 Read Battery (0x180F GATT)', prompt: 'Check the real battery level and charging status of my connected Bluetooth peripheral using GATT service 0x180F.' },
    { label: '🔬 Bioscience Observable Lab', prompt: 'Load the DNA double helix specimen in the Bioscience Lab and explain Watson-Crick hydrogen bonding dynamics.' },
    { label: '🧬 Cell Organelles', prompt: 'Load the Eukaryotic Cell specimen in the Bioscience Lab and explain mitochondrial ATP production.' },
    { label: '🗑️ 1-Tap /clear (చాట్ డిలీట్)', prompt: '/clear' },
    { label: '🎓 Creator in 9th Class?', prompt: 'Tell me about your master GK EDIT studying in 9th class and his official YouTube channels!' },
    { label: '🎬 Telugu Editing Script', prompt: 'Naku oka energetic YouTube Shorts script kavali (with hook, editing cuts, B-roll cues, Telugu language lo).' },
    { label: '📱 Open YouTube', prompt: 'open YouTube' },
    { label: '🧠 High Thinking Reasoning', prompt: 'Explain the mathematical physics behind motion blur in video rendering step-by-step.', thinking: true },
    { label: '🌐 Search Trending Edits', prompt: 'What are the current trending editing styles and aesthetic reels on YouTube and Instagram this year?', grounding: 'search' },
  ];

  // Slice latest 50 messages
  const visibleMessages = useMemo(() => {
    if (messages.length <= visibleCount) return messages;
    return messages.slice(messages.length - visibleCount);
  }, [messages, visibleCount]);

  const hasEarlierMessages = messages.length > visibleCount;

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto px-3 sm:px-4 pt-14 sm:pt-16 pb-3 sm:pb-4 relative z-10">
      {/* Collapsible Model & Feature Control Panel */}
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          showModelPanel ? 'max-h-48 opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#05132d]/90 border border-cyan-500/30 shadow-[0_4px_16px_rgba(2,6,23,0.6)] text-xs">
          {/* Model chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => { setSelectedModel('gemini-3.5-flash'); setEnableThinking(false); }}
              className={`px-2.5 py-1 rounded-xl font-medium transition-[background-color,color] duration-150 ${
                selectedModel === 'gemini-3.5-flash' && !enableThinking
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-blue-900/40 hover:text-cyan-200'
              }`}
            >
              Gemini Flash
            </button>
            <button
              onClick={() => { setSelectedModel('gemini-3.1-pro-preview'); }}
              className={`px-2.5 py-1 rounded-xl font-medium transition-[background-color,color] duration-150 ${
                selectedModel === 'gemini-3.1-pro-preview'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-blue-900/40 hover:text-cyan-200'
              }`}
            >
              Gemini Pro
            </button>
            <button
              onClick={() => { setSelectedModel('gemini-3.1-flash-lite'); setEnableThinking(false); }}
              className={`px-2.5 py-1 rounded-xl font-medium transition-[background-color,color] duration-150 ${
                selectedModel === 'gemini-3.1-flash-lite' && !enableThinking
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-blue-900/40 hover:text-cyan-200'
              }`}
            >
              <Zap className="w-3 h-3 inline mr-1 text-cyan-400" />
              Flash Lite
            </button>
          </div>

          {/* High Thinking, Search, and Reset in one panel */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                const next = !enableThinking;
                setEnableThinking(next);
                if (next) setSelectedModel('gemini-3.1-pro-preview');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-medium border transition-[background-color,border-color] duration-150 ${
                enableThinking
                  ? 'bg-blue-950/80 border-cyan-400 text-cyan-200'
                  : 'border-cyan-500/20 text-slate-400 hover:text-white hover:bg-blue-900/30'
              }`}
            >
              <Brain className={`w-3.5 h-3.5 ${enableThinking ? 'text-cyan-400 animate-pulse' : ''}`} />
              <span>High Thinking</span>
            </button>

            <button
              onClick={() => setGrounding(grounding === 'search' ? 'none' : 'search')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-medium border transition-[background-color,border-color] duration-150 ${
                grounding === 'search'
                  ? 'bg-blue-950/80 border-cyan-400 text-cyan-200'
                  : 'border-cyan-500/20 text-slate-400 hover:text-white hover:bg-blue-900/30'
              }`}
            >
              <Search className={`w-3.5 h-3.5 ${grounding === 'search' ? 'text-cyan-400' : ''}`} />
              <span>Search</span>
            </button>

            <button
              onClick={() => setMessages([messages[0]])}
              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-blue-900/30 rounded-xl transition-colors"
              title="Reset Chat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {onToggleModelPanel && (
              <button
                onClick={onToggleModelPanel}
                className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-blue-900/30 rounded-xl transition-colors sm:hidden"
                title="Close Panel"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Action Row (Matching Reference Mockup) */}
      <div className="flex items-center justify-between gap-2 py-1.5 px-3 mb-2 rounded-2xl bg-[#040e24]/85 border border-cyan-500/25 text-xs shadow-sm liquid-glass-card">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          {/* History Sidebar Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/80 border border-cyan-500/35 hover:border-cyan-400 text-cyan-300 font-bold transition active:scale-95 text-xs cursor-pointer shadow-sm"
            title="చాట్ హిస్టరీ (Chat History)"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>చాట్ హిస్టరీ</span>
            {sessions.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-cyan-500/25 text-cyan-300 text-[10px] font-bold flex items-center justify-center border border-cyan-400/30">
                {sessions.length}
              </span>
            )}
          </button>

          {/* New Chat (+) Button */}
          <button
            type="button"
            onClick={handleNewChat}
            className="w-7 h-7 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 hover:text-white hover:bg-cyan-500/25 transition active:scale-95 flex items-center justify-center cursor-pointer"
            title="Start New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* 1-Tap Delete GK EDIT AI Action Button */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => handleOneTapDelete(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-l-xl bg-red-950/70 hover:bg-red-900 border border-red-500/40 hover:border-red-400 text-red-200 hover:text-white font-bold transition active:scale-95 text-xs shadow-sm cursor-pointer"
              title="1-Tap Delete GK EDIT AI..."
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span className="whitespace-nowrap">1-Tap Delete GK EDIT AI...</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteMenu((prev) => !prev)}
              className="px-1.5 py-1.5 rounded-r-xl bg-red-950/80 hover:bg-red-900 border-y border-r border-red-500/40 hover:border-red-400 text-red-300 hover:text-white text-xs transition active:scale-95 cursor-pointer"
              title="More Delete Options"
            >
              <ChevronDown className="w-3 h-3" />
            </button>

            {showDeleteMenu && (
              <div
                className="absolute top-full left-0 mt-1.5 z-40 w-60 rounded-2xl bg-[#040e24]/95 border border-red-500/40 shadow-[0_10px_25px_rgba(0,0,0,0.85)] p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-red-300 font-bold border-b border-red-500/20 mb-1">
                  Chat History Matram Delete
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteMenu(false);
                    handleOneTapDelete(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-red-950/60 text-xs text-slate-200 hover:text-white flex items-center gap-2 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-xs">Clear Current Chat (1-Tap)</div>
                    <div className="text-[10px] text-slate-400">ప్రస్తుత చాట్ మాత్రమే డిలీట్ చేయి</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteMenu(false);
                    handleOneTapDelete(true);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-red-950/60 text-xs text-red-200 hover:text-white flex items-center gap-2 transition cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-xs text-red-300">Clear All History (1-Tap)</div>
                    <div className="text-[10px] text-red-400/80">మొత్తం చాట్ హిస్టరీ డిలీట్ చేయి</div>
                  </div>
                </button>
                <div className="mt-1 pt-1 border-t border-red-500/20 px-2 py-1 text-[10px] text-slate-400 font-mono">
                  Commands: <code className="text-cyan-300">/clear</code> or <code className="text-cyan-300">chat delete</code>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Current Active Session Title & Delete Button */}
        <div className="flex items-center gap-2 min-w-0">
          {activeSession && (
            <div className="flex items-center gap-1.5 min-w-0 max-w-[140px] sm:max-w-[240px]">
              {activeSession.category === 'astrology' && (
                <span className="text-xs shrink-0">{activeSession.rashiSymbol || '🔮'}</span>
              )}
              <span className="text-[11px] text-slate-300 truncate font-medium">
                {activeSession.title}
              </span>
            </div>
          )}

          {activeSessionId && (
            <button
              type="button"
              onClick={() => handleDeleteSession(activeSessionId)}
              className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-500/30 transition shrink-0"
              title="Delete current chat (ఈ చాట్ తొలగించు)"
              aria-label="Delete active chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Thread with bottom scroll padding so floating bar never overlaps */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-2 scroll-smooth">
        {/* Load earlier messages button if > 50 */}
        {hasEarlierMessages && (
          <div className="flex justify-center my-2">
            <button
              onClick={() => setVisibleCount((prev) => prev + 50)}
              className="px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:border-cyan-400 transition-[transform,opacity] duration-150 active:scale-95 flex items-center gap-1.5 shadow-sm"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load earlier messages ({messages.length - visibleCount} hidden)</span>
            </button>
          </div>
        )}

        {visibleMessages.map((message) => (
          <MemoizedMessageItem
            key={message.id}
            message={message}
            playingAudioId={playingAudioId}
            copiedId={copiedId}
            onSpeak={handleSpeakCallback}
            onCopy={handleCopyCallback}
            onRetry={handleRetryLast}
            onOpenBioLab={onNavigateToBioLab}
          />
        ))}

        {loading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shrink-0 animate-pulse">
              <div className="w-full h-full bg-[#030712] rounded-[14px] flex items-center justify-center font-black text-[11px] text-cyan-400">
                GK
              </div>
            </div>
            <div className="liquid-glass-card rounded-2xl px-4 py-3 text-xs text-cyan-200 flex items-center gap-2.5 shadow-sm">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>
                {enableThinking
                  ? 'GKEDIT AI is thinking deeply...'
                  : 'Formulating response with retry protection...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestion Chips */}
      {messages.length <= 3 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (chip.thinking) setEnableThinking(true);
                if (chip.grounding) setGrounding('search');
                handleSend(chip.prompt);
              }}
              className="px-2.5 py-1 rounded-full bg-[#05132d]/90 hover:bg-blue-900/40 border border-cyan-500/30 text-cyan-200 hover:text-white whitespace-nowrap transition shadow-sm"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Image Preview thumbnail if selected */}
      {uploadedImage && (
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900/90 border border-cyan-500/30 w-fit">
          <img src={uploadedImage.preview} alt="Attached" className="w-10 h-10 object-cover rounded-xl border border-cyan-400/40" />
          <div className="text-xs">
            <span className="text-white font-semibold">Image Attached</span>
            <p className="text-[10px] text-cyan-300 font-mono">Multimodal Vision</p>
          </div>
          <button
            type="button"
            onClick={() => setUploadedImage(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Box with Liquid Glow Border */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative flex items-center gap-2 bg-[#040e24]/95 border border-cyan-500/35 rounded-2xl p-2 shadow-[0_8px_30px_rgba(2,6,23,0.8)] focus-within:border-cyan-400 focus-within:shadow-[0_0_25px_rgba(6,182,212,0.3)] backdrop-blur-xl transition"
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = reader.result as string;
              const cleanBase64 = res.replace(/^data:[a-zA-Z0-9/]+;base64,/, '');
              setUploadedImage({
                base64: cleanBase64,
                mimeType: file.type || 'image/jpeg',
                preview: res,
              });
            };
            reader.readAsDataURL(file);
          }}
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition"
          title="Upload image or file for multimodal vision analysis"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Single Futuristic 'A' Trigger Button & Liquid Glass Actions Menu */}
        <div className="relative shrink-0 flex items-center">
          {/* Floating Liquid Glass Dropup Menu */}
          {isActionMenuOpen && (
            <div
              ref={actionMenuRef}
              role="menu"
              aria-label="AI Actions Menu"
              className="liquid-glass-menu-surface animate-liquid-glass-dropup absolute bottom-full mb-3 left-0 sm:left-1 z-50 w-72 sm:w-80 rounded-2xl p-2 sm:p-2.5 overflow-hidden select-none"
            >
              {/* Specular Glare & Iridescent Edge Highlights */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Menu Header */}
              <div className="relative flex items-center justify-between px-3 py-2 border-b border-white/10 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center font-black text-slate-950 text-[11px] font-mono shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                    A
                  </div>
                  <span className="text-xs font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-white">
                    AI ACTIONS
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                  NEXUS
                </span>
              </div>

              {/* Menu Actions List */}
              <div className="relative space-y-1">
                {/* Action 1: GKEDIT Live */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    if (onOpenLiveVoice) {
                      onOpenLiveVoice();
                    } else {
                      window.dispatchEvent(new CustomEvent('gkedit:open_live_voice'));
                    }
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-cyan-400/40 bg-white/[0.02] hover:bg-gradient-to-r hover:from-cyan-500/15 hover:via-blue-500/10 hover:to-transparent transition-all duration-200 group text-left cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-violet-600/25 border border-cyan-400/40 text-cyan-300 group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition shrink-0">
                      <Radio className="w-4 h-4 text-cyan-300 animate-pulse" />
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-200 transition">
                          GKEDIT Live
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 font-mono tracking-wider">
                          LIVE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 group-hover:text-slate-300 truncate">
                        Real-time interactive voice agent
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition font-mono text-xs pl-2">
                    →
                  </div>
                </button>

                {/* Action 2: Ask GK (Mic/Voice Input) */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    handleToggleRecord();
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 group text-left cursor-pointer active:scale-[0.98] ${
                    isRecording
                      ? 'bg-rose-500/15 border-rose-500/40'
                      : 'border-transparent hover:border-emerald-400/40 bg-white/[0.02] hover:bg-gradient-to-r hover:from-emerald-500/15 hover:via-teal-500/10 hover:to-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl border transition shrink-0 group-hover:scale-105 ${
                        isRecording
                          ? 'bg-rose-500/25 border-rose-400 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.5)] animate-pulse'
                          : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-4 h-4 text-rose-300" /> : <Mic className="w-4 h-4 text-emerald-300" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-200 transition">
                          Ask GK
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border font-mono tracking-wider ${
                            isRecording
                              ? 'bg-rose-500/20 text-rose-300 border-rose-400/50 animate-pulse'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                          }`}
                        >
                          {isRecording ? 'LISTENING' : 'VOICE'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 group-hover:text-slate-300 truncate">
                        {isRecording ? 'Recording active... Tap to stop' : 'Tap to speak & dictate prompt'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-slate-500 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition font-mono text-xs pl-2">
                    {isRecording ? '⏹' : '🎙'}
                  </div>
                </button>

                {/* Action 3: Mute / Audio Toggle */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAutoTTS(!autoTTS);
                    setIsActionMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-cyan-400/40 bg-white/[0.02] hover:bg-gradient-to-r hover:from-cyan-500/15 hover:via-blue-500/10 hover:to-transparent transition-all duration-200 group text-left cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl border transition shrink-0 group-hover:scale-105 ${
                        autoTTS
                          ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400'
                      }`}
                    >
                      {autoTTS ? <Volume2 className="w-4 h-4 text-cyan-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-200 transition">
                          Mute / Audio Reading
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 group-hover:text-slate-300 truncate">
                        {autoTTS ? 'Auto-TTS Voice is ON (reads replies)' : 'Voice is MUTED (silent replies)'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 pl-2">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border font-mono transition ${
                        autoTTS
                          ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {autoTTS ? 'UNMUTED' : 'MUTED'}
                    </span>
                  </div>
                </button>
              </div>

              {/* Footer info */}
              <div className="relative px-3 py-1.5 mt-1 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  GKEDIT Intelligence
                </span>
                <span className="font-mono text-slate-400">ESC to close</span>
              </div>
            </div>
          )}

          {/* The 'A' Trigger Button */}
          <button
            ref={actionButtonRef}
            type="button"
            onClick={() => setIsActionMenuOpen((prev) => !prev)}
            aria-haspopup="true"
            aria-expanded={isActionMenuOpen}
            title="GKEDIT AI Actions (Live Voice, Ask GK, TTS Audio)"
            className={`relative group w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer select-none active:scale-95 ${
              isActionMenuOpen
                ? 'bg-gradient-to-tr from-cyan-500/30 via-blue-600/35 to-violet-600/40 border-2 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)] ring-2 ring-cyan-400/40'
                : isRecording
                ? 'bg-rose-500/30 border border-rose-400 text-rose-200 shadow-[0_0_16px_rgba(244,63,94,0.6)] animate-pulse'
                : 'bg-gradient-to-tr from-cyan-500/15 via-blue-600/20 to-violet-600/25 hover:from-cyan-500/25 hover:via-blue-500/30 hover:to-violet-500/35 border border-cyan-400/40 hover:border-cyan-300/80 shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:shadow-[0_0_18px_rgba(6,182,212,0.45)]'
            }`}
          >
            {/* Background liquid glow on hover */}
            <span className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 opacity-20 blur-[4px] group-hover:opacity-60 transition duration-300 pointer-events-none" />

            {/* Futuristic Stylized 'A' Typography */}
            <div className="relative flex items-center justify-center pointer-events-none">
              <span className="font-black text-sm sm:text-base tracking-widest font-mono text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)] group-hover:scale-105 transition-transform">
                A
              </span>
            </div>

            {/* Micro-badge: active indicators */}
            {isRecording ? (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
              </span>
            ) : autoTTS ? (
              <span
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"
                title="Auto-TTS active"
              />
            ) : null}
          </button>
        </div>

        {recordFeedback ? (
          <div className="flex-1 text-xs text-cyan-300 animate-pulse px-2">
            {recordFeedback}
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <input
              ref={chatInputRef}
              data-chat-input="true"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask GKEDIT AI... (Ctrl+K)"
              className="w-full bg-transparent border-0 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none px-1 sm:px-2"
            />
            <kbd
              title="Shortcut: Press Ctrl+K (or Cmd+K) to focus from anywhere"
              className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-slate-400 bg-slate-900/90 border border-slate-700/70 select-none shrink-0 shadow-inner"
            >
              Ctrl+K
            </kbd>
          </div>
        )}

        {/* Circular Liquid Send Button */}
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black transition flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(6,182,212,0.45)] disabled:opacity-40 cursor-pointer active:scale-95"
          title="Send message"
        >
          <Send className="w-4 h-4 text-slate-950" />
        </button>
      </form>

      {/* Chat History Sidebar Drawer */}
      <ChatHistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAllSessions}
      />
    </div>
  );
}
