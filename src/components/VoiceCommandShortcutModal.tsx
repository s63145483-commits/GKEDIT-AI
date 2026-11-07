import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  X,
  Search,
  Sparkles,
  Camera,
  Trash2,
  Lock,
  Flame,
  MessageSquare,
  LayoutGrid,
  CloudSun,
  Newspaper,
  Microscope,
  BookOpen,
  Maximize,
  Sliders,
  PhoneCall,
  Play,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus,
  Radio,
  HelpCircle,
  Activity,
  Layers,
} from 'lucide-react';
import {
  voiceCommandShortcutService,
  VoiceShortcut,
  VoiceShortcutState,
} from '../services/voiceCommandShortcutService.ts';

interface VoiceCommandShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  take_photo: Camera,
  clear_cache: Trash2,
  lock_app: Lock,
  torch_on: Flame,
  torch_off: Flame,
  open_chat: MessageSquare,
  open_dashboard: LayoutGrid,
  open_maps: CloudSun,
  open_news: Newspaper,
  open_biolab: Microscope,
  start_lesson: BookOpen,
  toggle_fullscreen: Maximize,
  open_settings: Sliders,
  show_shortcuts: Mic,
  open_dialer: PhoneCall,
};

const ACTION_OPTIONS = [
  { id: 'take_photo', label: 'Take a Photo (Xiaomi HyperOS Camera & Watermark)' },
  { id: 'clear_cache', label: 'Clear Cache (CacheStorage & Runtime Buffers)' },
  { id: 'lock_app', label: 'Lock App (Security Gate & Biometric Shield)' },
  { id: 'torch_on', label: 'Turn on Flashlight (Rear LED / Screen Torch)' },
  { id: 'torch_off', label: 'Turn off Flashlight' },
  { id: 'open_chat', label: 'Open AI Chat (Focus GK Copilot)' },
  { id: 'open_dashboard', label: 'Go to Dashboard (Origin OS 6 Hub)' },
  { id: 'open_maps', label: 'Cyclone Radar & Maps (Satellite & Timeline)' },
  { id: 'open_news', label: 'Daily Chronicle News (Vintage Newspaper)' },
  { id: 'open_biolab', label: '3D Bio-Lab (Cellular & CRISPR Simulator)' },
  { id: 'start_lesson', label: '2-Minute Language Lesson (Duolingo-style)' },
  { id: 'open_dialer', label: 'Open AI Screen Dialer' },
  { id: 'toggle_fullscreen', label: 'Toggle Fullscreen Mode' },
  { id: 'open_settings', label: 'Open Settings' },
];

export function VoiceCommandShortcutModal({ isOpen, onClose }: VoiceCommandShortcutModalProps) {
  const [serviceState, setServiceState] = useState<VoiceShortcutState>(() =>
    voiceCommandShortcutService.getState()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [testingId, setTestingId] = useState<string | null>(null);

  // New Custom Shortcut Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPhrase, setCustomPhrase] = useState('');
  const [customAction, setCustomAction] = useState('take_photo');
  const [customSpeech, setCustomSpeech] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    const unsub = voiceCommandShortcutService.subscribe(setServiceState);
    return unsub;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = ['All', 'Media & Camera', 'System & Security', 'Navigation', 'Device & Tools'];

  const filteredShortcuts = serviceState.shortcuts.filter((s) => {
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCat;
    const matchesQuery =
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.phrases.some((p) => p.toLowerCase().includes(q));
    return matchesCat && matchesQuery;
  });

  const handleTestShortcut = async (shortcut: VoiceShortcut) => {
    setTestingId(shortcut.id);
    await voiceCommandShortcutService.executeShortcut(shortcut);
    setTimeout(() => {
      setTestingId(null);
    }, 1400);
  };

  const handleAddCustomShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customPhrase.trim()) return;

    voiceCommandShortcutService.addCustomShortcut(
      customName.trim(),
      customPhrase.trim(),
      customAction,
      'System & Security',
      customSpeech.trim() || `Executing ${customName}`
    );

    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setShowAddForm(false);
      setCustomName('');
      setCustomPhrase('');
      setCustomSpeech('');
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-[10px] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#030917]/95 border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.15)] text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Top Specular Sheen */}
        <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none" />

        {/* Header Bar */}
        <div className="p-4 sm:p-5 pb-3 border-b border-cyan-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Mic className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Voice Command Shortcuts
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 border border-cyan-400/30 text-cyan-300">
                  WEB SPEECH API
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Speak phrases like <span className="text-cyan-300 font-semibold">&ldquo;Take a photo&rdquo;</span>, <span className="text-cyan-300 font-semibold">&ldquo;Clear cache&rdquo;</span>, or <span className="text-cyan-300 font-semibold">&ldquo;Lock app&rdquo;</span>.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Microphone Status & Quick Control Ribbon */}
        <div className="px-4 sm:px-5 py-3 bg-[#020612]/90 border-b border-cyan-500/15 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => voiceCommandShortcutService.toggleListening()}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition shadow-md cursor-pointer ${
                serviceState.isListening
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-[0_0_14px_rgba(16,185,129,0.5)] active:scale-95'
                  : 'bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300'
              }`}
            >
              {serviceState.isListening ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950" />
                  </span>
                  <span>Mic Listening Active</span>
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Start Mic Listener</span>
                </>
              )}
            </button>

            {/* Continuous Mode Toggle */}
            <button
              onClick={() => voiceCommandShortcutService.setContinuousMode(!serviceState.continuousMode)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                serviceState.continuousMode
                  ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title="Continuous always-on listening vs Push-to-talk"
            >
              Continuous Mode: {serviceState.continuousMode ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Audio Feedback Toggle */}
            <button
              onClick={() => voiceCommandShortcutService.setAudioFeedback(!serviceState.audioFeedbackEnabled)}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                serviceState.audioFeedbackEnabled
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title="Audio Chimes"
            >
              {serviceState.audioFeedbackEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Voice Confirmation Toggle */}
            <button
              onClick={() => voiceCommandShortcutService.setVoiceConfirmation(!serviceState.voiceConfirmationEnabled)}
              className={`px-2 py-1 rounded-lg border text-[11px] transition cursor-pointer ${
                serviceState.voiceConfirmationEnabled
                  ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title="Speak confirmation feedback aloud"
            >
              Voice Feedback
            </button>
          </div>
        </div>

        {/* Live Recognized Transcript HUD */}
        {(serviceState.isListening || serviceState.lastTranscript) && (
          <div className="px-4 sm:px-5 py-2.5 bg-cyan-950/25 border-b border-cyan-500/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <Radio className={`w-3.5 h-3.5 shrink-0 ${serviceState.status === 'recognizing' ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`} />
              <span className="text-[11px] text-slate-400 shrink-0">Live Audio:</span>
              <span className="font-mono text-cyan-200 truncate">
                {serviceState.lastTranscript ? `"${serviceState.lastTranscript}"` : 'Listening for spoken command...'}
              </span>
            </div>

            {serviceState.status === 'executed' && (
              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 animate-pulse">
                ✓ Executed
              </span>
            )}
            {serviceState.status === 'unmatched' && (
              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                Unknown Command
              </span>
            )}
          </div>
        )}

        {/* Search, Filter Categories & Add Button */}
        <div className="p-3 sm:p-4 space-y-2.5 bg-[#030919]">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shortcuts or spoken phrases (e.g. photo, cache, lock)..."
                className="w-full bg-[#051126] border border-cyan-500/20 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              onClick={() => setShowAddForm((p) => !p)}
              className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Cancel' : 'Add Custom'}</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Shortcut Creator Drawer */}
        {showAddForm && (
          <form
            onSubmit={handleAddCustomShortcut}
            className="p-4 bg-cyan-950/20 border-b border-cyan-500/20 space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Register New Voice Shortcut
              </span>
              {formSuccess && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Shortcut Saved!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Shortcut Name</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Snap Viewfinder"
                  className="w-full bg-[#040e22] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Spoken Trigger Phrase</label>
                <input
                  type="text"
                  required
                  value={customPhrase}
                  onChange={(e) => setCustomPhrase(e.target.value)}
                  placeholder="e.g. shoot photo, instant snap"
                  className="w-full bg-[#040e22] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Target Application Action</label>
                <select
                  value={customAction}
                  onChange={(e) => setCustomAction(e.target.value)}
                  className="w-full bg-[#040e22] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                >
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-[#030919] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Voice Feedback Confirmation (Optional)</label>
                <input
                  type="text"
                  value={customSpeech}
                  onChange={(e) => setCustomSpeech(e.target.value)}
                  placeholder="e.g. Photo captured."
                  className="w-full bg-[#040e22] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 text-slate-950 text-xs font-black shadow-[0_0_12px_rgba(6,182,212,0.4)] active:scale-95 transition"
              >
                Save Shortcut
              </button>
            </div>
          </form>
        )}

        {/* Shortcuts List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-white/5">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <HelpCircle className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">No voice shortcuts match your search.</p>
            </div>
          ) : (
            filteredShortcuts.map((s) => {
              const IconComp = ACTION_ICONS[s.actionId] || Sparkles;
              const isTesting = testingId === s.id;

              return (
                <div
                  key={s.id}
                  className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-300 shrink-0 group-hover:border-cyan-400/50 transition">
                      <IconComp className="w-4 h-4 text-cyan-400" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-200 transition">
                          {s.name}
                        </span>
                        {s.isCustom && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                            CUSTOM
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">• {s.category}</span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-snug">
                        {s.description}
                      </p>

                      {/* Primary Trigger Phrases Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {s.phrases.slice(0, 3).map((p, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-cyan-950/60 border border-cyan-500/30 text-cyan-300"
                          >
                            &ldquo;{p}&rdquo;
                          </span>
                        ))}
                        {s.phrases.length > 3 && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            +{s.phrases.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Test Button & Enable Switch */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pl-12 sm:pl-0">
                    <button
                      type="button"
                      onClick={() => handleTestShortcut(s)}
                      disabled={isTesting}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                        isTesting
                          ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                          : 'bg-white/5 hover:bg-cyan-500/20 border border-cyan-500/25 hover:border-cyan-400/50 text-cyan-300'
                      }`}
                      title="Test this voice shortcut right now"
                    >
                      {isTesting ? (
                        <>
                          <Check className="w-3 h-3 text-slate-950 animate-bounce" />
                          <span>Triggered!</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current text-cyan-400" />
                          <span>Test Command</span>
                        </>
                      )}
                    </button>

                    {/* Enable Toggle */}
                    <button
                      type="button"
                      onClick={() => voiceCommandShortcutService.toggleShortcutEnabled(s.id)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        s.enabled ? 'bg-cyan-500' : 'bg-slate-800'
                      }`}
                      title={s.enabled ? 'Enabled' : 'Disabled'}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          s.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    {/* Delete Custom Shortcut */}
                    {s.isCustom && (
                      <button
                        type="button"
                        onClick={() => voiceCommandShortcutService.deleteCustomShortcut(s.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete custom shortcut"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-3 sm:p-4 bg-[#020612] border-t border-cyan-500/20 flex items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {serviceState.shortcuts.filter((s) => s.enabled).length} of{' '}
              {serviceState.shortcuts.length} shortcuts active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => voiceCommandShortcutService.restoreDefaultShortcuts()}
              className="text-[11px] text-slate-400 hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceCommandShortcutModal;
