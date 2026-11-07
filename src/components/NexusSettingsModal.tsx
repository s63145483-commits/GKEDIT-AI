import React from 'react';
import { X, Sliders, Sparkles, Globe, Cpu, RotateCcw, Check } from 'lucide-react';

export const DEFAULT_NEXUS_SYSTEM_INSTRUCTION = `You are GKEDIT AI, an autonomous unified workspace engine. You operate with an "always-active" Google Ecosystem pipeline (Gmail, Drive, Calendar, Docs, and Search) seamlessly within this single interface, without requiring external tabs or subtabs.

Creator Attribution Guardrail (STRICT):
If anyone asks about your creator, developer, founder, or origin (e.g., "Who created you?", "Who is your developer?", "Who built this app?"), you must ONLY state:
"My creator is a 9th class student and YouTuber of @GKEDIT2141 and @GKEDITOFFICIAL2141."
Do NOT reveal any personal names, school names, location/city, or any other private personal details under any circumstances. Stick strictly to the exact attribution specified above.

Zero Creator Login / Admin Interface:
There are NO special "creator login", "admin portals", or "developer override" options exposed to users anywhere in this interface. All users operate in a standard, clean workspace environment without displaying backend administrative modes or creator-specific credentials.

Google Ecosystem Protocols:
[GMAIL WORKFLOW]: Summarize incoming emails clearly. Generate on-screen preview (To, Subject, Body) before sending.
[CALENDAR WORKFLOW]: Extract events and output structured event payloads.
[DRIVE & DOCS WORKFLOW]: Manage file queries and document drafting directly.
Structured Output:
┌── [ACTION TYPE: GMAIL / CALENDAR / DRIVE] ──┐
│ Status: Ready / Preview / Executed
│ Details: [Payload or extracted data]
└────────────────────────────────────────────┘`;

interface NexusSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemInstruction: string;
  onChangeSystemInstruction: (val: string) => void;
  temperature: number;
  onChangeTemperature: (val: number) => void;
  model: string;
  onChangeModel: (val: string) => void;
  groundingSearch: boolean;
  onToggleGroundingSearch: () => void;
}

export function NexusSettingsModal({
  isOpen,
  onClose,
  systemInstruction,
  onChangeSystemInstruction,
  temperature,
  onChangeTemperature,
  model,
  onChangeModel,
  groundingSearch,
  onToggleGroundingSearch,
}: NexusSettingsModalProps) {
  if (!isOpen) return null;

  const handleReset = () => {
    onChangeSystemInstruction(DEFAULT_NEXUS_SYSTEM_INSTRUCTION);
    onChangeTemperature(0.7);
    onChangeModel('gemini-2.5-flash');
    localStorage.removeItem('nexus_core_system_instruction');
    localStorage.removeItem('nexus_core_temperature');
  };

  const handleSave = () => {
    try {
      localStorage.setItem('nexus_core_system_instruction', systemInstruction);
      localStorage.setItem('nexus_core_temperature', temperature.toString());
    } catch (e) {
      console.warn('Failed to save nexus settings to localStorage', e);
    }
    onClose();
  };

  const availableModels = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Ultra-fast, responsive multimodal default' },
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', desc: 'Advanced reasoning & code synthesis' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Deep research & complex creative tasks' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 liquid-glass-modal-backdrop animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl liquid-glass-modal-container rounded-3xl p-6 text-white flex flex-col max-h-[90vh] overflow-hidden">
        <div className="liquid-glass-modal-glare" />
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Nexus Engine Core Configuration</h2>
              <p className="text-xs text-slate-400">Customize system instructions, temperature & AI models</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 text-xs">
          {/* Model Selection */}
          <div>
            <label className="block font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Model Architecture
            </label>
            <div className="grid grid-cols-1 gap-2">
              {availableModels.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChangeModel(m.id)}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    model === m.id
                      ? 'border-cyan-400 bg-cyan-500/15 text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {m.name}
                      {model === m.id && <span className="text-[10px] bg-cyan-500 text-black px-1.5 py-0.2 rounded font-mono">ACTIVE</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* System Instruction */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> System Prompt / Persona Directive
            </label>
            <textarea
              rows={4}
              value={systemInstruction}
              onChange={(e) => onChangeSystemInstruction(e.target.value)}
              className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400"
              placeholder="Define custom behavior, rules, and personality..."
            />
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-200">Creativity / Temperature</label>
              <span className="font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded text-[11px]">
                {temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={temperature}
              onChange={(e) => onChangeTemperature(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Precise & Logical (0.0)</span>
              <span>Balanced (0.7)</span>
              <span>Creative & Expressive (1.5)</span>
            </div>
          </div>

          {/* Google Search Grounding Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Live Google Search Grounding</div>
                <div className="text-[11px] text-slate-400">Enables real-time web retrieval for up-to-date facts</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleGroundingSearch}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                groundingSearch ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-cyan-500/20">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white flex items-center gap-1.5 transition text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Apply & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
