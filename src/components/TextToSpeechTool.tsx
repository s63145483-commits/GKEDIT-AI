import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Download,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Mic,
  Sliders,
  Radio,
  FileAudio,
  Languages,
  Clock,
  ChevronRight,
  Share2,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface GeneratedClip {
  id: string;
  text: string;
  voiceName: string;
  language: string;
  audioUrl: string;
  timestamp: string;
  duration?: number;
}

const VOICES = [
  { id: 'Kore', name: 'Kore', desc: 'Warm, Studio Natural', gender: 'Female', badge: 'Popular' },
  { id: 'Puck', name: 'Puck', desc: 'Energetic & Crisp', gender: 'Male', badge: 'YouTube' },
  { id: 'Zephyr', name: 'Zephyr', desc: 'Bright, Expressive', gender: 'Female', badge: 'Podcast' },
  { id: 'Fenrir', name: 'Fenrir', desc: 'Deep & Authoritative', gender: 'Male', badge: 'Cinema' },
  { id: 'Charon', name: 'Charon', desc: 'Calm, Deep & Reflective', gender: 'Male', badge: 'Devotional' },
  { id: 'Aoede', name: 'Aoede', desc: 'Melodic & Narrative', gender: 'Female', badge: 'Audiobook' },
];

const PRESET_SCRIPTS = [
  {
    title: '🎬 YouTube Intro',
    text: 'Namaskaram and welcome to GK EDIT! Today we are exploring revolutionary video editing workflows and next-generation AI tools.',
    lang: 'english',
    voice: 'Puck',
  },
  {
    title: '🔥 Telugu Hook',
    text: 'నమస్కారం! జీకే ఎడిట్ యూట్యూబ్ ఛానల్‌కి స్వాగతం. ఈరోజు సరికొత్త ఏఐ వీడియో ఎడిటింగ్ టెక్నిక్స్ గురించి తెలుసుకుందాం!',
    lang: 'telugu',
    voice: 'Kore',
  },
  {
    title: '📢 Tech Alert',
    text: 'GKEDIT AI intelligence engine initialized. All multimodal sensors, neural renderers, and bioscience matrices are now operational.',
    lang: 'english',
    voice: 'Fenrir',
  },
  {
    title: '🙏 Devotional Sloka',
    text: 'ఓం నమః శివాయ. సర్వ మంగళ మాంగల్యే శివే సర్వార్థ సాధికే, శరణ్యే త్ర్యంబకే గౌరి నారాయణి నమోస్తుతే.',
    lang: 'telugu',
    voice: 'Charon',
  },
];

export function TextToSpeechTool() {
  const [text, setText] = useState<string>(
    'Namaskaram! Welcome to GK EDIT AI Audio Studio. Synthesize ultra-realistic speech with Gemini 3.8 Flash Neural TTS.'
  );
  const [voiceName, setVoiceName] = useState<string>('Kore');
  const [language, setLanguage] = useState<string>('telugu');
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [useBrowserFallback, setUseBrowserFallback] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedClip[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync playback rate to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setLoading(true);

    // If user explicitly toggled browser native synthesis
    if (useBrowserFallback) {
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = playbackRate;
          if (language === 'telugu') utterance.lang = 'te-IN';
          else if (language === 'hindi') utterance.lang = 'hi-IN';
          else if (language === 'tamil') utterance.lang = 'ta-IN';
          else utterance.lang = 'en-US';

          utterance.onstart = () => setIsPlaying(true);
          utterance.onend = () => setIsPlaying(false);
          utterance.onerror = () => setIsPlaying(false);

          window.speechSynthesis.speak(utterance);
        }
      } catch (e) {
        console.warn('Browser speech error:', e);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Call server Gemini Neural TTS
    try {
      const res = await api.textToSpeech({ text, voiceName });
      if (res.audioBase64) {
        const url = `data:${res.mimeType || 'audio/wav'};base64,${res.audioBase64}`;
        setCurrentAudioUrl(url);

        const newClip: GeneratedClip = {
          id: 'clip_' + Date.now(),
          text,
          voiceName,
          language,
          audioUrl: url,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setHistory((prev) => [newClip, ...prev.slice(0, 7)]);

        // Auto play on generation
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.playbackRate = playbackRate;
            audioRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
        }, 100);
      } else {
        throw new Error('No audio returned');
      }
    } catch (err: any) {
      console.warn('Gemini TTS server fallback to browser speech synthesis:', err);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = playbackRate;
        if (language === 'telugu') u.lang = 'te-IN';
        else if (language === 'hindi') u.lang = 'hi-IN';
        else u.lang = 'en-US';

        u.onstart = () => setIsPlaying(true);
        u.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(u);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSelectHistoryClip = (clip: GeneratedClip) => {
    setCurrentAudioUrl(clip.audioUrl);
    setText(clip.text);
    setVoiceName(clip.voiceName);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }, 100);
  };

  const handleCopyText = (t: string, id: string) => {
    navigator.clipboard.writeText(t);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Audio Element Hidden Runner */}
      {currentAudioUrl && (
        <audio
          ref={audioRef}
          src={currentAudioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      )}

      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 shadow-xl flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-400 to-cyan-500 text-slate-950 shadow-md">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>Gemini Neural Text-to-Speech</span>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                gemini-3.8-flash-tts
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Produce human-quality spoken voiceovers in Telugu, English, Hindi, and more
            </p>
          </div>
        </div>

        {/* Engine Toggle */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            type="button"
            onClick={() => setUseBrowserFallback(false)}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              !useBrowserFallback
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Neural Cloud AI
          </button>
          <button
            type="button"
            onClick={() => setUseBrowserFallback(true)}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              useBrowserFallback
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Instant Device TTS
          </button>
        </div>
      </div>

      {/* Main Grid: Input & Voice Config | Audio Player & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Input & Controls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 shadow-xl space-y-4 text-white">
            {/* Quick Template Chips */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Quick Prompt Presets:</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {PRESET_SCRIPTS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setText(preset.text);
                      setLanguage(preset.lang);
                      setVoiceName(preset.voice);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 border border-cyan-500/20 text-cyan-200 hover:border-cyan-400 hover:text-white whitespace-nowrap transition text-[11px]"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea Input */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <label className="font-semibold text-slate-200">Text to Speak</label>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span>{text.length} chars</span>
                  <span>•</span>
                  <span>{text.trim().split(/\s+/).filter(Boolean).length} words</span>
                  {text && (
                    <button
                      type="button"
                      onClick={() => setText('')}
                      className="text-red-400 hover:text-red-300 ml-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <textarea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste Telugu, English, or Hindi script here..."
                className="w-full bg-[#020617] border border-cyan-500/30 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-cyan-400 leading-relaxed resize-none"
              />
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-cyan-400" />
                <span>Spoken Language Tone</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'telugu', label: 'Telugu (తెలుగు)' },
                  { id: 'english', label: 'English (US/Global)' },
                  { id: 'hindi', label: 'Hindi (हिंदी)' },
                  { id: 'tamil', label: 'Tamil (தமிழ்)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLanguage(item.id)}
                    className={`p-2 rounded-xl border text-center transition font-semibold text-[11px] ${
                      language === item.id
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Characters Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-amber-400" />
                <span>Voice Persona</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVoiceName(v.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      voiceName === v.id
                        ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{v.name}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-slate-800 text-cyan-300">
                        {v.gender}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{v.desc}</div>
                    <div className="mt-1 text-[9px] text-amber-400 font-mono">{v.badge}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Speed Slider */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Playback Speed
                </span>
                <span className="font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded text-[11px]">
                  {playbackRate.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>0.5x Slow</span>
                <span>1.0x Normal</span>
                <span>2.0x Fast</span>
              </div>
            </div>

            {/* Synthesize Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Synthesizing Voice Audio...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 fill-slate-950" />
                  <span>Generate Voice Audio ({voiceName})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Player & Audio Ledger */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Visual Player Card */}
          <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 shadow-xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm">Active Voice Console</h3>
              </div>
              {currentAudioUrl && (
                <a
                  href={currentAudioUrl}
                  download="gkedit-speech.wav"
                  className="px-2.5 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              )}
            </div>

            {currentAudioUrl ? (
              <div className="space-y-4 text-center">
                {/* Waveform Bar Graphic */}
                <div className="h-20 bg-[#020617] border border-cyan-500/30 rounded-2xl p-4 flex items-center justify-center gap-1.5 overflow-hidden">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        isPlaying
                          ? 'bg-gradient-to-t from-cyan-500 to-amber-300 animate-pulse'
                          : 'bg-slate-800'
                      }`}
                      style={{
                        height: isPlaying ? `${Math.max(15, Math.sin(i * 0.8 + Date.now()) * 60 + 20)}%` : '20%',
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>

                {/* Primary Play Button */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 font-black flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95 transition"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-slate-950" /> : <Play className="w-6 h-6 fill-slate-950 ml-0.5" />}
                  </button>
                </div>

                <div className="text-xs text-slate-400">
                  Voice: <span className="font-bold text-cyan-300">{voiceName}</span> | Rate:{' '}
                  <span className="font-mono text-cyan-300">{playbackRate}x</span>
                </div>
              </div>
            ) : (
              <div className="h-44 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                <Volume2 className="w-10 h-10 mb-2 text-slate-700" />
                <p className="font-medium text-slate-400">No audio synthesized yet</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Type your prompt on the left and tap Generate
                </p>
              </div>
            )}
          </div>

          {/* Audio History Ledger */}
          <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 shadow-xl text-white space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 text-xs">
              <span className="font-bold flex items-center gap-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Recent Voice Clips ({history.length})
              </span>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-red-400 hover:text-red-300 text-[10px]"
                >
                  Clear All
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-[11px] text-slate-500 text-center py-4">
                Recent syntheses will appear here for fast 1-tap playback
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {history.map((clip) => (
                  <div
                    key={clip.id}
                    onClick={() => handleSelectHistoryClip(clip)}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-cyan-500/40 cursor-pointer transition flex items-center justify-between gap-2 text-xs group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-bold text-[11px] text-cyan-300">{clip.voiceName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{clip.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{clip.text}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(clip.text, clip.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="Copy text"
                      >
                        {copiedId === clip.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-slate-950 transition">
                        <Play className="w-3 h-3 fill-current" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
