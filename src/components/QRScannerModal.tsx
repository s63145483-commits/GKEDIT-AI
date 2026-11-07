import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  SwitchCamera,
  X,
  Upload,
  AlertTriangle,
  Sparkles,
  QrCode,
  CheckCircle2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { notificationService } from '../services/notificationService.ts';

export interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedResult: string) => void;
  title?: string;
  subtitle?: string;
}

/**
 * Helper to parse decoded QR code payload into structured Palm Share target
 */
export function parsePalmQrPayload(raw: string): {
  peerId?: string;
  pairCode?: string;
  url?: string;
  rawText: string;
} {
  const cleanRaw = raw.trim();

  // Check if it's a full URL
  if (cleanRaw.startsWith('http://') || cleanRaw.startsWith('https://')) {
    try {
      const url = new URL(cleanRaw);
      const receiveFrom = url.searchParams.get('receive_from');
      const palmPair = url.searchParams.get('palm_pair') || url.searchParams.get('palm_code');
      return {
        peerId: receiveFrom || undefined,
        pairCode: palmPair || undefined,
        url: cleanRaw,
        rawText: cleanRaw,
      };
    } catch {
      // ignore
    }
  }

  // Check if it's like "GK-8842", "GK-582914", or raw PIN "582914"
  const codeMatch = cleanRaw.match(/^(?:GK-)?(\d{4,8})$/i);
  if (codeMatch && codeMatch[1]) {
    const code = codeMatch[1];
    return {
      pairCode: code,
      peerId: `gkedit-palm-${code}`,
      rawText: cleanRaw,
    };
  }

  // Check if it's a raw peer ID (e.g. gkedit-palm-582914 or gkpalm-582914)
  if (cleanRaw.startsWith('gkedit-palm-') || cleanRaw.startsWith('gkpalm-')) {
    const code = cleanRaw.replace(/^(?:gkedit-palm-|gkpalm-)/, '');
    return {
      peerId: cleanRaw,
      pairCode: /^\d{4,8}$/.test(code) ? code : undefined,
      rawText: cleanRaw,
    };
  }

  return {
    rawText: cleanRaw,
  };
}

export function QRScannerModal({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Palm Share QR',
  subtitle = 'Point camera at any device to link Air Beam P2P transfer',
}: QRScannerModalProps) {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedValue, setScannedValue] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasDetectedRef = useRef(false);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Handle successful QR detection
  const handleSuccess = useCallback(
    (codeText: string) => {
      if (hasDetectedRef.current) return;
      hasDetectedRef.current = true;
      setScannedValue(codeText);

      // Play soft chime & trigger haptic feedback
      try {
        notificationService.playSoftChime();
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([80, 40, 80]);
        }
      } catch {}

      notificationService.showInAppToast(
        'QR Code Detected! ⚡',
        `Linking Palm Share: ${codeText.slice(0, 36)}...`,
        'success'
      );

      // Slight delay so the user sees the confirmation ring before closing
      setTimeout(() => {
        onScan(codeText);
        onClose();
      }, 500);
    },
    [onScan, onClose]
  );

  // Continuous frame analysis loop with jsQR
  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || hasDetectedRef.current) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (width > 0 && height > 0) {
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);

          // Run jsQR on image buffer
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            handleSuccess(code.data);
            return;
          }
        }
      }
    }

    if (!hasDetectedRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(scanFrame);
    }
  }, [handleSuccess]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    hasDetectedRef.current = false;
    setScannedValue(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setHasCamera(false);
      setCameraError('Camera API is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().catch((err) => {
          console.warn('Video play error:', err);
        });
      }

      animationFrameIdRef.current = requestAnimationFrame(scanFrame);
    } catch (err: any) {
      console.warn('Camera access denied or failed:', err);
      // Fallback: try any available camera
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play().catch(() => {});
        }
        animationFrameIdRef.current = requestAnimationFrame(scanFrame);
      } catch (fallbackErr: any) {
        setCameraError(
          fallbackErr.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access or upload a QR image.'
            : 'Unable to start camera. You can still upload a QR code screenshot.'
        );
      }
    }
  }, [facingMode, stopCamera, scanFrame]);

  // Manage start / stop based on modal open
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Decode QR code from uploaded image file
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessing(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        setIsProcessing(false);
        if (code && code.data) {
          handleSuccess(code.data);
        } else {
          notificationService.showInAppToast(
            'No QR Code Found',
            'Could not find a valid QR code in the selected image.',
            'warning'
          );
        }
      };
      img.onerror = () => {
        setIsProcessing(false);
        notificationService.showInAppToast('Image Error', 'Failed to load image for QR decoding.', 'alert');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input so user can pick the same file again if needed
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 liquid-glass-modal-backdrop animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl liquid-glass-modal-container flex flex-col text-slate-100 overflow-hidden">
        <div className="liquid-glass-modal-glare" />
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase">
                  Optical
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[240px]">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Switch Camera (Front/Rear)"
            >
              <SwitchCamera className="w-4 h-4 text-cyan-400" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder & Video Frame */}
        <div className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center">
          {/* Live Video Feed */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
            style={{
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
            }}
          />

          {/* Hidden Canvas for Frame Processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Sci-Fi Target Framing & Laser Scanning Bar */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
            <div className="relative w-56 h-56 rounded-2xl border-2 border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.25)] flex items-center justify-center">
              {/* Corner Brackets */}
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-cyan-400" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-cyan-400" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-cyan-400" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-cyan-400" />

              {/* Animated Laser Scanning Beam */}
              {!scannedValue && (
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-pulse scanline-beam" />
              )}

              {/* Detected Success Indicator */}
              {scannedValue && (
                <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl flex flex-col items-center justify-center backdrop-blur-xs animate-in zoom-in-95">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-bounce" />
                  <span className="text-xs font-mono font-bold text-white mt-1">QR LINK CONFIRMED</span>
                </div>
              )}
            </div>
          </div>

          {/* Camera Error Message */}
          {cameraError && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
              <AlertTriangle className="w-10 h-10 text-amber-400 animate-bounce" />
              <h4 className="text-sm font-bold text-white">Camera Unavailable</h4>
              <p className="text-xs text-slate-400 max-w-xs">{cameraError}</p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-cyan-400 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-mono hover:bg-slate-700 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Upload QR Image</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-slate-950/80 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Align QR code inside frame</span>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-cyan-300 hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Decoding...' : 'Upload Image'}</span>
          </button>
        </div>

        {/* Hidden File Input for QR Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      <style>{`
        @keyframes scanbeam {
          0% { top: 8%; opacity: 0.8; }
          50% { top: 90%; opacity: 1; }
          100% { top: 8%; opacity: 0.8; }
        }
        .scanline-beam {
          animation: scanbeam 2.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
