import React, { useState, useRef } from 'react';
import {
  Phone,
  Video,
  Delete,
  Mic,
  Keyboard,
  UserPlus,
  MessageSquare,
  Users,
  Settings,
  Sparkles,
  PhoneCall,
  Volume2,
} from 'lucide-react';
import { GKContact } from '../../types/gkChat.ts';
import { LiquidGlassNav } from '../LiquidGlassNav.tsx';

interface HyperOSDialerBarProps {
  currentContact?: GKContact;
  onCloseDialer: () => void;
  onOpenContacts?: () => void;
  onOpenSettings?: () => void;
  onStartCall?: (number: string, isVideo: boolean) => void;
}

interface DialKey {
  digit: string;
  letters: string;
}

const DIAL_KEYS: DialKey[] = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

// DTMF Tone Frequencies for standard phone dialer
const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
};

export function HyperOSDialerBar({
  currentContact,
  onCloseDialer,
  onOpenContacts,
  onOpenSettings,
  onStartCall,
}: HyperOSDialerBarProps) {
  const [dialedNumber, setDialedNumber] = useState(
    currentContact?.phone ? currentContact.phone.replace(/[^\d+]/g, '') : ''
  );
  const [activeTab, setActiveTab] = useState<'dialer' | 'chat' | 'contacts' | 'settings'>('dialer');
  const [isPressingKey, setIsPressingKey] = useState<string | null>(null);

  // Play realistic DTMF dial tone feedback via Web Audio API
  const playTone = (digit: string) => {
    try {
      const freqs = DTMF_FREQS[digit];
      if (!freqs) return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freqs[0], ctx.currentTime);
      osc2.frequency.setValueAtTime(freqs[1], ctx.currentTime);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.16);
      osc2.stop(ctx.currentTime + 0.16);
    } catch {
      // AudioContext unavailable
    }
  };

  const handleKeyPress = (digit: string) => {
    setIsPressingKey(digit);
    playTone(digit);
    setDialedNumber((prev) => prev + digit);
    setTimeout(() => setIsPressingKey(null), 150);
  };

  const handleDelete = () => {
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  const handleLongPressZero = () => {
    setDialedNumber((prev) => prev + '+');
  };

  const handleCall = (isVideo: boolean = false) => {
    const target = dialedNumber.trim() || currentContact?.phone || '';
    if (!target) return;

    if (onStartCall) {
      onStartCall(target, isVideo);
    } else {
      const clean = target.replace(/[^\d+]/g, '');
      window.location.href = `tel:${clean}`;
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none animate-in slide-in-from-bottom-6 duration-300">
      {/* Floating Translucent Liquid Glass Dialer Card (HyperOS 4 Acrylic Refraction) */}
      <div className="w-full max-w-sm rounded-3xl bg-[#040e24]/85 backdrop-blur-2xl border border-cyan-400/35 shadow-[0_12px_40px_rgba(0,0,0,0.85)] p-4 sm:p-5 flex flex-col items-center gap-3 relative overflow-hidden">
        {/* Top Specular Highlight Glare */}
        <div className="absolute -top-12 left-1/4 right-1/4 h-20 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none" />

        {/* Quick Contact Chip Carousel / Current Contact Indicator */}
        {currentContact && (
          <div className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/25">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-900 ring-1 ring-cyan-400/50 shrink-0">
                <img
                  src={currentContact.avatar}
                  alt={currentContact.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-bold text-white truncate">{currentContact.name}</p>
                <p className="text-[10px] text-cyan-300/80 font-mono truncate">{currentContact.phone}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
              HyperOS 4
            </span>
          </div>
        )}

        {/* Dialed Number Display Bar with Clear Button */}
        <div className="w-full h-11 px-3 rounded-2xl bg-[#020713]/80 border border-cyan-500/30 flex items-center justify-between gap-2 shadow-inner">
          <input
            type="text"
            readOnly
            value={dialedNumber}
            placeholder="Dial number..."
            className="flex-1 bg-transparent text-center font-mono text-base sm:text-lg font-bold text-cyan-200 tracking-wider outline-none placeholder:text-slate-600 truncate"
          />
          {dialedNumber && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition active:scale-90"
              title="Delete digit"
            >
              <Delete className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Circular Minimalist Glass Keys Pad (3x4 Grid) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-[280px] py-1">
          {DIAL_KEYS.map((key) => {
            const isPressed = isPressingKey === key.digit;
            return (
              <button
                key={key.digit}
                type="button"
                onClick={() => handleKeyPress(key.digit)}
                onContextMenu={(e) => {
                  if (key.digit === '0') {
                    e.preventDefault();
                    handleLongPressZero();
                  }
                }}
                className={`w-16 h-13 sm:w-18 sm:h-14 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center transition-all duration-150 backdrop-blur-md cursor-pointer ${
                  isPressed
                    ? 'bg-cyan-500/30 border-cyan-300 scale-95 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                    : 'bg-white/[0.04] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/40 shadow-sm active:scale-95'
                }`}
              >
                <span className="text-base sm:text-lg font-bold text-white leading-none font-mono">
                  {key.digit}
                </span>
                {key.letters && (
                  <span className="text-[8px] font-semibold tracking-widest text-cyan-300/70 mt-0.5">
                    {key.letters}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Material You Google Phone Dialer Elements (Bottom Call Bar) */}
        <div className="w-full flex items-center justify-around pt-1 px-2 border-t border-cyan-500/20">
          {/* Switch Back to Keyboard */}
          <button
            type="button"
            onClick={onCloseDialer}
            className="p-3 rounded-full bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-700/60 text-slate-300 hover:text-cyan-300 transition active:scale-90 shadow-md"
            title="Switch to Keyboard / Chat"
          >
            <Keyboard className="w-5 h-5" />
          </button>

          {/* Primary Material You Glowing Green Call Button */}
          <button
            type="button"
            onClick={() => handleCall(false)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.55)] transition transform hover:scale-105 active:scale-90 cursor-pointer"
            title="Start Audio Phone Call"
          >
            <Phone className="w-6 h-6 fill-slate-950" />
          </button>

          {/* Video Call Button (Google Meet / WhatsApp Video) */}
          <button
            type="button"
            onClick={() => handleCall(true)}
            className="p-3 rounded-full bg-cyan-950/80 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 hover:text-cyan-100 transition active:scale-90 shadow-md"
            title="Start Video Call"
          >
            <Video className="w-5 h-5 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Floating Translucent Pill-Shaped Sub-Navigation Bar at Base */}
      <LiquidGlassNav
        activeId={activeTab}
        className="mt-2.5 px-3 py-1.5 rounded-full border border-cyan-400/40 shadow-[0_4px_24px_rgba(0,0,0,0.7)] flex items-center gap-2 sm:gap-4 z-30"
      >
        <button
          data-nav-id="chat"
          onClick={() => {
            setActiveTab('chat');
            onCloseDialer();
          }}
          className={`liquid-nav-btn flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'chat'
              ? 'text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
          <span>Chat</span>
        </button>

        <button
          data-nav-id="dialer"
          onClick={() => setActiveTab('dialer')}
          className={`liquid-nav-btn flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'dialer'
              ? 'text-emerald-300 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
          <span>Dialer</span>
        </button>

        {onOpenContacts && (
          <button
            data-nav-id="contacts"
            onClick={onOpenContacts}
            className="liquid-nav-btn flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Contacts</span>
          </button>
        )}

        {onOpenSettings && (
          <button
            data-nav-id="settings"
            onClick={onOpenSettings}
            className="liquid-nav-btn flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>Settings</span>
          </button>
        )}
      </LiquidGlassNav>
    </div>
  );
}
