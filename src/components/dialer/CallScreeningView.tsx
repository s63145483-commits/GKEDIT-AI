import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Bot, 
  User, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  FileText, 
  Disc, 
  PhoneForwarded, 
  Sparkles, 
  Send, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Share2,
  Copy
} from 'lucide-react';
import { CallerInfo, TranscriptMessage, CallRecord } from '../../types/telephony.ts';
import { ScreeningScenario, SCREENING_SCENARIOS } from '../../services/aiCallScenarios.ts';
import { dtmfAudio } from '../../services/dtmfAudio.ts';

interface CallScreeningViewProps {
  scenario?: ScreeningScenario;
  caller: CallerInfo;
  onAnswerCall: () => void;
  onEndCall: (record?: CallRecord) => void;
  onTakeNote: (note: string) => void;
}

export const CallScreeningView: React.FC<CallScreeningViewProps> = ({
  scenario,
  caller,
  onAnswerCall,
  onEndCall,
  onTakeNote,
}) => {
  const [transcript, setTranscript] = useState<TranscriptMessage[]>(
    scenario ? scenario.initialTranscript : [
      {
        id: 'init-1',
        speaker: 'ai_assistant',
        text: 'GKEDIT AI Phone Screening: The person you called is screening this line. Please state your name and purpose of call.',
        timestamp: '00:02',
      }
    ]
  );
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [detectedIntent, setDetectedIntent] = useState<string>(
    caller.spamScore && caller.spamScore > 80 ? 'Suspected Robocall Telemarketer' : 'Inbound Peer Connection'
  );
  const [suggestedActions, setSuggestedActions] = useState<string[]>([
    'Ask for clarification',
    'Take a message',
    'Ask to call back later',
    'Block & Hang Up',
  ]);
  const [customInput, setCustomInput] = useState('');
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [liveNotes, setLiveNotes] = useState<string[]>([]);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [newNoteInput, setNewNoteInput] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  // Play initial speech for AI
  useEffect(() => {
    if (transcript.length > 0 && transcript[0].speaker === 'ai_assistant') {
      dtmfAudio.speakAiMessage(transcript[0].text);
    }
  }, []);

  // Duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRecordedDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Streaming simulated transcript
  useEffect(() => {
    if (!scenario || currentStepIdx >= scenario.streamingSteps.length) return;

    const step = scenario.streamingSteps[currentStepIdx];
    const timer = setTimeout(() => {
      setTranscript((prev) => [...prev, step.message]);
      
      if (step.detectedIntent) {
        setDetectedIntent(step.detectedIntent);
      }
      if (step.suggestedActions) {
        setSuggestedActions(step.suggestedActions);
      }

      // If it's an AI assistant message, play speech
      if (step.message.speaker === 'ai_assistant') {
        setIsAiSpeaking(true);
        dtmfAudio.speakAiMessage(step.message.text, () => {
          setIsAiSpeaking(false);
        });
      }

      setCurrentStepIdx((prev) => prev + 1);
    }, step.delayMs);

    return () => clearTimeout(timer);
  }, [currentStepIdx, scenario]);

  // Auto scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // User sends instruction for AI Assistant to speak to caller
  const handleSendAiPrompt = (promptText: string) => {
    if (!promptText.trim()) return;

    const aiMsg: TranscriptMessage = {
      id: `ai-msg-${Date.now()}`,
      speaker: 'ai_assistant',
      text: `GKEDIT AI: ${promptText}`,
      timestamp: formatTime(recordedDuration),
    };

    setTranscript((prev) => [...prev, aiMsg]);
    setCustomInput('');
    setIsAiSpeaking(true);
    dtmfAudio.speakAiMessage(promptText, () => {
      setIsAiSpeaking(false);
    });

    // Simulated caller response after 2 seconds
    setTimeout(() => {
      let reply = 'Thank you, I will make note of that.';
      if (caller.spamScore && caller.spamScore > 80) {
        reply = '...[Automated dialer disconnect detected]';
      } else if (caller.name.includes('Elena')) {
        reply = 'Sounds great GK! Sending the benchmark payload right away.';
      } else if (caller.name.includes('DHL')) {
        reply = 'Perfect, code entered. Dropping package now.';
      }

      const callerMsg: TranscriptMessage = {
        id: `caller-msg-${Date.now()}`,
        speaker: 'caller',
        text: reply,
        timestamp: formatTime(recordedDuration + 2),
      };
      setTranscript((prev) => [...prev, callerMsg]);
    }, 2200);
  };

  // Add a live note
  const handleAddNote = () => {
    if (!newNoteInput.trim()) return;
    setLiveNotes((prev) => [...prev, newNoteInput.trim()]);
    onTakeNote(newNoteInput.trim());
    setNewNoteInput('');
  };

  // End Call & Save record
  const handleHangUp = () => {
    dtmfAudio.playCallEnded();
    const newRecord: CallRecord = {
      id: `call-${Date.now()}`,
      caller,
      direction: 'incoming',
      timestamp: 'Just now',
      duration: recordedDuration,
      statusTag: caller.spamScore && caller.spamScore > 80 ? 'Spam Filtered' : 'AI Handled',
      transcript,
      aiSummary: `AI screened call (${formatTime(recordedDuration)}). Intent: ${detectedIntent}.`,
      actionItems: liveNotes.length > 0 ? liveNotes : ['No follow-up action required'],
    };
    onEndCall(newRecord);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-xl mx-auto px-4 py-2 select-none relative">
      {/* Top Caller Banner & Threat Status */}
      <div className="hyperos-glass-card rounded-2xl p-3 mb-2.5 shadow-xl border border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${caller.avatarGradient} flex items-center justify-center text-white font-bold text-base shadow-lg shrink-0`}>
              {caller.name.charAt(0)}
            </div>
            
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-white truncate">{caller.name}</h2>
                {caller.e2eeVerified ? (
                  <span title="E2EE WebRTC Verified" className="shrink-0 flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                ) : caller.spamScore && caller.spamScore > 80 ? (
                  <span title="Spam Threat" className="shrink-0 flex items-center">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {caller.number} {caller.location ? `· ${caller.location}` : ''}
              </p>
            </div>
          </div>

          {/* Call Status & Timer Badge */}
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[11px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                AI Screening
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 tabular-nums">
              {formatTime(recordedDuration)}
            </p>
          </div>
        </div>

        {/* Dynamic Threat & Intent Strip */}
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="text-slate-400">Detected Intent:</span>
            <span className="text-amber-200 font-medium truncate">{detectedIntent}</span>
          </div>

          {caller.spamScore !== undefined && (
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                caller.spamScore > 80 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {caller.spamScore > 80 ? `Spam Risk: ${caller.spamScore}%` : 'Low Risk'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas: Real-Time Voice-to-Text Transcription Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 hyperos-glass-card rounded-2xl p-3.5 mb-2.5 overflow-y-auto space-y-3 min-h-[200px] max-h-[320px] sm:max-h-[360px]"
      >
        <div className="text-[10.5px] font-mono text-center text-slate-500 py-1 border-b border-white/5 flex items-center justify-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real-time voice-to-text call screening feed active</span>
        </div>

        {transcript.map((msg) => {
          const isCaller = msg.speaker === 'caller';
          const isAi = msg.speaker === 'ai_assistant';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isCaller ? 'items-start' : 'items-end'} animate-in fade-in duration-200`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-slate-400">
                {isCaller ? (
                  <>
                    <User className="w-3 h-3 text-amber-400" />
                    <span className="font-semibold text-amber-300">Caller ({caller.name.split(' ')[0]})</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-cyan-300">GKEDIT AI Assistant</span>
                    <Bot className="w-3 h-3 text-cyan-400" />
                  </>
                )}
                <span>·</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-lg ${
                  isCaller
                    ? 'bg-slate-900/90 border border-amber-500/30 text-amber-50 rounded-tl-sm'
                    : 'bg-gradient-to-tr from-cyan-950/80 to-blue-950/80 border border-cyan-400/40 text-cyan-50 rounded-tr-sm'
                }`}
              >
                {msg.text}

                {msg.intent && (
                  <div className="mt-1 pt-1 border-t border-white/10 text-[10px] text-amber-300/80 font-mono">
                    Pattern: {msg.intent}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isAiSpeaking && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono animate-pulse pl-2">
            <Volume2 className="w-3.5 h-3.5" />
            <span>AI Assistant is speaking to caller...</span>
          </div>
        )}
      </div>

      {/* Suggested AI Quick Actions & Replies */}
      <div className="mb-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {suggestedActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleSendAiPrompt(action)}
              className="px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium whitespace-nowrap shrink-0 transition-all active:scale-95 shadow-sm"
            >
              💬 {action}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive AI Call-Assistant Action Cards Strip */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
        {/* Answer via AI */}
        <button
          onClick={() => handleSendAiPrompt("I'm handling this via AI. Please state how I can help.")}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-200 text-center transition-all active:scale-95"
        >
          <Bot className="w-4 h-4 text-cyan-400 mb-1" />
          <span className="text-[10px] font-semibold leading-tight">Answer AI</span>
        </button>

        {/* Screen Spam */}
        <button
          onClick={() => handleSendAiPrompt("State your company license number and reason or this line will disconnect.")}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-rose-500/30 text-rose-300 text-center transition-all active:scale-95"
        >
          <ShieldAlert className="w-4 h-4 text-rose-400 mb-1" />
          <span className="text-[10px] font-semibold leading-tight">Screen Spam</span>
        </button>

        {/* Live Note-taking */}
        <button
          onClick={() => setShowNotesDrawer(!showNotesDrawer)}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all active:scale-95 ${
            showNotesDrawer ? 'bg-cyan-900/60 border-cyan-400 text-cyan-200' : 'bg-slate-900/80 border-white/10 text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-400 mb-1" />
          <span className="text-[10px] font-semibold leading-tight">Live Notes</span>
        </button>

        {/* Mute */}
        <button
          onClick={() => {
            setIsMuted(!isMuted);
            dtmfAudio.playTone(isMuted ? 580 : 380, 50, 0.08);
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all active:scale-95 ${
            isMuted ? 'bg-amber-950/80 border-amber-500 text-amber-300' : 'bg-slate-900/80 border-white/10 text-slate-200'
          }`}
        >
          {isMuted ? <MicOff className="w-4 h-4 text-amber-400 mb-1" /> : <Mic className="w-4 h-4 text-slate-400 mb-1" />}
          <span className="text-[10px] font-semibold leading-tight">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* Record */}
        <button
          onClick={() => {
            setIsRecording(!isRecording);
            dtmfAudio.playTone(720, 60, 0.08);
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all active:scale-95 ${
            isRecording ? 'bg-rose-950/80 border-rose-500/60 text-rose-300' : 'bg-slate-900/80 border-white/10 text-slate-200'
          }`}
        >
          <Disc className={`w-4 h-4 text-rose-400 mb-1 ${isRecording ? 'animate-spin' : ''}`} />
          <span className="text-[10px] font-semibold leading-tight">{isRecording ? 'Rec ON' : 'Record'}</span>
        </button>

        {/* Call Transfer */}
        <button
          onClick={() => handleSendAiPrompt("Transferring you to voicemail inbox now...")}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-200 text-center transition-all active:scale-95"
        >
          <PhoneForwarded className="w-4 h-4 text-purple-400 mb-1" />
          <span className="text-[10px] font-semibold leading-tight">Transfer</span>
        </button>
      </div>

      {/* Live Notes Drawer (if toggled) */}
      {showNotesDrawer && (
        <div className="hyperos-glass-card rounded-2xl p-3 mb-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Screening Notes & Action Items</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-400">{liveNotes.length} notes</span>
          </div>

          <div className="space-y-1.5 max-h-24 overflow-y-auto mb-2 text-xs">
            {liveNotes.map((note, idx) => (
              <div key={idx} className="flex items-start gap-1.5 p-1.5 rounded-lg bg-black/40 text-slate-200 text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                <span>{note}</span>
              </div>
            ))}
            {liveNotes.length === 0 && (
              <p className="text-[11px] text-slate-500 italic">No notes recorded yet. Add one below.</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newNoteInput}
              onChange={(e) => setNewNoteInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              placeholder="Add key takeaway or action item..."
              className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleAddNote}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Send Custom Response to Caller via AI Prompt */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendAiPrompt(customInput)}
          placeholder="Instruct AI what to tell caller..."
          className="flex-1 px-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
        />
        <button
          onClick={() => handleSendAiPrompt(customInput)}
          disabled={!customInput.trim()}
          className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
        >
          <span>Speak</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Dual Call Controls: Join Voice Live vs Terminate / Block */}
      <div className="flex items-center justify-center gap-6 pt-1">
        {/* End Call / Block */}
        <button
          onClick={handleHangUp}
          className="flex flex-col items-center justify-center group active:scale-95 transition-all"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 shadow-[0_0_24px_rgba(225,29,72,0.4)] text-white">
            <PhoneOff className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-mono text-rose-300 font-semibold mt-1">
            End Call
          </span>
        </button>

        {/* Answer Directly (Bridge WebRTC Audio) */}
        <button
          onClick={() => {
            dtmfAudio.playCallConnected();
            onAnswerCall();
          }}
          className="flex flex-col items-center justify-center group active:scale-95 transition-all"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-full hyperos-call-btn text-white">
            <PhoneCall className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold mt-1">
            Connect Live
          </span>
        </button>
      </div>
    </div>
  );
};
