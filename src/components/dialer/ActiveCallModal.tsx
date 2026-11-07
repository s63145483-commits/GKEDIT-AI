import React, { useState, useEffect } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Disc, 
  Grid, 
  ShieldCheck, 
  UserPlus, 
  Sparkles, 
  FileText,
  ChevronDown,
  Pause,
  Play
} from 'lucide-react';
import { CallerInfo, CallRecord } from '../../types/telephony.ts';
import { dtmfAudio } from '../../services/dtmfAudio.ts';

interface ActiveCallModalProps {
  caller: CallerInfo;
  onEndCall: (record?: CallRecord) => void;
}

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  caller,
  onEndCall,
}) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [showInCallKeypad, setShowInCallKeypad] = useState(false);
  const [audioWaves, setAudioWaves] = useState<number[]>([30, 60, 90, 45, 80, 50, 70]);

  // Duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio wave simulator
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOnHold && !isMuted) {
        setAudioWaves(prev => prev.map(() => Math.floor(Math.random() * 80) + 20));
      } else {
        setAudioWaves(prev => prev.map(() => 10));
      }
    }, 150);
    return () => clearInterval(interval);
  }, [isOnHold, isMuted]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleHangUp = () => {
    dtmfAudio.playCallEnded();
    const record: CallRecord = {
      id: `call-${Date.now()}`,
      caller,
      direction: 'outgoing',
      timestamp: 'Just now',
      duration,
      statusTag: 'Verified Caller',
      aiSummary: `WebRTC HD Voice session (${formatTime(duration)}). E2EE Opus 48kHz audio stream.`,
    };
    onEndCall(record);
  };

  return (
    <div className="fixed inset-0 z-50 liquid-glass-modal-backdrop flex flex-col justify-between p-6 animate-in fade-in duration-200 select-none">
      <div className="liquid-glass-modal-glare" />
      {/* Top Bar: Connection & E2EE Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>E2EE DTLS-SRTP 256-Bit</span>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono text-slate-400">
            {isOnHold ? 'ON HOLD' : 'CONNECTED'}
          </span>
        </div>
      </div>

      {/* Center: Caller Details & Soundwave Rings */}
      <div className="flex flex-col items-center justify-center my-auto">
        {/* Pulsing Aura Avatar */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-36 h-36 rounded-full bg-cyan-500/10 animate-ping" />
          <div className="absolute w-28 h-28 rounded-full bg-emerald-500/15 animate-pulse" />

          <div className={`relative w-24 h-24 rounded-full bg-gradient-to-tr ${caller.avatarGradient} flex items-center justify-center text-white font-bold text-3xl shadow-[0_0_35px_rgba(6,182,212,0.4)] border-2 border-white/20`}>
            {caller.name.charAt(0)}
          </div>
        </div>

        {/* Caller Name & Number */}
        <h2 className="text-2xl font-bold text-white tracking-tight mb-1">{caller.name}</h2>
        <p className="text-sm font-mono text-cyan-400 mb-2">{caller.number}</p>
        {caller.company && (
          <p className="text-xs text-slate-400 mb-3">{caller.company}</p>
        )}

        {/* Live Call Duration */}
        <div className="px-4 py-1.5 rounded-full bg-slate-900/90 border border-white/10 text-slate-200 text-sm font-mono tabular-nums tracking-wider shadow-inner">
          {formatTime(duration)}
        </div>

        {/* Live Soundwave Audio Bar */}
        <div className="flex items-end gap-1.5 h-6 mt-4">
          {audioWaves.map((h, i) => (
            <span
              key={i}
              className={`w-1.5 rounded-full transition-all duration-150 ${
                isOnHold ? 'bg-slate-700' : 'bg-gradient-to-t from-emerald-500 to-cyan-400'
              }`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* In-Call Keypad Drawer (if toggled) */}
      {showInCallKeypad && (
        <div className="mb-4 p-3 rounded-2xl hyperos-glass-card max-w-xs mx-auto animate-in slide-in-from-bottom duration-150">
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((d) => (
              <button
                key={d}
                onClick={() => dtmfAudio.playDtmf(d)}
                className="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-mono text-base font-bold active:scale-95 transition-all"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls Grid */}
      <div className="w-full max-w-sm mx-auto space-y-5">
        <div className="grid grid-cols-4 gap-3">
          {/* Mute */}
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              dtmfAudio.playTone(isMuted ? 600 : 400, 40, 0.05);
            }}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 ${
              isMuted ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-900/80 border-white/10 text-slate-300'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5 mb-1 text-amber-400" /> : <Mic className="w-5 h-5 mb-1" />}
            <span className="text-[10px] font-semibold">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Keypad */}
          <button
            onClick={() => setShowInCallKeypad(!showInCallKeypad)}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 ${
              showInCallKeypad ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900/80 border-white/10 text-slate-300'
            }`}
          >
            <Grid className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-semibold">Keypad</span>
          </button>

          {/* Speaker */}
          <button
            onClick={() => {
              setIsSpeaker(!isSpeaker);
              dtmfAudio.playTone(isSpeaker ? 450 : 650, 40, 0.05);
            }}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 ${
              isSpeaker ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900/80 border-white/10 text-slate-300'
            }`}
          >
            {isSpeaker ? <Volume2 className="w-5 h-5 mb-1 text-cyan-400" /> : <VolumeX className="w-5 h-5 mb-1" />}
            <span className="text-[10px] font-semibold">Speaker</span>
          </button>

          {/* Hold */}
          <button
            onClick={() => {
              setIsOnHold(!isOnHold);
              dtmfAudio.playTone(isOnHold ? 600 : 350, 40, 0.05);
            }}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 ${
              isOnHold ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-900/80 border-white/10 text-slate-300'
            }`}
          >
            {isOnHold ? <Play className="w-5 h-5 mb-1 text-amber-400" /> : <Pause className="w-5 h-5 mb-1" />}
            <span className="text-[10px] font-semibold">{isOnHold ? 'Resume' : 'Hold'}</span>
          </button>
        </div>

        {/* Hang Up Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={handleHangUp}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.6)] flex items-center justify-center text-white active:scale-90 transition-all"
            aria-label="End Call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
