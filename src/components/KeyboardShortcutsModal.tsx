import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  X,
  MessageSquare,
  Mic,
  LayoutGrid,
  Microscope,
  Hand,
  Sparkles,
  Command,
  ArrowRight,
  Check,
} from 'lucide-react';
import { keyboardShortcutsService } from '../services/keyboardShortcutsService.ts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const [testedId, setTestedId] = useState<string | null>(null);
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTest = (id: string) => {
    setTestedId(id);
    setTimeout(() => setTestedId(null), 1800);

    if (id === 'focus_chat') {
      onClose();
      keyboardShortcutsService.executeFocusChat();
    } else if (id === 'toggle_wake_word') {
      onClose();
      keyboardShortcutsService.executeActivateWakeWord();
    } else if (id === 'nav_dashboard') {
      onClose();
      keyboardShortcutsService.executeNavDashboard();
    } else if (id === 'nav_biolab') {
      onClose();
      keyboardShortcutsService.executeNavBioLab();
    } else if (id === 'toggle_gesture_hud') {
      keyboardShortcutsService.executeToggleGestureHUD();
    }
  };

  const categories = [
    {
      title: 'AI & Voice Commands',
      items: [
        {
          id: 'focus_chat',
          label: 'Focus Chat Input',
          keys: [isMac ? '⌘' : 'Ctrl', 'K'],
          desc: 'Switch to Chat tab and instantly focus the AI prompt field.',
          icon: MessageSquare,
          accent: 'from-cyan-500 to-blue-600',
        },
        {
          id: 'toggle_wake_word',
          label: 'Activate Wake-Word (J.A.R.V.I.S)',
          keys: [isMac ? '⌘' : 'Ctrl', 'J'],
          desc: 'Trigger the continuous voice listener and chime without saying wake word.',
          icon: Mic,
          accent: 'from-emerald-500 to-teal-600',
        },
      ],
    },
    {
      title: 'Rapid Navigation',
      items: [
        {
          id: 'nav_dashboard',
          label: 'Dashboard Home',
          keys: [isMac ? '⌘' : 'Ctrl', 'D'],
          desc: 'Jump back to the central widget launcher and dashboard.',
          icon: LayoutGrid,
          accent: 'from-blue-500 to-indigo-600',
        },
        {
          id: 'nav_biolab',
          label: 'Bioscience Lab (3D Study)',
          keys: [isMac ? '⌘' : 'Ctrl', 'B'],
          desc: 'Launch the interactive 3D cellular and molecular biology lab.',
          icon: Microscope,
          accent: 'from-emerald-400 to-cyan-500',
        },
      ],
    },
    {
      title: 'Tools & Accessibility',
      items: [
        {
          id: 'toggle_gesture_hud',
          label: 'Toggle Gesture OS HUD',
          keys: [isMac ? '⌘' : 'Ctrl', 'Shift', 'H'],
          desc: 'Turn on/off webcam-based MediaPipe hand tracking overlay.',
          icon: Hand,
          accent: 'from-amber-500 to-orange-600',
        },
        {
          id: 'show_shortcuts',
          label: 'Open Shortcuts Cheat Sheet',
          keys: [isMac ? '⌘' : 'Ctrl', '/'],
          desc: 'Display this hotkeys reference guide anytime.',
          icon: Keyboard,
          accent: 'from-violet-500 to-purple-600',
        },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 liquid-glass-modal-backdrop animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl liquid-glass-modal-container p-5 sm:p-6 space-y-5 text-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="liquid-glass-modal-glare" />
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: 'var(--accent-bg-subtle, rgba(6, 182, 212, 0.15))',
                border: '1px solid var(--accent-border, rgba(6, 182, 212, 0.35))',
                color: 'var(--accent-color-light, #22d3ee)',
              }}
            >
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Global Keyboard Hotkeys
                </h2>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-md font-mono uppercase font-bold"
                  style={{
                    backgroundColor: 'var(--accent-bg-subtle, rgba(6, 182, 212, 0.15))',
                    color: 'var(--accent-color-light, #22d3ee)',
                    border: '1px solid var(--accent-border, rgba(6, 182, 212, 0.35))',
                  }}
                >
                  Active System
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Execute actions instantly without mouse clicks.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Categories */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {categories.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block px-1">
                {cat.title}
              </span>
              <div className="space-y-1.5">
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  const isTested = testedId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-[#040e24]/70 hover:bg-[#061536] border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 group-hover:text-cyan-300 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Key badge group */}
                        <div className="flex items-center gap-1">
                          {item.keys.map((k, kIdx) => (
                            <React.Fragment key={kIdx}>
                              <kbd className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px] font-mono font-bold text-slate-200 shadow-[0_2px_0_rgba(15,23,42,0.8)] min-w-[24px] text-center">
                                {k}
                              </kbd>
                              {kIdx < item.keys.length - 1 && (
                                <span className="text-slate-600 text-xs">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>

                        {/* Interactive trigger / test button */}
                        <button
                          type="button"
                          onClick={() => handleTest(item.id)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                            isTested
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                          }`}
                          title={`Test ${item.label}`}
                        >
                          {isTested ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Fired ✓</span>
                            </>
                          ) : (
                            <>
                              <span>Test</span>
                              <ArrowRight className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Command className="w-3.5 h-3.5 text-cyan-400" />
            <span>Works globally across the entire app, even inside inputs.</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('gkedit:open_voice_shortcuts'));
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice Shortcuts</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-xs transition cursor-pointer"
            >
              Dismiss (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
