import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Wifi, 
  Radio, 
  ChevronDown, 
  Smartphone, 
  Maximize2, 
  Sparkles,
  Zap,
  Volume2
} from 'lucide-react';
import { CallState } from '../../types/telephony.ts';
import { SCREENING_SCENARIOS } from '../../services/aiCallScenarios.ts';

interface HeaderTelephonyBarProps {
  callState: CallState;
  activeScenarioId?: string;
  onTriggerScenario: (scenarioId: string) => void;
  isDeviceFrame: boolean;
  onToggleDeviceFrame: () => void;
}

export const HeaderTelephonyBar: React.FC<HeaderTelephonyBarProps> = ({
  callState,
  onTriggerScenario,
  isDeviceFrame,
  onToggleDeviceFrame,
}) => {
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [waveformBars, setWaveformBars] = useState<number[]>([40, 65, 80, 50, 90, 70, 30, 85, 60]);

  // Dynamic audio frequency simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveformBars(prev => 
        prev.map(() => {
          if (callState === 'active' || callState === 'screening') {
            return Math.floor(Math.random() * 75) + 25; // 25% to 100%
          } else {
            return Math.floor(Math.random() * 20) + 12; // gentle idling
          }
        })
      );
    }, 140);
    return () => clearInterval(interval);
  }, [callState]);

  return (
    <header className="relative z-30 w-full px-4 pt-3 pb-2.5">
      {/* Floating Frosted-Glass HyperOS 4 Bar */}
      <div className="hyperos-glass-card rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-2xl">
        {/* Brand Zone: Strictly "GKEDIT Dialer" */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-sky-500/30 to-blue-600/20 border border-cyan-400/40 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)] shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-ping" />
          </div>
          <div className="truncate">
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
              <span>GKEDIT Dialer</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold tracking-wide">
                AI OS
              </span>
            </h1>
            <p className="text-[10.5px] text-slate-400 font-mono tracking-tight flex items-center gap-1">
              <span>Next-Gen WebRTC Telephony</span>
            </p>
          </div>
        </div>

        {/* Dynamic Telephony Pill: E2EE WebRTC, Signal, Real-Time Waveform */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Audio Waveform Spectrum Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 text-xs">
            <div className="flex items-end gap-0.5 h-4 w-12 px-0.5">
              {waveformBars.map((height, idx) => (
                <span
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    callState === 'active' || callState === 'screening'
                      ? 'bg-gradient-to-t from-emerald-500 to-cyan-400'
                      : 'bg-slate-600'
                  }`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <Volume2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </div>

          {/* E2EE WebRTC Security & Network Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] text-[11px] font-mono text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden xs:inline font-semibold">E2EE 256-Bit</span>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-1 text-slate-300">
              <Wifi className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] text-cyan-300 font-medium">5G Ultra</span>
            </div>
          </div>

          {/* Incoming Call Demo Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-semibold transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)] active:scale-95"
              title="Test Live AI Call Screening"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300/30" />
              <span className="hidden sm:inline">Simulate Incoming Call</span>
              <span className="sm:hidden">Test Call</span>
              <ChevronDown className="w-3 h-3 text-cyan-400" />
            </button>

            {/* Dropdown Scenarios Menu */}
            {showDemoMenu && (
              <div 
                className="absolute right-0 mt-2 w-72 p-2 rounded-2xl hyperos-glass-card shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1.5 border-b border-white/10 mb-1">
                  <p className="text-[11px] font-semibold text-white flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Select Incoming AI Call Test:</span>
                  </p>
                  <p className="text-[10px] text-slate-400">Experience real-time AI Call Screening & Smart Intercepts</p>
                </div>

                <div className="space-y-1">
                  {SCREENING_SCENARIOS.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => {
                        onTriggerScenario(scenario.id);
                        setShowDemoMenu(false);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all text-xs flex items-center justify-between group"
                    >
                      <div className="truncate pr-2">
                        <div className="font-medium text-slate-100 group-hover:text-cyan-300 truncate">
                          {scenario.caller.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {scenario.caller.company || scenario.caller.number}
                        </div>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                        scenario.badge.includes('Spam')
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : scenario.badge.includes('VIP')
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {scenario.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Frame / Fullscreen Toggle */}
          <button
            onClick={onToggleDeviceFrame}
            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-colors"
            title={isDeviceFrame ? 'Expand to Fullscreen' : 'Switch to Mobile Frame'}
            aria-label="Toggle layout mode"
          >
            {isDeviceFrame ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Smartphone className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
