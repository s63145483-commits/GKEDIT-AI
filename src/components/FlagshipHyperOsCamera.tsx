import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Camera,
  Video,
  Sparkles,
  Zap,
  ZapOff,
  Sun,
  Sliders,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  RotateCcw,
  Download,
  Check,
  Copy,
  Trash2,
  X,
  Maximize2,
  Minimize2,
  Eye,
  Cpu,
  Compass,
  Flame,
  Shield,
  Play,
  Pause,
  Square,
  Film,
  Aperture,
  Grid as GridIcon,
  Clock,
  AlertTriangle,
  MessageSquare,
  Info,
  Maximize,
  SlidersHorizontal,
  FileText,
  Volume2,
  VolumeX,
  Share2,
  Atom,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { notificationService } from '../services/notificationService.ts';
import { UltraMacroDeepVisionModal } from './UltraMacroDeepVisionModal.tsx';

// -------------------------------------------------------------
// TYPES & DEFINITIONS
// -------------------------------------------------------------
export type FlagshipCameraMode =
  | 'PRO'
  | 'VIDEO'
  | 'PHOTO'
  | 'PORTRAIT'
  | 'NIGHT'
  | 'ULTRA_HD'
  | 'MORE';

export type AspectRatio = '4:3' | '16:9' | '1:1' | 'full';
export type FlashMode = 'off' | 'auto' | 'on' | 'torch';
export type HdrMode = 'off' | 'auto' | 'on';
export type GridType = 'off' | '3x3' | 'golden';

export interface CapturedMediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string; // base64 or blob URL
  timestamp: number;
  width?: number;
  height?: number;
  focalLength: string;
  zoomLevel: number;
  mode: FlagshipCameraMode;
  aspectRatio: AspectRatio;
  durationSec?: number;
  isWatermarked?: boolean;
}

export interface ProTelemetry {
  iso: number | 'AUTO';
  shutterSpeed: string | 'AUTO';
  ev: number;
  wb: 'AWB' | '3200K' | '5500K' | '6500K';
}

const CAMERA_MODES: { id: FlagshipCameraMode; label: string }[] = [
  { id: 'PRO', label: 'PRO' },
  { id: 'VIDEO', label: 'VIDEO' },
  { id: 'PHOTO', label: 'PHOTO' },
  { id: 'PORTRAIT', label: 'PORTRAIT' },
  { id: 'NIGHT', label: 'NIGHT' },
  { id: 'ULTRA_HD', label: 'ULTRA HD' },
  { id: 'MORE', label: 'MORE' },
];

const ZOOM_PRESETS = [
  { label: '0.6', zoom: 0.6, focal: '14mm' },
  { label: '1X', zoom: 1.0, focal: '24mm' },
  { label: '2X', zoom: 2.0, focal: '48mm' },
  { label: '5X', zoom: 5.0, focal: '120mm' },
  { label: '10X', zoom: 10.0, focal: '240mm' },
];

interface FlagshipHyperOsCameraProps {
  onNavigateToChat?: (prompt: string) => void;
  onClose?: () => void;
}

export function FlagshipHyperOsCamera({ onNavigateToChat, onClose }: FlagshipHyperOsCameraProps) {
  // -------------------------------------------------------------
  // STREAM & HARDWARE STATES
  // -------------------------------------------------------------
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [hardwareZoomSupported, setHardwareZoomSupported] = useState<boolean>(false);
  const [hardwareZoomRange, setHardwareZoomRange] = useState<{ min: number; max: number; step: number }>({
    min: 1,
    max: 10,
    step: 0.1,
  });

  // -------------------------------------------------------------
  // CAMERA SETTINGS & MODES
  // -------------------------------------------------------------
  const [currentMode, setCurrentMode] = useState<FlagshipCameraMode>('PHOTO');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [flashMode, setFlashMode] = useState<FlashMode>('auto');
  const [hdrMode, setHdrMode] = useState<HdrMode>('auto');
  const [aiSceneActive, setAiSceneActive] = useState<boolean>(true);
  const [detectedScene, setDetectedScene] = useState<string>('Standard 24mm');
  const [gridType, setGridType] = useState<GridType>('3x3');
  const [isTopDrawerOpen, setIsTopDrawerOpen] = useState<boolean>(false);
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(true);
  const [shutterSoundEnabled, setShutterSoundEnabled] = useState<boolean>(true);
  const [horizonLevelEnabled, setHorizonLevelEnabled] = useState<boolean>(false);
  const [currentRollAngle, setCurrentRollAngle] = useState<number>(0);

  // Timer
  const [timerPreset, setTimerPreset] = useState<0 | 3 | 5 | 10>(0);
  const [timerCountdown, setTimerCountdown] = useState<number | null>(null);
  const timerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Portrait Mode Depth Bokeh
  const [portraitAperture, setPortraitAperture] = useState<number>(1.8); // f/1.4 - f/16

  // Pro Mode Telemetry
  const [proTelemetry, setProTelemetry] = useState<ProTelemetry>({
    iso: 'AUTO',
    shutterSpeed: 'AUTO',
    ev: 0.0,
    wb: 'AWB',
  });
  const [activeProSlider, setActiveProSlider] = useState<'iso' | 'shutter' | 'ev' | 'wb' | null>(null);

  // Night Mode Capture Progress
  const [nightProgress, setNightProgress] = useState<number | null>(null);

  // Touch-to-Focus Reticle & Exposure slider
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [focusExposure, setFocusExposure] = useState<number>(0);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // -------------------------------------------------------------
  // ZOOM SYSTEM & ROTARY WHEEL
  // -------------------------------------------------------------
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isRotaryWheelOpen, setIsRotaryWheelOpen] = useState<boolean>(false);
  const [isDraggingRotary, setIsDraggingRotary] = useState<boolean>(false);
  const rotaryDragStartRef = useRef<{ clientX: number; zoom: number }>({ clientX: 0, zoom: 1.0 });
  const rotaryInactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // -------------------------------------------------------------
  // VIDEO RECORDING
  // -------------------------------------------------------------
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // -------------------------------------------------------------
  // CAPTURE, FLASH, GALLERY & MODALS
  // -------------------------------------------------------------
  const [isShutterActive, setIsShutterActive] = useState<boolean>(false);
  const [galleryItems, setGalleryItems] = useState<CapturedMediaItem[]>([]);
  const [activePreviewItem, setActivePreviewItem] = useState<CapturedMediaItem | null>(null);
  const [showMacroModal, setShowMacroModal] = useState<boolean>(false);
  const [macroTargetImage, setMacroTargetImage] = useState<string | null>(null);
  const [macroInitialZoom, setMacroInitialZoom] = useState<number>(10000000);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState<boolean>(false);
  const [isOcrAnalyzing, setIsOcrAnalyzing] = useState<boolean>(false);
  const [ocrResultText, setOcrResultText] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Launch Quantum Zoom (up to 10,000,000x) from Flagship More Section
  const handleLaunchQuantumZoomFromCamera = useCallback(async (targetZoom: number = 10000000) => {
    setIsMoreSheetOpen(false);
    triggerHaptic(25);

    let targetUrl = macroTargetImage;
    if (galleryItems.length > 0) {
      targetUrl = galleryItems[0].url;
    }

    // If no capture yet, take one from current frame
    if (!targetUrl) {
      const video = videoRef.current;
      const simCanvas = simCanvasRef.current;
      const canvas = document.createElement('canvas');
      const w = video?.videoWidth || 1920;
      const h = video?.videoHeight || 1080;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (!isSimulatedMode && video && video.videoWidth > 0) {
          if (facingMode === 'user') {
            ctx.translate(w, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(video, 0, 0, w, h);
          targetUrl = canvas.toDataURL('image/jpeg', 0.96);
        } else if (simCanvas) {
          ctx.drawImage(simCanvas, 0, 0, w, h);
          targetUrl = canvas.toDataURL('image/jpeg', 0.96);
        }
      }
    }

    if (!targetUrl) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        <rect width="1280" height="720" fill="#030814"/>
        <circle cx="640" cy="360" r="160" fill="none" stroke="#ec4899" stroke-width="2" stroke-dasharray="6 6"/>
        <circle cx="640" cy="360" r="30" fill="#ec4899"/>
        <text x="640" y="560" font-family="monospace" font-size="28" font-weight="bold" text-anchor="middle" fill="#ec4899">QUANTUM ZOOM 10,000,000x</text>
      </svg>`;
      targetUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    setMacroTargetImage(targetUrl);
    setMacroInitialZoom(targetZoom);
    setShowMacroModal(true);
    notificationService.playSoftChime();
    notificationService.showInAppToast(
      `Quantum Zoom: ${targetZoom.toLocaleString()}x`,
      'Subatomic lattice & electron orbital probability pipeline engaged.',
      'success'
    );
  }, [macroTargetImage, galleryItems, isSimulatedMode, facingMode]);

  // DOM References
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modeCarouselRef = useRef<HTMLDivElement | null>(null);

  // -------------------------------------------------------------
  // FOCAL LENGTH 35MM EQUIVALENT CALCULATION
  // -------------------------------------------------------------
  const focalLengthMm = useMemo(() => {
    if (zoomLevel <= 0.65) return '14mm';
    if (zoomLevel <= 1.05) return `${Math.round(zoomLevel * 24)}mm`;
    return `${Math.round(zoomLevel * 24)}mm`;
  }, [zoomLevel]);

  // -------------------------------------------------------------
  // SYNTHESIZED LEICA / HYPEROS DUAL-BLADE MECHANICAL SHUTTER
  // -------------------------------------------------------------
  const playMechanicalShutterSound = useCallback(() => {
    if (!shutterSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Click 1: Primary curtain release
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(220, now);
      osc1.frequency.exponentialRampToValueAtTime(45, now + 0.04);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.05);

      // Click 2: Secondary dampener blade release (60ms later)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(320, now + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(35, now + 0.12);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.35, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.14);
    } catch {
      // Audio context fallback
    }
  }, [shutterSoundEnabled]);

  // Tactile haptic feedback
  const triggerHaptic = useCallback((pattern: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }, []);

  // -------------------------------------------------------------
  // HARDWARE MEDIA STREAM INITIALIZATION
  // -------------------------------------------------------------
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setCameraError(null);
    setIsSimulatedMode(false);

    try {
      const constraints: MediaStreamConstraints = {
        audio: currentMode === 'VIDEO',
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 3840, min: 1280 },
          height: { ideal: 2160, min: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setStreamActive(true);

      // Inspect hardware capabilities
      const track = stream.getVideoTracks()[0];
      if (track) {
        const caps = (track.getCapabilities && track.getCapabilities()) as any;
        setTorchSupported(Boolean(caps?.torch));

        if (caps?.zoom) {
          setHardwareZoomSupported(true);
          setHardwareZoomRange({
            min: caps.zoom.min || 1,
            max: caps.zoom.max || 10,
            step: caps.zoom.step || 0.1,
          });
        } else {
          setHardwareZoomSupported(false);
        }
      }
    } catch (err: any) {
      console.warn('Physical camera unavailable. Falling back to Flagship Optical Simulator:', err);
      setIsSimulatedMode(true);
      setStreamActive(true);
    }
  }, [facingMode, currentMode, stopStream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopStream();
      if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
      if (rotaryInactivityTimeoutRef.current) clearTimeout(rotaryInactivityTimeoutRef.current);
    };
  }, [startCamera, stopStream]);

  // Apply Hardware Zoom if supported
  useEffect(() => {
    if (!hardwareZoomSupported || !streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const clampedZoom = Math.max(
        hardwareZoomRange.min,
        Math.min(hardwareZoomRange.max, zoomLevel)
      );
      (track as any).applyConstraints({
        advanced: [{ zoom: clampedZoom }],
      });
    } catch {}
  }, [zoomLevel, hardwareZoomSupported, hardwareZoomRange]);

  // Apply Torch if flashMode === 'torch'
  useEffect(() => {
    if (!streamRef.current || !torchSupported) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      (track as any).applyConstraints({
        advanced: [{ torch: flashMode === 'torch' }],
      });
    } catch {}
  }, [flashMode, torchSupported]);

  // Simulated Optical Scene Render Loop (runs if physical camera is blocked/unavailable)
  useEffect(() => {
    if (!isSimulatedMode) return;
    let animId: number;
    let frame = 0;

    const renderSim = () => {
      const canvas = simCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = (canvas.width = canvas.clientWidth || 800);
      const h = (canvas.height = canvas.clientHeight || 600);

      // Deep dark optical target gradient
      const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h));
      grad.addColorStop(0, '#111827');
      grad.addColorStop(0.6, '#080c14');
      grad.addColorStop(1, '#020408');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Simulated Bokeh floating micro-particulates
      ctx.save();
      const numParticles = 24;
      for (let i = 0; i < numParticles; i++) {
        const seed = (frame * 0.4 + i * 180) % (w + 200);
        const px = (seed * 1.3) % w;
        const py = (Math.sin(frame * 0.02 + i) * 60 + h / 2 + (i % 5) * 80 - 160) % h;
        const radius = (12 + (i % 6) * 8) * (zoomLevel > 2 ? 1.5 : 1);

        const bGrad = ctx.createRadialGradient(px, py, 2, px, py, radius);
        bGrad.addColorStop(0, i % 2 === 0 ? 'rgba(255, 204, 0, 0.45)' : 'rgba(56, 189, 248, 0.35)');
        bGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.08)');
        bGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Optical concentric focus rings
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.strokeStyle = 'rgba(255, 204, 0, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 100 * (zoomLevel > 3 ? 1.8 : zoomLevel), 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, 180 * (zoomLevel > 3 ? 1.8 : zoomLevel), 0, Math.PI * 2);
      ctx.stroke();

      // Center crosshair
      ctx.setLineDash([]);
      ctx.strokeStyle = '#FFCC00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(16, 0);
      ctx.moveTo(0, -16);
      ctx.lineTo(0, 16);
      ctx.stroke();
      ctx.restore();

      // Telemetry text overlay
      ctx.fillStyle = '#FFCC00';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`SIMULATED OPTICAL FEED · ${zoomLevel.toFixed(1)}X (${focalLengthMm})`, 20, 35);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '10px monospace';
      ctx.fillText(`FRAME: ${frame} · 4K UHD 3840x2160 · ISO ${proTelemetry.iso} · 60FPS`, 20, 52);

      frame++;
      animId = requestAnimationFrame(renderSim);
    };

    animId = requestAnimationFrame(renderSim);
    return () => cancelAnimationFrame(animId);
  }, [isSimulatedMode, zoomLevel, focalLengthMm, proTelemetry.iso]);

  // AI Scene identification simulation
  useEffect(() => {
    if (!aiSceneActive) {
      setDetectedScene('');
      return;
    }
    if (currentMode === 'PORTRAIT') {
      setDetectedScene('👤 Leica Portrait Bokeh');
    } else if (currentMode === 'NIGHT') {
      setDetectedScene('🌙 Low-Light Night Scene');
    } else if (currentMode === 'ULTRA_HD') {
      setDetectedScene('🔬 100K Matrix Reconstructor');
    } else if (zoomLevel >= 4.5) {
      setDetectedScene('🔭 Super Telephoto 120mm+');
    } else if (zoomLevel <= 0.7) {
      setDetectedScene('🏞 Ultra-Wide Landscape');
    } else {
      setDetectedScene('✨ AI Scene: Optimal Natural HDR');
    }
  }, [currentMode, zoomLevel, aiSceneActive]);

  // Virtual Horizon Device Orientation listener
  useEffect(() => {
    if (!horizonLevelEnabled) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null) {
        // gamma is roll angle (-90 to 90)
        setCurrentRollAngle(Math.max(-45, Math.min(45, e.gamma)));
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [horizonLevelEnabled]);

  // -------------------------------------------------------------
  // CAMERA FLIP ANIMATION & TOGGLE
  // -------------------------------------------------------------
  const handleToggleFacing = () => {
    triggerHaptic(25);
    setIsFlipping(true);
    setTimeout(() => {
      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
      setTimeout(() => setIsFlipping(false), 300);
    }, 150);
  };

  // -------------------------------------------------------------
  // ROTARY ZOOM DIAL MATH & POINTER HANDLING
  // -------------------------------------------------------------
  // Map zoom z in [0.6, 10.0] to normalized parameter u in [0, 1] using logarithmic scale
  const zoomToU = useCallback((z: number) => {
    const minZ = 0.6;
    const maxZ = 10.0;
    return Math.max(0, Math.min(1, (Math.log(z) - Math.log(minZ)) / (Math.log(maxZ) - Math.log(minZ))));
  }, []);

  const uToZoom = useCallback((u: number) => {
    const minZ = 0.6;
    const maxZ = 10.0;
    const z = minZ * Math.exp(u * Math.log(maxZ / minZ));
    return Math.round(z * 10) / 10;
  }, []);

  // Preset button tap
  const handleSelectZoomPreset = (targetZoom: number) => {
    triggerHaptic(15);
    setZoomLevel(targetZoom);
    setIsRotaryWheelOpen(true);
    resetRotaryInactivity();
  };

  const resetRotaryInactivity = () => {
    if (rotaryInactivityTimeoutRef.current) clearTimeout(rotaryInactivityTimeoutRef.current);
    rotaryInactivityTimeoutRef.current = setTimeout(() => {
      setIsRotaryWheelOpen(false);
    }, 3800);
  };

  // Rotary pointer interactions
  const handleRotaryPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDraggingRotary(true);
    rotaryDragStartRef.current = {
      clientX: e.clientX,
      zoom: zoomLevel,
    };
    if (rotaryInactivityTimeoutRef.current) clearTimeout(rotaryInactivityTimeoutRef.current);
    triggerHaptic(10);
  };

  const handleRotaryPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRotary) return;
    e.preventDefault();
    const deltaX = e.clientX - rotaryDragStartRef.current.clientX;
    const currentU = zoomToU(rotaryDragStartRef.current.zoom);
    // Negative because dragging right moves lower zoom, dragging left increases zoom
    const deltaU = -deltaX / 360;
    const newU = Math.max(0, Math.min(1, currentU + deltaU));
    const newZ = uToZoom(newU);

    if (newZ !== zoomLevel) {
      setZoomLevel(newZ);
      triggerHaptic(8);
    }
  };

  const handleRotaryPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRotary) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setIsDraggingRotary(false);
    resetRotaryInactivity();
  };

  // -------------------------------------------------------------
  // TOUCH-TO-FOCUS & EXPOSURE SLIDER
  // -------------------------------------------------------------
  const handleViewfinderTap = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setFocusPoint({ x, y });
    setFocusExposure(0);
    triggerHaptic(20);

    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    focusTimeoutRef.current = setTimeout(() => {
      setFocusPoint(null);
    }, 3500);
  };

  // -------------------------------------------------------------
  // SHUTTER PHOTO CAPTURE WITH WATERMARK
  // -------------------------------------------------------------
  const capturePhotoImmediate = () => {
    triggerHaptic([30, 45, 25]);
    playMechanicalShutterSound();

    // Trigger visual screen white flash
    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 220);

    const video = videoRef.current;
    const simCanvas = simCanvasRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    let vw = 1920;
    let vh = 1080;

    if (video && streamActive && !isSimulatedMode) {
      vw = video.videoWidth || 1920;
      vh = video.videoHeight || 1080;
    } else if (simCanvas) {
      vw = simCanvas.width || 1920;
      vh = simCanvas.height || 1080;
    }

    // Adjust canvas aspect ratio crop
    let targetW = vw;
    let targetH = vh;
    if (aspectRatio === '1:1') {
      const minDim = Math.min(vw, vh);
      targetW = minDim;
      targetH = minDim;
    } else if (aspectRatio === '4:3') {
      if (vw > vh) {
        targetW = Math.round((vh * 4) / 3);
        targetH = vh;
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    // Mirror if front user camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Software zoom crop
    if (zoomLevel > 1 && !hardwareZoomSupported) {
      const cropW = vw / zoomLevel;
      const cropH = vh / zoomLevel;
      const startX = (vw - cropW) / 2;
      const startY = (vh - cropH) / 2;

      if (!isSimulatedMode && video) {
        ctx.drawImage(video, startX, startY, cropW, cropH, 0, 0, targetW, targetH);
      } else if (simCanvas) {
        ctx.drawImage(simCanvas, startX, startY, cropW, cropH, 0, 0, targetW, targetH);
      }
    } else {
      if (!isSimulatedMode && video) {
        const sx = (vw - targetW) / 2;
        const sy = (vh - targetH) / 2;
        ctx.drawImage(video, sx, sy, targetW, targetH, 0, 0, targetW, targetH);
      } else if (simCanvas) {
        ctx.drawImage(simCanvas, 0, 0, targetW, targetH);
      }
    }
    ctx.restore();

    // Portrait Bokeh simulated blur
    if (currentMode === 'PORTRAIT') {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.restore();
    }

    // Flagship Leica / HyperOS Signature Watermark
    if (watermarkEnabled) {
      const barHeight = Math.max(52, Math.round(targetH * 0.075));
      ctx.save();
      // Frosted dark bottom bar
      ctx.fillStyle = 'rgba(10, 12, 16, 0.88)';
      ctx.fillRect(0, targetH - barHeight, targetW, barHeight);

      // Gold divider line
      ctx.fillStyle = '#FFCC00';
      ctx.fillRect(0, targetH - barHeight, targetW, 2);

      // Left Brand Tag: SHOT ON GKEDIT HYPEROS
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.round(barHeight * 0.28)}px sans-serif`;
      ctx.fillText('SHOT ON GKEDIT HYPEROS', 24, targetH - barHeight * 0.52);

      ctx.fillStyle = '#FFCC00';
      ctx.font = `${Math.round(barHeight * 0.22)}px monospace`;
      ctx.fillText('LEICA DUAL-CAMERA · 50MP ULTRA-SENSING', 24, targetH - barHeight * 0.22);

      // Right Optical Specs
      const specsText = `${focalLengthMm} · f/${currentMode === 'PORTRAIT' ? portraitAperture : '1.8'} · 1/250s · ISO 100`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = `${Math.round(barHeight * 0.24)}px monospace`;
      const textWidth = ctx.measureText(specsText).width;
      ctx.fillText(specsText, targetW - textWidth - 24, targetH - barHeight * 0.38);

      // Signature Red Dot
      ctx.fillStyle = '#E53E3E';
      ctx.beginPath();
      ctx.arc(targetW - textWidth - 40, targetH - barHeight * 0.45, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    const base64 = canvas.toDataURL('image/jpeg', 0.96);

    const newItem: CapturedMediaItem = {
      id: `capture_${Date.now()}`,
      type: 'photo',
      url: base64,
      timestamp: Date.now(),
      width: targetW,
      height: targetH,
      focalLength: focalLengthMm,
      zoomLevel: zoomLevel,
      mode: currentMode,
      aspectRatio: aspectRatio,
      isWatermarked: watermarkEnabled,
    };

    setGalleryItems((prev) => [newItem, ...prev]);

    // Seamlessly ingest into ColorOS 17 Fluid Gallery & Cloud Vault
    window.dispatchEvent(
      new CustomEvent('gkedit:gallery_ingest', {
        detail: {
          url: base64,
          width: targetW,
          height: targetH,
          focalLength: focalLengthMm,
          mode: currentMode,
          filename: `SHOT_HYPEROS_${Date.now()}.JPG`,
        },
      })
    );

    // If Ultra HD mode, prompt user for 100K Macro reconstruction
    if (currentMode === 'ULTRA_HD') {
      setMacroTargetImage(base64);
      setShowMacroModal(true);
    }
  };

  // Listen for voice command shortcut: "Take a photo"
  const capturePhotoImmediateRef = useRef(capturePhotoImmediate);
  useEffect(() => {
    capturePhotoImmediateRef.current = capturePhotoImmediate;
  });

  useEffect(() => {
    const handleVoiceCapture = () => {
      if (capturePhotoImmediateRef.current) {
        capturePhotoImmediateRef.current();
      }
    };
    window.addEventListener('gkedit:trigger_photo_capture', handleVoiceCapture);
    return () => {
      window.removeEventListener('gkedit:trigger_photo_capture', handleVoiceCapture);
    };
  }, []);

  // Shutter with Timer & Night mode support
  const handleShutterTrigger = () => {
    if (currentMode === 'VIDEO') {
      handleToggleVideoRecording();
      return;
    }

    // Cancel active countdown
    if (timerCountdown !== null) {
      if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
      setTimerCountdown(null);
      return;
    }

    // Night Mode exposure simulation
    if (currentMode === 'NIGHT') {
      triggerHaptic(20);
      setNightProgress(0);
      let p = 0;
      const interval = setInterval(() => {
        p += 20;
        setNightProgress(p);
        triggerHaptic(8);
        if (p >= 100) {
          clearInterval(interval);
          setNightProgress(null);
          capturePhotoImmediate();
        }
      }, 350);
      return;
    }

    // Timer Countdown
    if (timerPreset > 0) {
      setTimerCountdown(timerPreset);
      let current = timerPreset;

      const tick = () => {
        current -= 1;
        triggerHaptic(20);
        if (current <= 0) {
          setTimerCountdown(null);
          capturePhotoImmediate();
        } else {
          setTimerCountdown(current);
          timerTimeoutRef.current = setTimeout(tick, 1000);
        }
      };

      timerTimeoutRef.current = setTimeout(tick, 1000);
      return;
    }

    capturePhotoImmediate();
  };

  // -------------------------------------------------------------
  // VIDEO RECORDING START / STOP
  // -------------------------------------------------------------
  const handleToggleVideoRecording = () => {
    if (isRecording) {
      // Stop Recording
      triggerHaptic([30, 60, 30]);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    } else {
      // Start Recording
      triggerHaptic(40);
      setRecordingSeconds(0);
      recordedChunksRef.current = [];

      let streamToRecord = streamRef.current;
      if (!streamToRecord && isSimulatedMode && simCanvasRef.current) {
        streamToRecord = (simCanvasRef.current as any).captureStream(30);
      }

      if (!streamToRecord) {
        notificationService.showInAppToast('Recording Failed', 'Camera stream is unavailable.', 'alert');
        return;
      }

      try {
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4';

        const recorder = new MediaRecorder(streamToRecord, { mimeType });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          const videoUrl = URL.createObjectURL(blob);
          const newItem: CapturedMediaItem = {
            id: `video_${Date.now()}`,
            type: 'video',
            url: videoUrl,
            timestamp: Date.now(),
            focalLength: focalLengthMm,
            zoomLevel: zoomLevel,
            mode: 'VIDEO',
            aspectRatio: aspectRatio,
            durationSec: recordingSeconds || 1,
          };
          setGalleryItems((prev) => [newItem, ...prev]);
          notificationService.showInAppToast('Video Saved', `Recorded ${recordingSeconds}s high-definition video.`, 'success');
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);

        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds((s) => s + 1);
        }, 1000);
      } catch (err) {
        console.error('Failed to start MediaRecorder:', err);
        notificationService.showInAppToast('Video Error', 'MediaRecorder failed to initialize.', 'alert');
      }
    }
  };

  const formatRecordingTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // GALLERY MODAL OCR & ACTIONS
  // -------------------------------------------------------------
  const handleExecuteOcr = async (item: CapturedMediaItem) => {
    if (item.type !== 'photo') return;
    setIsOcrAnalyzing(true);
    setOcrResultText(null);

    try {
      const cleanBase64 = item.url.replace(/^data:[a-zA-Z0-9/]+;base64,/, '');
      const res = await api.analyzeCameraSnapshot({
        imageBase64: cleanBase64,
        mimeType: 'image/jpeg',
        prompt:
          'You are the Xiaomi HyperOS Optical OCR Engine. Transcribe all text, numbers, signs, and labels in this image accurately with clean formatting.',
      });
      setOcrResultText(res.analysis || 'No text detected in this image.');
    } catch {
      setOcrResultText('Optical OCR analysis failed. Please verify your connection.');
    } finally {
      setIsOcrAnalyzing(false);
    }
  };

  const handleDownloadItem = (item: CapturedMediaItem) => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = `GKEDIT_HYPEROS_${item.type.toUpperCase()}_${item.timestamp}.${
      item.type === 'video' ? 'webm' : 'jpg'
    }`;
    a.click();
    notificationService.showInAppToast('Saved', `Downloaded ${item.type} to device storage.`, 'success');
  };

  // -------------------------------------------------------------
  // RENDER ROTARY ARCS & TICKS
  // -------------------------------------------------------------
  // We generate radial tick marks along a downward curving circular arc
  const renderRotaryArcTicks = () => {
    const svgWidth = 340;
    const svgHeight = 85;
    const cx = svgWidth / 2;
    const arcRadius = 190;
    const topNeedleY = 14;
    const circleCenterY = topNeedleY + arcRadius;

    // We generate tick marks along the entire logarithmic zoom scale
    const ticks: React.ReactNode[] = [];
    const currentU = zoomToU(zoomLevel);
    const totalAngleSpan = 1.95; // ~112 degrees span for full scale

    // Milestones to mark
    const milestones = [
      { z: 0.6, label: '0.6' },
      { z: 1.0, label: '1X' },
      { z: 2.0, label: '2X' },
      { z: 3.0, label: '3X' },
      { z: 5.0, label: '5X' },
      { z: 10.0, label: '10X' },
    ];

    // Subdivisions between milestones
    const allSteps: { z: number; isMajor: boolean; label?: string }[] = [];
    // 0.6 to 1.0 (step 0.1)
    for (let z = 0.6; z <= 1.0; z = +(z + 0.1).toFixed(1)) {
      allSteps.push({ z, isMajor: z === 0.6 || z === 1.0, label: z === 0.6 ? '.6' : z === 1.0 ? '1' : undefined });
    }
    // 1.0 to 2.0 (step 0.2)
    for (let z = 1.2; z <= 2.0; z = +(z + 0.2).toFixed(1)) {
      allSteps.push({ z, isMajor: z === 2.0, label: z === 2.0 ? '2' : undefined });
    }
    // 2.0 to 5.0 (step 0.5)
    for (let z = 2.5; z <= 5.0; z = +(z + 0.5).toFixed(1)) {
      allSteps.push({ z, isMajor: z === 3.0 || z === 5.0, label: z === 3.0 ? '3' : z === 5.0 ? '5' : undefined });
    }
    // 5.0 to 10.0 (step 1.0)
    for (let z = 6.0; z <= 10.0; z = +(z + 1.0).toFixed(1)) {
      allSteps.push({ z, isMajor: z === 10.0, label: z === 10.0 ? '10' : undefined });
    }

    allSteps.forEach((step, idx) => {
      const stepU = zoomToU(step.z);
      // Angle offset from center top needle
      const alpha = (stepU - currentU) * totalAngleSpan;

      // Only render ticks visible within SVG arc bounds (~0.58 rad on either side)
      if (Math.abs(alpha) > 0.58) return;

      const sinA = Math.sin(alpha);
      const cosA = Math.cos(alpha);

      // Arc point
      const x0 = cx + arcRadius * sinA;
      const y0 = circleCenterY - arcRadius * cosA;

      const tickLen = step.isMajor ? 11 : 6;
      // Normal pointing inward toward circle center
      const x1 = x0 + tickLen * sinA;
      const y1 = y0 + tickLen * cosA;

      const isCurrent = Math.abs(alpha) < 0.04;

      ticks.push(
        <line
          key={`tick_${idx}`}
          x1={x0}
          y1={y0}
          x2={x1}
          y2={y1}
          stroke={isCurrent ? '#FFCC00' : step.isMajor ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)'}
          strokeWidth={isCurrent ? 2 : step.isMajor ? 1.5 : 1}
          strokeLinecap="round"
        />
      );

      if (step.isMajor && step.label) {
        const textDist = 22;
        const tx = x0 + textDist * sinA;
        const ty = y0 + textDist * cosA;
        ticks.push(
          <text
            key={`lbl_${idx}`}
            x={tx}
            y={ty}
            fill={isCurrent ? '#FFCC00' : 'rgba(255, 255, 255, 0.8)'}
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {step.label}
          </text>
        );
      }
    });

    return (
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="overflow-visible select-none pointer-events-none"
      >
        {/* Subtle curved arc track */}
        <path
          d={`M ${cx - 150} ${circleCenterY - arcRadius * Math.cos(-0.55)} A ${arcRadius} ${arcRadius} 0 0 1 ${
            cx + 150
          } ${circleCenterY - arcRadius * Math.cos(0.55)}`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1.5"
        />
        {/* Render all dynamic ticks */}
        {ticks}

        {/* Fixed Center Indicator: Flagship HyperOS Gold Needle */}
        <line
          x1={cx}
          y1={topNeedleY - 8}
          x2={cx}
          y2={topNeedleY + 10}
          stroke="#FFCC00"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="drop-shadow-[0_0_6px_#FFCC00]"
        />
      </svg>
    );
  };

  // -------------------------------------------------------------
  // MAIN COMPONENT JSX
  // -------------------------------------------------------------
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[100dvh] bg-black text-white select-none overflow-hidden flex flex-col justify-between font-sans overscroll-none"
      style={{ touchAction: 'manipulation' }}
    >
      {/* ----------------------------------------------------------- */}
      {/* VIEWFINDER CANVAS / VIDEO LAYER                             */}
      {/* ----------------------------------------------------------- */}
      <div
        className="absolute inset-0 z-0 flex items-center justify-center bg-black overflow-hidden cursor-crosshair"
        onClick={handleViewfinderTap}
      >
        {/* Real Hardware Camera Stream */}
        {!isSimulatedMode && (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover transition-transform duration-300 ease-out ${
              isFlipping ? 'scale-x-0 opacity-40' : 'scale-x-100 opacity-100'
            } ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            style={{
              transform:
                zoomLevel > 1 && !hardwareZoomSupported
                  ? `scale(${zoomLevel}) ${facingMode === 'user' ? 'scaleX(-1)' : ''}`
                  : facingMode === 'user'
                  ? 'scaleX(-1)'
                  : 'none',
              filter:
                currentMode === 'PRO' && proTelemetry.ev !== 0
                  ? `brightness(${1 + proTelemetry.ev * 0.25})`
                  : currentMode === 'PORTRAIT'
                  ? 'contrast(105%) saturate(108%)'
                  : 'none',
            }}
          />
        )}

        {/* Optical Simulator Canvas (Fallback when camera unavailable) */}
        {isSimulatedMode && (
          <canvas
            ref={simCanvasRef}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isFlipping ? 'opacity-40' : 'opacity-100'
            }`}
          />
        )}

        {/* Capture Off-screen Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Shutter White Flash Animation Overlay */}
        <div
          className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-200 z-40 ${
            isShutterActive ? 'opacity-95' : 'opacity-0'
          }`}
        />

        {/* Aspect Ratio Framing Guides */}
        {aspectRatio === '1:1' && (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between">
            <div className="w-full bg-black/85 flex-1" />
            <div className="w-full aspect-square border border-white/20" />
            <div className="w-full bg-black/85 flex-1" />
          </div>
        )}

        {aspectRatio === '4:3' && (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between">
            <div className="w-full bg-black/60 h-10" />
            <div className="w-full flex-1 border border-white/10" />
            <div className="w-full bg-black/60 h-10" />
          </div>
        )}

        {/* Rule of Thirds (3x3) Grid */}
        {gridType === '3x3' && (
          <div className="pointer-events-none absolute inset-0 z-10 grid grid-cols-3 grid-rows-3 border border-white/10">
            <div className="border-r border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-b border-white/15" />
            <div className="border-r border-white/15" />
            <div className="border-r border-white/15" />
            <div />
          </div>
        )}

        {/* Golden Ratio Spiral Grid */}
        {gridType === 'golden' && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-40">
            <div className="w-48 h-48 rounded-full border border-dashed border-[#FFCC00]/60" />
            <div className="absolute w-80 h-80 rounded-full border border-dashed border-white/25" />
          </div>
        )}

        {/* Virtual Horizon Artificial Level */}
        {horizonLevelEnabled && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div
              className="relative flex items-center justify-center transition-transform duration-100"
              style={{ transform: `rotate(${-currentRollAngle}deg)` }}
            >
              <div
                className={`w-24 h-0.5 rounded transition-colors ${
                  Math.abs(currentRollAngle) < 1.5 ? 'bg-[#FFCC00] shadow-[0_0_8px_#FFCC00]' : 'bg-white/60'
                }`}
              />
              <div
                className={`w-3 h-3 rounded-full border-2 mx-1 transition-colors ${
                  Math.abs(currentRollAngle) < 1.5
                    ? 'border-[#FFCC00] bg-[#FFCC00]/30 shadow-[0_0_8px_#FFCC00]'
                    : 'border-white/60'
                }`}
              />
              <div
                className={`w-24 h-0.5 rounded transition-colors ${
                  Math.abs(currentRollAngle) < 1.5 ? 'bg-[#FFCC00] shadow-[0_0_8px_#FFCC00]' : 'bg-white/60'
                }`}
              />
            </div>
          </div>
        )}

        {/* Touch-to-Focus Reticle */}
        {focusPoint && (
          <div
            className="pointer-events-none absolute z-30 flex items-center gap-2 transition-transform duration-200"
            style={{
              left: `${focusPoint.x}px`,
              top: `${focusPoint.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Focus Ring Box */}
            <div className="relative w-16 h-16 border-2 border-[#FFCC00] rounded-lg shadow-[0_0_10px_rgba(255,204,0,0.6)] animate-in zoom-in-75 duration-150">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-[#FFCC00]" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-[#FFCC00]" />
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-0.5 h-2 bg-[#FFCC00]" />
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-0.5 h-2 bg-[#FFCC00]" />
            </div>
            {/* Micro Sun Exposure Slider */}
            <div className="flex flex-col items-center gap-1 text-[#FFCC00]">
              <Sun className="w-3.5 h-3.5 animate-spin-slow" />
              <div className="w-1 h-8 bg-white/20 rounded-full relative">
                <div
                  className="w-2.5 h-2.5 rounded-full bg-[#FFCC00] absolute -left-[3px] transition-all"
                  style={{ top: `${50 - focusExposure * 20}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Timer Countdown Badge */}
        {timerCountdown !== null && (
          <div className="absolute z-30 inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
            <div className="w-28 h-28 rounded-full border-4 border-[#FFCC00] flex items-center justify-center text-6xl font-black text-[#FFCC00] shadow-[0_0_30px_#FFCC00] animate-pulse font-mono">
              {timerCountdown}
            </div>
          </div>
        )}

        {/* Night Mode Progress Ring */}
        {nightProgress !== null && (
          <div className="absolute z-30 inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none gap-4">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="w-full h-full rounded-full border-4 border-white/20 animate-spin border-t-[#FFCC00]" />
              <span className="absolute text-xl font-bold font-mono text-[#FFCC00]">
                {nightProgress}%
              </span>
            </div>
            <p className="text-xs font-semibold text-white/90 tracking-wide uppercase">
              Hold device steady · Capturing night light
            </p>
          </div>
        )}

        {/* Video Recording Header Pill */}
        {isRecording && (
          <div className="absolute top-16 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90 text-white font-mono text-xs font-bold shadow-lg animate-pulse">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>REC {formatRecordingTime(recordingSeconds)}</span>
          </div>
        )}

        {/* AI Scene Detection Tag */}
        {aiSceneActive && detectedScene && !isRecording && (
          <div className="absolute top-16 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/15 text-[#FFCC00] backdrop-blur-md text-[11px] font-medium shadow-md">
            <Sparkles className="w-3 h-3 text-[#FFCC00]" />
            <span>{detectedScene}</span>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* TOP STATUS & FEATURE CONTROLS BAR (Frosted Glassmorphism)  */}
      {/* ----------------------------------------------------------- */}
      <div className="relative z-30 w-full pt-safe">
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-md border-b border-white/5">
          {/* Flash Mode Toggle */}
          <button
            onClick={() => {
              triggerHaptic(15);
              setFlashMode((prev) =>
                prev === 'off' ? 'auto' : prev === 'auto' ? 'on' : prev === 'on' ? 'torch' : 'off'
              );
            }}
            className="flex items-center gap-1 p-2 rounded-full hover:bg-white/10 active:scale-95 transition cursor-pointer"
            title={`Flash: ${flashMode.toUpperCase()}`}
          >
            {flashMode === 'off' && <ZapOff className="w-4 h-4 text-white/50" />}
            {flashMode === 'auto' && (
              <div className="relative flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#FFCC00]" />
                <span className="absolute -bottom-1 -right-1 text-[8px] font-black font-mono text-[#FFCC00]">
                  A
                </span>
              </div>
            )}
            {flashMode === 'on' && <Zap className="w-4 h-4 text-[#FFCC00] fill-[#FFCC00]" />}
            {flashMode === 'torch' && <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />}
          </button>

          {/* HDR Selector */}
          <button
            onClick={() => {
              triggerHaptic(15);
              setHdrMode((prev) => (prev === 'off' ? 'auto' : prev === 'auto' ? 'on' : 'off'));
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold transition active:scale-95 cursor-pointer ${
              hdrMode !== 'off'
                ? 'bg-[#FFCC00]/20 text-[#FFCC00] border border-[#FFCC00]/50'
                : 'text-white/60 hover:text-white'
            }`}
          >
            HDR {hdrMode === 'auto' ? 'A' : hdrMode === 'on' ? 'ON' : 'OFF'}
          </button>

          {/* AI Scene Toggle (Xiaomi AI Camera Logo) */}
          <button
            onClick={() => {
              triggerHaptic(15);
              setAiSceneActive(!aiSceneActive);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition active:scale-95 cursor-pointer ${
              aiSceneActive
                ? 'bg-[#FFCC00] text-black border-[#FFCC00] shadow-[0_0_10px_rgba(255,204,0,0.5)]'
                : 'bg-transparent text-white/50 border-white/20'
            }`}
            title="Xiaomi AI Scene Detection"
          >
            <span className="font-mono text-[10px]">AI</span>
          </button>

          {/* 100K Ultra Macro Shortcut */}
          <button
            onClick={() => {
              triggerHaptic(15);
              if (galleryItems.length > 0 && galleryItems[0].type === 'photo') {
                setMacroTargetImage(galleryItems[0].url);
              } else {
                capturePhotoImmediate();
              }
              setShowMacroModal(true);
            }}
            className="p-2 rounded-full hover:bg-white/10 text-cyan-400 active:scale-95 transition cursor-pointer"
            title="10,000x Ultra Macro / 100K Matrix Reconstructor"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Dropdown Chevron Drawer Toggle */}
          <button
            onClick={() => {
              triggerHaptic(15);
              setIsTopDrawerOpen(!isTopDrawerOpen);
            }}
            className={`p-2 rounded-full transition active:scale-95 cursor-pointer ${
              isTopDrawerOpen ? 'bg-white/20 text-[#FFCC00]' : 'text-white/80 hover:text-white'
            }`}
            title="More Camera Settings"
          >
            {isTopDrawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Close or Back if provided */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white active:scale-95 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* --------------------------------------------------------- */}
        {/* TOP EXPANDABLE DRAWER SETTINGS                             */}
        {/* --------------------------------------------------------- */}
        {isTopDrawerOpen && (
          <div className="w-full bg-black/90 backdrop-blur-2xl border-b border-white/10 px-5 py-4 space-y-4 animate-in slide-in-from-top-3 duration-200">
            {/* Aspect Ratio Selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60 font-medium">Aspect Ratio</span>
              <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl">
                {(['1:1', '4:3', '16:9', 'full'] as AspectRatio[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      triggerHaptic(10);
                      setAspectRatio(r);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      aspectRatio === r
                        ? 'bg-[#FFCC00] text-black shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid & Framing */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60 font-medium">Grid Guides</span>
              <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl">
                {(['off', '3x3', 'golden'] as GridType[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      triggerHaptic(10);
                      setGridType(g);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      gridType === g
                        ? 'bg-[#FFCC00] text-black shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {g === 'off' ? 'OFF' : g === '3x3' ? '3x3' : 'GOLDEN'}
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60 font-medium">Self-Timer</span>
              <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl">
                {([0, 3, 5, 10] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      triggerHaptic(10);
                      setTimerPreset(t);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      timerPreset === t
                        ? 'bg-[#FFCC00] text-black shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {t === 0 ? 'OFF' : `${t}s`}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles Row: Watermark, Audio, Level */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10">
              <button
                onClick={() => {
                  triggerHaptic(10);
                  setWatermarkEnabled(!watermarkEnabled);
                }}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-medium transition cursor-pointer ${
                  watermarkEnabled
                    ? 'border-[#FFCC00]/60 bg-[#FFCC00]/15 text-[#FFCC00]'
                    : 'border-white/10 bg-white/5 text-white/50'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Leica Stamp</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic(10);
                  setHorizonLevelEnabled(!horizonLevelEnabled);
                }}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-medium transition cursor-pointer ${
                  horizonLevelEnabled
                    ? 'border-[#FFCC00]/60 bg-[#FFCC00]/15 text-[#FFCC00]'
                    : 'border-white/10 bg-white/5 text-white/50'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Level Sensor</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic(10);
                  setShutterSoundEnabled(!shutterSoundEnabled);
                }}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-medium transition cursor-pointer ${
                  shutterSoundEnabled
                    ? 'border-[#FFCC00]/60 bg-[#FFCC00]/15 text-[#FFCC00]'
                    : 'border-white/10 bg-white/5 text-white/50'
                }`}
              >
                {shutterSoundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
                <span>Shutter Audio</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* LOWER DECK: PRO TELEMETRY / ROTARY DIAL / MODES / SHUTTER    */}
      {/* ----------------------------------------------------------- */}
      <div className="relative z-30 w-full flex flex-col items-center pb-safe bg-gradient-to-t from-black via-black/80 to-transparent">
        {/* PRO Mode Telemetry Controls Bar */}
        {currentMode === 'PRO' && (
          <div className="w-full max-w-md px-4 py-1.5 flex items-center justify-between text-xs font-mono text-white/80 bg-black/60 backdrop-blur-md border-t border-b border-white/10 mb-2">
            <button
              onClick={() => setActiveProSlider(activeProSlider === 'iso' ? null : 'iso')}
              className={`px-2 py-1 rounded transition ${
                activeProSlider === 'iso' ? 'bg-[#FFCC00] text-black font-bold' : 'hover:bg-white/10'
              }`}
            >
              ISO {proTelemetry.iso}
            </button>
            <button
              onClick={() => setActiveProSlider(activeProSlider === 'shutter' ? null : 'shutter')}
              className={`px-2 py-1 rounded transition ${
                activeProSlider === 'shutter' ? 'bg-[#FFCC00] text-black font-bold' : 'hover:bg-white/10'
              }`}
            >
              S {proTelemetry.shutterSpeed}
            </button>
            <button
              onClick={() => setActiveProSlider(activeProSlider === 'ev' ? null : 'ev')}
              className={`px-2 py-1 rounded transition ${
                activeProSlider === 'ev' ? 'bg-[#FFCC00] text-black font-bold' : 'hover:bg-white/10'
              }`}
            >
              EV {proTelemetry.ev > 0 ? `+${proTelemetry.ev}` : proTelemetry.ev}
            </button>
            <button
              onClick={() => setActiveProSlider(activeProSlider === 'wb' ? null : 'wb')}
              className={`px-2 py-1 rounded transition ${
                activeProSlider === 'wb' ? 'bg-[#FFCC00] text-black font-bold' : 'hover:bg-white/10'
              }`}
            >
              WB {proTelemetry.wb}
            </button>
          </div>
        )}

        {/* PRO Mode Slider Expandable Drawer */}
        {currentMode === 'PRO' && activeProSlider && (
          <div className="w-full max-w-sm px-4 py-2 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 mb-2 flex items-center justify-around text-xs font-mono">
            {activeProSlider === 'ev' &&
              ([-2.0, -1.0, 0, 1.0, 2.0] as number[]).map((val) => (
                <button
                  key={val}
                  onClick={() => setProTelemetry((p) => ({ ...p, ev: val }))}
                  className={`px-2.5 py-1 rounded-full ${
                    proTelemetry.ev === val ? 'bg-[#FFCC00] text-black font-bold' : 'text-white/60'
                  }`}
                >
                  {val > 0 ? `+${val}` : val}
                </button>
              ))}
            {activeProSlider === 'iso' &&
              (['AUTO', 100, 200, 400, 800, 1600] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => setProTelemetry((p) => ({ ...p, iso: val }))}
                  className={`px-2.5 py-1 rounded-full ${
                    proTelemetry.iso === val ? 'bg-[#FFCC00] text-black font-bold' : 'text-white/60'
                  }`}
                >
                  {val}
                </button>
              ))}
            {activeProSlider === 'shutter' &&
              (['AUTO', '1/1000', '1/250', '1/60', '1/30'] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => setProTelemetry((p) => ({ ...p, shutterSpeed: val }))}
                  className={`px-2.5 py-1 rounded-full ${
                    proTelemetry.shutterSpeed === val
                      ? 'bg-[#FFCC00] text-black font-bold'
                      : 'text-white/60'
                  }`}
                >
                  {val}
                </button>
              ))}
            {activeProSlider === 'wb' &&
              (['AWB', '3200K', '5500K', '6500K'] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => setProTelemetry((p) => ({ ...p, wb: val }))}
                  className={`px-2.5 py-1 rounded-full ${
                    proTelemetry.wb === val ? 'bg-[#FFCC00] text-black font-bold' : 'text-white/60'
                  }`}
                >
                  {val}
                </button>
              ))}
          </div>
        )}

        {/* PORTRAIT Mode Depth Bokeh Aperture Slider */}
        {currentMode === 'PORTRAIT' && (
          <div className="w-full max-w-sm px-4 py-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 mb-2 flex items-center justify-between text-xs font-mono">
            <span className="text-[#FFCC00] flex items-center gap-1 font-bold">
              <Aperture className="w-3.5 h-3.5" />
              <span>f/{portraitAperture.toFixed(1)}</span>
            </span>
            <div className="flex items-center gap-1.5">
              {[1.4, 2.0, 2.8, 4.0, 8.0, 16.0].map((ap) => (
                <button
                  key={ap}
                  onClick={() => {
                    triggerHaptic(10);
                    setPortraitAperture(ap);
                  }}
                  className={`px-2 py-0.5 rounded-full ${
                    portraitAperture === ap
                      ? 'bg-[#FFCC00] text-black font-bold shadow'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  f/{ap}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* XIAOMI HYPEROS CURVED RADIAL ZOOM DIAL / PRESETS           */}
        {/* --------------------------------------------------------- */}
        <div className="relative w-full max-w-md flex flex-col items-center justify-center my-1 select-none">
          {/* Active Zoom & Focal Length Display Readout */}
          <div
            onClick={() => {
              triggerHaptic(10);
              setIsRotaryWheelOpen(!isRotaryWheelOpen);
            }}
            className="flex flex-col items-center justify-center cursor-pointer mb-1"
          >
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono tracking-tight text-[#FFCC00] drop-shadow-[0_0_8px_rgba(255,204,0,0.6)]">
                {zoomLevel % 1 === 0 ? `${zoomLevel}.0X` : `${zoomLevel.toFixed(1)}X`}
              </span>
            </div>
            <span className="text-[10px] text-white/70 font-mono tracking-wide -mt-0.5">
              {focalLengthMm}
            </span>
          </div>

          {/* Curved Rotary Wheel Mode (Interactive Drag Arc) */}
          {isRotaryWheelOpen ? (
            <div
              className="relative w-full h-[85px] flex items-center justify-center cursor-ew-resize touch-none"
              onPointerDown={handleRotaryPointerDown}
              onPointerMove={handleRotaryPointerMove}
              onPointerUp={handleRotaryPointerUp}
              onPointerCancel={handleRotaryPointerUp}
            >
              {renderRotaryArcTicks()}
            </div>
          ) : (
            /* Quick Preset Buttons Row */
            <div className="flex items-center justify-center gap-3 py-1">
              {ZOOM_PRESETS.map((preset) => {
                const isActive = Math.abs(zoomLevel - preset.zoom) < 0.15;
                return (
                  <button
                    key={preset.label}
                    onClick={() => handleSelectZoomPreset(preset.zoom)}
                    className={`w-9 h-9 rounded-full flex flex-col items-center justify-center transition-all duration-150 cursor-pointer active:scale-90 ${
                      isActive
                        ? 'bg-[#FFCC00] text-black font-black shadow-[0_0_12px_rgba(255,204,0,0.6)] scale-110'
                        : 'bg-black/50 border border-white/20 text-white/80 hover:text-white hover:border-[#FFCC00]/50'
                    }`}
                  >
                    <span className="text-[11px] font-mono leading-none font-bold">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* --------------------------------------------------------- */}
        {/* CAMERA MODE SWITCHER CAROUSEL                             */}
        {/* --------------------------------------------------------- */}
        <div
          ref={modeCarouselRef}
          className="w-full overflow-x-auto no-scrollbar scrollbar-none py-2 px-6 flex items-center justify-center gap-6 text-sm font-bold tracking-wider"
        >
          {CAMERA_MODES.map((mode) => {
            const isCurrent = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  triggerHaptic(20);
                  setCurrentMode(mode.id);
                  if (mode.id === 'ULTRA_HD') {
                    setZoomLevel(1.0);
                  }
                  if (mode.id === 'MORE') {
                    setIsMoreSheetOpen(true);
                  }
                }}
                className={`relative shrink-0 transition-colors uppercase cursor-pointer ${
                  isCurrent
                    ? 'text-[#FFCC00] font-black drop-shadow-[0_0_6px_rgba(255,204,0,0.5)]'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <span>{mode.label}</span>
                {isCurrent && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#FFCC00] shadow-[0_0_6px_#FFCC00]" />
                )}
              </button>
            );
          })}
        </div>

        {/* --------------------------------------------------------- */}
        {/* BOTTOM ACTION DECK (GALLERY, SHUTTER, SWITCH CAMERA)      */}
        {/* --------------------------------------------------------- */}
        <div className="w-full max-w-md px-8 py-4 flex items-center justify-between">
          {/* Gallery Thumbnail Preview (Left) */}
          <div className="w-14 h-14 flex items-center justify-center">
            {galleryItems.length > 0 ? (
              <button
                onClick={() => {
                  triggerHaptic(15);
                  setActivePreviewItem(galleryItems[0]);
                }}
                className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/40 shadow-xl active:scale-90 transition cursor-pointer"
              >
                {galleryItems[0].type === 'video' ? (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                    <Film className="w-5 h-5 text-red-400" />
                  </div>
                ) : (
                  <img
                    src={galleryItems[0].url}
                    alt="Latest Capture"
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Total Captures Badge */}
                <div className="absolute top-0 right-0 px-1 rounded-bl bg-black/75 text-[9px] font-mono text-white">
                  {galleryItems.length}
                </div>
              </button>
            ) : (
              <div className="w-12 h-12 rounded-2xl border-2 border-white/10 bg-white/5 flex items-center justify-center text-white/30">
                <Camera className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Shutter Button (Center) */}
          <div className="flex items-center justify-center">
            <button
              onClick={handleShutterTrigger}
              className={`relative rounded-full flex items-center justify-center transition-transform active:scale-90 cursor-pointer ${
                currentMode === 'VIDEO'
                  ? 'w-20 h-20 border-4 border-white'
                  : 'w-20 h-20 border-4 border-white/90 shadow-[0_0_20px_rgba(255,255,255,0.25)]'
              }`}
              title={
                currentMode === 'VIDEO'
                  ? isRecording
                    ? 'Stop Recording'
                    : 'Start Video Recording'
                  : 'Capture Photo'
              }
            >
              {currentMode === 'VIDEO' ? (
                /* Video Recording Red Button */
                <div
                  className={`rounded-full bg-red-600 transition-all duration-200 ${
                    isRecording ? 'w-8 h-8 rounded-md animate-pulse' : 'w-14 h-14'
                  }`}
                />
              ) : (
                /* Native Flagship Photo Dual-Ring Shutter */
                <div className="w-14 h-14 rounded-full bg-white transition-all duration-150 flex items-center justify-center shadow-inner">
                  {currentMode === 'ULTRA_HD' && (
                    <div className="w-4 h-4 rounded-full bg-[#FFCC00] animate-ping" />
                  )}
                  {currentMode === 'NIGHT' && (
                    <div className="w-4 h-4 rounded-full bg-indigo-600" />
                  )}
                </div>
              )}
            </button>
          </div>

          {/* Camera Flip Switch Button (Right) */}
          <div className="w-14 h-14 flex items-center justify-center">
            <button
              onClick={handleToggleFacing}
              className={`w-12 h-12 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer ${
                isFlipping ? 'rotate-180 duration-300' : 'rotate-0 duration-300'
              }`}
              title="Flip Front / Rear Camera"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* FULLSCREEN GALLERY REVIEW MODAL                             */}
      {/* ----------------------------------------------------------- */}
      {activePreviewItem && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#FFCC00]">
                {activePreviewItem.type === 'video' ? 'VIDEO RECORDING' : 'PHOTO CAPTURE'}
              </span>
              <span className="text-[10px] text-white/50">
                {new Date(activePreviewItem.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <button
              onClick={() => setActivePreviewItem(null)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Media Viewport */}
          <div className="flex-1 relative flex items-center justify-center p-2 overflow-hidden">
            {activePreviewItem.type === 'video' ? (
              <video
                src={activePreviewItem.url}
                controls
                autoPlay
                className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
              />
            ) : (
              <img
                src={activePreviewItem.url}
                alt="Captured Review"
                className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
              />
            )}
          </div>

          {/* OCR text extraction drawer if available */}
          {ocrResultText && (
            <div className="mx-4 mb-2 p-3 rounded-2xl bg-slate-900 border border-cyan-500/30 text-xs font-mono max-h-40 overflow-y-auto space-y-2">
              <div className="flex items-center justify-between font-bold text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Optical OCR Text Extracted</span>
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(ocrResultText);
                    setCopiedKey('ocr');
                    setTimeout(() => setCopiedKey(null), 2000);
                  }}
                  className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white"
                >
                  {copiedKey === 'ocr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-white/90 whitespace-pre-wrap">{ocrResultText}</p>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="p-4 bg-gradient-to-t from-black via-black/80 to-transparent border-t border-white/10 flex items-center justify-around gap-2">
            {/* Quantum Zoom (10,000,000x) Analysis Trigger */}
            {activePreviewItem.type === 'photo' && (
              <button
                onClick={() => {
                  setMacroTargetImage(activePreviewItem.url);
                  setMacroInitialZoom(10000000);
                  setShowMacroModal(true);
                }}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 hover:from-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
              >
                <Atom className="w-4 h-4 text-pink-300" />
                <span>10M Quantum Zoom</span>
              </button>
            )}

            {/* OCR Extract */}
            {activePreviewItem.type === 'photo' && (
              <button
                onClick={() => handleExecuteOcr(activePreviewItem)}
                disabled={isOcrAnalyzing}
                className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#FFCC00]" />
                <span>{isOcrAnalyzing ? 'Analyzing...' : 'OCR'}</span>
              </button>
            )}

            {/* Download */}
            <button
              onClick={() => handleDownloadItem(activePreviewItem)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white active:scale-95 transition cursor-pointer"
              title="Download to Device"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Send to Chat */}
            {onNavigateToChat && (
              <button
                onClick={() => {
                  onNavigateToChat(
                    `Analyze this photograph captured in Xiaomi HyperOS camera mode (${activePreviewItem.focalLength}):`
                  );
                  setActivePreviewItem(null);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 active:scale-95 transition cursor-pointer"
                title="Send Photo to GK Copilot"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}

            {/* Delete */}
            <button
              onClick={() => {
                setGalleryItems((prev) => prev.filter((i) => i.id !== activePreviewItem.id));
                setActivePreviewItem(null);
                triggerHaptic(15);
              }}
              className="p-2.5 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/40 active:scale-95 transition cursor-pointer"
              title="Delete Capture"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* FLAGSHIP HYPEROS MORE MODES DRAWER / SHEET                  */}
      {/* ----------------------------------------------------------- */}
      {isMoreSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#070b14]/95 border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 shadow-[0_12px_60px_rgba(0,0,0,0.95)] max-h-[85vh] overflow-y-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFCC00]/20 border border-[#FFCC00]/50 flex items-center justify-center text-[#FFCC00]">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Camera Modes</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-[#FFCC00] border border-[#FFCC00]/40">
                      MORE
                    </span>
                  </h3>
                  <p className="text-[11px] text-white/50 font-mono">
                    HyperOS Vision &amp; Quantum Magnification Suite
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreSheetOpen(false)}
                className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PREMIER FEATURE: QUANTUM ZOOM 10,000,000x */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-950/70 via-purple-950/50 to-neutral-900 border-2 border-pink-500/60 shadow-[0_0_25px_rgba(236,72,153,0.35)] space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-pink-500/25 border border-pink-400 flex items-center justify-center text-pink-300 text-xl shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                    ⚛️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-white">Quantum Zoom</h4>
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-pink-500 text-white shadow-[0_0_8px_#ec4899]">
                        10,000,000x
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-pink-300">
                      Tier 4: Subatomic Lattice &amp; Electron Orbital Probability
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-white/80 leading-relaxed">
                Uncapped optical and quantum magnification pipeline. Zoom from 1x up to <strong>10,000,000x</strong> into atomic lattices, electron orbital probability clouds, and subatomic density fields.
              </p>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-mono text-white/50">
                  Scale: <span className="text-pink-300 font-bold">50 pm Subatomic</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleLaunchQuantumZoomFromCamera(10000000)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.5)] hover:brightness-110 active:scale-95 transition cursor-pointer"
                >
                  <span>Launch 10,000,000x Zoom</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid of Other HyperOS Camera Modes in More */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleLaunchQuantumZoomFromCamera(2500)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 text-left transition cursor-pointer group space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">🔬</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                    100K Matrix
                  </span>
                </div>
                <div className="text-xs font-bold text-white group-hover:text-cyan-300">Super Macro</div>
                <p className="text-[10px] text-white/50 line-clamp-2">Microscopic lattice &amp; sub-pixel forensic scan.</p>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchQuantumZoomFromCamera(1000000)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 text-left transition cursor-pointer group space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">🌌</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                    1,000,000x
                  </span>
                </div>
                <div className="text-xs font-bold text-white group-hover:text-amber-300">Molecular SEM</div>
                <p className="text-[10px] text-white/50 line-clamp-2">Scanning electron microscopy &amp; lipid bilayer.</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  setCurrentMode('PHOTO');
                  triggerHaptic(15);
                  notificationService.showInAppToast('Document Scanner', 'Frame document to extract OCR text.', 'info');
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FFCC00]/50 text-left transition cursor-pointer group space-y-1"
              >
                <div className="flex items-center justify-between">
                  <FileText className="w-4 h-4 text-[#FFCC00]" />
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#FFCC00]/20 text-[#FFCC00] font-bold">
                    OCR
                  </span>
                </div>
                <div className="text-xs font-bold text-white group-hover:text-[#FFCC00]">Documents</div>
                <p className="text-[10px] text-white/50 line-clamp-2">High-contrast deskew &amp; auto text OCR.</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  window.dispatchEvent(new CustomEvent('gkedit:open_palm_share'));
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400/50 text-left transition cursor-pointer group space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">🖐️</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    P2P
                  </span>
                </div>
                <div className="text-xs font-bold text-white group-hover:text-emerald-300">Palm Share</div>
                <p className="text-[10px] text-white/50 line-clamp-2">Touchless instant photo transfer.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 10,000,000x ULTRA MACRO / QUANTUM DEEP VISION MODAL         */}
      {/* ----------------------------------------------------------- */}
      {showMacroModal && (
        <UltraMacroDeepVisionModal
          isOpen={showMacroModal}
          onClose={() => setShowMacroModal(false)}
          capturedImageDataUrl={macroTargetImage || (galleryItems[0] ? galleryItems[0].url : '')}
          initialItemName="HyperOS Optical Specimen"
          initialZoom={macroInitialZoom}
          onSendToGenerator={(prompt) => {
            setShowMacroModal(false);
            if (onNavigateToChat) {
              onNavigateToChat(prompt);
            }
          }}
        />
      )}
    </div>
  );
}
