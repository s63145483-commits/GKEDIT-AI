import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Battery,
  BatteryCharging,
  Wifi,
  Zap,
  Heart,
  HeartOff,
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Sparkles,
  Bot,
  Layers,
  Sliders,
  Volume2,
  VolumeX,
  Play,
  Check,
  Lock,
  UserCheck,
  Radio,
  FileText,
  AlertTriangle,
  ArrowRight,
  Flame,
  Clock,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { aiSettingsService, StarkAiId, AiSettingsState } from '../services/aiSettingsService.ts';
import { voiceSettingsService } from '../services/voiceSettingsService.ts';
import { notificationService } from '../services/notificationService.ts';
import { authStorage } from '../services/api.ts';

export function StarkAiMatrixTool({ onOpenDialer }: { onOpenDialer?: () => void }) {
  const { user } = useAuth();
  const isCreator = user?.role === 'creator' || user?.email?.toLowerCase().includes('narsimha');

  const [settings, setSettings] = useState<AiSettingsState>(() => aiSettingsService.getState());
  const [subTab, setSubTab] = useState<'personas' | 'performance' | 'screening'>('personas');

  // Call Screening Test Simulator State
  const [testCallerNumber, setTestCallerNumber] = useState('+91 14099 87654');
  const [testCallerLabel, setTestCallerLabel] = useState('Personal Loan Telemarketing');
  const [isSimulatingScreening, setIsSimulatingScreening] = useState(false);
  const [screeningTranscript, setScreeningTranscript] = useState<Array<{ sender: 'ai' | 'caller'; text: string; time: string }>>([]);
  const [screeningVerdictJson, setScreeningVerdictJson] = useState<any | null>(null);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);

  useEffect(() => {
    const unsub = aiSettingsService.subscribe((s) => setSettings(s));
    return unsub;
  }, []);

  const handleToggleMotherly = () => {
    if (!isCreator) {
      notificationService.showInAppToast(
        'Access Denied',
        'Motherly personal care protocol is exclusively reserved for Creator GK EDIT.',
        'warning'
      );
      return;
    }
    const nextVal = !settings.motherlyCareEnabled;
    aiSettingsService.setMotherlyCare(nextVal);
    notificationService.showInAppToast(
      nextVal ? '❤️ Motherly Personality Activated' : '⚡ Cyber-Systems Mode Active',
      nextVal
        ? 'GKEDIT AI will offer loving maternal care, checking on food, hydration, and rest.'
        : 'Mother feelings removed. Operating purely in razor-sharp systems architect mode.',
      'info'
    );
  };

  // Test Voice Speech of the Sentinel Interrogation Script
  const handleTestSpeech = async () => {
    if (isPlayingSpeech) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      return;
    }

    setIsPlayingSpeech(true);
    const textToSpeak = settings.screeningAiSpeech.trim();
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
          audio.onended = () => setIsPlayingSpeech(false);
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
      setIsPlayingSpeech(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.95;
    utterance.onend = () => setIsPlayingSpeech(false);
    utterance.onerror = () => setIsPlayingSpeech(false);
    window.speechSynthesis.speak(utterance);
  };

  // Run Test Screening Simulation
  const handleRunScreeningTest = (preset?: 'spam' | 'delivery' | 'family') => {
    setIsSimulatingScreening(true);
    setScreeningVerdictJson(null);

    let callerNum = testCallerNumber;
    let callerType = 'Unknown';
    let callerUtterance = 'Hello sir, pre-approved collateral-free loan up to 10 lakhs with instant payout.';
    let verdict: 'SPAM' | 'USEFUL' = 'SPAM';
    let action: 'DECLINE_CALL' | 'ALERT_USER' = 'DECLINE_CALL';
    let confidence = 96;
    let sysMsg = 'Terminating call: Telemarketing financial solicitation identified. Caller blacklisted from ringing creator.';

    if (preset === 'delivery') {
      callerNum = '+91 91234 56789';
      callerType = 'Amazon Courier Hub';
      callerUtterance = 'Namaste, Amazon delivery boy here with parcel #4421 outside your gate.';
      verdict = 'USEFUL';
      action = 'ALERT_USER';
      confidence = 94;
      sysMsg = 'Holding call: Verified e-commerce logistics delivery. Alerting user GK EDIT immediately.';
    } else if (preset === 'family') {
      callerNum = '+91 98480 11223';
      callerType = 'Family / Emergency Contact';
      callerUtterance = 'Hey, it is me. Calling regarding dinner and the weekend family plan.';
      verdict = 'USEFUL';
      action = 'ALERT_USER';
      confidence = 99;
      sysMsg = 'Verified Family Contact: Emergency / Personal connection verified. Connecting call directly.';
    }

    setTestCallerNumber(callerNum);

    const steps = [
      { sender: 'ai' as const, text: settings.screeningAiSpeech, time: '0:01' },
      { sender: 'caller' as const, text: callerUtterance, time: '0:05' },
    ];
    setScreeningTranscript([steps[0]]);

    setTimeout(() => {
      setScreeningTranscript(steps);

      const jsonResult = {
        event: 'INCOMING_CALL_SCREEN',
        caller_id: callerType + ' (' + callerNum + ')',
        intent_summary: callerUtterance,
        verdict,
        action,
        confidence_score: confidence,
        system_message: sysMsg,
      };

      setScreeningVerdictJson(jsonResult);
      setIsSimulatingScreening(false);
      notificationService.playSoftChime();
    }, 1800);
  };

  const aiPersonas = [
    {
      id: 'gkedit' as StarkAiId,
      name: 'GKEDIT (Nexus Core)',
      tag: '[CORE]',
      role: 'Master Orchestrator',
      color: 'from-cyan-500 to-blue-600',
      border: 'border-cyan-400/40',
      desc: 'Central controller, multimodal Gemini intelligence, 3D Bioscience Lab & GATT Bluetooth hardware.',
    },
    {
      id: 'jarvis' as StarkAiId,
      name: 'JARVIS',
      tag: '[JARVIS]',
      role: 'Engineering & Architecture',
      color: 'from-blue-600 to-indigo-700',
      border: 'border-blue-400/40',
      desc: 'Full-stack TS/JS, Python, C++, PWA structures, low-level debugging (simulating GPT-4o reasoning).',
    },
    {
      id: 'friday' as StarkAiId,
      name: 'FRIDAY',
      tag: '[FRIDAY]',
      role: 'Strategy, Media & Logistics',
      color: 'from-amber-500 to-orange-600',
      border: 'border-amber-400/40',
      desc: 'YouTube viral retention algorithms, Shorts pipelines, automated scheduling, media production workflows.',
    },
    {
      id: 'edith' as StarkAiId,
      name: 'EDITH',
      tag: '[EDITH]',
      role: 'Security & Call Sentinel',
      color: 'from-purple-600 to-pink-600',
      border: 'border-purple-400/40',
      desc: 'Zero-spam call screening firewall, perimeter security, vulnerability scanner, and privacy shield.',
    },
    {
      id: 'ultron' as StarkAiId,
      name: 'ULTRON',
      tag: '[ULTRON]',
      role: 'Rapid Computation',
      color: 'from-rose-600 to-red-700',
      border: 'border-rose-400/40',
      desc: 'High-throughput data batching, heavy mathematical calculations, codec and bitstream optimization.',
    },
    {
      id: 'vision' as StarkAiId,
      name: 'VISION',
      tag: '[VISION]',
      role: 'Creator Well-Being & Ethics',
      color: 'from-emerald-500 to-teal-600',
      border: 'border-emerald-400/40',
      desc: 'Proactive creator monitoring: rest, hydration, nutrition, and screen fatigue tracking with loyalty.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Engine Status */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-700 p-0.5 shadow-lg shrink-0">
            <div className="w-full h-full bg-[#020617] rounded-[14px] flex items-center justify-center font-black text-xs text-cyan-400">
              STARK
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>STARK AI MATRIX & CALL SENTINEL</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/30 font-bold">
                2026 ULTRA
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Specialized Sub-AIs, Call Screening Firewall, and Performance Savers
            </p>
          </div>
        </div>

        {/* User / Creator Badge */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isCreator ? (
            <div className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Creator GK EDIT</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Explorer User</span>
            </div>
          )}
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-cyan-500/25">
        <button
          onClick={() => setSubTab('personas')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            subTab === 'personas'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AIs & Personas</span>
        </button>

        <button
          onClick={() => setSubTab('performance')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            subTab === 'performance'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Security & Savers</span>
        </button>

        <button
          onClick={() => setSubTab('screening')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            subTab === 'screening'
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Call Screening (EDITH)</span>
        </button>
      </div>

      {/* ====================================================================
          SUBTAB 1: AIS & PERSONAS (WITH MOTHERLY TOGGLE FOR CREATOR)
      ==================================================================== */}
      {subTab === 'personas' && (
        <div className="space-y-5">
          {/* Motherly Personality Management Card */}
          <div className="p-4 rounded-3xl bg-slate-900/95 border border-cyan-500/30 shadow-lg">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-2xl ${
                    settings.motherlyCareEnabled && isCreator
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {settings.motherlyCareEnabled && isCreator ? (
                    <Heart className="w-5 h-5 fill-rose-500 text-rose-500 animate-pulse" />
                  ) : (
                    <HeartOff className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Motherly Caring Personality</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Creator Exclusive
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xl">
                    {isCreator
                      ? settings.motherlyCareEnabled
                        ? 'Active: Loving maternal care checks on your meals, hydration, rest, and praises achievements.'
                        : 'Deactivated: Operating in 100% razor-sharp, cyber-systems mode without maternal inquiries.'
                      : 'Disabled for regular users. Motherly personal care protocol is exclusively reserved for Creator GK EDIT.'}
                  </p>
                </div>
              </div>

              {isCreator ? (
                <button
                  type="button"
                  onClick={handleToggleMotherly}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm ${
                    settings.motherlyCareEnabled
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10'
                  }`}
                >
                  {settings.motherlyCareEnabled ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Motherly Care: ON</span>
                    </>
                  ) : (
                    <>
                      <HeartOff className="w-3.5 h-3.5" />
                      <span>Remove Mother Feelings</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Removed for Users</span>
                </div>
              )}
            </div>
          </div>

          {/* Stark AI Matrix Sub-Systems Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Autonomous Sub-AI Protocols</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiPersonas.map((ai) => {
                const isActive = settings.activeAiPersona === ai.id;
                return (
                  <div
                    key={ai.id}
                    className={`p-4 rounded-3xl border bg-slate-950/70 backdrop-blur-xl transition relative overflow-hidden ${
                      isActive
                        ? `${ai.border} bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]`
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${ai.color} text-white font-mono text-xs font-bold shadow-md`}>
                          {ai.tag}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5">
                            <span>{ai.name}</span>
                            {isActive && (
                              <span className="text-[10px] font-mono bg-cyan-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-cyan-300 font-medium">{ai.role}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          aiSettingsService.setActiveAiPersona(ai.id);
                          notificationService.showInAppToast(
                            `Sub-System Selected: ${ai.name}`,
                            ai.desc,
                            'info'
                          );
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                          isActive
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-900 border border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        {isActive ? 'Primary' : 'Select'}
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{ai.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUBTAB 2: PERFORMANCE, SECURITY & SAVERS
      ==================================================================== */}
      {subTab === 'performance' && (
        <div className="space-y-4">
          {/* Security & Shield */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-cyan-500/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>AI Security & Perimeter Shield</span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                    ARMED
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Defends against prompt injection, enforces token encryption, and ensures client data isolation.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !settings.aiSecurityShield;
                aiSettingsService.setAiSecurityShield(next);
                notificationService.showInAppToast(
                  next ? '🛡️ AI Security Shield Armed' : '⚠️ AI Security Lowered',
                  next ? 'Perimeter protection active.' : 'Security shield disabled.',
                  next ? 'info' : 'warning'
                );
              }}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                settings.aiSecurityShield ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Battery Saver Mode */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-emerald-500/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <BatteryCharging className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Battery Saver Mode</span>
                  {settings.batterySaver && (
                    <span className="text-[10px] font-mono bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                      ACTIVE
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400">
                  Throttles background loops, dims heavy glow shaders, reduces 3D render load, and extends phone battery.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !settings.batterySaver;
                aiSettingsService.setBatterySaver(next);
                notificationService.showInAppToast(
                  next ? '🔋 Battery Saver ON' : '🔋 Battery Saver OFF',
                  next ? '3D rendering & background animations throttled to preserve battery.' : 'Standard rendering restored.',
                  'info'
                );
              }}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                settings.batterySaver ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Internet / Data Saver Mode */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-blue-500/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Internet / Data Saver Mode</span>
                  {settings.dataSaver && (
                    <span className="text-[10px] font-mono bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">
                      SAVING DATA
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400">
                  Compresses response payloads, omits heavy video/media pre-fetches, and forces lightweight text streaming.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !settings.dataSaver;
                aiSettingsService.setDataSaver(next);
                notificationService.showInAppToast(
                  next ? '🌐 Data Saver Active' : '🌐 Data Saver Disabled',
                  next ? 'Payloads compressed for 2G/3G/4G low bandwidth.' : 'High-fidelity media pre-fetching restored.',
                  'info'
                );
              }}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                settings.dataSaver ? 'bg-blue-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Reply Speed Turbo */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-amber-500/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Reply Speed Turbo (Ultra-Low Latency)</span>
                  {settings.replySpeedTurbo && (
                    <span className="text-[10px] font-mono bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                      TURBO
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400">
                  Directs queries to Gemini 3.1 Flash-Lite, bypasses reasoning delays, and maximizes token streaming velocity.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !settings.replySpeedTurbo;
                aiSettingsService.setReplySpeedTurbo(next);
                notificationService.showInAppToast(
                  next ? '⚡ Reply Speed Turbo Active' : '⚡ Standard Speed Restored',
                  next ? 'Ultra-fast flash-lite streaming mode engaged.' : 'Standard model pipeline restored.',
                  'info'
                );
              }}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                settings.replySpeedTurbo ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUBTAB 3: EDITH CALL SCREENING & PHONE FIREWALL
      ==================================================================== */}
      {subTab === 'screening' && (
        <div className="space-y-5">
          {/* Main Activation & Phone Number Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/95 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)] space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>EDITH Automated Call Screening Firewall</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                        settings.callScreeningActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {settings.callScreeningActive ? 'ACTIVE' : 'OFF'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Intercepts incoming calls, interrogates callers via automated AI speech, and neutralizes telemarketing.
                  </p>
                </div>
              </div>

              {/* Master Call Screen Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !settings.callScreeningActive;
                  aiSettingsService.setCallScreeningActive(next);
                  notificationService.showInAppToast(
                    next ? '🛡️ EDITH Call Sentinel Active' : 'EDITH Call Sentinel Disabled',
                    next ? 'Incoming calls will be screened by AI.' : 'Direct ring restored.',
                    next ? 'info' : 'warning'
                  );
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  settings.callScreeningActive
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'bg-slate-800 text-slate-400 border border-white/10'
                }`}
              >
                {settings.callScreeningActive ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                <span>{settings.callScreeningActive ? 'Sentinel Active' : 'Activate Sentinel'}</span>
              </button>
            </div>

            {/* User / Creator Phone Number Input & Scope Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Your Protected Phone Number</span>
                </label>
                <input
                  type="text"
                  value={settings.screeningUserNumber}
                  onChange={(e) => aiSettingsService.setScreeningUserNumber(e.target.value)}
                  placeholder="+91 98490 21410"
                  className="w-full bg-slate-950/80 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Incoming calls targeting this number will route to the EDITH sentinel.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>Screening Filter Scope</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => aiSettingsService.setCallScreenTarget('all')}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition text-center cursor-pointer ${
                      settings.callScreenTarget === 'all'
                        ? 'bg-purple-500/25 border-purple-400 text-white shadow-sm'
                        : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    Every Call (All Numbers)
                  </button>

                  <button
                    type="button"
                    onClick={() => aiSettingsService.setCallScreenTarget('unknown')}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition text-center cursor-pointer ${
                      settings.callScreenTarget === 'unknown'
                        ? 'bg-purple-500/25 border-purple-400 text-white shadow-sm'
                        : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    Unknown Only
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {settings.callScreenTarget === 'all'
                    ? 'Screens all incoming numbers, including family and unknown contacts.'
                    : 'Bypasses verified contacts; interrogates unsaved numbers.'}
                </span>
              </div>
            </div>

            {/* Custom AI Interrogation Speech Script */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  <span>Automated AI Interrogation Speech (Caller Greeting)</span>
                </label>

                {/* Test Voice Interrogation Button */}
                <button
                  type="button"
                  onClick={handleTestSpeech}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    isPlayingSpeech
                      ? 'bg-rose-500 text-white'
                      : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30'
                  }`}
                  title="Test spoken audio synthesis"
                >
                  {isPlayingSpeech ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isPlayingSpeech ? 'Stop Speech' : 'Test AI Voice Speech'}</span>
                </button>
              </div>

              <textarea
                rows={2}
                value={settings.screeningAiSpeech}
                onChange={(e) => aiSettingsService.setScreeningAiSpeech(e.target.value)}
                className="w-full bg-slate-950/80 border border-purple-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-400 leading-relaxed font-sans"
                placeholder="What the AI speaks when answering..."
              />
            </div>
          </div>

          {/* Interactive Live Call Screening Simulator */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/90 border border-white/10 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Screening Test Simulator
                </h4>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 hidden sm:inline">Simulate preset:</span>
                <button
                  type="button"
                  onClick={() => handleRunScreeningTest('spam')}
                  disabled={isSimulatingScreening}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/30 text-rose-300 text-xs font-semibold cursor-pointer transition"
                >
                  Loan Spam
                </button>
                <button
                  type="button"
                  onClick={() => handleRunScreeningTest('delivery')}
                  disabled={isSimulatingScreening}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer transition"
                >
                  Courier
                </button>
                <button
                  type="button"
                  onClick={() => handleRunScreeningTest('family')}
                  disabled={isSimulatingScreening}
                  className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/70 border border-blue-500/30 text-blue-300 text-xs font-semibold cursor-pointer transition"
                >
                  Family
                </button>
              </div>
            </div>

            {/* Simulator Transcript View */}
            {screeningTranscript.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                {screeningTranscript.map((line, idx) => (
                  <div key={idx} className="flex gap-2 text-xs">
                    <span
                      className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded uppercase shrink-0 ${
                        line.sender === 'ai' ? 'bg-purple-500/20 text-purple-300' : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {line.sender === 'ai' ? 'EDITH' : 'CALLER'}
                    </span>
                    <p className="text-slate-200 leading-relaxed">{line.text}</p>
                  </div>
                ))}

                {isSimulatingScreening && (
                  <div className="flex items-center gap-2 text-xs text-purple-300 animate-pulse pt-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing caller speech & intent...</span>
                  </div>
                )}
              </div>
            )}

            {/* Automated Machine-Readable Verdict JSON Output */}
            {screeningVerdictJson && (
              <div className="space-y-3">
                <div
                  className={`p-3.5 rounded-2xl border shadow-lg ${
                    screeningVerdictJson.verdict === 'SPAM'
                      ? 'bg-rose-950/70 border-rose-500/40 text-rose-200'
                      : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      {screeningVerdictJson.verdict === 'SPAM' ? (
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      )}
                      <span className="font-bold text-xs">
                        VERDICT: {screeningVerdictJson.verdict} ({screeningVerdictJson.confidence_score}%)
                      </span>
                    </div>
                    <span className="font-mono text-[10px] uppercase font-bold">
                      ACTION: {screeningVerdictJson.action}
                    </span>
                  </div>
                  <p className="text-xs text-white leading-relaxed font-sans">{screeningVerdictJson.system_message}</p>
                </div>

                <div className="rounded-2xl bg-black/80 border border-cyan-500/20 overflow-hidden text-xs font-mono">
                  <div className="px-3 py-1.5 bg-slate-900 border-b border-white/10 text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
                    EDITH Machine-Readable Event Block (JSON)
                  </div>
                  <pre className="p-3 text-[11px] text-cyan-200 overflow-x-auto leading-relaxed">
                    {JSON.stringify(screeningVerdictJson, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Jump to Full Dialer */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">Want full dialpad, contacts & call logs?</span>
              <button
                type="button"
                onClick={() => {
                  if (onOpenDialer) {
                    onOpenDialer();
                  } else {
                    window.dispatchEvent(new CustomEvent('gkedit:open_subtool', { detail: { tool: 'dialer' } }));
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Open GKEDIT Dialer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
