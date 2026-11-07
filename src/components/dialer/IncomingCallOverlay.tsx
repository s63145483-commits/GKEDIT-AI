import React from 'react';
import { 
  PhoneIncoming, 
  PhoneOff, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  Bot 
} from 'lucide-react';
import { CallerInfo } from '../../types/telephony.ts';
import { dtmfAudio } from '../../services/dtmfAudio.ts';

interface IncomingCallOverlayProps {
  caller: CallerInfo;
  onScreenWithAi: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallOverlay: React.FC<IncomingCallOverlayProps> = ({
  caller,
  onScreenWithAi,
  onAccept,
  onDecline,
}) => {
  return (
    <div className="fixed inset-x-4 top-4 z-50 max-w-sm sm:max-w-md mx-auto animate-in slide-in-from-top duration-300">
      <div className="liquid-glass-modal-container rounded-3xl p-4 overflow-hidden">
        <div className="liquid-glass-modal-glare" />
        {/* Caller Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${caller.avatarGradient} flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0`}>
              {caller.name.charAt(0)}
            </div>

            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-wider">
                  Incoming Call
                </span>
                {caller.e2eeVerified ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : caller.spamScore && caller.spamScore > 80 ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : null}
              </div>
              <h3 className="text-sm font-bold text-white truncate">{caller.name}</h3>
              <p className="text-[11px] text-slate-400 font-mono truncate">{caller.number}</p>
            </div>
          </div>

          {/* Spam / VIP pill */}
          <div className="shrink-0 text-right">
            {caller.spamScore && caller.spamScore > 80 ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Spam {caller.spamScore}%
              </span>
            ) : caller.e2eeVerified ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Verified
              </span>
            ) : null}
          </div>
        </div>

        {/* 3 Call Actions: Decline, Screen with AI, Accept */}
        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-white/10">
          {/* Decline */}
          <button
            onClick={() => {
              dtmfAudio.playTone(320, 100, 0.1);
              onDecline();
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-semibold active:scale-95 transition-all"
          >
            <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
            <span>Decline</span>
          </button>

          {/* Screen with AI (Primary Smart Feature) */}
          <button
            onClick={() => {
              dtmfAudio.playTone(740, 70, 0.08);
              onScreenWithAi();
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-300/40 text-white text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-spin" />
            <span>Screen AI</span>
          </button>

          {/* Accept */}
          <button
            onClick={() => {
              dtmfAudio.playCallConnected();
              onAccept();
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl hyperos-call-btn text-white text-xs font-bold active:scale-95 transition-all shadow-md"
          >
            <PhoneIncoming className="w-3.5 h-3.5" />
            <span>Answer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
