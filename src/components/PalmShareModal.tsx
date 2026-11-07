import React, { useState, useEffect, useRef } from 'react';
import { Peer } from 'peerjs';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  Share2,
  Download,
  Copy,
  Check,
  RotateCcw,
  X,
  Sparkles,
  Wifi,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  QrCode,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { notificationService } from '../services/notificationService.ts';
import {
  getPersistentTransferId,
  generateNewTransferId,
  rotateTransferIdOnComplete,
  sendFileWithKeepAlive,
} from '../services/fileTransferSessionService.ts';

export interface PalmShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  capturedImage: string | null;
  onRetake?: () => void;
}

export function PalmShareModal({
  isOpen,
  onClose,
  capturedImage,
  onRetake,
}: PalmShareModalProps) {
  // 1. Persistent Session ID: Locked in persistent state / localStorage
  const [transferPin, setTransferPin] = useState<string>(() => getPersistentTransferId());
  const pinRef = useRef<string>(transferPin);
  const isTransferringRef = useRef<boolean>(false);

  const [peerId, setPeerId] = useState<string | null>(null);
  const [peerStatus, setPeerStatus] = useState<
    'initializing' | 'waiting' | 'connected' | 'transferring' | 'complete' | 'error'
  >('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);
  const [isQRExpanded, setIsQRExpanded] = useState(false);
  const [qrEncodingMode, setQrEncodingMode] = useState<'peer_id' | 'url'>('peer_id');
  const [screenScanBoost, setScreenScanBoost] = useState(false);
  const [transferProgress, setTransferProgress] = useState<number>(0);
  const [chunkStats, setChunkStats] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  const peerRef = useRef<Peer | null>(null);
  const activeConnRef = useRef<any>(null);

  // Check if Web Share API with files is supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setHasNativeShare(true);
    }
  }, []);

  // 2. Disable Re-render Randomization:
  // Initialize PeerJS session with persistent locked PIN.
  // Never randomize inside reactive loops or unkeyed timers.
  useEffect(() => {
    if (!isOpen || !capturedImage) return;

    setPeerStatus('initializing');
    setErrorMessage(null);
    setTransferProgress(0);

    const lockedPin = pinRef.current;
    const customId = `gkpalm-${lockedPin}`;

    try {
      const peer = new Peer(customId, {
        debug: 1,
      });
      peerRef.current = peer;

      peer.on('open', (id) => {
        setPeerId(id);
        setPeerStatus('waiting');
      });

      peer.on('connection', (conn) => {
        activeConnRef.current = conn;
        setPeerStatus('connected');
        notificationService.playSoftChime();
        notificationService.showInAppToast(
          'Peer Connected! 📲',
          'Direct WebRTC keep-alive channel established with receiver.',
          'info'
        );

        conn.on('open', async () => {
          setPeerStatus('transferring');
          isTransferringRef.current = true;

          // 3. Transfer Keep-Alive & Resilient Chunking:
          // Keep the existing WebRTC connection open until file chunks reach 100%
          try {
            await sendFileWithKeepAlive({
              dataUrl: capturedImage,
              transferId: pinRef.current,
              conn,
              filename: `gkedit_palm_capture_${Date.now()}.jpg`,
              onProgress: (pct, curr, total) => {
                setTransferProgress(pct);
                setChunkStats({ current: curr, total });
              },
              isCancelled: () => !isOpen,
            });

            isTransferringRef.current = false;
            setPeerStatus('complete');

            // Trigger celebratory confetti burst
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#06b6d4', '#10b981', '#3b82f6', '#f59e0b'],
            });

            notificationService.playSoftChime();
            notificationService.showInAppToast(
              'Transfer Complete! 🎉',
              '100% photo chunks successfully delivered without timeout resets.',
              'success'
            );

            // Rotate PIN in localStorage for subsequent sessions upon 100% completion
            rotateTransferIdOnComplete();
          } catch (sendErr: any) {
            console.error('Data transfer error:', sendErr);
            isTransferringRef.current = false;
            setPeerStatus('error');
            setErrorMessage('Transfer interrupted. Tap link to copy directly.');
          }
        });

        conn.on('error', (err) => {
          console.error('Connection error:', err);
          if (!isTransferringRef.current) {
            setPeerStatus('error');
            setErrorMessage(err.message || 'Peer connection interrupted');
          }
        });
      });

      peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        setPeerStatus('error');
        setErrorMessage(err.message || 'Peer initialization error');
      });
    } catch (err: any) {
      console.error('Peer creation failed:', err);
      setPeerStatus('error');
      setErrorMessage(err.message || 'WebRTC initialisation error');
    }

    return () => {
      // Keep alive if currently in active chunk transmission
      if (!isTransferringRef.current && peerRef.current) {
        try {
          peerRef.current.destroy();
        } catch {
          // ignore
        }
        peerRef.current = null;
      }
      activeConnRef.current = null;
    };
  }, [isOpen, capturedImage, transferPin]);

  // Manual generation of new PIN (only when user clicks button)
  const handleGenerateNewCode = () => {
    if (isTransferringRef.current) {
      notificationService.showInAppToast('Transfer Active ⏳', 'PIN is locked during active chunk transmission.', 'warning');
      return;
    }
    const freshPin = generateNewTransferId();
    pinRef.current = freshPin;
    setTransferPin(freshPin);
    setPeerId(`gkpalm-${freshPin}`);
    notificationService.playSoftChime();
    notificationService.showInAppToast('New Session PIN 🔑', `Transfer PIN updated to ${freshPin}`, 'info');
  };

  if (!isOpen || !capturedImage) return null;

  // The receiver URL encoded in the dynamic QR code
  const shareUrl = peerId
    ? `${window.location.origin}${window.location.pathname}?receive_from=${peerId}`
    : '';

  // The active QR payload: Either direct Peer ID string or web deep link
  const currentPeerId = peerId || `gkpalm-${transferPin}`;
  const activeQrValue = qrEncodingMode === 'peer_id' ? currentPeerId : (shareUrl || currentPeerId);

  // Download QR code as high-contrast PNG image
  const handleDownloadQrPng = () => {
    try {
      const svgElement = document.getElementById('palm-modal-qr-code') as SVGSVGElement | null;
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

  // Copy share URL to clipboard
  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      notificationService.playSoftChime();
      notificationService.showInAppToast('Share Link Copied 📋', 'Send this link to anyone to receive the photo.', 'info');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  // Trigger native device Web Share
  const handleNativeShare = async () => {
    if (!capturedImage) return;

    try {
      // Convert Data URL to File
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const file = new File([blob], `palm_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'GKEDIT Palm Gesture Photo',
          text: 'Captured touchless via Palm Gesture on GKEDIT AI Studio.',
          url: shareUrl || window.location.href,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'GKEDIT Palm Gesture Photo',
          text: 'Touchless Palm Capture from GKEDIT AI.',
          url: shareUrl || window.location.href,
        });
      }
    } catch (err) {
      console.warn('Native share cancelled or failed:', err);
    }
  };

  // Direct download to local gallery
  const handleDownload = () => {
    if (!capturedImage) return;
    const a = document.createElement('a');
    a.href = capturedImage;
    a.download = `gkedit_palm_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    notificationService.playSoftChime();
    notificationService.showInAppToast('Saved to Device 📸', 'Photo downloaded to your gallery.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 liquid-glass-modal-backdrop animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl liquid-glass-modal-container flex flex-col text-slate-100">
        <div className="liquid-glass-modal-glare" />
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              🖐️
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>Palm Gesture Photo Share</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase tracking-wider">
                  P2P WebRTC
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Direct cross-device transfer • No cloud storage
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Top Split: Image Preview & Dynamic QR Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Captured Image Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-4/3 flex items-center justify-center shadow-lg group">
              <img
                src={capturedImage}
                alt="Palm Capture"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono flex items-center gap-1 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>PALM CAPTURED</span>
              </div>
            </div>

            {/* Dynamic QR Code Card with Peer ID QR Generator */}
            <div className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-black/60 border border-cyan-500/20 text-center space-y-2.5">
              {/* QR Format Selector: Peer ID vs Web Link */}
              <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10 text-[10px] font-mono w-full">
                <button
                  type="button"
                  onClick={() => setQrEncodingMode('peer_id')}
                  className={`flex-1 py-1 rounded-lg font-bold transition cursor-pointer ${
                    qrEncodingMode === 'peer_id'
                      ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Encode raw Peer ID for direct P2P pairing"
                >
                  Direct Peer ID
                </button>
                <button
                  type="button"
                  onClick={() => setQrEncodingMode('url')}
                  className={`flex-1 py-1 rounded-lg font-bold transition cursor-pointer ${
                    qrEncodingMode === 'url'
                      ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Encode full web URL for instant mobile browser launch"
                >
                  Mobile Web Link
                </button>
              </div>

              {/* QR Canvas Frame with Screen-Scan Contrast Boost */}
              <div
                className={`p-3 bg-white rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all ${
                  screenScanBoost ? 'ring-4 ring-cyan-400 p-4 scale-105' : ''
                }`}
              >
                {peerId ? (
                  <QRCodeSVG
                    id="palm-modal-qr-code"
                    value={activeQrValue}
                    size={145}
                    level="M"
                    includeMargin={false}
                  />
                ) : (
                  <div className="w-[145px] h-[145px] flex flex-col items-center justify-center gap-2 text-slate-700">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
                    <span className="text-[10px] font-mono font-bold">Generating QR...</span>
                  </div>
                )}
              </div>

              <div className="space-y-0.5 w-full">
                <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {qrEncodingMode === 'peer_id'
                      ? 'Scan Peer ID from Screen'
                      : 'Scan to Open in Mobile Browser'}
                  </span>
                </div>
                <p className="text-[10px] text-cyan-300 font-mono truncate max-w-[200px] mx-auto">
                  {activeQrValue}
                </p>

                {peerId && (
                  <div className="flex flex-col items-center gap-1.5 pt-1">
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                        <span>PIN: <strong className="text-white tracking-wider">{transferPin}</strong></span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(transferPin);
                            notificationService.showInAppToast('PIN Copied 📋', `Transfer PIN: ${transferPin}`, 'info');
                          }}
                          className="text-slate-400 hover:text-white transition cursor-pointer"
                          title="Copy Transfer PIN"
                        >
                          <Copy className="w-3 h-3 text-cyan-400" />
                        </button>
                      </div>

                      {/* Manual Generate New Code button */}
                      <button
                        type="button"
                        onClick={handleGenerateNewCode}
                        className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
                        title="Generate New Code (static throughout active transfer)"
                      >
                        <RefreshCw className="w-2.5 h-2.5 text-cyan-400" />
                        <span>New Code</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setIsQRExpanded(true)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-[10px] font-mono font-bold inline-flex items-center gap-1 transition cursor-pointer border border-cyan-500/30"
                        title="Open Large Screen Scanner for Mobile Phones"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Screen Scan</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadQrPng}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-mono inline-flex items-center gap-1 transition cursor-pointer border border-white/10"
                        title="Download QR code PNG"
                      >
                        <Download className="w-3 h-3 text-emerald-400" />
                        <span>Save QR</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Transfer Status Indicator Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <span>P2P Transfer Channel:</span>
              </span>

              <span
                className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  peerStatus === 'complete'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : peerStatus === 'connected' || peerStatus === 'transferring'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse'
                    : peerStatus === 'error'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {peerStatus === 'complete' && <Check className="w-3 h-3" />}
                {(peerStatus === 'connected' || peerStatus === 'transferring') && (
                  <Loader2 className="w-3 h-3 animate-spin" />
                )}
                {peerStatus === 'waiting' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}

                {peerStatus === 'initializing' && 'Initialising session...'}
                {peerStatus === 'waiting' && 'Waiting for scan...'}
                {peerStatus === 'connected' && 'Peer connected!'}
                {peerStatus === 'transferring' && `Transferring chunks (${transferProgress}%)...`}
                {peerStatus === 'complete' && 'Transfer complete!'}
                {peerStatus === 'error' && (errorMessage || 'Connection failed')}
              </span>
            </div>

            {/* Chunk Transfer Progress Bar with Keep-Alive Heartbeat */}
            {peerStatus === 'transferring' && (
              <div className="p-2 rounded-xl bg-black/50 border border-cyan-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
                    <span>Chunk Delivery: {transferProgress}%</span>
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {chunkStats.current} / {chunkStats.total} chunks • Keep-Alive Active
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-150"
                    style={{ width: `${transferProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Direct Link Share & Copy */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
              <input
                type="text"
                readOnly
                value={shareUrl || 'Generating secure session URL...'}
                className="flex-1 bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-mono text-slate-300 select-all focus:outline-none focus:border-cyan-400 truncate"
              />
              <button
                type="button"
                onClick={handleCopyShareLink}
                disabled={!peerId}
                className="px-3 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 border border-white/10 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1 transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Native App Share Button */}
            {hasNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share via Native App</span>
              </button>
            )}

            {/* Save to Local Device */}
            <button
              type="button"
              onClick={handleDownload}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Save to Gallery</span>
            </button>

            {/* Retake Photo Button */}
            {onRetake && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRetake();
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Retake Photo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Enlarged QR Modal */}
      {isQRExpanded && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in zoom-in-95">
          <div className="relative p-6 rounded-3xl bg-slate-900 border border-cyan-500/50 shadow-[0_0_60px_rgba(6,182,212,0.4)] flex flex-col items-center space-y-4 max-w-sm w-full text-center">
            <div className="flex items-center justify-between w-full border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white text-sm">Screen Scan QR</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Point smartphone camera at monitor screen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQRExpanded(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher */}
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

            {/* High-Contrast White Background for Reliable Phone Camera Sensor Scanning */}
            <div className="p-4 bg-white rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.6)]">
              <QRCodeSVG
                value={activeQrValue}
                size={230}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="space-y-1 w-full">
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/30 font-mono text-xs text-cyan-300">
                <span className="text-[10px] text-slate-400">Target:</span>
                <span className="font-bold truncate max-w-[200px]">{activeQrValue}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeQrValue);
                    notificationService.showInAppToast('Copied 📋', activeQrValue, 'info');
                  }}
                  className="text-slate-400 hover:text-white transition cursor-pointer ml-1"
                  title="Copy QR Payload"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>

              <p className="text-[11px] text-slate-400 font-mono pt-1">
                {qrEncodingMode === 'peer_id'
                  ? 'Encodes Peer ID directly for instant P2P pairing'
                  : 'Encodes direct web URL to open transfer receiver on phone'}
              </p>
            </div>

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
                onClick={() => setIsQRExpanded(false)}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
