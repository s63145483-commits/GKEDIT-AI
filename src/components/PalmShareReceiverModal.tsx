import React, { useState, useEffect, useRef } from 'react';
import { Peer } from 'peerjs';
import confetti from 'canvas-confetti';
import {
  Download,
  Check,
  X,
  Share2,
  Sparkles,
  Wifi,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Camera,
  Scan,
  QrCode,
  Zap,
} from 'lucide-react';
import { notificationService } from '../services/notificationService.ts';
import { QRScannerModal, parsePalmQrPayload } from './QRScannerModal.tsx';
import { ChunkReassembler } from '../services/fileTransferSessionService.ts';

export interface PalmShareReceiverModalProps {
  senderPeerId: string;
  onClose: () => void;
  onOpenPalmCapture?: () => void;
}

export function PalmShareReceiverModal({
  senderPeerId,
  onClose,
  onOpenPalmCapture,
}: PalmShareReceiverModalProps) {
  const [activeSenderPeerId, setActiveSenderPeerId] = useState<string>(senderPeerId);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [receivedImage, setReceivedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'receiving' | 'done' | 'error'>(
    'connecting'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [transferProgress, setTransferProgress] = useState<number>(0);
  const [chunkStats, setChunkStats] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<any>(null);
  const reassemblerRef = useRef<ChunkReassembler>(new ChunkReassembler());

  useEffect(() => {
    setActiveSenderPeerId(senderPeerId);
  }, [senderPeerId]);

  useEffect(() => {
    if (!activeSenderPeerId) return;

    setStatus('connecting');
    setErrorMessage(null);
    setTransferProgress(0);
    reassemblerRef.current.reset();

    try {
      const receiverPeer = new Peer({
        debug: 1,
      });
      peerRef.current = receiverPeer;

      receiverPeer.on('open', () => {
        // Connect to the sender peer
        const conn = receiverPeer.connect(activeSenderPeerId, {
          reliable: true,
        });
        connRef.current = conn;

        conn.on('open', () => {
          setStatus('connected');
          notificationService.playSoftChime();
          notificationService.showInAppToast(
            'Connected to Sender 🔗',
            'WebRTC P2P direct keep-alive channel active.',
            'info'
          );
        });

        conn.on('data', (data: any) => {
          setStatus('receiving');

          // Process packet through chunk reassembler
          const result = reassemblerRef.current.handlePacket(data, (pct, received, total) => {
            setTransferProgress(pct);
            setChunkStats({ current: received, total });
          });

          if (result.complete && result.dataUrl) {
            setReceivedImage(result.dataUrl);
            setStatus('done');
            setTransferProgress(100);

            // Trigger celebratory confetti burst on receiver phone
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.55 },
              colors: ['#06b6d4', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
            });

            notificationService.playSoftChime();
            notificationService.showInAppToast(
              'Photo Received! 📸',
              '100% chunks transferred directly via P2P without timeout resets.',
              'success'
            );
          }
        });

        conn.on('error', (err) => {
          console.error('Receiver connection error:', err);
          if (status !== 'done') {
            setStatus('error');
            setErrorMessage(err.message || 'Connection to sender peer lost.');
          }
        });
      });

      receiverPeer.on('error', (err) => {
        console.error('Receiver peer error:', err);
        setStatus('error');
        setErrorMessage(
          err.type === 'peer-unavailable'
            ? 'Sender session expired or offline. Please scan again.'
            : err.message || 'Peer connection failed'
        );
      });
    } catch (err: any) {
      console.error('Failed to initialize receiver:', err);
      setStatus('error');
      setErrorMessage(err.message || 'WebRTC initialisation error');
    }

    return () => {
      if (peerRef.current) {
        try {
          peerRef.current.destroy();
        } catch {
          // ignore
        }
        peerRef.current = null;
      }
      connRef.current = null;
    };
  }, [activeSenderPeerId]);

  const handleScanNewQR = (scannedText: string) => {
    const parsed = parsePalmQrPayload(scannedText);
    if (parsed.peerId) {
      setActiveSenderPeerId(parsed.peerId);
      setIsScanModalOpen(false);
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('receive_from', parsed.peerId);
        window.history.replaceState({}, '', url.pathname + url.search);
      } catch {}
      notificationService.showInAppToast('Connecting to Peer 🔗', `Linking ${parsed.peerId}`, 'info');
    }
  };

  // Clean URL query parameters when closing
  const handleClose = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('receive_from');
      window.history.replaceState({}, '', url.pathname + url.search);
    } catch {
      // ignore
    }
    onClose();
  };

  // 1-Tap Save to Gallery / Download
  const handleSaveToGallery = async () => {
    if (!receivedImage) return;

    try {
      // If mobile supports Web Share file saving
      const res = await fetch(receivedImage);
      const blob = await res.blob();
      const file = new File([blob], `palm_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'GKEDIT Palm Photo',
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
        return;
      }
    } catch {
      // fallback to download tag
    }

    // Direct browser anchor download
    const a = document.createElement('a');
    a.href = receivedImage;
    a.download = `gkedit_palm_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setIsSaved(true);
    notificationService.playSoftChime();
    notificationService.showInAppToast('Saved to Gallery 💾', 'Photo downloaded to your device.', 'success');
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 liquid-glass-modal-backdrop animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl liquid-glass-modal-container flex flex-col text-slate-100 overflow-hidden">
        <div className="liquid-glass-modal-glare" />
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              📥
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>Direct P2P Photo Receiver</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Session ID: <span className="text-cyan-300">{senderPeerId.slice(0, 16)}...</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Confirmation status pill */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-black/60 border border-white/10 text-xs">
            <span className="flex items-center gap-2 text-slate-300 font-mono">
              <Wifi className="w-4 h-4 text-cyan-400" />
              <span>Status:</span>
            </span>

            <span
              className={`font-mono font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                status === 'done'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : status === 'error'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
              }`}
            >
              {status === 'connecting' && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting to sender...</span>
                </>
              )}
              {status === 'connected' && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sender connected, waiting for photo...</span>
                </>
              )}
              {status === 'receiving' && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Receiving chunks ({transferProgress}%)...</span>
                </>
              )}
              {status === 'done' && (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Photo received via P2P Direct Transfer</span>
                </>
              )}
              {status === 'error' && (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>{errorMessage || 'Connection failed'}</span>
                </>
              )}
            </span>
          </div>

          {/* Receiving Chunk Progress Bar with Keep-Alive Status */}
          {status === 'receiving' && (
            <div className="p-3 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>Receiving: {transferProgress}%</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {chunkStats.current} / {chunkStats.total} chunks • Keep-Alive Active
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-2 rounded-full transition-all duration-150"
                  style={{ width: `${transferProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Transferred Image Display */}
          {receivedImage ? (
            <div className="space-y-3 animate-in zoom-in-95 duration-200">
              <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-black aspect-4/3 flex items-center justify-center shadow-2xl">
                <img
                  src={receivedImage}
                  alt="Received Palm Capture"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/80 border border-emerald-500/50 text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1.5 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ORIGINAL FULL QUALITY</span>
                </div>
              </div>

              {/* 1-Tap Save to Gallery / Download */}
              <button
                type="button"
                onClick={handleSaveToGallery}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>Saved to Device Gallery!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-slate-950" />
                    <span>Save to Gallery / Download</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="h-64 rounded-2xl border border-dashed border-white/15 bg-black/40 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div className="max-w-xs">
                <h4 className="text-sm font-bold text-white">Receiving Live Palm Photo</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Establishing direct WebRTC peer connection to transfer the original uncompressed snapshot.
                </p>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
            {onOpenPalmCapture && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onOpenPalmCapture();
                }}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>Take My Own Palm Photo</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsScanModalOpen(true)}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer border border-cyan-500/30"
              title="Scan another QR code"
            >
              <Scan className="w-3.5 h-3.5 text-cyan-400" />
              <span>Scan New QR</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold ml-auto transition active:scale-95 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Optical QR Scanner Modal for receiving */}
      <QRScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScan={handleScanNewQR}
        title="Scan Palm Share QR Code"
        subtitle="Align another phone's QR code in frame to receive photo"
      />
    </div>
  );
}
