import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Camera,
  SwitchCamera,
  Sparkles,
  SlidersHorizontal,
  Filter,
  X,
  Zap,
  Download,
  RefreshCw,
  Send,
  Check,
  Grid,
  Volume2,
  VolumeX,
  Copy,
  RotateCcw,
  Upload,
  AlertTriangle,
  Sun,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Flame,
  Thermometer,
  Target,
  Search,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { notificationService } from '../services/notificationService.ts';
import { GestureTrainingOverlay } from './GestureTrainingOverlay.tsx';
import { VisionStudio } from './VisionStudio.tsx';
import { UltraMacroDeepVisionModal } from './UltraMacroDeepVisionModal.tsx';

export interface VisualFilter {
  id: string;
  name: string;
  badge: string;
  css: string;
  description: string;
  color: string;
}

export const CAMERA_FILTERS: VisualFilter[] = [
  {
    id: 'normal',
    name: 'Normal / Clean',
    badge: 'RAW',
    css: 'none',
    description: 'Raw natural optical feed',
    color: '#06b6d4',
  },
  {
    id: 'thermal',
    name: 'Thermal Vision (feColorMatrix)',
    badge: 'THERMAL',
    css: 'url(#thermal-feColorMatrix) contrast(175%) saturate(190%)',
    description: 'Custom SVG feColorMatrix false-color heatmap',
    color: '#f97316',
  },
  {
    id: 'ironbow',
    name: 'FLIR Ironbow Heatmap',
    badge: 'IRONBOW',
    css: 'url(#thermal-ironbow) contrast(140%) saturate(180%)',
    description: 'Multi-stage thermal ironbow false-color ramp',
    color: '#ef4444',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    badge: 'NEON',
    css: 'contrast(140%) saturate(190%) hue-rotate(185deg) brightness(105%)',
    description: 'Electric cyan & magenta neon contrast',
    color: '#ec4899',
  },
  {
    id: 'noir',
    name: 'Cinematic Noir',
    badge: 'B&W',
    css: 'grayscale(100%) contrast(165%) brightness(95%)',
    description: 'High-contrast monochrome classic noir',
    color: '#94a3b8',
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    badge: 'WARM',
    css: 'sepia(45%) saturate(155%) brightness(108%) contrast(110%) hue-rotate(-12deg)',
    description: 'Warm golden sunlight & amber glow',
    color: '#f59e0b',
  },
  {
    id: 'vhs',
    name: 'VHS Retro Glitch',
    badge: 'RETRO',
    css: 'contrast(130%) saturate(145%) sepia(25%) hue-rotate(330deg) brightness(102%)',
    description: '90s analog videotape nostalgia',
    color: '#a855f7',
  },
  {
    id: 'matrix',
    name: 'Matrix Emerald',
    badge: 'MATRIX',
    css: 'contrast(135%) hue-rotate(85deg) saturate(160%) brightness(105%)',
    description: 'Sci-fi cyber green phosphors',
    color: '#10b981',
  },
  {
    id: 'cool',
    name: 'Midnight Blue',
    badge: 'COOL',
    css: 'contrast(120%) saturate(135%) hue-rotate(200deg) brightness(96%)',
    description: 'Cinematic moonlight blue grade',
    color: '#3b82f6',
  },
];

/**
 * Applies a true false-color thermal heatmap palette to Canvas pixel data
 * This ensures captured snapshots and downloaded photos reflect accurate FLIR/Thermal Heat signatures
 * across all browsers, while the live video stream uses the hardware SVG feColorMatrix filter.
 */
export function applyThermalCanvasEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filterId: string = 'thermal',
  intensityFactor: number = 1.0
) {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;
    const len = d.length;

    for (let i = 0; i < len; i += 4) {
      const origR = d[i];
      const origG = d[i + 1];
      const origB = d[i + 2];

      // Standard ITU-R BT.601 perceptual luminance
      const luma = (0.299 * origR + 0.587 * origG + 0.114 * origB) / 255;

      let tr = 0;
      let tg = 0;
      let tb = 0;

      if (filterId === 'ironbow') {
        // FLIR Ironbow: Cold Purple -> Deep Violet -> Magenta -> Orange -> Amber Gold -> Peak White
        if (luma < 0.22) {
          const t = luma / 0.22;
          tr = Math.floor(15 + 75 * t);
          tg = 0;
          tb = Math.floor(60 + 130 * t);
        } else if (luma < 0.5) {
          const t = (luma - 0.22) / 0.28;
          tr = Math.floor(90 + 145 * t);
          tg = Math.floor(10 + 35 * t);
          tb = Math.floor(190 - 160 * t);
        } else if (luma < 0.78) {
          const t = (luma - 0.5) / 0.28;
          tr = 255;
          tg = Math.floor(45 + 175 * t);
          tb = Math.floor(30 * (1 - t));
        } else {
          const t = (luma - 0.78) / 0.22;
          tr = 255;
          tg = Math.floor(220 + 35 * t);
          tb = Math.floor(255 * t);
        }
      } else {
        // Standard Thermal Vision Heatmap: Cold Indigo -> Cyan -> Emerald -> Yellow -> Vivid Red -> Hot Incandescent White
        if (luma < 0.18) {
          const t = luma / 0.18;
          tr = 0;
          tg = Math.floor(10 * t);
          tb = Math.floor(90 + 145 * t);
        } else if (luma < 0.4) {
          const t = (luma - 0.18) / 0.22;
          tr = 0;
          tg = Math.floor(10 + 195 * t);
          tb = Math.floor(235 - 195 * t);
        } else if (luma < 0.65) {
          const t = (luma - 0.4) / 0.25;
          tr = Math.floor(220 * t);
          tg = Math.floor(205 + 40 * t);
          tb = 0;
        } else if (luma < 0.88) {
          const t = (luma - 0.65) / 0.23;
          tr = 255;
          tg = Math.floor(245 * (1 - t));
          tb = 0;
        } else {
          const t = (luma - 0.88) / 0.12;
          tr = 255;
          tg = Math.floor(220 * t);
          tb = Math.floor(255 * t);
        }
      }

      // Blend based on intensity factor if user adjusts slider
      if (intensityFactor !== 1.0) {
        const factor = Math.max(0, Math.min(1.5, intensityFactor));
        d[i] = Math.min(255, Math.max(0, Math.round(origR + (tr - origR) * factor)));
        d[i + 1] = Math.min(255, Math.max(0, Math.round(origG + (tg - origG) * factor)));
        d[i + 2] = Math.min(255, Math.max(0, Math.round(origB + (tb - origB) * factor)));
      } else {
        d[i] = tr;
        d[i + 1] = tg;
        d[i + 2] = tb;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    console.warn('Thermal canvas effect error:', err);
  }
}

interface CameraTabProps {
  onNavigateToChat?: (initialMessage?: string) => void;
}

export function CameraTab({ onNavigateToChat }: CameraTabProps) {
  // Mode: 'studio' (Vision Studio with Filters and Circle to Search) or 'thermal_ocr' (Legacy)
  const [viewMode, setViewMode] = useState<'studio' | 'thermal_ocr'>('studio');

  // Hardware stream state
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // Viewfinder overlays
  const [showGrid, setShowGrid] = useState(true);
  const [activeFilterId, setActiveFilterId] = useState<string>('normal');
  const [filterIntensity, setFilterIntensity] = useState<number>(100);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showIntensitySlider, setShowIntensitySlider] = useState(false);
  const [flashAnimation, setFlashAnimation] = useState(false);
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const [showUltraMacroModal, setShowUltraMacroModal] = useState(false);

  // Snapshot & Analysis State
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [rawSnapshotData, setRawSnapshotData] = useState<string | null>(null); // For re-filtering
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analysisPrompt, setAnalysisPrompt] = useState('');
  const [customPromptInput, setCustomPromptInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeFilter = CAMERA_FILTERS.find((f) => f.id === activeFilterId) || CAMERA_FILTERS[0];

  // Calculate combined CSS filter style factoring in intensity
  const getFilterStyleString = useCallback(
    (filter: VisualFilter, intensity: number) => {
      if (filter.id === 'normal' || intensity === 0) return 'none';
      if (intensity === 100) return filter.css;
      // Interpolate filter with intensity percentage
      const factor = intensity / 100;
      if (filter.id === 'thermal') {
        return `url(#thermal-feColorMatrix) contrast(${100 + 75 * factor}%) saturate(${100 + 90 * factor}%)`;
      }
      if (filter.id === 'ironbow') {
        return `url(#thermal-ironbow) contrast(${100 + 40 * factor}%) saturate(${100 + 80 * factor}%)`;
      }
      if (filter.id === 'cyberpunk') {
        return `contrast(${100 + 40 * factor}%) saturate(${100 + 90 * factor}%) hue-rotate(${185 * factor}deg) brightness(${100 + 5 * factor}%)`;
      }
      if (filter.id === 'noir') {
        return `grayscale(${100 * factor}%) contrast(${100 + 65 * factor}%) brightness(${100 - 5 * factor}%)`;
      }
      if (filter.id === 'golden') {
        return `sepia(${45 * factor}%) saturate(${100 + 55 * factor}%) brightness(${100 + 8 * factor}%) contrast(${100 + 10 * factor}%)`;
      }
      if (filter.id === 'vhs') {
        return `contrast(${100 + 30 * factor}%) saturate(${100 + 45 * factor}%) sepia(${25 * factor}%) hue-rotate(${330 * factor}deg)`;
      }
      if (filter.id === 'matrix') {
        return `contrast(${100 + 35 * factor}%) hue-rotate(${85 * factor}deg) saturate(${100 + 60 * factor}%)`;
      }
      if (filter.id === 'cool') {
        return `contrast(${100 + 20 * factor}%) saturate(${100 + 35 * factor}%) hue-rotate(${200 * factor}deg)`;
      }
      return filter.css;
    },
    []
  );

  const activeFilterCss = getFilterStyleString(activeFilter, filterIntensity);

  // Stop all media tracks safely
  const stopMediaTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Start hardware camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopMediaTracks();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser or environment.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((e) => console.warn('Video play interrupted', e));
          setIsStreaming(true);
        };
      }

      // Check torch/flashlight support on track
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
        setHasTorch(!!capabilities?.torch);
      }
    } catch (err: any) {
      console.error('Camera stream access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera sensor hardware was detected on this device.');
      } else {
        setCameraError(`Unable to start camera stream: ${err.message || 'Unknown error'}`);
      }
      setIsStreaming(false);
    }
  }, [facingMode, stopMediaTracks]);

  // Lifecycle stream management
  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }
    return () => {
      stopMediaTracks();
    };
  }, [capturedImage, startCamera, stopMediaTracks]);

  // Window visibility listener (pause stream when tab is hidden to conserve battery)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopMediaTracks();
      } else if (!capturedImage) {
        startCamera();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [capturedImage, startCamera, stopMediaTracks]);

  // Toggle Camera Front / Rear
  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Toggle Torch / Flash
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !torchOn;
      const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
      if (capabilities?.torch) {
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setTorchOn(nextTorch);
      } else {
        // Fallback simulated screen glow
        setTorchOn(nextTorch);
      }
    } catch (e) {
      console.warn('Torch constraint error', e);
      setTorchOn(!torchOn);
    }
  };

  // Capture Snapshot and bake exact active CSS filter directly onto canvas
  const handleCapturePhoto = () => {
    if (!videoRef.current || !isStreaming) return;

    // Trigger shutter sound and haptic vibration
    notificationService.playSoftChime();
    if (navigator.vibrate) {
      navigator.vibrate([40, 25, 40]);
    }

    // Flash animation
    setFlashAnimation(true);
    setTimeout(() => setFlashAnimation(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // If user front camera, mirror image for natural selfie orientation
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      // 1. First save raw frame (without filter) for re-filtering later
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawBase64 = canvas.toDataURL('image/jpeg', 0.95);
      setRawSnapshotData(rawBase64);

      // 2. Clear and draw with the EXACT active CSS filter baked in
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = activeFilterCss;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // If active filter is thermal / ironbow, bake false-color palette onto canvas pixels
      if (activeFilter.id === 'thermal' || activeFilter.id === 'ironbow') {
        applyThermalCanvasEffect(ctx, canvas.width, canvas.height, activeFilter.id, filterIntensity / 100);
      }

      const filteredBase64 = canvas.toDataURL('image/jpeg', 0.94);
      setCapturedImage(filteredBase64);

      // Pause/Stop active camera stream while previewing frozen snapshot
      stopMediaTracks();
    }
  };

  // Retake Photo
  const handleRetake = () => {
    setCapturedImage(null);
    setRawSnapshotData(null);
    setAiAnalysis(null);
    setIsAnalyzing(false);
    startCamera();
  };

  // Re-apply filter on captured snapshot
  const handleApplyFilterToSnapshot = (filterId: string) => {
    setActiveFilterId(filterId);
    if (!rawSnapshotData) return;

    const filterObj = CAMERA_FILTERS.find((f) => f.id === filterId) || CAMERA_FILTERS[0];
    const newCss = getFilterStyleString(filterObj, filterIntensity);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.filter = newCss;
        ctx.drawImage(img, 0, 0);
        if (filterId === 'thermal' || filterId === 'ironbow') {
          applyThermalCanvasEffect(ctx, canvas.width, canvas.height, filterId, filterIntensity / 100);
        }
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.94));
      }
    };
    img.src = rawSnapshotData;
  };

  // Download snapshot
  const handleDownload = () => {
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `gkedit_camera_${activeFilterId}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notificationService.showInAppToast('Snapshot Saved', 'Saved high-res photo with active visual filter.', 'success');
  };

  // Upload photo fallback from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setRawSnapshotData(result);
        setCapturedImage(result);
        stopMediaTracks();
      }
    };
    reader.readAsDataURL(file);
  };

  // Run Gemini Multimodal Vision Analysis
  const handleAnalyzeWithAI = async (presetPrompt?: string) => {
    if (!capturedImage || isAnalyzing) return;

    const promptToUse = presetPrompt || customPromptInput.trim() || 'Describe this scene in detail, identify objects and assess style.';
    setAnalysisPrompt(promptToUse);
    setIsAnalyzing(true);
    setAiAnalysis(null);

    try {
      const res = await api.analyzeCameraSnapshot({
        imageBase64: capturedImage,
        prompt: promptToUse,
        mimeType: 'image/jpeg',
      });

      setAiAnalysis(res.analysis || 'Analysis complete.');
      notificationService.playSoftChime();
      notificationService.showInAppToast('AI Vision Analysis Ready', 'Gemini Multimodal breakdown generated successfully.', 'success');
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      setAiAnalysis(`### ⚠️ AI Vision Analysis Note\n\n${err.message || 'The AI service is experiencing high traffic. Please retry in a moment.'}\n\n*Tip: Ensure the captured snapshot is clear and contains visible light.*`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Copy analysis text
  const handleCopyAnalysis = () => {
    if (!aiAnalysis) return;
    navigator.clipboard.writeText(aiAnalysis);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Text-To-Speech for AI analysis
  const handleSpeakAnalysis = async () => {
    if (!aiAnalysis) return;

    if (isPlayingAudio) {
      if (audioRef.current) audioRef.current.pause();
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    try {
      const cleanText = aiAnalysis.replace(/[*#_`]/g, '').slice(0, 380);
      const res = await api.textToSpeech({ text: cleanText, voiceName: 'Kore' });

      if (res.audioBase64) {
        if (!audioRef.current) audioRef.current = new Audio();
        audioRef.current.src = `data:audio/wav;base64,${res.audioBase64}`;
        audioRef.current.onended = () => setIsPlayingAudio(false);
        audioRef.current.onerror = () => {
          fallbackSpeech(cleanText);
        };
        await audioRef.current.play();
        return;
      }
    } catch {
      fallbackSpeech(aiAnalysis);
    }
  };

  const fallbackSpeech = (text: string) => {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '').slice(0, 450);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  // Send analysis to Main Chat
  const handleSendToChat = () => {
    if (!aiAnalysis) return;
    const chatSnippet = `📸 **Camera Snapshot Analysis (${activeFilter.name})**\n\n${aiAnalysis}`;
    onNavigateToChat?.(chatSnippet);
  };

  const quickPromptChips = [
    {
      label: '⚛️ Quantum Zoom (10,000,000x)',
      prompt:
        'You are the Uncapped Quantum Vision Engine (10,000,000x Subatomic Lattice & Orbital Matrix). Perform subatomic density field breakdown, electron cloud probability analysis, and atomic lattice grid forensic inspection on this camera snapshot.',
      isMacroModal: true,
    },
    { label: '🔥 Thermal Heat Analysis', prompt: 'Analyze this thermal heat vision snapshot. Identify high-heat signatures (hotspots), relative surface temperatures, potential heat sources (people, electronics, engine, lighting, friction), and cold insulation zones in detail.' },
    { label: '🔍 Describe Scene', prompt: 'Describe the scene, lighting, composition, and visual mood of this camera snapshot in detail.' },
    { label: '📝 Extract Text (OCR)', prompt: 'Read and transcribe all visible text, signs, logos, or writing in this image accurately.' },
    { label: '🎯 Identify Objects', prompt: 'List and identify all notable objects, items, people, and equipment present in this photo.' },
    { label: '✨ Creative Caption', prompt: 'Generate 3 high-impact, aesthetic captions and hashtags suitable for YouTube Shorts and Instagram Reels.' },
    { label: '🎬 Video & VFX Ideas', prompt: 'Suggest creative cinematic video editing techniques, color grading, sound design cues, and VFX workflows for this scene.' },
    { label: '🇮🇳 Telugu Explanation', prompt: 'ఈ ఫోటోలో ఏమి ఉంది? దృశ్యం, వస్తువులు మరియు విశేషాలను స్పష్టమైన తెలుగులో వివరించండి.' },
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] max-w-4xl mx-auto px-2 sm:px-4 pt-1 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] relative z-10 overflow-hidden">
      {/* Top Mode Segment Switcher: Vision Studio vs Thermal / OCR */}
      <div className="flex items-center justify-between gap-2 p-1.5 mb-2 bg-[#040e24]/90 backdrop-blur-md rounded-2xl border border-cyan-500/25 shrink-0 z-20">
        <div className="flex items-center gap-1.5 w-full">
          <button
            type="button"
            onClick={() => setViewMode('studio')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'studio'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Vision Studio</span>
            <span className="hidden xs:inline text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
              Filters & Search
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('thermal_ocr')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'thermal_ocr'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thermal & OCR Lab</span>
          </button>

          {/* Touchless Palm Gesture Photo Share Quick Launch */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('gkedit:open_palm_share'))}
            className="py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-white shadow-sm shrink-0 active:scale-95"
            title="Launch Touchless Palm Gesture Photo Share"
          >
            <span>🖐️</span>
            <span className="hidden sm:inline">Palm Share</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              P2P
            </span>
          </button>
        </div>
      </div>

      {viewMode === 'studio' ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <VisionStudio onNavigateToChat={onNavigateToChat} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* SVG Filters for feColorMatrix Thermal Vision & Heatmap effects */}
          <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <defs>
          {/* Custom SVG feColorMatrix Thermal Vision Heatmap Filter */}
          <filter id="thermal-feColorMatrix" colorInterpolationFilters="sRGB" x="-10%" y="-10%" width="120%" height="120%">
            {/* Step 1: Extract Luminance into Grayscale */}
            <feColorMatrix
              type="matrix"
              values="
                0.299 0.587 0.114 0 0
                0.299 0.587 0.114 0 0
                0.299 0.587 0.114 0 0
                0     0     0     1 0"
              result="luma"
            />
            {/* Step 2: False-color thermal heatmap ramp: Cold (indigo/cyan) -> Mid (green/yellow) -> Hot (amber/red) -> Hotspot Peak (white) */}
            <feComponentTransfer in="luma" result="heatmap">
              <feFuncR type="table" tableValues="0.0 0.05 0.25 0.75 1.0 1.0 1.0" />
              <feFuncG type="table" tableValues="0.0 0.0  0.0  0.2  0.65 0.95 1.0" />
              <feFuncB type="table" tableValues="0.35 0.8 0.95 0.15 0.0  0.3  1.0" />
            </feComponentTransfer>
            {/* Step 3: Color Matrix enhancement for thermal contrast, punch, and glow */}
            <feColorMatrix
              type="matrix"
              in="heatmap"
              values="
                1.25 0    0    0  0.02
                0    1.15 0    0 -0.01
                0    0    1.30 0  0.03
                0    0    0    1  0"
            />
          </filter>

          {/* FLIR Ironbow False-Color Heatmap */}
          <filter id="thermal-ironbow" colorInterpolationFilters="sRGB" x="-10%" y="-10%" width="120%" height="120%">
            <feColorMatrix
              type="matrix"
              values="
                0.299 0.587 0.114 0 0
                0.299 0.587 0.114 0 0
                0.299 0.587 0.114 0 0
                0     0     0     1 0"
              result="gray"
            />
            <feComponentTransfer in="gray">
              <feFuncR type="table" tableValues="0.05 0.15 0.55 0.9 1.0 1.0" />
              <feFuncG type="table" tableValues="0.0  0.0  0.05 0.45 0.85 1.0" />
              <feFuncB type="table" tableValues="0.35 0.75 0.8  0.1  0.2 1.0" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for gallery upload fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Screen flash effect */}
      {flashAnimation && (
        <div className="fixed inset-0 z-50 bg-white pointer-events-none transition-opacity duration-200 opacity-80" />
      )}

      {/* Simulated Screen Torch / Flash Glow */}
      {torchOn && (
        <div className="fixed inset-0 z-40 bg-white/20 pointer-events-none backdrop-brightness-125" />
      )}

      {/* VIEWPORT VIEWFINDER CONTAINER */}
      <div className="relative flex-1 w-full bg-black rounded-3xl overflow-hidden border border-cyan-500/35 shadow-[0_8px_32px_rgba(2,6,23,0.9)] flex items-center justify-center select-none">
        {/* LIVE CAMERA FEED OR FROZEN SNAPSHOT */}
        {capturedImage ? (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
            <img
              src={capturedImage}
              alt="Captured Snapshot"
              className="w-full h-full object-contain"
            />

            {/* LASER SCAN LOADING ANIMATION DURING GEMINI INFERENCE */}
            {isAnalyzing && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
                {/* Horizontal Neon Laser Scanner Beam */}
                <div
                  className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-[scan_2s_ease-in-out_infinite]"
                  style={{
                    animation: 'scan 2.2s ease-in-out infinite alternate',
                  }}
                />

                {/* Cybernetic Scan Grid Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(6,182,212,0.15)_1px,transparent_1px)] [background-size:20px_20px] opacity-70" />

                {/* Laser Status HUD Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-2xl bg-black/85 border border-cyan-400 text-cyan-300 font-mono text-xs flex items-center gap-2.5 shadow-[0_0_25px_rgba(6,182,212,0.5)] backdrop-blur-md">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span className="font-bold tracking-wider uppercase animate-pulse">
                    NEURAL VISION SCANNING...
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
            {cameraError ? (
              <div className="p-6 max-w-sm text-center space-y-4 text-slate-300">
                <div className="w-16 h-16 rounded-2xl bg-red-950/70 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Camera Sensor Unavailable</h3>
                  <p className="text-xs text-red-300 mt-1 leading-relaxed">{cameraError}</p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={startCamera}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again / Grant Permission</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Snapshot from Device</span>
                  </button>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  filter: activeFilterCss,
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                }}
                className="w-full h-full object-cover transition-[filter] duration-200"
              />
            )}
          </div>
        )}

        {/* RULE OF THIRDS 3X3 VIEWFINDER GRID */}
        {showGrid && !cameraError && (
          <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 border border-cyan-500/15">
            <div className="border-r border-b border-cyan-500/20" />
            <div className="border-r border-b border-cyan-500/20" />
            <div className="border-b border-cyan-500/20" />
            <div className="border-r border-b border-cyan-500/20" />
            <div className="border-r border-b border-cyan-500/20" />
            <div className="border-b border-cyan-500/20" />
            <div className="border-r border-cyan-500/20" />
            <div className="border-r border-cyan-500/20" />
            <div />
          </div>
        )}

        {/* CYBERPUNK HUD TARGET RETICLE & CORNER BRACKETS */}
        {!cameraError && (
          <div className="absolute inset-4 pointer-events-none z-10 flex flex-col justify-between">
            {/* Top Brackets */}
            <div className="flex justify-between items-start">
              <div className="w-5 h-5 border-t-2 border-l-2 border-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
              <div className="w-5 h-5 border-t-2 border-r-2 border-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
            </div>

            {/* Center Focus Reticle */}
            {!capturedImage && (
              <div className="self-center flex flex-col items-center justify-center">
                <div
                  className={`w-14 h-14 rounded-full border flex items-center justify-center animate-pulse ${
                    activeFilterId === 'thermal' || activeFilterId === 'ironbow'
                      ? 'border-orange-400/80 shadow-[0_0_15px_rgba(249,115,22,0.6)]'
                      : 'border-cyan-400/40 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activeFilterId === 'thermal' || activeFilterId === 'ironbow'
                        ? 'bg-orange-400 shadow-[0_0_10px_#f97316]'
                        : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                    }`}
                  />
                </div>
                {(activeFilterId === 'thermal' || activeFilterId === 'ironbow') && (
                  <span className="mt-1 text-[9px] font-mono text-orange-300 font-bold bg-black/80 px-2.5 py-0.5 rounded-full border border-orange-500/50 shadow-md">
                    SPOT: 36.6°C [HEAT ACQUIRED]
                  </span>
                )}
              </div>
            )}

            {/* Bottom Brackets */}
            <div className="flex justify-between items-end">
              <div className="w-5 h-5 border-b-2 border-l-2 border-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
              <div className="w-5 h-5 border-b-2 border-r-2 border-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
            </div>
          </div>
        )}

        {/* THERMAL HEAT TEMPERATURE GAUGE OVERLAY */}
        {(activeFilterId === 'thermal' || activeFilterId === 'ironbow') && !cameraError && (
          <div className="absolute right-3 top-20 bottom-20 z-20 pointer-events-none flex items-center gap-1.5 animate-in fade-in duration-300">
            <div className="flex flex-col justify-between h-44 text-[8.5px] font-mono text-white text-right drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
              <span className="text-white font-extrabold">38° MAX</span>
              <span className="text-yellow-300 font-bold">34°</span>
              <span className="text-orange-400 font-bold">30°</span>
              <span className="text-red-400 font-bold">26°</span>
              <span className="text-cyan-300 font-bold">18° MIN</span>
            </div>
            <div className="w-2.5 h-44 rounded-full border border-white/50 overflow-hidden shadow-[0_0_12px_rgba(249,115,22,0.7)] bg-gradient-to-b from-white via-yellow-400 via-orange-500 via-red-600 via-purple-600 to-blue-600" />
          </div>
        )}

        {/* FLOATING TOP HUD STATUS BAR */}
        <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none gap-2">
          {/* Active Filter & Live Tag & Thermal Vision Quick Toggle */}
          <div className="pointer-events-auto flex items-center gap-1.5 flex-wrap">
            <div className="px-2.5 py-1 rounded-full bg-black/75 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>{capturedImage ? 'SNAPSHOT' : 'LIVE FEED'}</span>
              <span className="text-slate-400">•</span>
              <span className="text-white font-extrabold uppercase">{activeFilter.badge}</span>
              {filterIntensity !== 100 && (
                <span className="text-cyan-400 text-[9px]">{filterIntensity}%</span>
              )}
            </div>

            {/* Dedicated Thermal Vision Quick Button */}
            <button
              type="button"
              onClick={() => {
                const nextFilter = activeFilterId === 'thermal' ? 'normal' : 'thermal';
                if (capturedImage) {
                  handleApplyFilterToSnapshot(nextFilter);
                } else {
                  setActiveFilterId(nextFilter);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold transition active:scale-95 shadow-md cursor-pointer ${
                activeFilterId === 'thermal' || activeFilterId === 'ironbow'
                  ? 'bg-gradient-to-r from-orange-600 via-red-600 to-amber-500 text-white border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.6)] animate-pulse'
                  : 'bg-black/75 border-orange-500/40 text-orange-400 hover:text-white hover:bg-orange-950/60'
              }`}
              title="Thermal Heat Vision (థర్మల్ విజన్)"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>THERMAL</span>
              <span className="text-[8.5px] px-1 py-0.2 rounded bg-black/50 text-orange-300">
                {activeFilterId === 'thermal' || activeFilterId === 'ironbow' ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Gesture Training Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsTrainingOpen((prev) => !prev);
                // If facing mode is environment, suggest switching to user front camera for hand tracking
                if (facingMode !== 'user') {
                  setFacingMode('user');
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold transition active:scale-95 shadow-md cursor-pointer ${
                isTrainingOpen
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse'
                  : 'bg-black/75 border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-950/60'
              }`}
              title="Interactive Gesture Training (హ్యాండ్ గెస్చర్ ట్రైనింగ్)"
            >
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>TRAIN GESTURES</span>
              <span className={`text-[8.5px] px-1 py-0.2 rounded font-mono ${
                isTrainingOpen ? 'bg-cyan-900/80 text-cyan-200' : 'bg-black/50 text-cyan-400'
              }`}>
                {isTrainingOpen ? 'ACTIVE' : 'START'}
              </span>
            </button>
          </div>

          {/* Floating HUD Quick Control Buttons */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-black/75 border border-cyan-500/35 p-1 rounded-2xl backdrop-blur-md shadow-lg">
            {/* Flash / Torch Toggle */}
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`p-2 rounded-xl transition ${
                torchOn
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title={torchOn ? 'Turn off flash/torch' : 'Turn on flash/torch'}
              aria-label="Toggle Flash Torch"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>

            {/* Grid Toggle */}
            <button
              type="button"
              onClick={() => setShowGrid((prev) => !prev)}
              className={`p-2 rounded-xl transition ${
                showGrid
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title={showGrid ? 'Hide Grid lines' : 'Show Rule of Thirds Grid'}
              aria-label="Toggle Grid"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>

            {/* Filter Drawer Toggle */}
            <button
              type="button"
              onClick={() => {
                setShowFilterDrawer((prev) => !prev);
                setShowIntensitySlider(false);
              }}
              className={`p-2 rounded-xl transition ${
                showFilterDrawer
                  ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Toggle Visual Filters Drawer"
              aria-label="Toggle Filters"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>

            {/* Intensity Slider Toggle */}
            <button
              type="button"
              onClick={() => {
                setShowIntensitySlider((prev) => !prev);
                setShowFilterDrawer(false);
              }}
              className={`p-2 rounded-xl transition ${
                showIntensitySlider
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title="Fine-tune Filter Intensity"
              aria-label="Filter Intensity"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Flip / Switch Camera (Front/Rear) */}
            {!capturedImage && (
              <button
                type="button"
                onClick={handleToggleCamera}
                className="p-2 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-white/10 transition active:scale-90"
                title={`Switch Camera (Currently ${facingMode === 'user' ? 'Front Selfie' : 'Rear Environment'})`}
                aria-label="Switch Camera Facing Mode"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* INTENSITY SLIDER POPUP */}
        {showIntensitySlider && (
          <div className="absolute top-16 inset-x-4 z-30 p-3 rounded-2xl bg-black/90 border border-cyan-500/40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Filter Intensity ({activeFilter.name})</span>
              </span>
              <span className="text-cyan-300 font-mono font-bold">{filterIntensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              value={filterIntensity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setFilterIntensity(val);
                if (capturedImage && rawSnapshotData) {
                  const filterObj = activeFilter;
                  const newCss = getFilterStyleString(filterObj, val);
                  const img = new Image();
                  img.onload = () => {
                    const canvas = canvasRef.current || document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.filter = newCss;
                      ctx.drawImage(img, 0, 0);
                      if (activeFilter.id === 'thermal' || activeFilter.id === 'ironbow') {
                        applyThermalCanvasEffect(ctx, canvas.width, canvas.height, activeFilter.id, val / 100);
                      }
                      setCapturedImage(canvas.toDataURL('image/jpeg', 0.94));
                    }
                  };
                  img.src = rawSnapshotData;
                }
              }}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>0% (Raw)</span>
              <span>100% (Standard)</span>
              <span>150% (Intense)</span>
            </div>
          </div>
        )}

        {/* COLLAPSIBLE LIVE FILTER CAROUSEL DRAWER */}
        {showFilterDrawer && (
          <div className="absolute bottom-3 inset-x-3 z-30 p-3 rounded-2xl bg-black/90 border border-cyan-500/40 shadow-[0_0_30px_rgba(0,0,0,0.9)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Camera Filters ({CAMERA_FILTERS.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFilterDrawer(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CAMERA_FILTERS.map((f) => {
                const isSelected = activeFilterId === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      if (capturedImage) {
                        handleApplyFilterToSnapshot(f.id);
                      } else {
                        setActiveFilterId(f.id);
                      }
                    }}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-left border transition active:scale-95 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-cyan-500/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: f.color }}
                      />
                      <span className="text-xs font-bold whitespace-nowrap">{f.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                      {f.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* INTERACTIVE GESTURE TRAINING OVERLAY */}
        <GestureTrainingOverlay
          isOpen={isTrainingOpen && !capturedImage}
          onClose={() => setIsTrainingOpen(false)}
          onCompleteAll={() => {
            notificationService.showInAppToast(
              '🎉 Training Completed!',
              'You have mastered Open Palm, Closed Fist, and Pinch air gestures!',
              'success'
            );
          }}
        />
      </div>

      {/* BOTTOM CONTROLS & WORKFLOW BAR */}
      <div className="mt-3 p-3 rounded-2xl bg-[#040e24]/90 border border-cyan-500/30 shadow-xl backdrop-blur-xl">
        {capturedImage ? (
          /* SNAPSHOT PREVIEW ACTIONS (Retake, Download, Analyze with AI) */
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {/* Retake Button */}
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-3.5 py-2 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-cyan-500/30 text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>

                {/* Filter Drawer in Preview Mode */}
                <button
                  type="button"
                  onClick={() => setShowFilterDrawer((prev) => !prev)}
                  className="px-3.5 py-2 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-cyan-500/30 text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Filter className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Filters</span>
                </button>

                {/* Download Snapshot Button */}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3.5 py-2 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-cyan-500/30 text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                  title="Download snapshot JPEG"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* 10,000x Ultra Macro & 100K Matrix Reconstructor Trigger */}
                <button
                  type="button"
                  onClick={() => setShowUltraMacroModal(true)}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-blue-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border border-cyan-400 text-cyan-200 text-xs font-mono font-bold flex items-center gap-1.5 transition active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.35)] cursor-pointer"
                  title="Launch 10,000x Ultra Macro & 100K Matrix Reconstructor"
                >
                  <Cpu className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>10,000x Macro (100K)</span>
                </button>

                {/* Primary AI Analyze Button */}
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => handleAnalyzeWithAI()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzing ? 'Scanning Frame...' : 'Analyze with AI'}</span>
                </button>
              </div>
            </div>

            {/* Quick Prompt Suggestion Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {quickPromptChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => {
                    if ((chip as any).isMacroModal) {
                      setShowUltraMacroModal(true);
                    }
                    handleAnalyzeWithAI(chip.prompt);
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#05132d] hover:bg-blue-900/40 border border-cyan-500/30 text-cyan-200 hover:text-white whitespace-nowrap transition active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Custom Prompt Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAnalyzeWithAI();
              }}
              className="flex items-center gap-2 bg-[#020713] border border-cyan-500/35 rounded-xl p-1.5 focus-within:border-cyan-400 transition"
            >
              <input
                type="text"
                value={customPromptInput}
                onChange={(e) => setCustomPromptInput(e.target.value)}
                placeholder="Ask Gemini AI vision anything about this snapshot..."
                className="flex-1 bg-transparent border-0 text-xs text-white placeholder-slate-500 focus:outline-none px-2"
                disabled={isAnalyzing}
              />
              <button
                type="submit"
                disabled={isAnalyzing}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition disabled:opacity-40"
              >
                <Send className="w-3 h-3" />
                <span className="hidden sm:inline">Ask</span>
              </button>
            </form>
          </div>
        ) : (
          /* LIVE VIEWFINDER SHUTTER BAR */
          <div className="flex items-center justify-between px-2">
            {/* Gallery Upload Fallback */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-2xl bg-blue-950/70 hover:bg-blue-900 border border-cyan-500/25 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition active:scale-95"
              title="Upload photo from device gallery"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Gallery</span>
            </button>

            {/* MAIN SHUTTER BUTTON */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={handleCapturePhoto}
                disabled={!isStreaming}
                className="relative group p-1.5 rounded-full border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] transition active:scale-90 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                title="Capture Snapshot (ట్యాప్ చేసి ఫోటో తీయండి)"
                aria-label="Capture Photo"
              >
                {/* Outer Cyber Pulse Ring */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-400 to-blue-600 flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full bg-white/95 flex items-center justify-center shadow-inner">
                    <Camera className="w-6 h-6 text-slate-950" />
                  </div>
                </div>
              </button>
            </div>

            {/* Switch Camera Button */}
            <button
              type="button"
              onClick={handleToggleCamera}
              className="p-3 rounded-2xl bg-blue-950/70 hover:bg-blue-900 border border-cyan-500/25 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition active:scale-95"
              title="Switch between front and rear cameras"
            >
              <SwitchCamera className="w-4 h-4" />
              <span className="hidden sm:inline">Flip</span>
            </button>
          </div>
        )}
      </div>

      {/* AI VISION ANALYSIS RESULT MODAL / BOTTOM DRAWER */}
      {aiAnalysis && (
        <div className="mt-3 p-4 rounded-3xl bg-[#03091e]/95 border border-cyan-400/40 shadow-[0_10px_35px_rgba(0,0,0,0.85)] max-h-72 overflow-y-auto space-y-3 backdrop-blur-xl animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-white">
                Gemini Multimodal Vision Analysis
              </h4>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Text To Speech */}
              <button
                type="button"
                onClick={handleSpeakAnalysis}
                className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                  isPlayingAudio
                    ? 'bg-cyan-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-blue-900/40'
                }`}
                title="Read aloud with Gemini voice"
              >
                {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Copy */}
              <button
                type="button"
                onClick={handleCopyAnalysis}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/40 transition"
                title="Copy analysis text"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Send to Chat */}
              <button
                type="button"
                onClick={handleSendToChat}
                className="px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-[11px] font-bold flex items-center gap-1 hover:bg-cyan-500/30 transition"
                title="Continue discussion in main chat"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Chat</span>
              </button>

              {/* Search with Google Lens */}
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(analysisPrompt || 'thermal camera object')}&udm=2`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-bold flex items-center gap-1 hover:bg-blue-500/30 transition no-underline cursor-pointer"
                title="Find this object on Google Lens"
              >
                <Search className="w-3 h-3" />
                <span>Google Lens</span>
              </a>

              {/* Close analysis drawer */}
              <button
                type="button"
                onClick={() => setAiAnalysis(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/40 transition"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Formatted Markdown Content */}
          <div className="prose prose-invert prose-cyan max-w-none text-xs leading-relaxed break-words space-y-2 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_strong]:text-cyan-200 [&_code]:bg-blue-950 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded text-slate-200">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAnalysis}</ReactMarkdown>
          </div>
        </div>
      )}
        </div>
      )}

      {/* 10,000x Ultra Macro & 32K Enhancer Modal */}
      {capturedImage && (
        <UltraMacroDeepVisionModal
          isOpen={showUltraMacroModal}
          onClose={() => setShowUltraMacroModal(false)}
          capturedImageDataUrl={capturedImage}
          initialItemName="Optical Camera Target"
          initialZoom={10000000}
          onSendToGenerator={(prompt) => {
            setShowUltraMacroModal(false);
            window.dispatchEvent(new CustomEvent('gkedit:fill_chat_prompt', { detail: { prompt } }));
            window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'generators' } }));
          }}
        />
      )}
    </div>
  );
}
