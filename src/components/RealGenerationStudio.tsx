import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Camera,
  Film,
  Play,
  Pause,
  Download,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sliders,
  Check,
  Copy,
  Trash2,
  CloudUpload,
  AlertCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { dynamicIslandService } from '../services/dynamicIslandService.ts';

export type StudioMode = 'image' | 'video';
export type AspectRatio = '16:9' | '9:16' | '1:1';
export type StudioStatus = 'idle' | 'generating' | 'polling' | 'ready' | 'error';

export interface GenerationHistoryItem {
  id: string;
  type: StudioMode;
  prompt: string;
  enhancedPrompt?: string;
  mediaUrl: string;
  aspectRatio: AspectRatio;
  timestamp: string;
  seed?: number;
  metadata?: {
    model?: string;
    dimensions?: { width: number; height: number };
    cameraLens?: string;
    resolution?: string;
  };
}

const STORAGE_KEY = 'gkedit_recent_generations';

const IMAGE_PRESETS = [
  'Cyberpunk street portrait with neon reflections in rain puddle',
  'Editorial fashion photography of model with emerald silk gown in warm golden hour',
  'Macro shot of a robotic dragonfly with iridescent carbon-fiber wings',
  'Hyper-realistic misty pine forest with sunbeams piercing morning canopy',
  'Architectural modern glass villa over looking ocean at blue hour',
];

const VIDEO_PRESETS = [
  'Drone 60fps sweep through neon-lit futuristic metropolis at twilight',
  'Slow-motion espresso pour into glass cup with warm morning cafe steam',
  'Cinematic hypercar drifting on wet asphalt at night with glowing brake rotors',
  'Deep space telescope flight through colorful glowing stellar nursery nebula',
  'Samurai duel on rainy bamboo bridge with authentic optical anamorphic lens flare',
];

const POSITIVE_IMAGE_MOD =
  'raw candid photograph, 8k uhd, shot on Sony A7 IV with 85mm f/1.4 GM lens, natural skin pores and micro-textures, soft cinematic ambient lighting, shallow depth of field, authentic film color grade, neutral contrast';

const NEGATIVE_IMAGE_MOD =
  'cartoon, 3d render, anime, illustration, CGI, plastic waxy skin, oversaturated, disfigured hands, extra fingers, blurry, watermark, distorted faces, unrealistic reflections';

const POSITIVE_VIDEO_MOD =
  'cinematic film footage, natural optical motion blur, 60fps, dynamic smooth camera tracking, accurate cloth and hair physics, realistic volumetric lighting, authentic shutter speed, 4k master';

const NEGATIVE_VIDEO_MOD =
  'stutter, static image, morphing artifacts, distorted limbs, AI uncanny valley, oversmoothed surfaces, flickering text, cartoon animation';

export function RealGenerationStudio() {
  const [mode, setMode] = useState<StudioMode>('image');
  const [prompt, setPrompt] = useState(
    'Cinematic portrait of a cyberpunk creator in high-tech studio editing 8K video, subtle volumetric neon blue and gold backlighting'
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [status, setStatus] = useState<StudioStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active result state
  const [currentResult, setCurrentResult] = useState<GenerationHistoryItem | null>(null);

  // Inspector & Settings
  const [showInspector, setShowInspector] = useState(false);
  const [customNegative, setCustomNegative] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Image zoom & Lightbox
  const [imageZoom, setImageZoom] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Video playback controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isLooping, setIsLooping] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);

  // History gallery
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'image' | 'video'>('all');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<any>(null);
  const pollIntervalRef = useRef<any>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
          if (parsed.length > 0 && !currentResult) {
            setCurrentResult(parsed[0]);
            setMode(parsed[0].type);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse generation history:', e);
    }
  }, []);

  // Save history helper
  const saveHistory = (items: GenerationHistoryItem[]) => {
    setHistory(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 30)));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  };

  // Elapsed timer handling
  useEffect(() => {
    if (status === 'generating' || status === 'polling') {
      const start = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedSeconds(parseFloat(((Date.now() - start) / 1000).toFixed(1)));
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Clean polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  // Enhance Prompt via Gemini API
  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    setErrorMessage(null);
    try {
      const res = await api.enhancePrompt({ prompt, mode });
      if (res.enhancedPrompt) {
        setPrompt(res.enhancedPrompt);
        showToast('✨ Prompt enhanced with cinematic optic parameters!');
      }
    } catch (err: any) {
      console.warn('Enhance failed:', err);
      showToast('⚠️ Could not connect to AI prompt engineer. Kept current prompt.');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Generate Image Action
  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    setStatus('generating');
    setProgress(15);
    setStageText('Configuring Sony A7 IV 85mm f/1.4 GM optical params...');
    setErrorMessage(null);
    setImageZoom(1);

    dynamicIslandService.setMedia({
      progress: 25,
      prompt,
      mediaType: 'image',
    });

    const progressPhases = [
      { delay: 800, p: 35, text: 'Sampling latent diffusion steps with Flux.1 Realism...' },
      { delay: 1800, p: 65, text: 'Rendering organic micro-textures and neutral contrast...' },
      { delay: 2800, p: 88, text: 'Polishing 8K UHD master lighting and shallow DOF...' },
    ];

    const timeouts = progressPhases.map((phase) =>
      setTimeout(() => {
        setProgress(phase.p);
        setStageText(phase.text);
      }, phase.delay)
    );

    try {
      const res = await api.generateRealImage({
        prompt,
        aspectRatio,
        negativePrompt: customNegative || undefined,
      });

      timeouts.forEach(clearTimeout);

      if (res.imageUrl) {
        const newItem: GenerationHistoryItem = {
          id: 'gen_' + Date.now().toString(36),
          type: 'image',
          prompt: res.prompt,
          enhancedPrompt: res.enhancedPrompt,
          mediaUrl: res.imageUrl,
          aspectRatio,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          seed: res.seed,
          metadata: res.metadata,
        };

        setProgress(100);
        setStageText('Render complete!');
        setCurrentResult(newItem);
        saveHistory([newItem, ...history]);
        setStatus('ready');

        dynamicIslandService.updateMediaProgress(100);
        setTimeout(() => dynamicIslandService.setIdle(), 2500);
      } else {
        throw new Error('Image URL was empty');
      }
    } catch (err: any) {
      timeouts.forEach(clearTimeout);
      console.error('Image generation error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Generation failed. Please try a different prompt or retry.');
      dynamicIslandService.setIdle();
    }
  };

  // Generate Video Action with Polling
  const handleGenerateVideo = async () => {
    if (!prompt.trim()) return;
    setStatus('generating');
    setProgress(10);
    setStageText('Initializing 60fps cinematic film pipeline...');
    setErrorMessage(null);
    setIsPlaying(false);

    dynamicIslandService.setMedia({
      progress: 15,
      prompt,
      mediaType: 'video',
    });

    try {
      const res = await api.generateRealVideo({
        prompt,
        aspectRatio,
        durationSeconds: 5,
      });

      if (!res.jobId) {
        throw new Error('Failed to create video synthesis task');
      }

      setStatus('polling');
      setProgress(20);
      setStageText('Synthesizing dynamic camera motion tracking & fluid physics...');

      // Begin polling worker
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      const jobId = res.jobId;
      let attempts = 0;

      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        try {
          const pollRes = await api.getVideoStatus(jobId);
          if (pollRes.progress) {
            setProgress(Math.max(20, pollRes.progress));
          }

          if (pollRes.progress < 50) {
            setStageText('Synthesizing 60fps motion blur & volumetric lighting...');
          } else if (pollRes.progress < 90) {
            setStageText('Encoding 4K cinematic film color grading...');
          } else {
            setStageText('Finalizing video render stream...');
          }

          if (pollRes.status === 'completed' && pollRes.videoUrl) {
            clearInterval(pollIntervalRef.current);
            setProgress(100);
            setStageText('4K Cinematic Video Ready!');

            const newItem: GenerationHistoryItem = {
              id: 'gen_vid_' + Date.now().toString(36),
              type: 'video',
              prompt: pollRes.prompt || prompt,
              enhancedPrompt: pollRes.enhancedPrompt,
              mediaUrl: pollRes.videoUrl,
              aspectRatio,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              metadata: {
                model: 'Cinematic 60fps Master',
                resolution: '4K Ultra HD',
              },
            };

            setCurrentResult(newItem);
            saveHistory([newItem, ...history]);
            setStatus('ready');

            dynamicIslandService.updateMediaProgress(100);
            setTimeout(() => dynamicIslandService.setIdle(), 2500);
          } else if (pollRes.status === 'failed') {
            clearInterval(pollIntervalRef.current);
            setStatus('error');
            setErrorMessage(pollRes.error || 'Video rendering failed on the server.');
            dynamicIslandService.setIdle();
          }
        } catch (pollErr: any) {
          console.warn('Polling check error:', pollErr);
          if (attempts > 30) {
            clearInterval(pollIntervalRef.current);
            setStatus('error');
            setErrorMessage('Video generation timed out. Please retry.');
            dynamicIslandService.setIdle();
          }
        }
      }, 1200);
    } catch (err: any) {
      console.error('Video generation init error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Could not queue video generation.');
      dynamicIslandService.setIdle();
    }
  };

  const handleGenerate = () => {
    if (mode === 'image') {
      handleGenerateImage();
    } else {
      handleGenerateVideo();
    }
  };

  // Video Player Control Handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const changeSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setVideoCurrentTime(videoRef.current.currentTime);
    const duration = videoRef.current.duration || 1;
    setVideoDuration(duration);
    setVideoProgress((videoRef.current.currentTime / duration) * 100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!videoRef.current) return;
    const duration = videoRef.current.duration || 1;
    videoRef.current.currentTime = (val / 100) * duration;
    setVideoProgress(val);
  };

  // Save to ColorOS 17 Cloud Vault
  const handleSaveToVault = (item: GenerationHistoryItem) => {
    const event = new CustomEvent('gkedit:gallery_ingest', {
      detail: {
        id: item.id,
        title: item.prompt.slice(0, 36) + '...',
        type: item.type === 'video' ? 'video' : 'image',
        url: item.mediaUrl,
        sizeMB: item.type === 'video' ? '18.4' : '4.2',
        timestamp: new Date().toISOString(),
      },
    });
    window.dispatchEvent(event);
    showToast('☁ Uploaded to 512 GB Cloud Vault • 0 MB used on device');
  };

  // Download Media
  const handleDownload = async (item: GenerationHistoryItem) => {
    try {
      const a = document.createElement('a');
      a.href = item.mediaUrl;
      a.download = `gkedit-${item.type}-${item.id}.${item.type === 'video' ? 'mp4' : 'png'}`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`📥 Downloading ${item.type === 'video' ? 'MP4 Video' : 'HD Image'}...`);
    } catch {
      window.open(item.mediaUrl, '_blank');
    }
  };

  // Reload history item into active editor
  const handleReloadItem = (item: GenerationHistoryItem) => {
    setMode(item.type);
    setPrompt(item.prompt);
    setAspectRatio(item.aspectRatio);
    setCurrentResult(item);
    showToast('Loaded prompt & parameters into studio!');
  };

  // Delete history item
  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((h) => h.id !== id);
    saveHistory(updated);
    if (currentResult?.id === id) {
      setCurrentResult(updated[0] || null);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const filteredHistory = history.filter((item) => {
    if (historyFilter === 'all') return true;
    return item.type === historyFilter;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 px-4 py-2.5 rounded-2xl bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-xs font-semibold shadow-[0_10px_30px_rgba(0,229,255,0.35)] backdrop-blur-xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Generator Controls & Inputs (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-[#071024]/90 border border-cyan-500/25 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl space-y-4">
            {/* Header with Mode Toggle */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-cyan-500/15">
              <div>
                <h2 className="text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Real Generation Studio</span>
                </h2>
                <p className="text-[11px] text-slate-400">Zero-CGI Realism Engine & 4K Cinema</p>
              </div>

              {/* Segmented Mode Selector */}
              <div className="p-1 rounded-2xl bg-[#030919] border border-cyan-500/30 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMode('image')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    mode === 'image'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('video')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    mode === 'video'
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>
              </div>
            </div>

            {/* Prompt Textarea & AI Enhance Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Prompt Description</label>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing || !prompt.trim()}
                  className="px-2.5 py-1 rounded-xl bg-cyan-950/70 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-[11px] font-bold flex items-center gap-1 transition shadow-[0_0_10px_rgba(6,182,212,0.2)] disabled:opacity-50 cursor-pointer"
                  title="Rewrite into hyper-detailed cinematic description"
                >
                  <Sparkles className={`w-3 h-3 ${isEnhancing ? 'animate-spin' : 'text-cyan-400'}`} />
                  <span>{isEnhancing ? 'Enhancing...' : '✨ Enhance Prompt'}</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    mode === 'image'
                      ? 'Describe your photo (e.g. 85mm portrait of astronaut in neon temple...)'
                      : 'Describe cinematic video (e.g. 60fps tracking shot of racecar in Tokyo rain...)'
                  }
                  className="w-full bg-[#030818]/90 border border-cyan-500/30 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition resize-none leading-relaxed"
                />
                <span className="absolute bottom-2 right-2 text-[10px] text-slate-500 font-mono">
                  {prompt.length} chars
                </span>
              </div>
            </div>

            {/* Inspiration Preset Pills */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                {(mode === 'image' ? IMAGE_PRESETS : VIDEO_PRESETS).map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(p)}
                    className="px-2.5 py-1 rounded-lg bg-[#030919] border border-cyan-500/20 hover:border-cyan-400 text-[10px] text-slate-300 hover:text-white transition truncate max-w-full cursor-pointer text-left"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '16:9', label: '16:9 Cinematic', sub: 'YouTube / Desktop' },
                  { id: '9:16', label: '9:16 Vertical', sub: 'Reels / Shorts' },
                  { id: '1:1', label: '1:1 Square', sub: 'Social / Feed' },
                ].map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setAspectRatio(ar.id as AspectRatio)}
                    className={`p-2 rounded-2xl border text-center transition cursor-pointer ${
                      aspectRatio === ar.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                        : 'bg-[#030818] border-cyan-500/20 text-slate-400 hover:border-cyan-500/40 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-black">{ar.label}</div>
                    <div className="text-[9px] text-slate-400">{ar.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Realism Engine Parameters Inspector (Collapsible) */}
            <div className="rounded-2xl border border-cyan-500/20 bg-[#020713]/70 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowInspector(!showInspector)}
                className="w-full px-3 py-2 flex items-center justify-between text-left text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Realism Engine Specs & Negative Filters</span>
                </div>
                {showInspector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showInspector && (
                <div className="p-3 border-t border-cyan-500/15 space-y-3 text-[11px]">
                  <div>
                    <span className="font-bold text-cyan-300 block mb-0.5">
                      ✓ Active Optical Realism Positive Injected:
                    </span>
                    <p className="p-2 rounded-xl bg-[#030919] border border-cyan-500/20 text-slate-300 font-mono text-[10px] leading-relaxed">
                      {mode === 'image' ? POSITIVE_IMAGE_MOD : POSITIVE_VIDEO_MOD}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-rose-300 block mb-0.5">
                      ✕ Active Negative Filters (Anti-CGI & Plastic):
                    </span>
                    <p className="p-2 rounded-xl bg-[#030919] border border-rose-500/20 text-rose-300 font-mono text-[10px] leading-relaxed">
                      {mode === 'image' ? NEGATIVE_IMAGE_MOD : NEGATIVE_VIDEO_MOD}
                    </p>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">
                      Optional Extra Negative Words:
                    </label>
                    <input
                      type="text"
                      value={customNegative}
                      onChange={(e) => setCustomNegative(e.target.value)}
                      placeholder="e.g. lowres, extra buildings, fog..."
                      className="w-full bg-[#030818] border border-cyan-500/20 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Primary Generate CTA */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={status === 'generating' || status === 'polling' || !prompt.trim()}
              className={`w-full py-3.5 rounded-2xl font-black text-xs tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-2 shadow-xl ${
                status === 'generating' || status === 'polling'
                  ? 'bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 animate-pulse'
                  : mode === 'image'
                  ? 'bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.45)]'
                  : 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-600 hover:from-amber-300 hover:to-rose-500 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.45)]'
              }`}
            >
              {status === 'generating' || status === 'polling' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Synthesizing ({progress}% • {elapsedSeconds}s)...</span>
                </>
              ) : mode === 'image' ? (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Generate Photorealistic Image</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  <span>Render 60fps Cinematic Video</span>
                </>
              )}
            </button>

            {/* Error notice */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Generation Notice</p>
                  <p className="text-[11px] text-red-300 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Preview & Playback Canvas (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl bg-[#071024]/90 border border-cyan-500/25 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col justify-between min-h-[500px]">
            {/* Canvas Header */}
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {currentResult?.type === 'video' ? '🎬 Cinematic 4K Player' : '📸 8K Master Canvas'}
                </span>
                {currentResult && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-mono">
                    {currentResult.aspectRatio}
                  </span>
                )}
              </div>

              {currentResult && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSaveToVault(currentResult)}
                    className="px-2.5 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Zero phone space used • Direct Google Cloud Vault"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>Sync Vault</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(currentResult)}
                    className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 text-slate-950 text-xs font-black flex items-center gap-1 transition shadow-[0_0_12px_rgba(6,182,212,0.35)] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {currentResult.type === 'video' ? 'MP4' : 'HD'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Active Display Canvas */}
            <div className="my-4 flex-1 flex flex-col items-center justify-center">
              {status === 'generating' || status === 'polling' ? (
                /* Dynamic Progress & Elapsed Timer Display */
                <div className="w-full max-w-md p-8 rounded-3xl bg-[#030919]/90 border border-cyan-500/30 text-center space-y-4 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent animate-spin" />
                    {mode === 'video' ? (
                      <Film className="w-8 h-8 text-amber-400" />
                    ) : (
                      <Camera className="w-8 h-8 text-cyan-400" />
                    )}
                  </div>

                  <div>
                    <div className="text-xl font-black text-white">{progress}%</div>
                    <p className="text-xs font-bold text-cyan-300 mt-1">{stageText}</p>
                    <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mt-1 font-mono">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>Elapsed: {elapsedSeconds}s</span>
                    </p>
                  </div>

                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-cyan-500/30">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300 shadow-[0_0_12px_#38bdf8]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : currentResult?.type === 'video' ? (
                /* HTML5 Video Player Viewport */
                <div className="w-full space-y-3">
                  <div className="relative w-full rounded-2xl overflow-hidden border border-cyan-500/30 bg-black max-h-[420px] flex items-center justify-center shadow-2xl group">
                    <video
                      ref={videoRef}
                      src={currentResult.mediaUrl}
                      loop={isLooping}
                      playsInline
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={() => setIsPlaying(false)}
                      onClick={togglePlay}
                      className="w-full h-full max-h-[420px] object-contain cursor-pointer"
                    />

                    {/* Big Center Play Overlay Button */}
                    {!isPlaying && (
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-cyan-500/30 border-2 border-cyan-400/80 text-cyan-300 flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:scale-110 transition cursor-pointer"
                      >
                        <Play className="w-8 h-8 ml-1 fill-cyan-300" />
                      </button>
                    )}
                  </div>

                  {/* Player Controls Bar */}
                  <div className="p-3.5 rounded-2xl bg-[#030919] border border-cyan-500/20 space-y-2.5">
                    {/* Progress Scrubber */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 min-w-[32px]">
                        {formatTime(videoCurrentTime)}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={videoProgress}
                        onChange={handleSeek}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                      <span className="text-[10px] font-mono text-slate-400 min-w-[32px]">
                        {formatTime(videoDuration)}
                      </span>
                    </div>

                    {/* Bottom Row Controls */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={togglePlay}
                          className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 transition cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={toggleMute}
                          className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsLooping(!isLooping)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            isLooping
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                              : 'bg-slate-900 border-slate-700 text-slate-400'
                          }`}
                        >
                          Loop
                        </button>
                      </div>

                      {/* Playback Speed Toggles */}
                      <div className="flex items-center gap-1 text-[11px] font-mono">
                        {[0.5, 1, 1.5, 2].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => changeSpeed(s)}
                            className={`px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                              playbackSpeed === s
                                ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-bold'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentResult?.type === 'image' ? (
                /* High-Resolution Image Canvas */
                <div className="w-full space-y-3">
                  <div className="relative w-full rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#020713] max-h-[420px] flex items-center justify-center shadow-2xl group">
                    <img
                      src={currentResult.mediaUrl}
                      alt={currentResult.prompt}
                      style={{ transform: `scale(${imageZoom})` }}
                      className="w-full h-full max-h-[420px] object-contain transition-transform duration-200 cursor-zoom-in"
                      onClick={() => setLightboxOpen(true)}
                    />

                    {/* Floating Zoom / Lightbox Quick Controls */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/80 border border-cyan-500/30 backdrop-blur-md opacity-90 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => setImageZoom((z) => Math.max(0.75, z - 0.25))}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageZoom(1)}
                        className="px-2 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-mono cursor-pointer"
                        title="Reset Zoom"
                      >
                        {Math.round(imageZoom * 100)}%
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageZoom((z) => Math.min(2.5, z + 0.25))}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setLightboxOpen(true)}
                        className="p-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 cursor-pointer ml-1"
                        title="Fullscreen Lightbox"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty Canvas State */
                <div className="h-72 w-full border-2 border-dashed border-cyan-500/25 rounded-3xl flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-300">No media synthesized yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Enter a creative description or tap "✨ Enhance Prompt" on the left to generate photorealistic images or 60fps cinematic film!
                  </p>
                </div>
              )}
            </div>

            {/* Prompt Readout & Metadata Card */}
            {currentResult && (
              <div className="pt-3 border-t border-cyan-500/15 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300 truncate max-w-[80%]">
                    Prompt: "{currentResult.prompt}"
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentResult.prompt);
                      setCopiedPrompt(true);
                      setTimeout(() => setCopiedPrompt(false), 2000);
                    }}
                    className="flex items-center gap-1 text-cyan-300 hover:underline cursor-pointer shrink-0"
                  >
                    {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {currentResult.enhancedPrompt && (
                  <p className="text-[10px] text-slate-500 font-mono line-clamp-2">
                    Enhanced: {currentResult.enhancedPrompt}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && currentResult?.type === 'image' && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs">
              <span className="font-bold text-cyan-300">8K UHD Master Lightbox</span>
              <span className="text-slate-400 ml-2">({currentResult.aspectRatio})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownload(currentResult)}
                className="px-3 py-1.5 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download HD
              </button>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white hover:bg-slate-800"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image */}
          <div
            className="flex-1 flex items-center justify-center p-4 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentResult.mediaUrl}
              alt={currentResult.prompt}
              className="max-h-[85vh] max-w-[95vw] object-contain rounded-2xl shadow-2xl border border-cyan-500/30"
            />
          </div>

          {/* Lightbox Footer */}
          <div className="text-center text-xs text-slate-400" onClick={(e) => e.stopPropagation()}>
            <p className="max-w-2xl mx-auto truncate font-mono text-[11px] text-slate-300">
              "{currentResult.prompt}"
            </p>
          </div>
        </div>
      )}

      {/* Persistent "Recent Generations" Gallery Strip */}
      <div className="p-5 rounded-3xl bg-[#071024]/90 border border-cyan-500/25 shadow-xl backdrop-blur-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/15">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Recent Studio Generations ({filteredHistory.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="p-1 rounded-xl bg-[#030919] border border-cyan-500/20 flex items-center text-xs">
              {(['all', 'image', 'video'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setHistoryFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition cursor-pointer ${
                    historyFilter === filter
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {history.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear all local generation history?')) {
                    saveHistory([]);
                  }
                }}
                className="px-2.5 py-1 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Gallery Horizontal Carousel / Grid */}
        {filteredHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No {historyFilter === 'all' ? '' : historyFilter} generations stored yet. Generate your first piece above!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => handleReloadItem(item)}
                className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition transform hover:-translate-y-1 bg-[#030919] ${
                  currentResult?.id === item.id
                    ? 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'border-cyan-500/20 hover:border-cyan-400'
                }`}
              >
                {/* Media thumbnail */}
                <div className="aspect-video w-full bg-slate-950 relative overflow-hidden">
                  {item.type === 'video' ? (
                    <div className="w-full h-full relative">
                      <video
                        src={item.mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play className="w-5 h-5 text-amber-400 fill-amber-400" />
                      </div>
                    </div>
                  ) : (
                    <img src={item.mediaUrl} alt={item.prompt} className="w-full h-full object-cover" />
                  )}

                  {/* Badge */}
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/80 text-[9px] font-mono font-bold text-cyan-300 uppercase">
                    {item.type}
                  </span>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/80 hover:bg-red-600 text-slate-300 hover:text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    title="Delete from history"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-2 space-y-1">
                  <p className="text-[11px] text-slate-300 font-semibold truncate" title={item.prompt}>
                    {item.prompt}
                  </p>
                  <div className="flex items-center justify-between text-[9px] text-slate-500">
                    <span>{item.aspectRatio}</span>
                    <span>{item.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
