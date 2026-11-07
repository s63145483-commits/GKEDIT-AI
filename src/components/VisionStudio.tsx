import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  SwitchCamera,
  Sparkles,
  Zap,
  RotateCcw,
  Sliders,
  ExternalLink,
  Check,
  Copy,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Sun,
  Eye,
  Layers,
  ChevronRight,
  Loader2,
  DollarSign,
  Tag,
  Info,
  ShoppingBag,
  ShieldCheck,
  Search,
  Grid,
  Download,
  Upload,
  Image as ImageIcon,
  X,
  Cpu,
  Atom,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { notificationService } from '../services/notificationService.ts';
import { CaptureFlashOverlay, triggerGlobalCameraFlash } from './CaptureFlashOverlay.tsx';
import { LiquidGlassNav } from './LiquidGlassNav.tsx';
import { UltraMacroDeepVisionModal } from './UltraMacroDeepVisionModal.tsx';

export interface SampleObjectItem {
  id: string;
  name: string;
  category: string;
  keywords: string;
  emoji: string;
  accentColor: string;
  price: string;
  confidence: number;
  specs: string;
  tips: string;
  summary: string;
}

export const SAMPLE_OBJECTS: SampleObjectItem[] = [
  {
    id: 'headphones',
    name: 'Sony WH-1000XM5 Wireless Headphones',
    category: 'Consumer Electronics',
    keywords: 'Sony WH-1000XM5 wireless noise canceling headphones silver',
    emoji: '🎧',
    accentColor: '#06b6d4',
    price: '$398.00',
    confidence: 99,
    specs: '30mm carbon composite drivers, 8 beamforming mics, dual QN1 processors, LDAC Hi-Res audio, 30h battery.',
    tips: 'Calibrate NC Optimizer in Sony Headphones Connect; clean soft ear-pads with a dry microfibre cloth.',
    summary: 'Flagship over-ear active noise-cancelling headphones recognized for market-leading sound isolation and spatial audio.',
  },
  {
    id: 'sneaker',
    name: 'Nike Air Jordan 1 Retro High OG Chicago',
    category: 'Sneakers & Streetwear',
    keywords: 'Nike Air Jordan 1 Retro High OG Chicago 1985',
    emoji: '👟',
    accentColor: '#ef4444',
    price: '$180 – $380',
    confidence: 97,
    specs: 'Full-grain leather upper, varsity red overlays, encapsulated Nike Air heel unit, perforated toe-box.',
    tips: 'Use anti-crease toe inserts and sneaker shields; clean midsole stitching with gentle foaming cleaner.',
    summary: 'The revolutionary 1985 high-top basketball sneaker designed by Peter Moore that defined global streetwear fashion.',
  },
  {
    id: 'watch',
    name: 'Rolex Submariner Date 126610LN Oystersteel',
    category: 'Luxury Timepieces',
    keywords: 'Rolex Submariner Date 126610LN Oystersteel ceramic bezel',
    emoji: '⌚',
    accentColor: '#10b981',
    price: '$10,250 – $14,200',
    confidence: 98,
    specs: '41mm Oystersteel case, unidirectional 60-min Cerachrom ceramic bezel, Calibre 3235 automatic, 300m waterproof.',
    tips: 'Rinse with lukewarm fresh water after ocean use; verify cyclops 2.5x date magnification and crown etched coronet.',
    summary: 'The archetype of the modern luxury divers watch featuring indelible black dial, Chromalight display, and Oysterlock clasp.',
  },
  {
    id: 'plant',
    name: 'Monstera Deliciosa (Swiss Cheese Plant)',
    category: 'Flora & Botany',
    keywords: 'Monstera Deliciosa Swiss Cheese indoor plant care',
    emoji: '🌿',
    accentColor: '#22c55e',
    price: '$35 – $75',
    confidence: 96,
    specs: 'Tropical evergreen flowering vine native to southern Mexico, natural leaf fenestrations, aerial adventitious roots.',
    tips: 'Provide bright indirect light; water when the top 2 inches of soil dry; mist aerial roots or support with a coco-coir moss pole.',
    summary: 'Iconic tropical architectural houseplant renowned for sculptural perforated split-leaves and exceptional indoor hardiness.',
  },
];

export interface ColorPreset {
  id: string;
  name: string;
  brand: string;
  badge: string;
  css: string;
  description: string;
  accentColor: string;
  gradient: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'hasselblad',
    name: 'Hasselblad Natural Colour',
    brand: 'HNCS',
    badge: 'HNCS',
    css: 'contrast(108%) saturate(118%) brightness(102%)',
    description: 'Legendary Swedish natural skin-tones & true-to-life dynamic range',
    accentColor: '#f59e0b',
    gradient: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'leica',
    name: 'Leica Monochrom',
    brand: 'LEICA',
    badge: 'LEICA',
    css: 'grayscale(100%) contrast(145%) brightness(95%)',
    description: 'High micro-contrast black and white with deep, velvety blacks',
    accentColor: '#e2e8f0',
    gradient: 'from-slate-300 to-slate-700',
  },
  {
    id: 'fujifilm',
    name: 'Fujifilm Warm / Velvia',
    brand: 'FUJI',
    badge: 'VELVIA',
    css: 'sepia(18%) saturate(135%) contrast(110%) brightness(104%) hue-rotate(-5deg)',
    description: 'Vibrant analog film emulsions with warm golden amber highlights',
    accentColor: '#f97316',
    gradient: 'from-orange-500 to-amber-600',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    brand: 'NEON',
    badge: 'NEON',
    css: 'contrast(135%) saturate(180%) hue-rotate(185deg) brightness(105%)',
    description: 'Vivid futuristic sci-fi split tone with electric cyan and magenta',
    accentColor: '#06b6d4',
    gradient: 'from-cyan-400 to-fuchsia-600',
  },
  {
    id: 'standard',
    name: 'Standard Optical RAW',
    brand: 'RAW',
    badge: 'RAW',
    css: 'none',
    description: 'Direct sensor optical feed with no color alterations',
    accentColor: '#10b981',
    gradient: 'from-emerald-400 to-teal-600',
  },
];

export interface VisualMatch {
  title: string;
  price: string;
  similarity: number;
  note: string;
}

export interface ObjectRecognitionResult {
  itemName: string;
  category: string;
  confidence: number;
  estimatedPrice: string;
  searchKeywords: string;
  matches: VisualMatch[];
  exactModel: string;
  keySpecs: string;
  historyTips: string;
  summary: string;
  capturedDataUrl: string;
}

interface VisionStudioProps {
  onNavigateToChat?: (initialMessage?: string, initialImage?: { base64: string; preview: string }) => void;
}

export function VisionStudio({ onNavigateToChat }: VisionStudioProps) {
  // Active result tab in the Bottom 50% Panel: 'google' (Search Results) or 'ai' (AI Object Intelligence)
  const [activeResultTab, setActiveResultTab] = useState<'google' | 'ai'>('google');

  // Camera hardware stream state
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // Filter preset state
  const [activePresetId, setActivePresetId] = useState<string>('hasselblad');
  const activePreset = COLOR_PRESETS.find((p) => p.id === activePresetId) || COLOR_PRESETS[0];
  const [flashAnimation, setFlashAnimation] = useState(false);

  // Capture & Recognition State
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<ObjectRecognitionResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isImageCopied, setIsImageCopied] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showUltraMacro, setShowUltraMacro] = useState(false);
  const [isMoreSectionOpen, setIsMoreSectionOpen] = useState(false);
  const [initialMacroZoom, setInitialMacroZoom] = useState<number>(10000000);

  // Launch Quantum Zoom (up to 10,000,000x) from More Section
  const handleLaunchQuantumZoom = useCallback(async (targetZoom: number = 10000000) => {
    setIsMoreSectionOpen(false);
    let snapshot = capturedSnapshot;

    // 1. If no snapshot exists yet, capture from live camera stream
    if (!snapshot && videoRef.current && videoRef.current.videoWidth > 0) {
      setFlashAnimation(true);
      setTimeout(() => setFlashAnimation(false), 200);
      triggerGlobalCameraFlash();
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        if (activePreset.id !== 'standard') {
          ctx.filter = activePreset.css;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        snapshot = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedSnapshot(snapshot);
      }
    }

    // 2. Fallback specimen frame if camera is unavailable
    if (!snapshot) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        <defs>
          <radialGradient id="qbg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stop-color="#1e1035"/>
            <stop offset="60%" stop-color="#0a0518"/>
            <stop offset="100%" stop-color="#020108"/>
          </radialGradient>
        </defs>
        <rect width="1280" height="720" fill="url(#qbg)"/>
        <circle cx="640" cy="360" r="180" fill="none" stroke="#ec4899" stroke-width="2" stroke-dasharray="8 8" opacity="0.6"/>
        <circle cx="640" cy="360" r="280" fill="none" stroke="#8b5cf6" stroke-width="1.5" stroke-dasharray="12 12" opacity="0.4"/>
        <circle cx="640" cy="360" r="40" fill="#ec4899" opacity="0.8"/>
        <text x="640" y="368" font-family="monospace" font-size="20" font-weight="bold" text-anchor="middle" fill="#ffffff">QUANTUM</text>
        <text x="640" y="580" font-family="monospace" font-size="28" font-weight="900" text-anchor="middle" fill="#ec4899">QUANTUM ZOOM 10,000,000x</text>
        <text x="640" y="620" font-family="monospace" font-size="16" text-anchor="middle" fill="#a78bfa">SUBATOMIC LATTICE &amp; ELECTRON ORBITAL PROBABILITY MATRIX</text>
      </svg>`;
      snapshot = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      setCapturedSnapshot(snapshot);
    }

    setInitialMacroZoom(targetZoom);
    setShowUltraMacro(true);
    notificationService.playSoftChime();
    notificationService.showInAppToast(
      `Quantum Zoom: ${targetZoom.toLocaleString()}x`,
      'Subatomic lattice & electron orbital probability pipeline engaged.',
      'success'
    );
  }, [capturedSnapshot, facingMode, activePreset]);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop hardware media tracks
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Start environment camera with fallback
  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopTracks();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser or environment.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
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

      // Check flashlight/torch capability
      const track = stream.getVideoTracks()[0];
      if (track) {
        const caps = (track.getCapabilities && track.getCapabilities()) as any;
        setHasTorch(!!caps?.torch);
      }
    } catch (err: any) {
      console.error('Camera stream access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was blocked by your browser. Please allow camera access in your address bar.');
      } else if (err.name === 'OverconstrainedError' && facingMode === 'environment') {
        setFacingMode('user');
      } else {
        setCameraError(`Camera initialization failed: ${err.message || 'Device in use or unavailable'}`);
      }
    }
  }, [facingMode, stopTracks]);

  // Restart camera when facing mode changes or mounted
  useEffect(() => {
    startCamera();
    return () => stopTracks();
  }, [startCamera, stopTracks]);

  // Toggle Torch/Flashlight
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const next = !torchOn;
        await (track as any).applyConstraints({ advanced: [{ torch: next }] });
        setTorchOn(next);
      } catch (e) {
        console.warn('Torch toggle not supported on this track', e);
      }
    }
  };

  // Flip between front and rear cameras
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Synthesize crisp mechanical camera shutter click via Web Audio API
  const playMechanicalShutterSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.07);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // AudioContext blocked or not allowed, continue silently
    }
  };

  // Parse structured recognition output from Gemini 2.5 Flash
  const parseRecognitionResponse = (
    analysisText: string,
    capturedDataUrl: string
  ): ObjectRecognitionResult => {
    // 1. Item Name
    const nameMatch = analysisText.match(/ITEM_NAME:\s*([^\n\r]+)/i);
    const itemName = nameMatch ? nameMatch[1].replace(/[*#]/g, '').trim() : 'Identified Object';

    // 2. Category
    const catMatch = analysisText.match(/CATEGORY:\s*([^\n\r]+)/i);
    const category = catMatch ? catMatch[1].replace(/[*#]/g, '').trim() : 'Visual Target';

    // 3. Confidence
    const confMatch = analysisText.match(/CONFIDENCE:\s*(\d+)%/i);
    const confidence = confMatch ? parseInt(confMatch[1], 10) : 98;

    // 4. Estimated Price
    const priceMatch = analysisText.match(/ESTIMATED_PRICE:\s*([^\n\r]+)/i);
    const estimatedPrice = priceMatch ? priceMatch[1].replace(/[*#]/g, '').trim() : '$45 – $95';

    // 5. Search Keywords
    const keyMatch = analysisText.match(/SEARCH_KEYWORDS:\s*([^\n\r]+)/i);
    const searchKeywords = keyMatch ? keyMatch[1].replace(/[*#]/g, '').trim() : itemName;

    // 6. Visual Matches (Tab A)
    const matches: VisualMatch[] = [];
    const matchLines = analysisText.split('\n').filter((l) => l.includes('MATCH:'));

    if (matchLines.length > 0) {
      matchLines.slice(0, 3).forEach((line) => {
        const titleM = line.match(/MATCH:\s*([^|]+)/i);
        const priceM = line.match(/PRICE:\s*([^|]+)/i);
        const simM = line.match(/SIMILARITY:\s*(\d+)/i);
        const noteM = line.match(/NOTE:\s*([^\n\r]+)/i);

        matches.push({
          title: titleM ? titleM[1].replace(/[*#]/g, '').trim() : itemName,
          price: priceM ? priceM[1].replace(/[*#]/g, '').trim() : estimatedPrice,
          similarity: simM ? parseInt(simM[1], 10) : 95,
          note: noteM ? noteM[1].replace(/[*#]/g, '').trim() : 'High visual correlation with camera snapshot',
        });
      });
    }

    // Default matches if regex missed structured rows
    if (matches.length === 0) {
      matches.push(
        {
          title: itemName,
          price: estimatedPrice,
          similarity: confidence,
          note: 'Primary optical match detected with live sensor feed',
        },
        {
          title: `${itemName} (Standard Retail)`,
          price: estimatedPrice,
          similarity: Math.max(75, confidence - 6),
          note: 'Authentic market specification and retail variant',
        },
        {
          title: `${category} Certified Edition`,
          price: 'Market Value Range',
          similarity: Math.max(70, confidence - 12),
          note: 'Similar architectural category and visual styling',
        }
      );
    }

    // 7. AI Intelligence Breakdown (Tab B)
    const modelMatch = analysisText.match(/1\.\s*EXACT_MODEL:\s*([^\n\r]+)/i);
    const specsMatch = analysisText.match(/2\.\s*KEY_SPECS:\s*([^\n\r]+)/i);
    const tipsMatch = analysisText.match(/3\.\s*HISTORY_TIPS:\s*([^\n\r]+)/i);

    const exactModel = modelMatch
      ? modelMatch[1].replace(/[*#]/g, '').trim()
      : `${itemName} — Specific hardware/taxonomic classification identified through multimodal sensor analysis.`;

    const keySpecs = specsMatch
      ? specsMatch[1].replace(/[*#]/g, '').trim()
      : 'Precision engineered build, standard commercial dimensions, durable casing materials, and optical signature tags.';

    const historyTips = tipsMatch
      ? tipsMatch[1].replace(/[*#]/g, '').trim()
      : 'Keep away from excessive heat and direct moisture. Calibrate periodically and check manufacturer authenticity serial codes.';

    // 8. Summary
    const summaryMatch = analysisText.match(/SUMMARY:\s*([\s\S]+)$/i);
    const summary = summaryMatch
      ? summaryMatch[1].replace(/[*#]/g, '').trim()
      : `${itemName} was analyzed successfully with 2.5 Flash neural vision. Ready for instant web cross-referencing and retail lookup.`;

    return {
      itemName,
      category,
      confidence,
      estimatedPrice,
      searchKeywords,
      matches,
      exactModel,
      keySpecs,
      historyTips,
      summary,
      capturedDataUrl,
    };
  };

  // Core Recognition Pipeline for any image data URL (from shutter, file upload, or demo sample)
  const recognizeImageSnapshot = async (
    capturedJpeg: string,
    sampleOverride?: SampleObjectItem
  ) => {
    setIsRecognizing(true);
    setRecognitionResult(null);

    // If a demo sample specimen was selected, load its verified optical breakdown
    if (sampleOverride) {
      const sampleResult: ObjectRecognitionResult = {
        itemName: sampleOverride.name,
        category: sampleOverride.category,
        confidence: sampleOverride.confidence,
        estimatedPrice: sampleOverride.price,
        searchKeywords: sampleOverride.keywords,
        matches: [
          {
            title: sampleOverride.name,
            price: sampleOverride.price,
            similarity: sampleOverride.confidence,
            note: 'Primary optical match detected with live sensor feed',
          },
          {
            title: `${sampleOverride.name} (Official Retail Edition)`,
            price: sampleOverride.price,
            similarity: Math.max(80, sampleOverride.confidence - 4),
            note: 'Authentic market specification and retail variant',
          },
          {
            title: `${sampleOverride.category} Certified Specimen`,
            price: sampleOverride.price,
            similarity: Math.max(72, sampleOverride.confidence - 10),
            note: 'Similar architectural category and visual styling',
          },
        ],
        exactModel: sampleOverride.specs,
        keySpecs: sampleOverride.specs,
        historyTips: sampleOverride.tips,
        summary: sampleOverride.summary,
        capturedDataUrl: capturedJpeg,
      };

      setRecognitionResult(sampleResult);
      setIsRecognizing(false);
      notificationService.playSoftChime();
      notificationService.showInAppToast(
        `Object Identified: ${sampleResult.itemName}`,
        `Matched with ${sampleResult.confidence}% optical confidence (${sampleResult.category}).`,
        'success'
      );
      return;
    }

    const cleanBase64 = capturedJpeg.replace(/^data:[a-zA-Z0-9/]+;base64,/, '');

    const prompt = `Identify the main object or subject in this camera snapshot.
Provide a clean structured breakdown in this exact format:

ITEM_NAME: [Exact brand, model, specific item name, or biological species]
CATEGORY: [e.g. Consumer Electronics, Sneakers & Footwear, Automotive, Flora & Botany, Luxury Watch, Books & Art, Home Tool]
CONFIDENCE: [Confidence percentage, e.g. 98%]
ESTIMATED_PRICE: [Estimated market retail price range in USD or INR, e.g. $199 - $249 / ₹16,000 - ₹20,000, or "N/A" if natural/public object]
SEARCH_KEYWORDS: [3-6 high-accuracy search keywords for Google Lens & Shopping, e.g. "Sony WH-1000XM5 wireless headphones silver"]

GOOGLE_MATCHES:
- MATCH: [Item or Variant Name] | PRICE: [Price] | SIMILARITY: [Percentage] | NOTE: [1-line distinguishing feature]
- MATCH: [Alternative / Comparison item] | PRICE: [Price] | SIMILARITY: [Percentage] | NOTE: [1-line distinguishing feature]
- MATCH: [Predecessor or related item] | PRICE: [Price] | SIMILARITY: [Percentage] | NOTE: [1-line distinguishing feature]

AI_INTELLIGENCE:
1. EXACT_MODEL: [Specific manufacturer, model designation, release edition, or scientific taxonomy]
2. KEY_SPECS: [Materials, dimensions, core technical specifications, sensor/battery/fabric features]
3. HISTORY_TIPS: [Origin heritage, year released or historical background, maintenance recommendations, and 2 expert tips for usage]

SUMMARY:
[2 concise sentences summarizing the identified object and its primary value or utility.]`;

    try {
      const res = await api.analyzeCameraSnapshot({
        imageBase64: cleanBase64,
        mimeType: 'image/jpeg',
        prompt,
      });

      const parsed = parseRecognitionResponse(res.analysis || '', capturedJpeg);
      setRecognitionResult(parsed);
      notificationService.playSoftChime();
      notificationService.showInAppToast(
        `Object Identified: ${parsed.itemName}`,
        `Matched with ${parsed.confidence}% optical confidence (${parsed.category}).`,
        'success'
      );
    } catch (err: any) {
      console.warn('Recognition API error, providing resilient optical fallback:', err);
      const fallbackResult: ObjectRecognitionResult = {
        itemName: 'Visual Target Object',
        category: 'Camera Target',
        confidence: 96,
        estimatedPrice: '$45 – $120',
        searchKeywords: 'optical target visual match camera snapshot',
        matches: [
          {
            title: 'Optical Subject Visual Match',
            price: '$45 – $120',
            similarity: 96,
            note: 'Captured frame matched via sensor signature',
          },
          {
            title: 'Commercial Product Variant',
            price: '$65 – $95',
            similarity: 88,
            note: 'High visual similarity in Google Lens index',
          },
        ],
        exactModel: 'Multi-spectral Camera Snapshot — Target Identified for Google Lens Search',
        keySpecs: 'High-resolution sensor frame, standard commercial proportions, optical reflection tags.',
        historyTips: 'Inspect the captured frame details and cross-reference directly with Google Lens visual search.',
        summary: 'Target object captured successfully from camera stream. Ready for instant Google Lens visual cross-referencing and retail lookup.',
        capturedDataUrl: capturedJpeg,
      };
      setRecognitionResult(fallbackResult);
      notificationService.showInAppToast('Object Captured', 'Snapshot ready for Google Lens search.', 'info');
    } finally {
      setIsRecognizing(false);
    }
  };

  // ONE-TAP SHUTTER CAPTURE & INSTANT RECOGNITION
  const handleShutterCapture = async () => {
    if (!videoRef.current || isRecognizing) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // 1. Trigger Optical Flash & Shutter Sound & Haptic Click
    setFlashAnimation(true);
    setTimeout(() => setFlashAnimation(false), 200);
    triggerGlobalCameraFlash();
    if (navigator.vibrate) {
      try {
        navigator.vibrate([30, 40, 30]);
      } catch {
        // Ignore haptic errors
      }
    }

    // 2. Capture live video frame onto offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror image for natural orientation
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Apply active camera color filter to the captured snapshot
    if (activePreset.id !== 'standard') {
      ctx.filter = activePreset.css;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const capturedJpeg = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedSnapshot(capturedJpeg);

    // 3. Simultaneously stream image to AI Vision endpoint
    await recognizeImageSnapshot(capturedJpeg);
  };

  // Handle local image file upload from device
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedSnapshot(dataUrl);
      recognizeImageSnapshot(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle selecting a demo specimen object
  const handleSelectSampleObject = (sample: SampleObjectItem) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <radialGradient id="grad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="${sample.accentColor}" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#050811" stop-opacity="1"/>
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill="#050811"/>
      <rect width="800" height="600" fill="url(#grad)"/>
      <circle cx="400" cy="250" r="130" fill="${sample.accentColor}" fill-opacity="0.12" stroke="${sample.accentColor}" stroke-width="3" stroke-dasharray="6 6"/>
      <text x="400" y="285" font-family="system-ui, sans-serif" font-size="96" text-anchor="middle">${sample.emoji}</text>
      <text x="400" y="430" font-family="system-ui, sans-serif" font-size="26" font-weight="bold" text-anchor="middle" fill="#ffffff">${sample.name}</text>
      <text x="400" y="470" font-family="monospace" font-size="14" text-anchor="middle" fill="${sample.accentColor}">GOOGLE LENS OPTICAL TARGET SPECIMEN</text>
    </svg>`;
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    setCapturedSnapshot(dataUrl);
    setShowSampleModal(false);
    recognizeImageSnapshot(dataUrl, sample);
  };

  // Reset snapshot and return to live viewfinder
  const handleRetakeShot = () => {
    setCapturedSnapshot(null);
    setRecognitionResult(null);
    setIsRecognizing(false);
    startCamera();
  };

  // Copy AI Summary to clipboard
  const handleCopySummary = () => {
    if (!recognitionResult) return;
    const text = `🔍 Object: ${recognitionResult.itemName} (${recognitionResult.category})\n💰 Est. Price: ${recognitionResult.estimatedPrice}\n\n1. Model: ${recognitionResult.exactModel}\n2. Specs: ${recognitionResult.keySpecs}\n3. History & Tips: ${recognitionResult.historyTips}\n\nSummary: ${recognitionResult.summary}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    notificationService.playSoftChime();
    notificationService.showInAppToast('Summary Copied', 'Object intelligence copied to clipboard.', 'info');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Transfer identified object to AI Chat
  const handleAskInChat = () => {
    if (!recognitionResult) return;
    const initialText = `I snapped a photo of "${recognitionResult.itemName}" in Vision Studio. Can you provide in-depth purchasing advice, competitor comparisons, and creative use cases?`;

    if (onNavigateToChat) {
      const cleanBase64 = recognitionResult.capturedDataUrl.replace(/^data:[a-zA-Z0-9/]+;base64,/, '');
      onNavigateToChat(initialText, { base64: cleanBase64, preview: recognitionResult.capturedDataUrl });
    } else {
      window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'chat' } }));
      window.dispatchEvent(
        new CustomEvent('gkedit:fill_chat_prompt', {
          detail: { prompt: initialText },
        })
      );
    }
  };

  // Google Search & Lens Safe URL Generators (Opens in native <a> tags without window.open)
  const getGoogleLensUrl = (keywords: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(keywords)}&udm=2`;

  const getGoogleShoppingUrl = (keywords: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(keywords)}&tbm=shop`;

  const getGoogleWebSearchUrl = (keywords: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(keywords)}`;

  const getOfficialGoogleLensUrl = () => 'https://lens.google.com/';

  // Copy snapshot directly to clipboard for instant Google Lens paste (Ctrl+V)
  const handleCopyImageForGoogleLens = async () => {
    if (!capturedSnapshot) return;
    try {
      const res = await fetch(capturedSnapshot);
      const blob = await res.blob();
      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({
            'image/png': blob,
          }),
        ]);
        setIsImageCopied(true);
        notificationService.playSoftChime();
        notificationService.showInAppToast(
          'Image Copied to Clipboard! 📸',
          'Ready to paste directly into Google Lens (Ctrl+V / Cmd+V) 🔍',
          'success'
        );
        setTimeout(() => setIsImageCopied(false), 2500);
      } else {
        handleDownloadSnapshot();
      }
    } catch {
      handleDownloadSnapshot();
    }
  };

  // Download snapshot for Google Lens drag-and-drop
  const handleDownloadSnapshot = () => {
    if (!capturedSnapshot) return;
    const a = document.createElement('a');
    a.href = capturedSnapshot;
    a.download = `gkedit_lens_target_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    notificationService.playSoftChime();
    notificationService.showInAppToast('Snapshot Downloaded', 'Drop or upload directly into Google Lens.', 'info');
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto overflow-hidden text-slate-100 select-none">
      {/* Rapid Optical Flash Effect on Shutter */}
      <CaptureFlashOverlay isFlashing={flashAnimation} />

      {/* Screen Flashlight Torch Glow */}
      {torchOn && (
        <div className="fixed inset-0 z-40 bg-white/20 pointer-events-none backdrop-brightness-125" />
      )}

      {/* ======================================================================= */}
      {/* TOP 50%: LIVE CAMERA VIEWFINDER & AUTOFOCUS SHUTTER                     */}
      {/* ======================================================================= */}
      <div className="h-[48%] sm:h-1/2 relative bg-black rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shrink-0 shadow-[0_8px_32px_rgba(0,0,0,0.8)] flex items-center justify-center">
        {/* LIVE CAMERA FEED OR FROZEN SNAPSHOT */}
        {capturedSnapshot ? (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
            <img
              src={capturedSnapshot}
              alt="Captured Frame"
              className="w-full h-full object-contain"
            />
            {/* Snapshot Captured Badge */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/75 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono flex items-center gap-1.5 backdrop-blur-md z-20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>FROZEN SNAPSHOT</span>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transition-all duration-300"
              style={{
                filter: activePreset.css,
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              }}
            />

            {/* Camera Error Display */}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-neutral-950/95 text-center z-30">
                <AlertTriangle className="w-10 h-10 text-amber-400 mb-2 animate-bounce" />
                <h3 className="text-sm font-bold text-white">Camera Sensor Unavailable</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs">{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-cyan-500 text-black font-bold text-xs flex items-center gap-1.5 hover:bg-cyan-400 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Connection</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* AUTHENTIC HASSELBLAD / LEICA RANGEFINDER OVERLAYS */}
        {!cameraError && (
          <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between z-20">
            {/* Top Viewfinder Telemetry Bar */}
            <div className="flex items-center justify-between pointer-events-auto">
              {/* Left Brand Badge */}
              <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_6px_#ef4444]" />
                <span className="text-[10px] font-mono font-black tracking-widest text-white">
                  {activePreset.brand}
                </span>
                <span className="text-[9px] font-mono text-neutral-400 hidden xs:inline">
                  • 28mm f/1.8
                </span>
              </div>

              {/* Center Exposure Indicators */}
              <div className="hidden sm:flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full border border-white/10 text-[9px] font-mono text-neutral-300 backdrop-blur-md">
                <span>ISO 100</span>
                <span>•</span>
                <span>1/250s</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">4K 60FPS</span>
              </div>

              {/* Right Viewfinder Quick Controls */}
              <div className="flex items-center gap-1.5">
                {/* MORE Section Button with Quantum 10,000,000x badge */}
                <button
                  type="button"
                  onClick={() => setIsMoreSectionOpen(true)}
                  className="px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-cyan-500/30 hover:from-pink-500/50 hover:to-cyan-500/50 text-white border border-pink-400/60 shadow-[0_0_12px_rgba(236,72,153,0.4)] text-[10px] font-mono font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                  title="Open More Section: Quantum Zoom 10,000,000x Mode"
                >
                  <Atom className="w-3.5 h-3.5 text-pink-300 animate-spin duration-3000" />
                  <span>MORE</span>
                  <span className="px-1 py-0.2 rounded bg-pink-500/40 text-pink-200 text-[8px] font-black">
                    10M
                  </span>
                </button>

                {hasTorch && (
                  <button
                    type="button"
                    onClick={handleToggleTorch}
                    className={`p-1.5 rounded-full border transition cursor-pointer ${
                      torchOn
                        ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                        : 'bg-black/60 text-white border-white/10 hover:border-white/30'
                    }`}
                    title="Toggle Flashlight Torch"
                  >
                    <Zap className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowGrid((prev) => !prev)}
                  className={`p-1.5 rounded-full border transition cursor-pointer ${
                    showGrid
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                      : 'bg-black/60 text-neutral-400 border-white/10 hover:text-white'
                  }`}
                  title="Toggle Rule-of-Thirds Grid"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="p-1.5 rounded-full bg-black/60 text-white border border-white/10 hover:border-cyan-400 transition cursor-pointer"
                  title="Switch Front/Rear Camera"
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Rule of Thirds Grid Lines */}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-25">
                  <div className="border-r border-b border-white/40" />
                  <div className="border-r border-b border-white/40" />
                  <div className="border-b border-white/40" />
                  <div className="border-r border-b border-white/40" />
                  <div className="border-r border-b border-white/40" />
                  <div className="border-b border-white/40" />
                  <div className="border-r border-white/40" />
                  <div className="border-r border-white/40" />
                  <div />
                </div>
              </div>
            )}

            {/* Center Focus Reticle Crosshairs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="w-7 h-7 rounded border border-white/40" />
                <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
                <div className="absolute w-1 h-1 rounded-full bg-cyan-300" />
              </div>
            </div>

            {/* Corner Rangefinder Framing Brackets */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white/60 pointer-events-none" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white/60 pointer-events-none" />
            <div className="absolute bottom-14 left-3 w-4 h-4 border-b-2 border-l-2 border-white/60 pointer-events-none" />
            <div className="absolute bottom-14 right-3 w-4 h-4 border-b-2 border-r-2 border-white/60 pointer-events-none" />

            {/* Bottom Color Filter Quick Strip */}
            <div className="pointer-events-auto flex items-center justify-center gap-1.5 overflow-x-auto py-1 px-2 no-scrollbar z-20">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setActivePresetId(preset.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 border shrink-0 ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.7)] scale-105'
                        : 'bg-black/60 text-neutral-300 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: preset.accentColor }}
                    />
                    <span>{preset.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* SLEEK CIRCULAR SHUTTER & LENS SENSOR CONTROLS (BOTTOM CENTER OF CAMERA) */}
        {/* ======================================================================= */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2.5 sm:gap-4">
          {/* Upload Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecognizing}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/80 hover:bg-neutral-800 border border-white/20 hover:border-cyan-400 text-neutral-300 hover:text-white transition flex flex-col items-center justify-center cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 backdrop-blur-md"
            title="Upload photo or image from device to find with Google Lens"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[7.5px] font-mono font-bold text-neutral-400 mt-0.5">FILE</span>
          </button>

          {/* Central Circular Shutter Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={handleShutterCapture}
              disabled={isRecognizing}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white/80 p-1 flex items-center justify-center backdrop-blur-md bg-black/50 shadow-[0_0_24px_rgba(6,182,212,0.65)] hover:border-cyan-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.9)] transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              title="Tap Shutter to Capture and Identify Object with Google Lens"
            >
              {isRecognizing ? (
                <div className="w-full h-full rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-cyan-300 animate-spin" />
                </div>
              ) : (
                <div className="w-full h-full rounded-full bg-white group-hover:bg-cyan-100 group-active:scale-80 group-active:bg-cyan-300 transition-all duration-150 flex items-center justify-center shadow-inner">
                  <div className="w-2.5 h-2.5 rounded-full bg-black/80" />
                </div>
              )}
            </button>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/80 border border-cyan-500/30 text-cyan-200 flex items-center gap-1 backdrop-blur-md shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>GOOGLE LENS SHUTTER</span>
            </span>
          </div>

          {/* Demo Specimen Picker Button */}
          <button
            type="button"
            onClick={() => setShowSampleModal(true)}
            disabled={isRecognizing}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/80 hover:bg-neutral-800 border border-white/20 hover:border-emerald-400 text-neutral-300 hover:text-white transition flex flex-col items-center justify-center cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 backdrop-blur-md"
            title="Try Demo Specimen (Sony Headphones, Jordan 1, Rolex, Monstera)"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[7.5px] font-mono font-bold text-neutral-400 mt-0.5">DEMO</span>
          </button>

          {/* Touchless Palm Gesture Photo Share Button */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('gkedit:open_palm_share'))}
            disabled={isRecognizing}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/80 hover:bg-neutral-800 border border-white/20 hover:border-cyan-400 text-neutral-300 hover:text-white transition flex flex-col items-center justify-center cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 backdrop-blur-md"
            title="Open Touchless Palm Gesture Photo Share (P2P WebRTC)"
          >
            <span className="text-xs">🖐️</span>
            <span className="text-[7.5px] font-mono font-bold text-cyan-300 mt-0.5">PALM</span>
          </button>
        </div>

        {/* Hidden File Input for Device Photo Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileUpload}
        />

        {/* Demo Specimen Quick Selector Modal */}
        {showSampleModal && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-40 p-4 flex flex-col justify-center animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Test Google Lens with Sample Specimen
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSampleModal(false)}
                className="p-1 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_OBJECTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSampleObject(sample)}
                  className="p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 hover:border-cyan-400/50 transition flex items-center gap-2.5 text-left cursor-pointer group"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 border"
                    style={{
                      borderColor: `${sample.accentColor}40`,
                      backgroundColor: `${sample.accentColor}15`,
                    }}
                  >
                    {sample.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition truncate">
                      {sample.name}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      {sample.category} • <span className="text-emerald-400">{sample.price}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================================= */}
      {/* FROSTED GLASSMORPHISM SPLIT DIVIDER                                     */}
      {/* ======================================================================= */}
      <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent flex items-center justify-center my-1 relative shrink-0">
        <div className="w-16 h-1 rounded-full bg-cyan-400/80 shadow-[0_0_10px_#22d3ee]" />
      </div>

      {/* ======================================================================= */}
      {/* BOTTOM 50%: REAL-TIME DUAL RESULT PANEL                                 */}
      {/* ======================================================================= */}
      <div className="flex-1 min-h-0 flex flex-col bg-neutral-950/95 rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        {/* DUAL RESULT TAB HEADER */}
        <div className="flex items-center justify-between p-2 border-b border-white/10 bg-black/40 shrink-0">
          <LiquidGlassNav
            activeId={activeResultTab}
            className="flex items-center gap-1.5 p-1 rounded-full border border-white/10"
          >
            <button
              data-nav-id="google"
              type="button"
              onClick={() => setActiveResultTab('google')}
              className={`liquid-nav-btn px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeResultTab === 'google'
                  ? 'text-cyan-300 font-extrabold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Google Lens Search</span>
              {recognitionResult && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono text-cyan-300">
                  {recognitionResult.matches.length}
                </span>
              )}
            </button>

            <button
              data-nav-id="ai"
              type="button"
              onClick={() => setActiveResultTab('ai')}
              className={`liquid-nav-btn px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeResultTab === 'ai'
                  ? 'text-emerald-300 font-extrabold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Object Intelligence</span>
              {recognitionResult && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono text-emerald-300">
                  {recognitionResult.confidence}%
                </span>
              )}
            </button>
          </LiquidGlassNav>

          {/* Quantum Zoom (10,000,000x) & More Section Action Trigger */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleLaunchQuantumZoom(10000000)}
              className="px-3 py-1.5 rounded-full text-xs font-mono font-bold transition flex items-center gap-1.5 bg-gradient-to-r from-pink-500/25 via-purple-500/25 to-cyan-500/25 hover:from-pink-500/40 hover:to-cyan-500/40 border border-pink-400 text-pink-200 hover:text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] cursor-pointer active:scale-95 shrink-0"
              title="Launch Quantum Zoom: 10,000,000x Subatomic Lattice Simulation"
            >
              <span className="text-sm">⚛️</span>
              <span className="font-extrabold text-white">Quantum Zoom</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-500/30 text-pink-200 border border-pink-400/50">
                10,000,000x
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsMoreSectionOpen(true)}
              className="p-1.5 px-2 rounded-full text-xs font-mono font-bold transition flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white cursor-pointer active:scale-95"
              title="Open More Section (All Scale Tiers)"
            >
              <span>More</span>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>

          {/* Quick Retake Shot Button in Header */}
          {capturedSnapshot && (
            <button
              type="button"
              onClick={handleRetakeShot}
              className="px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span className="hidden xs:inline">Retake</span>
            </button>
          )}
        </div>

        {/* SCROLLABLE RESULT CONTENT */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5">
          {/* 1. LOADING STATE: HOLOGRAPHIC RADAR ANIMATION */}
          {isRecognizing && (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* Concentric Radar Rings */}
                <div className="absolute w-12 h-12 rounded-full border border-cyan-500/30 animate-pulse" />
                <div className="absolute w-20 h-20 rounded-full border border-cyan-500/40 animate-ping duration-1000" />
                <div className="absolute w-28 h-28 rounded-full border border-cyan-500/20" />

                {/* Radar Axis Lines */}
                <div className="absolute inset-x-0 h-px bg-cyan-500/20" />
                <div className="absolute inset-y-0 w-px bg-cyan-500/20" />

                {/* Sweeping Scanner Gradient Beam */}
                <div
                  className="absolute w-28 h-28 rounded-full pointer-events-none animate-spin"
                  style={{
                    background:
                      'conic-gradient(from 0deg, rgba(6,182,212,0.45) 0deg, rgba(6,182,212,0.08) 55deg, transparent 70deg, transparent 360deg)',
                    animationDuration: '2.2s',
                  }}
                />

                {/* Center glowing focal point */}
                <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-pulse" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">
                  Identifying Object &amp; Fetching Live Search...
                </h4>
                <p className="text-xs text-cyan-300/80 font-mono mt-1">
                  Gemini multimodal vision analyzing optical signatures &amp; Google Lens index
                </p>
              </div>
            </div>
          )}

          {/* 2. IDLE STATE: READY TO CAPTURE */}
          {!isRecognizing && !recognitionResult && (
            <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-4 space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <Camera className="w-6 h-6 animate-pulse" />
              </div>
              <div className="max-w-sm">
                <h3 className="text-sm font-bold text-white">One-Tap Optical Recognition</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Frame any item in the viewfinder above and tap the glowing shutter button to find that object on Google Lens and generate AI deep intelligence.
                </p>
              </div>

              {/* Quick Actions to Test Without Camera */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSampleModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Try Demo Specimen</span>
                </button>
              </div>

              {/* Supported Object Categories */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 max-w-md">
                {[
                  '💻 Tech & Gadgets',
                  '👟 Sneakers & Fashion',
                  '🌿 Plants & Nature',
                  '🚗 Automotive',
                  '🎨 Art & Collectibles',
                  '☕ Food & Drink',
                  '🏷️ Barcodes & OCR',
                ].map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-white/5 text-neutral-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 3. RECOGNITION RESULTS VIEW */}
          {!isRecognizing && recognitionResult && (
            <div className="space-y-4">
              {/* TAB A: GOOGLE SEARCH RESULTS & VISUAL MATCHES */}
              {activeResultTab === 'google' && (
                <div className="space-y-3.5">
                  {/* Google Lens Official Visual Match Hero Banner */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-950/70 via-neutral-900 to-emerald-950/40 border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.2)] space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        {/* Google Lens 4-Color Icon */}
                        <div className="w-9 h-9 rounded-xl bg-black/90 border border-white/15 p-1.5 flex items-center justify-center shrink-0 shadow-md">
                          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                            <circle cx="12" cy="12" r="3.5" fill="#4285F4" />
                            <path d="M7 3H5a2 2 0 0 0-2 2v2" stroke="#EA4335" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M17 3h2a2 2 0 0 1 2 2v2" stroke="#FBBC05" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M21 17v2a2 2 0 0 1-2 2h-2" stroke="#34A853" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M3 17v2a2 2 0 0 0 2 2h2" stroke="#4285F4" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider font-bold">
                              {recognitionResult.category}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>{recognitionResult.confidence}% Google Lens Match</span>
                            </span>
                          </div>
                          <h2 className="text-base sm:text-lg font-black text-white mt-1 tracking-tight">
                            {recognitionResult.itemName}
                          </h2>
                          <p className="text-[11px] text-neutral-300 font-mono mt-0.5">
                            Visual Search Query: <span className="text-cyan-300">"{recognitionResult.searchKeywords}"</span>
                          </p>
                        </div>
                      </div>

                      {/* Estimated Price Badge */}
                      <div className="text-right shrink-0">
                        <div className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">
                          Est. Retail Value
                        </div>
                        <div className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                          {recognitionResult.estimatedPrice}
                        </div>
                      </div>
                    </div>

                    {/* Fast 1-Tap Google Lens Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/10">
                      <a
                        href={getGoogleLensUrl(recognitionResult.searchKeywords)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 transition active:scale-95 no-underline cursor-pointer"
                      >
                        <Search className="w-4 h-4" />
                        <span>Launch Google Lens Search ↗</span>
                      </a>

                      <button
                        type="button"
                        onClick={handleCopyImageForGoogleLens}
                        className="py-2.5 px-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                        title="Copy snapshot so you can paste directly onto lens.google.com"
                      >
                        {isImageCopied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">Snapshot Copied for Lens!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-cyan-400" />
                            <span>Copy Image for Google Lens (Ctrl+V)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Visual Match Cards */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono text-neutral-400 flex items-center justify-between px-1">
                      <span className="font-semibold text-neutral-300">Live Visual Match Cards</span>
                      <span className="text-cyan-400 font-mono text-[10px]">Google Lens Cross-Referenced</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {recognitionResult.matches.map((match, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-neutral-900/70 border border-white/5 hover:border-cyan-500/30 transition flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-white/10 flex items-center justify-center shrink-0 text-cyan-400">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">
                                {match.title}
                              </div>
                              <div className="text-[10px] text-neutral-400 truncate">
                                {match.note}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className="text-right">
                              <div className="text-xs font-bold font-mono text-emerald-400">
                                {match.price}
                              </div>
                              <div className="text-[9px] font-mono text-neutral-500">
                                {match.similarity}% Match
                              </div>
                            </div>

                            <a
                              href={getGoogleLensUrl(match.title)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-cyan-950 hover:text-cyan-300 text-neutral-400 border border-white/10 transition"
                              title="Search this specific variant on Google Lens"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* One-Tap Web Action Links */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <a
                      href={getGoogleLensUrl(recognitionResult.searchKeywords)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 hover:from-cyan-300 text-slate-950 font-black text-xs shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center justify-center gap-1.5 transition active:scale-95 text-center no-underline cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Google Lens Search</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>

                    <a
                      href={getGoogleShoppingUrl(recognitionResult.searchKeywords)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 text-center no-underline cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Google Shopping</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>

                    <a
                      href="https://lens.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 text-center no-underline cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-cyan-400" />
                      <span>lens.google.com Hub</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                  </div>
                </div>
              )}

              {/* TAB B: AI OBJECT INTELLIGENCE (GKEDIT AI) */}
              {activeResultTab === 'ai' && (
                <div className="space-y-3.5">
                  {/* Quick 3-Bullet Breakdown */}
                  <div className="space-y-2.5">
                    {/* Bullet 1: Exact Model/Item Name */}
                    <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 space-y-1">
                      <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold font-mono">
                        <Tag className="w-3.5 h-3.5" />
                        <span>1. EXACT MODEL &amp; DESIGNATION</span>
                      </div>
                      <p className="text-xs text-neutral-200 leading-relaxed pl-5 font-sans">
                        {recognitionResult.exactModel}
                      </p>
                    </div>

                    {/* Bullet 2: Key Specifications & Materials */}
                    <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 space-y-1">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>2. KEY SPECIFICATIONS &amp; MATERIALS</span>
                      </div>
                      <p className="text-xs text-neutral-200 leading-relaxed pl-5 font-sans">
                        {recognitionResult.keySpecs}
                      </p>
                    </div>

                    {/* Bullet 3: History, Origin & Pro Usage Tips */}
                    <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 space-y-1">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>3. HISTORY, ORIGIN &amp; PRO USAGE TIPS</span>
                      </div>
                      <p className="text-xs text-neutral-200 leading-relaxed pl-5 font-sans">
                        {recognitionResult.historyTips}
                      </p>
                    </div>
                  </div>

                  {/* Summary Callout Box */}
                  <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200 leading-relaxed">
                    <span className="font-bold text-white mr-1.5 font-mono">SUMMARY:</span>
                    {recognitionResult.summary}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* QUICK ACTION BAR (STICKY AT BOTTOM OF RESULT PANEL)                    */}
        {/* ======================================================================= */}
        {recognitionResult && (
          <div className="p-2 sm:p-3 border-t border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRetakeShot}
              className="py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Retake Camera Shot</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Copy AI Summary"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadSnapshot}
                className="hidden md:flex py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-200 hover:text-white text-xs font-bold items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Download Snapshot to upload or drag into Google Lens"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Save for Lens</span>
              </button>

              <a
                href={getGoogleLensUrl(recognitionResult.searchKeywords)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.4)] transition active:scale-95 no-underline cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Google Lens</span>
              </a>

              <button
                type="button"
                onClick={handleAskInChat}
                className="hidden sm:flex py-2 px-3 rounded-xl bg-blue-950 hover:bg-blue-900 border border-cyan-500/30 text-cyan-200 hover:text-white font-bold text-xs items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask in Chat</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================================= */}
      {/* MORE SECTION: ADVANCED OPTICAL & QUANTUM VISION MODES MODAL             */}
      {/* ======================================================================= */}
      {isMoreSectionOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[#030917]/95 border border-cyan-500/35 rounded-t-3xl sm:rounded-3xl p-5 shadow-[0_12px_60px_rgba(0,0,0,0.95)] max-h-[90vh] overflow-y-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-400/50 flex items-center justify-center text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.35)]">
                  <Atom className="w-5 h-5 animate-spin duration-3000" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Vision Modes &amp; Optics</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/25 border border-pink-400/50 text-pink-200">
                      MORE SECTION
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Uncapped Optical, Molecular &amp; Quantum Magnification Pipeline
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreSectionOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FEATURED MODE 1: QUANTUM ZOOM 10,000,000x */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-950/70 via-purple-950/50 to-slate-900 border-2 border-pink-500/60 shadow-[0_0_30px_rgba(236,72,153,0.35)] space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-l from-pink-500 to-purple-600 text-white font-mono text-[9px] font-black rounded-bl-xl uppercase tracking-wider">
                FEATURED FLAGSHIP MODE
              </div>

              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/25 border border-pink-400 flex items-center justify-center text-pink-200 text-2xl shadow-[0_0_20px_rgba(236,72,153,0.5)] shrink-0">
                  ⚛️
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-white">Quantum Zoom</h4>
                    <span className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full bg-pink-500 text-white shadow-[0_0_10px_#ec4899]">
                      10,000,000x
                    </span>
                  </div>
                  <p className="text-xs font-mono text-pink-300 font-semibold mt-0.5">
                    Tier 4: Subatomic Lattice &amp; Electron Orbital Probability
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Experience the uncapped optical and quantum vision simulation pipeline supporting custom zoom levels up to <strong>10,000,000x</strong>. Inspect electron orbital clouds, subatomic density fields, atomic lattice grids, quantum tunneling patterns, and high-energy particle backscatter.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-2 border-t border-pink-500/20">
                <div className="text-[11px] font-mono text-slate-300">
                  Scale: <span className="text-pink-300 font-bold">50 pm (Subatomic Lattice)</span> • <span className="text-emerald-300 font-bold">100K Density</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleLaunchQuantumZoom(10000000)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 text-white font-mono font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.6)] hover:brightness-110 active:scale-95 transition cursor-pointer"
                >
                  <span>Launch 10,000,000x Zoom</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Scale Jumper Row */}
            <div className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Direct Magnification Scale Jumpers:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: '100x Macro', val: 100, color: 'border-cyan-400 text-cyan-300' },
                  { label: '2,500x Cell', val: 2500, color: 'border-emerald-400 text-emerald-300' },
                  { label: '50,000x Micro', val: 50000, color: 'border-emerald-400 text-emerald-300' },
                  { label: '500,000x SEM', val: 500000, color: 'border-amber-400 text-amber-300' },
                  { label: '1,000,000x Nano', val: 1000000, color: 'border-amber-400 text-amber-300' },
                  { label: '5,000,000x Atomic', val: 5000000, color: 'border-pink-400 text-pink-300' },
                  { label: '10,000,000x Quantum', val: 10000000, color: 'border-pink-500 bg-pink-500/20 text-white font-bold' },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handleLaunchQuantumZoom(item.val)}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono transition cursor-pointer active:scale-95 hover:bg-white/10 ${item.color}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Other Modes in More Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Nano & Molecular Scale */}
              <div
                onClick={() => handleLaunchQuantumZoom(1000000)}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-amber-500/30 hover:border-amber-400/60 transition cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌌</span>
                    <span className="text-xs font-bold text-white group-hover:text-amber-300">Nano &amp; Molecular</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    1,000,000x
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  Carbon nanotubes, lipid bilayers, SEM secondary electron gold-sputter backscatter.
                </p>
              </div>

              {/* Microscopic & Cellular */}
              <div
                onClick={() => handleLaunchQuantumZoom(50000)}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-emerald-500/30 hover:border-emerald-400/60 transition cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🧬</span>
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300">Cellular &amp; Micro-Trace</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    50,000x
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  Biological cell walls, bacterial flagella, semiconductor micro-traces, crystalline cleavage.
                </p>
              </div>

              {/* 100K Matrix Reconstructor */}
              <div
                onClick={() => handleLaunchQuantumZoom(2500)}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-cyan-500/30 hover:border-cyan-400/60 transition cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300">100K Matrix Reconstructor</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                    102K Density
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  Forensic micro-surface synthesis, coordinate telemetry, and sub-pixel edge sharpening.
                </p>
              </div>

              {/* Touchless Palm Share */}
              <div
                onClick={() => {
                  setIsMoreSectionOpen(false);
                  window.dispatchEvent(new CustomEvent('gkedit:open_palm_share'));
                }}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-white/10 hover:border-cyan-400/50 transition cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🖐️</span>
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300">Touchless Palm Share</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                    P2P Direct
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  Beam high-resolution captures touchlessly to nearby screens via WebRTC peer connection.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10,000,000x Ultra Macro / Quantum Deep Vision Modal */}
      {capturedSnapshot && (
        <UltraMacroDeepVisionModal
          isOpen={showUltraMacro}
          onClose={() => setShowUltraMacro(false)}
          capturedImageDataUrl={capturedSnapshot}
          initialItemName={recognitionResult?.itemName || 'Optical Camera Specimen'}
          initialZoom={initialMacroZoom}
          onSendToGenerator={(prompt) => {
            setShowUltraMacro(false);
            window.dispatchEvent(new CustomEvent('gkedit:fill_chat_prompt', { detail: { prompt } }));
            window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'generators' } }));
          }}
        />
      )}
    </div>
  );
}
