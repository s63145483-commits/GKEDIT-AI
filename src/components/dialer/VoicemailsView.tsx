import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Phone, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Share2, 
  Trash2, 
  Volume2, 
  Clock,
  Voicemail
} from 'lucide-react';
import { VoicemailItem } from '../../types/telephony.ts';
import { dtmfAudio } from '../../services/dtmfAudio.ts';

interface VoicemailsViewProps {
  voicemails: VoicemailItem[];
  onCallBack: (number: string) => void;
}

export const VoicemailsView: React.FC<VoicemailsViewProps> = ({
  voicemails,
  onCallBack,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({});

  const togglePlay = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
      dtmfAudio.playTone(380, 50, 0.05);
    } else {
      setPlayingId(id);
      dtmfAudio.playTone(620, 60, 0.06);

      // Simple playback simulation loop
      const interval = setInterval(() => {
        setPlaybackProgress((prev) => {
          const current = prev[id] || 0;
          if (current >= 100) {
            clearInterval(interval);
            setPlayingId(null);
            return { ...prev, [id]: 0 };
          }
          return { ...prev, [id]: current + (4 * playbackSpeed) };
        });
      }, 200);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
    dtmfAudio.playTone(700, 40, 0.05);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-xl mx-auto px-4 py-2 select-none">
      {/* Tab Header Banner */}
      <div className="flex items-center justify-between px-1 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <Voicemail className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white">Voicemail & AI Audio Transcripts</h2>
            <p className="text-[10px] text-slate-400 font-mono">Neural speech-to-text with action extraction</p>
          </div>
        </div>

        {/* Playback speed switcher */}
        <button
          onClick={cycleSpeed}
          className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-white/10 hover:border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold transition-all"
          title="Change playback speed"
        >
          {playbackSpeed}x Speed
        </button>
      </div>

      {/* Voicemails List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {voicemails.map((vm) => {
          const isPlaying = playingId === vm.id;
          const progress = playbackProgress[vm.id] || 0;

          return (
            <div
              key={vm.id}
              className="hyperos-glass-card rounded-2xl p-4 shadow-xl border border-white/10 space-y-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${vm.caller.avatarGradient} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}>
                    {vm.caller.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white truncate">{vm.caller.name}</h3>
                      {vm.isUnread && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 truncate">
                      {vm.caller.number} · {vm.timestamp}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono text-slate-400">
                    {Math.floor(vm.duration)}s audio
                  </span>
                </div>
              </div>

              {/* Audio Waveform Player */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 flex items-center gap-3">
                <button
                  onClick={() => togglePlay(vm.id)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all active:scale-90 shrink-0 ${
                    isPlaying 
                      ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]' 
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                {/* Waveform Bars */}
                <div className="flex-1 flex items-end gap-1 h-8 px-1">
                  {vm.waveform.map((bar, idx) => {
                    const barPercent = (idx / vm.waveform.length) * 100;
                    const isPassed = barPercent <= progress;

                    return (
                      <div
                        key={idx}
                        className={`flex-1 rounded-full transition-all duration-150 ${
                          isPassed
                            ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                            : 'bg-slate-700'
                        }`}
                        style={{ height: `${Math.max(15, bar)}%` }}
                      />
                    );
                  })}
                </div>

                {/* Time Indicator */}
                <span className="text-[10px] font-mono text-cyan-300 shrink-0 tabular-nums">
                  {Math.round((progress / 100) * vm.duration)}s
                </span>
              </div>

              {/* AI Transcript */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-200 leading-relaxed">
                <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-slate-400 mb-1">
                  <FileText className="w-3 h-3 text-cyan-400" />
                  <span>AI Speech-to-Text Transcript</span>
                </div>
                <p>&ldquo;{vm.transcript}&rdquo;</p>
              </div>

              {/* AI Summary & Action Items */}
              {vm.summary && (
                <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-cyan-300 mb-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Takeaway Summary</span>
                  </div>
                  <p className="text-slate-300 text-[11px] mb-2">{vm.summary}</p>

                  {vm.actionItems.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-white/5">
                      {vm.actionItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(vm.transcript);
                    dtmfAudio.playTone(750, 40, 0.05);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[11px] flex items-center gap-1 transition-all"
                  title="Copy transcript"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Copy</span>
                </button>

                <button
                  onClick={() => onCallBack(vm.caller.number)}
                  className="px-3.5 py-1.5 rounded-xl hyperos-call-btn text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Back</span>
                </button>
              </div>
            </div>
          );
        })}

        {voicemails.length === 0 && (
          <div className="py-12 text-center text-slate-500 font-mono text-xs">
            No voicemail messages recorded.
          </div>
        )}
      </div>
    </div>
  );
};
