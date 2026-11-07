import React, { useState } from 'react';
import {
  Camera,
  SwitchCamera,
  X,
  Sparkles,
  Zap,
  Hand,
  QrCode,
  Scan,
  Share2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Download,
  Smartphone,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { usePalmGesture } from '../hooks/usePalmGesture.ts';
import { PalmShareModal } from './PalmShareModal.tsx';
import { CaptureFlashOverlay } from './CaptureFlashOverlay.tsx';
import { QRScannerModal, parsePalmQrPayload } from './QRScannerModal.tsx';
import { getPersistentTransferId } from '../services/fileTransferSessionService.ts';
import { notificationService } from '../services/notificationService.ts';

export interface PalmGesturePhotoShareProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectReceiver?: (senderPeerId: string) => void;
}

export function PalmGesturePhotoShare({
  isOpen,
  onClose,
  onConnectReceiver,
}: PalmGesturePhotoShareProps) {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isPeerQROpen, setIsPeerQROpen] = useState(false);
  const [qrEncodingMode, setQrEncodingMode] = useState<'peer_id' | 'url'>('peer_id');
  const [copiedPeerId, setCopiedPeerId] = useState(false);

  const transferPin = getPersistentTransferId();
  const currentPeerId = `gkpalm-${transferPin}`;
  const webShareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?receive_from=${currentPeerId}&mode=palm_share`
    : '';
  const qrDisplayValue = qrEncodingMode === 'peer_id' ? currentPeerId : webShareUrl;

  const handleCopyPeerId = async () => {
    try {
      await navigator.clipboard.writeText(qrDisplayValue);
      setCopiedPeerId(true);
      notificationService.playSoftChime();
      notificationService.showInAppToast('Copied 📋', qrDisplayValue, 'info');
      setTimeout(() => setCopiedPeerId(false), 2000);
    } catch {}
  };

  const handleDownloadQrPng = () => {
    try {
      const svgElement = document.getElementById('viewfinder-peer-qr-code') as SVGSVGElement | null;
      if (!svgElement) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 512, 512);
          ctx.drawImage(image, 32, 32, 448, 448);
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `PalmShare-PeerID-${currentPeerId}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(blobURL);

          notificationService.playSoftChime();
          notificationService.showInAppToast('QR Code Saved 📥', `Saved QR for ${currentPeerId}`, 'success');
        }
      };
      image.src = blobURL;
    } catch (err) {
      console.warn('QR download error:', err);
    }
  };

  const {
    videoRef,
    isCameraActive,
    cameraError,
    modelLoading,
    detectionState,
    startCamera,
    triggerCapture,
  } = usePalmGesture({
    enabled: isOpen && !isShareModalOpen,
    facingMode,
    holdDurationMs: 1500, // 1.5 seconds hold
    onCapture: (dataUrl) => {
      setCapturedPhoto(dataUrl);
      setIsShareModalOpen(true);
    },
  });

  if (!isOpen) return null;

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setIsShareModalOpen(false);
  };

  const handleScanQRResult = (scannedText: string) => {
    const parsed = parsePalmQrPayload(scannedText);
    if (parsed.peerId) {
      setIsQRScannerOpen(false);
      onClose();
      if (onConnectReceiver) {
        onConnectReceiver(parsed.peerId);
      } else {
        const url = new URL(window.location.href);
        url.searchParams.set('receive_from', parsed.peerId);
        window.history.pushState({}, '', url.pathname + url.search);
        window.dispatchEvent(new Event('popstate'));
      }
    }
  };

  // Circular countdown SVG parameters
  const circleRadius = 42;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeOffset = circumference - detectionState.holdProgress * circumference;

  return (
    <>
      {/* Full screen Flash Overlay on Shutter Capture */}
      <CaptureFlashOverlay />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl max-h-[96vh] rounded-3xl bg-slate-900/95 border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.3)] flex flex-col text-slate-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 shrink-0 bg-black/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                🖐️
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Palm Gesture Photo Share</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                    Touchless
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Hold open palm for 1.5s • Instant P2P QR transfer
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Show Screen QR Code for Mobile Scanning */}
              <button
                type="button"
                onClick={() => setIsPeerQROpen(true)}
                className="p-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-200 hover:text-white transition flex items-center gap-1.5 cursor-pointer text-xs font-semibold border border-cyan-500/40 shadow-sm"
                title="Generate Screen QR Code from Peer ID for Mobile Pairing"
              >
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline font-mono">Screen QR</span>
              </button>

              {/* Scan QR to Receive Button */}
              <button
                type="button"
                onClick={() => setIsQRScannerOpen(true)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer text-xs font-semibold border border-cyan-500/30"
                title="Scan QR Code to Receive Photo"
              >
                <Scan className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline font-mono">Scan QR</span>
              </button>

              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
                title="Switch Front/Rear Camera"
              >
                <SwitchCamera className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline font-mono">{facingMode === 'user' ? 'Front' : 'Rear'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Viewfinder Canvas / Camera Feed Container */}
          <div className="relative w-full aspect-4/3 sm:aspect-16/10 bg-black overflow-hidden flex items-center justify-center">
            {/* Live Camera Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transition-all"
              style={{
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              }}
            />

            {/* Rangefinder Corner Framing Brackets */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400/80 pointer-events-none" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400/80 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400/80 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400/80 pointer-events-none" />

            {/* Top Telemetry Overlay */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 border border-cyan-500/30 text-cyan-200 text-[10px] font-mono flex items-center gap-2 backdrop-blur-md shadow-lg pointer-events-none">
              <span
                className={`w-2 h-2 rounded-full ${
                  detectionState.isPalmDetected
                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <span>
                {detectionState.isPalmDetected
                  ? `PALM DETECTED (${Math.round(detectionState.handConfidence * 100)}%)`
                  : 'SEARCHING FOR OPEN PALM 🖐️'}
              </span>
            </div>

            {/* Model Loading State Overlay */}
            {modelLoading && (
              <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-4 text-center z-20">
                <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-3" />
                <h4 className="text-xs font-bold text-white tracking-wider">
                  INITIALIZING MEDIAPIPE PALM TRACKING...
                </h4>
                <p className="text-[11px] text-cyan-300/80 font-mono mt-1">
                  Loading high-precision 21-landmark neural hand model
                </p>
              </div>
            )}

            {/* Camera Error Display */}
            {cameraError && (
              <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-4 text-center z-30 space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-400 animate-bounce" />
                <h4 className="text-sm font-bold text-white">Camera Access Required</h4>
                <p className="text-xs text-slate-400 max-w-sm">{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs flex items-center gap-1.5 hover:bg-cyan-400 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera</span>
                </button>
              </div>
            )}

            {/* CIRCULAR RADIAL COUNTDOWN OVERLAY ON ACTIVE PALM */}
            {detectionState.isPalmDetected && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="relative flex flex-col items-center justify-center animate-in zoom-in-75 duration-150">
                  {/* Circular Radial Progress Ring */}
                  <svg className="w-36 h-36 -rotate-90 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
                    {/* Background Ring */}
                    <circle
                      cx="72"
                      cy="72"
                      r={circleRadius}
                      stroke="rgba(255, 255, 255, 0.15)"
                      strokeWidth="8"
                      fill="rgba(0, 0, 0, 0.4)"
                    />
                    {/* Animated Progress Ring */}
                    <circle
                      cx="72"
                      cy="72"
                      r={circleRadius}
                      stroke="url(#palmGrad)"
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-75 ease-linear"
                    />
                    <defs>
                      <linearGradient id="palmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Inner Countdown Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black font-mono text-white tracking-wider">
                      {detectionState.countdownRemainingSec > 0
                        ? `${detectionState.countdownRemainingSec}s`
                        : 'SNAP!'}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-cyan-300 uppercase tracking-widest mt-0.5">
                      HOLD STILL
                    </span>
                  </div>

                  {/* Outer Pulsing Target Ring */}
                  <div className="absolute -inset-2 rounded-full border border-cyan-400/40 animate-ping opacity-40 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Bottom Floating Instructions Bar */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl bg-black/85 border border-white/15 backdrop-blur-xl flex items-center gap-3 shadow-2xl z-20">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-lg">🖐️</span>
                <span className="text-slate-300">
                  {detectionState.isPalmDetected ? (
                    <strong className="text-emerald-400 font-bold">
                      Hold still for {detectionState.countdownRemainingSec}s to snap photo!
                    </strong>
                  ) : (
                    <span>Extend 5 fingers facing camera to trigger auto-capture</span>
                  )}
                </span>
              </div>

              {/* Manual Capture Shutter Backup */}
              <button
                type="button"
                onClick={triggerCapture}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 text-slate-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5"
                title="Manual Capture"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snap</span>
              </button>
            </div>
          </div>

          {/* Quick Explainer Strip */}
          <div className="p-3 bg-black/50 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct Peer-to-Peer WebRTC</span>
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPeerQROpen(true)}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition cursor-pointer font-semibold"
                title="Display QR code on screen for phone scanning"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Show Screen QR</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQRScannerOpen(true)}
                className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition cursor-pointer font-semibold"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Scan QR Code</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Optical QR Scanner Modal for receiving */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleScanQRResult}
        title="Scan Palm Share QR Code"
        subtitle="Align another phone's QR code in frame to receive photo"
      />

      {/* Screen QR Modal for Instant Mobile Phone Screen Scanning */}
      {isPeerQROpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in zoom-in-95 duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-cyan-500/50 shadow-[0_0_60px_rgba(6,182,212,0.4)] flex flex-col items-center p-5 space-y-4 text-center">
            {/* Modal Header */}
            <div className="flex items-center justify-between w-full border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white text-sm">Peer ID Screen QR</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Scan with your mobile phone camera
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPeerQROpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono w-full">
              <button
                type="button"
                onClick={() => setQrEncodingMode('peer_id')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  qrEncodingMode === 'peer_id'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Direct Peer ID
              </button>
              <button
                type="button"
                onClick={() => setQrEncodingMode('url')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  qrEncodingMode === 'url'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mobile Web Link
              </button>
            </div>

            {/* High-Contrast White Background for Camera Lens Scan */}
            <div className="p-4 bg-white rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.6)]">
              <QRCodeSVG
                id="viewfinder-peer-qr-code"
                value={qrDisplayValue}
                size={210}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Target Display with Copy */}
            <div className="space-y-1 w-full">
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/30 font-mono text-xs text-cyan-300">
                <span className="text-[10px] text-slate-400">Target:</span>
                <span className="font-bold truncate max-w-[200px]">{qrDisplayValue}</span>
                <button
                  type="button"
                  onClick={handleCopyPeerId}
                  className="text-slate-400 hover:text-white transition cursor-pointer ml-1"
                  title="Copy QR Value"
                >
                  {copiedPeerId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              </div>

              <div className="text-[11px] text-slate-300 font-mono pt-1">
                <span className="text-cyan-400 font-bold">Screen-to-Camera Pairing:</span> Point your smartphone camera at this screen to link P2P devices instantly!
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                type="button"
                onClick={handleDownloadQrPng}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border border-white/10"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save PNG</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPeerQROpen(false)}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* P2P Share Modal */}
      <PalmShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        capturedImage={capturedPhoto}
        onRetake={handleRetake}
      />
    </>
  );
}
