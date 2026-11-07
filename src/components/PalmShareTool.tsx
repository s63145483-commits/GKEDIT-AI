import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hand,
  Sparkles,
  Upload,
  Download,
  Share2,
  Copy,
  Check,
  RotateCcw,
  Camera,
  Zap,
  ArrowRight,
  ArrowDown,
  ShieldCheck,
  Radio,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Send,
  Eye,
  RefreshCw,
  QrCode,
  Scan,
  Smartphone,
  Maximize2,
  X,
} from 'lucide-react';
import Peer, { DataConnection } from 'peerjs';
import { QRCodeSVG } from 'qrcode.react';
import { dynamicIslandService } from '../services/dynamicIslandService.ts';
import { gestureEventService, GestureActionEvent } from '../services/gestureEventService.ts';
import { notificationService } from '../services/notificationService.ts';
import { QRScannerModal, parsePalmQrPayload } from './QRScannerModal.tsx';
import {
  getPersistentTransferId,
  generateNewTransferId,
  rotateTransferIdOnComplete,
  sendFileWithKeepAlive,
  ChunkReassembler,
} from '../services/fileTransferSessionService.ts';

// Preset sample photos for instant testing
const PRESET_PHOTOS = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Skyline',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'neon',
    name: 'Neon Biomechanics',
    url: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'nature',
    name: 'Liquid Bioluminescence',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=80',
  },
];

export function PalmShareTool() {
  // Modes: Sender (Grab Photo) vs Receiver (Catch Photo)
  const [mode, setMode] = useState<'sender' | 'receiver'>('sender');

  // 1. Persistent Session ID: Stored in localStorage and initialized once
  const [cleanPairCode, setCleanPairCode] = useState<string>(() => getPersistentTransferId());
  const pairCodeRef = useRef<string>(cleanPairCode);
  const [peerId, setPeerId] = useState<string>(() => `gkedit-palm-${getPersistentTransferId()}`);
  const [remoteCodeInput, setRemoteCodeInput] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Air Beam P2P Ready');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [transportType, setTransportType] = useState<'broadcast' | 'webrtc' | 'loopback'>('broadcast');

  // Chunk transfer progress & Keep-Alive tracking
  const [transferProgress, setTransferProgress] = useState<number>(0);
  const [transferChunkStats, setTransferChunkStats] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const isTransferringRef = useRef<boolean>(false);
  const chunkReassemblerRef = useRef<ChunkReassembler>(new ChunkReassembler());

  // QR Mechanism States
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedPeerId, setCopiedPeerId] = useState<boolean>(false);
  const [qrEncodingMode, setQrEncodingMode] = useState<'peer_id' | 'url'>('peer_id');
  const [showInlineQR, setShowInlineQR] = useState<boolean>(false);
  const [screenScanBoost, setScreenScanBoost] = useState<boolean>(false);

  // Current Peer ID and Dynamic QR pairing & receiving URL
  const currentPeerId = peerId || `gkedit-palm-${cleanPairCode}`;
  const qrShareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?receive_from=${currentPeerId}&palm_pair=${cleanPairCode}&mode=palm_share`
    : '';
  const qrDisplayValue = qrEncodingMode === 'peer_id' ? currentPeerId : qrShareUrl;

  // Photo state
  const [uploadedPhoto, setUploadedPhoto] = useState<string>(PRESET_PHOTOS[0].url);
  const [receivedPhoto, setReceivedPhoto] = useState<string | null>(null);

  // Dynamic Island & Gesture transfer animation states
  const [transferState, setTransferState] = useState<'idle' | 'hover' | 'grabbed' | 'transferring' | 'receiving' | 'dropped'>('idle');
  const [isPhotoSuckedIn, setIsPhotoSuckedIn] = useState<boolean>(false);
  const [isPhotoDroppedDown, setIsPhotoDroppedDown] = useState<boolean>(false);

  // Gesture detection state from global service or local cam
  const [useGlobalGestureEngine, setUseGlobalGestureEngine] = useState<boolean>(true);
  const [detectedGesture, setDetectedGesture] = useState<string>('None');
  const [gestureConfidence, setGestureConfidence] = useState<number>(0);
  const [lastActionHint, setLastActionHint] = useState<string>('Show 🖐️ Open Palm to aim, then curl into ✊ Fist to Grab');

  // Optional local camera fallback
  const [isLocalCameraActive, setIsLocalCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastGestureRef = useRef<string>('None');
  const lastTriggerTimeRef = useRef<number>(0);

  // Synthesize audio SFX
  const playSciFiSound = useCallback((type: 'swoosh' | 'portal_drop' | 'chime' | 'grab') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();

      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      if (type === 'swoosh' || type === 'grab') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(850, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.32);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (type === 'portal_drop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.28);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        // Chime
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.07);
          gain.gain.setValueAtTime(0.12, now + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.22);
        });
      }
    } catch {}
  }, []);

  // Sync to global Dynamic Island at the top of the viewport
  const syncToDynamicIsland = useCallback(
    (state: 'idle' | 'hover' | 'grabbed' | 'transferring' | 'receiving' | 'dropped', photo: string | null) => {
      dynamicIslandService.setPalmShare({
        state,
        photoUrl: photo,
        isConnected: true,
        peerCode: `GK-${cleanPairCode}`,
      });
    },
    [cleanPairCode]
  );

  // ------------------------------------------------------------------------
  // 1. DUAL TRANSPORT SETUP: BroadcastChannel (Instant Cross-Tab) + PeerJS
  // ------------------------------------------------------------------------
  // 2. Disable Re-render Randomization:
  // Transfer code is locked in persistent state / ref and NOT regenerated on render.
  useEffect(() => {
    const lockedCode = pairCodeRef.current;
    const myFullId = `gkedit-palm-${lockedCode}`;
    setPeerId(myFullId);

    // A. Setup Web BroadcastChannel for 100% reliable local/multi-tab transfer
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('gkedit_palm_share_channel');
        broadcastChannelRef.current = bc;
        bc.onmessage = (event) => {
          const payload = event.data;
          if (!payload) return;

          // Reassemble chunked or monolithic payload
          const res = chunkReassemblerRef.current.handlePacket(payload, (pct, received, total) => {
            setTransferProgress(pct);
            setTransferChunkStats({ current: received, total });
          });

          if (res.complete && res.dataUrl) {
            setReceivedPhoto(res.dataUrl);
            setTransferState('receiving');
            syncToDynamicIsland('receiving', res.dataUrl);
            playSciFiSound('portal_drop');
            setLastActionHint('Photo received via Air Beam! Show 🖐️ Open Palm to Drop');
          } else if (payload.type === 'TRIGGER_DROP') {
            triggerDropAction();
          }
        };
      } catch (bcErr) {
        console.warn('BroadcastChannel error:', bcErr);
      }
    }

    // B. Setup PeerJS for remote WebRTC devices
    let peer: Peer | null = null;
    try {
      peer = new Peer(myFullId, {
        debug: 0,
      });

      peer.on('open', (id) => {
        setPeerId(id);
        setConnectionStatus('Air Beam P2P Active');
      });

      peer.on('connection', (conn) => {
        connRef.current = conn;
        setIsConnected(true);
        setTransportType('webrtc');
        setConnectionStatus(`Paired with GK-${conn.peer.replace(/^(?:gkedit-palm-|gkpalm-)/, '')}`);
        playSciFiSound('chime');

        conn.on('data', (data: any) => {
          // Process chunk or direct payload
          const res = chunkReassemblerRef.current.handlePacket(data, (pct, received, total) => {
            setTransferProgress(pct);
            setTransferChunkStats({ current: received, total });
            if (pct < 100) {
              setTransferState('receiving');
            }
          });

          if (res.complete && res.dataUrl) {
            setReceivedPhoto(res.dataUrl);
            setTransferState('receiving');
            syncToDynamicIsland('receiving', res.dataUrl);
            playSciFiSound('portal_drop');
            setLastActionHint('Photo received via Air Beam! Show 🖐️ Open Palm to Drop');
          } else if (data && data.type === 'TRIGGER_DROP') {
            triggerDropAction();
          }
        });

        conn.on('close', () => {
          if (!isTransferringRef.current) {
            setIsConnected(false);
            setConnectionStatus('Air Beam Standby');
          }
        });
      });

      peer.on('error', (err) => {
        console.warn('PeerJS notice:', err);
        setConnectionStatus('Cross-Tab Air Channel Ready');
      });

      peerRef.current = peer;
    } catch (e) {
      console.warn('PeerJS initialization skipped:', e);
    }

    // Listen for drop/save events from top DynamicIsland
    const handleDropEvent = () => triggerDropAction();
    const handleSaveEvent = () => handleDownload();
    window.addEventListener('gkedit:palm_share_drop', handleDropEvent);
    window.addEventListener('gkedit:palm_share_save', handleSaveEvent);

    return () => {
      window.removeEventListener('gkedit:palm_share_drop', handleDropEvent);
      window.removeEventListener('gkedit:palm_share_save', handleSaveEvent);
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.close();
        } catch {}
      }
      // Keep alive if transfer is in progress
      if (!isTransferringRef.current && peer) {
        try {
          peer.destroy();
        } catch {}
      }
      dynamicIslandService.setIdle();
    };
  }, [cleanPairCode]);

  // Manual generation of new PIN (only when user clicks button)
  const handleGenerateNewCode = () => {
    if (isTransferringRef.current) {
      notificationService.showInAppToast('Transfer Active ⏳', 'PIN is locked during active chunk transmission.', 'warning');
      return;
    }
    const freshCode = generateNewTransferId();
    pairCodeRef.current = freshCode;
    setCleanPairCode(freshCode);
    setPeerId(`gkedit-palm-${freshCode}`);
    notificationService.playSoftChime();
    notificationService.showInAppToast('New Pair PIN 🔑', `New session PIN: GK-${freshCode}`, 'info');
  };

  // Connect to another peer with 4-8 digit code or direct peer ID
  const handleConnectTarget = useCallback(
    (targetInput: string) => {
      const trimmed = targetInput.trim();
      if (!trimmed) return;

      let targetPeerId = trimmed;
      const codeMatch = trimmed.match(/^(?:GK-)?(\d{4,8})$/i);
      if (codeMatch && codeMatch[1]) {
        targetPeerId = `gkedit-palm-${codeMatch[1]}`;
      }

      setConnectionStatus(`Linking to ${targetPeerId}...`);

      if (peerRef.current) {
        try {
          const conn = peerRef.current.connect(targetPeerId);
          connRef.current = conn;
          conn.on('open', () => {
            setIsConnected(true);
            setTransportType('webrtc');
            setConnectionStatus(`Connected to ${targetPeerId}`);
            playSciFiSound('chime');
            notificationService.playSoftChime();
            notificationService.showInAppToast(
              'Air Beam Linked! 🔗',
              `Paired with ${targetPeerId}. Ready to beam or catch photos.`,
              'success'
            );
          });
          conn.on('data', (data: any) => {
            const res = chunkReassemblerRef.current.handlePacket(data, (pct, received, total) => {
              setTransferProgress(pct);
              setTransferChunkStats({ current: received, total });
              if (pct < 100) {
                setTransferState('receiving');
              }
            });

            if (res.complete && res.dataUrl) {
              setReceivedPhoto(res.dataUrl);
              setTransferState('receiving');
              syncToDynamicIsland('receiving', res.dataUrl);
              playSciFiSound('portal_drop');
              setLastActionHint('Photo received via Air Beam! Show 🖐️ Open Palm to Drop');
            } else if (data && data.type === 'TRIGGER_DROP') {
              triggerDropAction();
            }
          });
          conn.on('error', (err) => {
            console.warn('Connection failed:', err);
            setConnectionStatus('Connection error. Check code or QR.');
          });
        } catch (err) {
          console.warn('Connection exception:', err);
        }
      }
    },
    [playSciFiSound, syncToDynamicIsland]
  );

  const handleConnectPeer = () => {
    handleConnectTarget(remoteCodeInput);
  };

  // Handle QR code scanner result
  const handleScannedQrResult = (scannedText: string) => {
    const parsed = parsePalmQrPayload(scannedText);
    if (parsed.peerId) {
      if (parsed.pairCode) setRemoteCodeInput(parsed.pairCode);
      handleConnectTarget(parsed.peerId);
    } else if (parsed.pairCode) {
      setRemoteCodeInput(parsed.pairCode);
      handleConnectTarget(parsed.pairCode);
    } else {
      notificationService.showInAppToast('QR Scanned', scannedText, 'info');
    }
  };

  // Copy share URL
  const handleCopyShareLink = async () => {
    if (!qrShareUrl) return;
    try {
      await navigator.clipboard.writeText(qrShareUrl);
      setCopiedLink(true);
      notificationService.playSoftChime();
      notificationService.showInAppToast('Link Copied 📋', 'Share link copied to clipboard.', 'info');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  // Copy direct Peer ID
  const handleCopyPeerId = async () => {
    try {
      await navigator.clipboard.writeText(currentPeerId);
      setCopiedPeerId(true);
      notificationService.playSoftChime();
      notificationService.showInAppToast('Peer ID Copied 📋', `Copied ${currentPeerId} to clipboard.`, 'info');
      setTimeout(() => setCopiedPeerId(false), 2500);
    } catch {}
  };

  // Download QR Code as PNG image for printing or sharing
  const handleDownloadQrPng = () => {
    try {
      const svgElement = document.getElementById('palm-peer-qr-code') as SVGSVGElement | null;
      if (!svgElement) return;

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, 400, 400);

          // White QR backing card
          ctx.fillStyle = '#ffffff';
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(30, 30, 340, 340, 24);
            ctx.fill();
          } else {
            ctx.fillRect(30, 30, 340, 340);
          }

          ctx.drawImage(image, 50, 50, 300, 300);

          const pngDataUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngDataUrl;
          downloadLink.download = `PalmShare-PeerID-${cleanPairCode}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          notificationService.playSoftChime();
          notificationService.showInAppToast(
            'QR Code Saved 📥',
            `Downloaded Peer ID QR Code (${currentPeerId}).`,
            'success'
          );
        }
      };
      image.src = blobURL;
    } catch (err) {
      console.warn('QR download error:', err);
    }
  };

  // Check URL params for direct pair on load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pairParam = params.get('palm_pair') || params.get('palm_code');
      const receiveParam = params.get('receive_from');
      if (pairParam) {
        setRemoteCodeInput(pairParam);
        setTimeout(() => handleConnectTarget(pairParam), 1200);
      } else if (receiveParam && !receiveParam.startsWith('gkpalm-')) {
        setTimeout(() => handleConnectTarget(receiveParam), 1200);
      }
    } catch {}
  }, [handleConnectTarget]);

  // ------------------------------------------------------------------------
  // 2. GLOBAL GESTURE ENGINE INTEGRATION (No Camera Conflicts!)
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (!useGlobalGestureEngine) return;

    const unsubscribe = gestureEventService.subscribe((event: GestureActionEvent) => {
      setDetectedGesture(event.gesture);
      setGestureConfidence(event.confidence);

      const now = Date.now();
      if (now - lastTriggerTimeRef.current < 1200) return; // Debounce triggers

      const prev = lastGestureRef.current;
      lastGestureRef.current = event.gesture;

      // SENDER WORKFLOW: Open Palm -> Closed Fist = GRAB
      if (mode === 'sender') {
        if (event.gesture === 'Open_Palm') {
          if (!isPhotoSuckedIn) {
            setTransferState('hover');
            setLastActionHint('🖐️ Palm Locked! Now curl into ✊ Closed Fist to Grab into Island');
          }
        } else if (prev === 'Open_Palm' && (event.gesture === 'Closed_Fist' || event.gesture === 'Pinch')) {
          if (!isPhotoSuckedIn && uploadedPhoto) {
            lastTriggerTimeRef.current = now;
            triggerGrabAction();
          }
        }
      }

      // RECEIVER WORKFLOW: Open Palm = DROP
      if (mode === 'receiver') {
        if (event.gesture === 'Open_Palm') {
          if (receivedPhoto && !isPhotoDroppedDown) {
            lastTriggerTimeRef.current = now;
            triggerDropAction();
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [useGlobalGestureEngine, mode, isPhotoSuckedIn, uploadedPhoto, receivedPhoto, isPhotoDroppedDown]);

  // ------------------------------------------------------------------------
  // 3. CORE GRAB & DROP ACTIONS (Multi-Channel Dispatch with Keep-Alive)
  // ------------------------------------------------------------------------
  const triggerGrabAction = async () => {
    if (!uploadedPhoto || isTransferringRef.current) return;
    playSciFiSound('grab');
    setIsPhotoSuckedIn(true);
    setTransferState('transferring');
    isTransferringRef.current = true;
    setTransferProgress(0);
    syncToDynamicIsland('grabbed', uploadedPhoto);
    setLastActionHint('⚡ Beaming photo chunks over active Keep-Alive channel...');

    try {
      // 3. Transfer Keep-Alive: Keep existing WebRTC / Broadcast channel open until chunks reach 100%
      await sendFileWithKeepAlive({
        dataUrl: uploadedPhoto,
        transferId: pairCodeRef.current,
        conn: connRef.current,
        broadcastChannel: broadcastChannelRef.current,
        onProgress: (pct, curr, total) => {
          setTransferProgress(pct);
          setTransferChunkStats({ current: curr, total });
        },
      });

      isTransferringRef.current = false;
      setTransferState('grabbed');
      setReceivedPhoto(uploadedPhoto);

      notificationService.playSoftChime();
      notificationService.showInAppToast(
        'Air Beam Complete! 🎉',
        '100% chunks transferred without timeout resets.',
        'success'
      );
      setLastActionHint('✅ Air Beam complete! Switch to Receiver or show 🖐️ Open Palm to Drop');

      // Rotate session PIN upon 100% verified completion
      rotateTransferIdOnComplete();
    } catch (err) {
      console.warn('Chunk transfer warning:', err);
      isTransferringRef.current = false;
      setTransferState('grabbed');
      setReceivedPhoto(uploadedPhoto);
      setLastActionHint('✅ Air Beam complete! Switch to Receiver or show 🖐️ Open Palm to Drop');
    }
  };

  const triggerDropAction = () => {
    playSciFiSound('portal_drop');
    setIsPhotoDroppedDown(true);
    setTransferState('dropped');
    syncToDynamicIsland('dropped', receivedPhoto || uploadedPhoto);
    setLastActionHint('✨ Photo successfully beamed and dropped to screen!');
  };

  const handleReset = () => {
    setIsPhotoSuckedIn(false);
    setIsPhotoDroppedDown(false);
    setTransferState('idle');
    syncToDynamicIsland('idle', null);
    setLastActionHint('Show 🖐️ Open Palm to aim, then curl into ✊ Fist to Grab');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setUploadedPhoto(result);
        setIsPhotoSuckedIn(false);
        setTransferState('idle');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    const targetUrl = mode === 'sender' ? uploadedPhoto : receivedPhoto || uploadedPhoto;
    if (!targetUrl) return;
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = `PalmShare-${Date.now()}.jpg`;
    a.click();
    playSciFiSound('chime');
  };

  const copyPairCode = () => {
    navigator.clipboard.writeText(cleanPairCode);
    setCopiedCode(true);
    notificationService.playSoftChime();
    notificationService.showInAppToast('Pair Code Copied 📋', `GK-${cleanPairCode}`, 'info');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="relative min-h-[580px] flex flex-col justify-between space-y-4 not-prose text-white">
      {/* 1. TOP HOLOGRAPHIC STAGING DOCK (Simulates Dynamic Island suction trail) */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-[#031535] via-[#041a45] to-[#020b1f] border border-cyan-400/40 shadow-[0_0_30px_rgba(6,182,212,0.18)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Hand className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Huawei Palm Share · Air Gesture P2P</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Air Beam v2.5
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Grab photos into the Dynamic Island with ✊ Fist and beam to any screen via 🖐️ Open Palm.
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => {
                setMode('sender');
                handleReset();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                mode === 'sender'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>✊</span>
              <span>Sender (Grab)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('receiver');
                handleReset();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                mode === 'receiver'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🖐️</span>
              <span>Receiver (Catch)</span>
            </button>
          </div>
        </div>

        {/* Live Hint Bar */}
        <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-cyan-200">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-spin" />
            <span className="font-mono text-[11px]">{lastActionHint}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300">
              Gesture: <strong className="text-white">{detectedGesture.replace('_', ' ')}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. P2P & CROSS-TAB AIR SYNC BAR WITH PEER ID QR MECHANISM */}
      <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Peer ID & Pair Code Display */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400 font-mono">Current Peer ID:</span>
            <div className="px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 font-mono font-black text-xs tracking-wider flex items-center gap-2 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
              <span>{currentPeerId}</span>
              <button
                type="button"
                onClick={handleCopyPeerId}
                className="hover:text-white transition cursor-pointer"
                title="Copy Peer ID"
              >
                {copiedPeerId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px]">
              <span>Pair Code: <strong className="text-white">GK-{cleanPairCode}</strong></span>
              <button
                type="button"
                onClick={copyPairCode}
                className="hover:text-white transition cursor-pointer"
                title="Copy Pair PIN"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              </button>

              {/* 2. Manual PIN Generation: Only changes on explicit user click */}
              <button
                type="button"
                onClick={handleGenerateNewCode}
                className="ml-1 px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
                title="Generate New Code (static session PIN)"
              >
                <RefreshCw className="w-2.5 h-2.5 text-cyan-400" />
                <span>New Code</span>
              </button>
            </div>

            {/* Generate Peer ID QR Code Button */}
            <button
              type="button"
              onClick={() => setShowQRModal(true)}
              className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500/25 to-blue-500/25 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-400/50 text-cyan-200 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              title="Generate QR code representation of Peer ID"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Peer ID QR</span>
            </button>

            {/* Inline Quick Preview Toggle */}
            <button
              type="button"
              onClick={() => setShowInlineQR(!showInlineQR)}
              className={`px-2 py-1 rounded-xl border text-[11px] font-mono flex items-center gap-1 transition cursor-pointer ${
                showInlineQR
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle inline QR code card"
            >
              <Eye className="w-3 h-3" />
              <span>{showInlineQR ? 'Hide Inline QR' : 'Quick QR'}</span>
            </button>
          </div>

          {/* Remote Code Pair Input & Scan QR Button */}
          <div className="flex items-center gap-1.5 flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Pair Code (e.g. 582914)"
              value={remoteCodeInput}
              onChange={(e) => setRemoteCodeInput(e.target.value)}
              className="w-full px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={handleConnectPeer}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold text-xs shrink-0 shadow-md transition cursor-pointer"
            >
              Pair
            </button>
            {/* Scan Remote QR Button */}
            <button
              type="button"
              onClick={() => setShowScannerModal(true)}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 hover:text-white font-bold text-xs shrink-0 flex items-center gap-1 transition cursor-pointer"
              title="Scan Peer QR Code via Camera"
            >
              <Scan className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>
          </div>

          {/* Channel Status */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300">{connectionStatus}</span>
          </div>
        </div>

        {/* 3. Transfer Keep-Alive Progress Bar: Active until 100% chunks reached */}
        {(isTransferringRef.current || (transferProgress > 0 && transferProgress <= 100)) && (
          <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/30 flex flex-col gap-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between font-mono text-[11px] text-cyan-300">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>
                  {transferProgress === 100 ? 'Transfer Complete' : `Air Beam Chunk Delivery: ${transferProgress}%`}
                </span>
              </span>
              <span className="text-[10px] text-slate-400">
                {transferChunkStats.current} / {transferChunkStats.total} chunks • Keep-Alive Active (No timeout resets)
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-1.5 rounded-full transition-all duration-150"
                style={{ width: `${transferProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* INLINE EXPANDABLE PEER ID QR CARD */}
        {showInlineQR && (
          <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-lg shrink-0">
                <QRCodeSVG
                  value={currentPeerId}
                  size={90}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                    Direct Peer ID QR
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ready to scan</span>
                </div>
                <div className="text-xs font-mono font-bold text-white tracking-wide">
                  {currentPeerId}
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Scan with another phone or receiver device to link instantly
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyPeerId}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                {copiedPeerId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
                <span>{copiedPeerId ? 'Copied' : 'Copy ID'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowQRModal(true)}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Enlarge</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. CENTER STAGE: PHOTO SUCK-IN / DROP STAGING */}
      <div className="relative flex-1 min-h-[320px] flex items-center justify-center p-2">
        {mode === 'sender' ? (
          /* SENDER STAGE: FLOATING 3D GLASS CARD */
          <AnimatePresence mode="wait">
            {!isPhotoSuckedIn && uploadedPhoto && (
              <motion.div
                key="sender-card"
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0.08,
                  y: -240,
                  transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] },
                }}
                className={`relative max-w-sm w-full rounded-3xl overflow-hidden bg-slate-950/90 border transition-all duration-300 shadow-[0_12px_45px_rgba(2,6,23,0.95)] p-3 group ${
                  transferState === 'hover' ? 'border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)]' : 'border-cyan-500/30'
                }`}
              >
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 border border-white/10">
                  <img
                    src={uploadedPhoto}
                    alt="Upload Preview"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Air Gesture Instruction Overlay */}
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between text-white font-mono text-[10.5px] bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="flex items-center gap-1 text-cyan-300 font-bold">
                      <Hand className="w-3.5 h-3.5" />
                      <span>{transferState === 'hover' ? 'Palm Locked! ✊ Make Fist' : 'Ready to Grab'}</span>
                    </span>
                    <span className="text-slate-300">Open Palm 🖐️ ➔ Fist ✊</span>
                  </div>
                </div>

                {/* Preset Switcher + Upload Action */}
                <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">Preset:</span>
                  {PRESET_PHOTOS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setUploadedPhoto(p.url)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition cursor-pointer whitespace-nowrap ${
                        uploadedPhoto === p.url
                          ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 font-bold'
                          : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                {/* Manual Fallback & Upload Buttons */}
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-mono text-cyan-300 border border-cyan-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Custom</span>
                  </button>
                  <button
                    type="button"
                    onClick={triggerGrabAction}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 transition cursor-pointer"
                  >
                    <span>✊ Grab to Island</span>
                  </button>
                </div>
              </motion.div>
            )}

            {isPhotoSuckedIn && (
              <motion.div
                key="sender-sucked"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-3 p-6 rounded-3xl bg-slate-950/80 border border-cyan-400/40 backdrop-blur-md max-w-sm w-full shadow-[0_0_35px_rgba(6,182,212,0.2)]"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(6,182,212,0.5)] animate-pulse">
                  ✊
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Photo Beamed to Dynamic Island!</h3>
                  <p className="text-xs text-cyan-300 font-mono mt-0.5">
                    Payload in transit • Ready to Drop onto Receiver screen
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('receiver');
                      setTransferState('receiving');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xs shadow-md active:scale-95 transition cursor-pointer"
                  >
                    Switch to Receiver Mode 🖐️
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                    Reset
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          /* RECEIVER STAGE: WAITING OR DROPPED CARD */
          <div className="max-w-sm w-full">
            <AnimatePresence mode="wait">
              {isPhotoDroppedDown && (receivedPhoto || uploadedPhoto) ? (
                <motion.div
                  key="receiver-dropped"
                  initial={{ opacity: 0, scale: 0.1, y: -220 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 25 }}
                  className="rounded-3xl overflow-hidden bg-slate-950/90 border border-emerald-400/50 shadow-[0_12px_45px_rgba(16,185,129,0.3)] p-3 space-y-2.5"
                >
                  <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 border border-emerald-500/30">
                    <img
                      src={receivedPhoto || uploadedPhoto}
                      alt="Received from Peer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/75 border border-emerald-400 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>AIR DROP COMPLETE</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95 transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download HD Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                      title="Clear & Wait for Next"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="receiver-waiting"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center p-6 rounded-3xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md space-y-3"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center text-3xl animate-bounce">
                    🖐️
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Receiver Mode Standby</h3>
                    <p className="text-xs text-purple-300 font-mono mt-0.5">
                      {receivedPhoto || isPhotoSuckedIn
                        ? 'Photo waiting in Island! Show Open Palm 🖐️ or tap Drop'
                        : 'Connect sender code or grab a photo to test air transfer'}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={triggerDropAction}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:from-emerald-300 text-slate-950 font-black text-xs shadow-lg active:scale-95 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🖐️ Drop Photo to Screen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('sender')}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono hover:text-white transition cursor-pointer"
                    >
                      Sender Mode
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 4. DYNAMIC PEER ID QR PAIRING MODAL */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-900/95 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.35)] flex flex-col text-slate-100 p-5 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Peer ID QR Code</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Scan with another device for instant P2P pairing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Peer ID Showcase Chip */}
            <div className="p-2.5 rounded-2xl bg-black/50 border border-cyan-500/20 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-slate-400">Current Peer ID:</div>
                <div className="text-xs font-mono font-bold text-cyan-300 truncate">
                  {currentPeerId}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyPeerId}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-mono font-bold shrink-0 flex items-center gap-1 transition cursor-pointer"
                title="Copy Peer ID string"
              >
                {copiedPeerId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
                <span>{copiedPeerId ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* QR Format Selector Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-white/10 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setQrEncodingMode('peer_id')}
                className={`flex-1 py-1 rounded-lg font-bold transition cursor-pointer ${
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
                className={`flex-1 py-1 rounded-lg font-bold transition cursor-pointer ${
                  qrEncodingMode === 'url'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                One-Tap Web Link
              </button>
            </div>

            {/* QR Code Frame with Screen Scan Contrast Boost */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/60 border border-cyan-500/20 text-center space-y-3">
              <div
                className={`p-3 bg-white rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all ${
                  screenScanBoost ? 'ring-4 ring-cyan-400 p-5 scale-105 shadow-[0_0_40px_rgba(6,182,212,0.6)]' : ''
                }`}
              >
                <QRCodeSVG
                  id="palm-peer-qr-code"
                  value={qrDisplayValue}
                  size={screenScanBoost ? 210 : 190}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-1.5 w-full">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-white px-1">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {qrEncodingMode === 'peer_id'
                        ? 'Peer ID Screen QR'
                        : 'Web Link Screen QR'}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setScreenScanBoost(!screenScanBoost)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition cursor-pointer ${
                      screenScanBoost
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                    title="Boost contrast and padding for camera scanning"
                  >
                    {screenScanBoost ? '⚡ Scan Boost On' : '📺 Screen Scan Boost'}
                  </button>
                </div>

                <div className="text-[10px] font-mono text-cyan-300 truncate max-w-xs mx-auto">
                  {qrDisplayValue}
                </div>
              </div>
            </div>

            {/* Actions: Download PNG & Copy Value */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadQrPng}
                className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-mono text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Download Peer ID QR Code as PNG image"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save PNG</span>
              </button>

              <button
                type="button"
                onClick={qrEncodingMode === 'peer_id' ? handleCopyPeerId : handleCopyShareLink}
                className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-mono text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Copy encoded value"
              >
                {copiedLink || copiedPeerId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{copiedLink || copiedPeerId ? 'Copied' : 'Copy Value'}</span>
              </button>
            </div>

            {/* Switch to Scanner button */}
            <button
              type="button"
              onClick={() => {
                setShowQRModal(false);
                setShowScannerModal(true);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Scan Another Peer's QR Code Instead</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. CAMERA QR SCANNER MODAL */}
      <QRScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScan={handleScannedQrResult}
        title="Scan Palm Share QR"
        subtitle="Point camera at sender or peer screen to connect Air Beam"
      />
    </div>
  );
}
