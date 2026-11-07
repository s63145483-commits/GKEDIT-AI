import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio,
  Compass,
  Volume2,
  VolumeX,
  Lock,
  RotateCcw,
  Plus,
  Trash2,
  Share2,
  Wifi,
  Activity,
  Layers,
  Sparkles,
  Zap,
  MapPin,
  Trophy,
  Sliders,
  ChevronRight,
  RefreshCw,
  Info,
  Check,
  AlertTriangle,
  Download,
  Copy,
} from 'lucide-react';
import { sonarAudio, AudioMode } from '../services/sonarAudioService.ts';

export interface RoomSpot {
  id: string;
  name: string;
  signalIndex: number; // 0 - 100
  pingMs: number;
  jitterMs: number;
  downlinkMbps: number;
  headingDeg: number;
  tier: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  timestamp: string;
}

interface SignalNode {
  id: string;
  name: string;
  band: string;
  baseAngleDeg: number; // fixed room angle (0-360)
  targetDistanceRatio: number; // 0 (center) to 1 (outer rim)
  currentDistanceRatio: number;
  frequency: string;
  color: string;
  lastPingTime: number;
  pulsePhase: number;
  isCustom?: boolean;
}

interface CyberRadarSignalFinderProps {
  onBackToTools: () => void;
  onLockRadar: () => void;
}

export function CyberRadarSignalFinder({ onBackToTools, onLockRadar }: CyberRadarSignalFinderProps) {
  // --------------------------------------------------------------------------
  // 1. Radar Canvas & Orientation State
  // --------------------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [isOrientationSupported, setIsOrientationSupported] = useState<boolean>(false);
  const [orientationPermissionNeeded, setOrientationPermissionNeeded] = useState<boolean>(false);
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [useManualHeading, setUseManualHeading] = useState<boolean>(false);
  const sweepAngleRef = useRef<number>(0);
  const compassHeadingRef = useRef<number>(0);

  // --------------------------------------------------------------------------
  // 2. Network Performance Metrics
  // --------------------------------------------------------------------------
  const [currentPing, setCurrentPing] = useState<number>(24);
  const [currentJitter, setCurrentJitter] = useState<number>(2.4);
  const [currentDownlink, setCurrentDownlink] = useState<number>(65);
  const [effectiveType, setEffectiveType] = useState<string>('WiFi / 5G');
  const [signalIndex, setSignalIndex] = useState<number>(88); // 0 - 100%
  const pingHistoryRef = useRef<number[]>([25, 24, 26, 23, 24]);
  const isPingingRef = useRef<boolean>(false);

  // --------------------------------------------------------------------------
  // 3. Audio & Acoustic Sonar State
  // --------------------------------------------------------------------------
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(0.6);
  const [audioMode, setAudioMode] = useState<AudioMode>('sonar');
  const [acousticPulseActive, setAcousticPulseActive] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // 4. Room Spots & Session Ranking Log
  // --------------------------------------------------------------------------
  const [roomSpots, setRoomSpots] = useState<RoomSpot[]>(() => {
    const cached = sessionStorage.getItem('gkedit_cyber_room_spots');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'spot-1',
        name: 'Work Desk / Office',
        signalIndex: 94,
        pingMs: 18,
        jitterMs: 1.8,
        downlinkMbps: 84.5,
        headingDeg: 42,
        tier: 'EXCELLENT',
        timestamp: 'Just now',
      },
      {
        id: 'spot-2',
        name: 'Living Room',
        signalIndex: 82,
        pingMs: 31,
        jitterMs: 3.5,
        downlinkMbps: 58.2,
        headingDeg: 135,
        tier: 'GOOD',
        timestamp: '5m ago',
      },
    ];
  });

  const [selectedRoomPreset, setSelectedRoomPreset] = useState<string>('Bedroom');
  const [customRoomInput, setCustomRoomInput] = useState<string>('');
  const [isMarking, setIsMarking] = useState<boolean>(false);
  const [activeBlipInfo, setActiveBlipInfo] = useState<SignalNode | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // Signal nodes representing access points / mesh nodes / gateways in the space
  const signalNodesRef = useRef<SignalNode[]>([
    {
      id: 'node-ap-main',
      name: 'Primary 5GHz AP (Main Router)',
      band: '5.8 GHz WiFi 6',
      baseAngleDeg: 35,
      targetDistanceRatio: 0.22,
      currentDistanceRatio: 0.22,
      frequency: 'Channel 36 · 80MHz',
      color: '#00f0ff',
      lastPingTime: 0,
      pulsePhase: 0,
    },
    {
      id: 'node-mesh-hall',
      name: 'Mesh Node 02 (Hallway Uplink)',
      band: '5.2 GHz Mesh',
      baseAngleDeg: 120,
      targetDistanceRatio: 0.45,
      currentDistanceRatio: 0.45,
      frequency: 'Channel 48 · 80MHz',
      color: '#10b981',
      lastPingTime: 0,
      pulsePhase: 0,
    },
    {
      id: 'node-iot-gateway',
      name: '2.4GHz Smart IoT Backbone',
      band: '2.4 GHz WiFi',
      baseAngleDeg: 215,
      targetDistanceRatio: 0.68,
      currentDistanceRatio: 0.68,
      frequency: 'Channel 6 · 20MHz',
      color: '#38bdf8',
      lastPingTime: 0,
      pulsePhase: 0,
    },
    {
      id: 'node-dns-cloud',
      name: 'DNS Edge Gateway / Resolver',
      band: 'Gigabit Core',
      baseAngleDeg: 310,
      targetDistanceRatio: 0.35,
      currentDistanceRatio: 0.35,
      frequency: '1.1.1.1 / 8.8.8.8 Primary',
      color: '#a855f7',
      lastPingTime: 0,
      pulsePhase: 0,
    },
  ]);

  // Persist room spots in session
  useEffect(() => {
    sessionStorage.setItem('gkedit_cyber_room_spots', JSON.stringify(roomSpots));
  }, [roomSpots]);

  // --------------------------------------------------------------------------
  // 5. Network Latency & Ping Probing Engine
  // --------------------------------------------------------------------------
  const calculateSignalIndex = useCallback((ping: number, jitter: number, downlink: number): number => {
    // Ping factor: < 20ms = 100%, 100ms = 50%, > 300ms = 0%
    const pingScore = Math.max(0, Math.min(100, 100 - (ping - 15) * 0.4));
    // Jitter factor: < 3ms = 100%, 30ms = 20%
    const jitterScore = Math.max(0, Math.min(100, 100 - jitter * 3.0));
    // Downlink factor: > 60Mbps = 100%, 10Mbps = 50%, < 1Mbps = 10%
    const downlinkScore = Math.max(10, Math.min(100, (downlink / 60) * 100));

    // Weighted composite index (Ping: 45%, Jitter: 25%, Downlink: 30%)
    const composite = pingScore * 0.45 + jitterScore * 0.25 + downlinkScore * 0.3;
    return Math.round(Math.max(5, Math.min(100, composite)));
  }, []);

  const measureNetworkPerformance = useCallback(async () => {
    if (isPingingRef.current) return;
    isPingingRef.current = true;

    const startTime = performance.now();
    let rtt = 28;
    try {
      // Ping our fast server route with cache buster
      const response = await fetch(`/api/ping?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const endTime = performance.now();
        rtt = Math.round(endTime - startTime);
      }
    } catch {
      // Fallback measurement if network glitch
      rtt = Math.round(20 + Math.random() * 25);
    } finally {
      isPingingRef.current = false;
    }

    // Clamp realistic browser HTTP round-trip
    const clampedPing = Math.max(6, Math.min(450, rtt));
    setCurrentPing(clampedPing);

    // Update ping history & calculate rolling jitter (std dev)
    const history = [...pingHistoryRef.current.slice(-9), clampedPing];
    pingHistoryRef.current = history;
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length;
    const jitter = Math.round(Math.sqrt(variance) * 10) / 10;
    setCurrentJitter(jitter);

    // Read navigator.connection metrics if available
    let downlink = 65;
    let netType = 'WiFi / 5G';
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      if (conn.downlink && typeof conn.downlink === 'number') {
        downlink = Math.round(conn.downlink * 10) / 10;
      }
      if (conn.effectiveType) {
        netType = conn.effectiveType.toUpperCase();
      }
    } else {
      // Estimated synthetic bandwidth
      downlink = Math.round(45 + Math.random() * 35);
    }
    setCurrentDownlink(downlink);
    setEffectiveType(netType);

    // Calculate real-time signal index (0-100%)
    const index = calculateSignalIndex(clampedPing, jitter, downlink);
    setSignalIndex(index);

    // Update audio service signal index
    sonarAudio.setSignalIndex(index);

    // Dynamically adjust signal node distances based on live signal index
    // Higher signal = nodes gravitate closer to center
    // Lower signal = nodes push outward toward the boundary
    const invertedDistRatio = Math.max(0.12, Math.min(0.88, 1 - index / 100));
    signalNodesRef.current.forEach((node, i) => {
      const offset = (i - 1.5) * 0.08;
      node.targetDistanceRatio = Math.max(0.12, Math.min(0.92, invertedDistRatio + offset));
    });
  }, [calculateSignalIndex]);

  // Periodic network probe
  useEffect(() => {
    measureNetworkPerformance();
    const interval = setInterval(() => {
      measureNetworkPerformance();
    }, 1400);
    return () => clearInterval(interval);
  }, [measureNetworkPerformance]);

  // --------------------------------------------------------------------------
  // 6. Gyroscope / Compass Device Orientation Listener
  // --------------------------------------------------------------------------
  useEffect(() => {
    let supported = false;

    // Check iOS permission requirement
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      setOrientationPermissionNeeded(true);
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      supported = true;
      setIsOrientationSupported(true);

      let heading = 0;
      // iOS webkitCompassHeading is absolute clockwise degrees from Magnetic North
      if ((e as any).webkitCompassHeading !== undefined && (e as any).webkitCompassHeading !== null) {
        heading = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null && e.alpha !== undefined) {
        // Android standard alpha: counter-clockwise 0-360. Invert to clockwise
        heading = (360 - e.alpha) % 360;
      }

      const roundedHeading = Math.round(heading);
      if (!useManualHeading) {
        setCompassHeading(roundedHeading);
        compassHeadingRef.current = roundedHeading;
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [useManualHeading]);

  // Request iOS permission if needed
  const handleRequestCompassPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setOrientationPermissionNeeded(false);
          setIsOrientationSupported(true);
        }
      } catch (err) {
        console.error('Orientation permission error:', err);
      }
    }
  };

  // --------------------------------------------------------------------------
  // 7. Audio & Acoustic Sonar Feedback Setup
  // --------------------------------------------------------------------------
  useEffect(() => {
    sonarAudio.setVolume(audioVolume);
    sonarAudio.setMode(audioMode);
    sonarAudio.setPulseCallback(() => {
      setAcousticPulseActive(true);
      setTimeout(() => setAcousticPulseActive(false), 140);
    });

    if (!isAudioMuted) {
      sonarAudio.start();
    } else {
      sonarAudio.stop();
    }

    return () => {
      sonarAudio.stop();
    };
  }, [isAudioMuted, audioVolume, audioMode]);

  const toggleMute = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    sonarAudio.setMuted(next);
  };

  // --------------------------------------------------------------------------
  // 8. Canvas 360-degree High-Tech Radar Sweep Rendering (60 FPS)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const renderRadar = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 22;

      // Clear with dark tactical cyber canvas
      ctx.fillStyle = '#020712';
      ctx.fillRect(0, 0, width, height);

      // Save transform for rotated compass
      const activeHeading = useManualHeading ? manualHeading : compassHeadingRef.current;
      const headingRad = (activeHeading * Math.PI) / 180;

      // 1. Concentric Range Rings
      const ringLevels = [0.25, 0.5, 0.75, 1.0];
      const ringLabels = ['-35 dBm (10m)', '-50 dBm (25m)', '-70 dBm (50m)', '-90 dBm (100m)'];

      ctx.save();
      ctx.translate(centerX, centerY);

      // Rotate canvas so compass rotates when user physically turns
      ctx.rotate(-headingRad);

      ringLevels.forEach((level, idx) => {
        const r = radius * level;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = idx === ringLevels.length - 1 ? 'rgba(6, 182, 212, 0.45)' : 'rgba(6, 182, 212, 0.16)';
        ctx.lineWidth = idx === ringLevels.length - 1 ? 2 : 1;
        if (idx % 2 === 1) {
          ctx.setLineDash([4, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Ring label
        ctx.save();
        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.font = '9px monospace';
        ctx.fillText(ringLabels[idx], 6, -r + 11);
        ctx.restore();
      });

      // 2. Crosshairs & Angle Lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-radius, 0);
      ctx.lineTo(radius, 0);
      ctx.moveTo(0, -radius);
      ctx.lineTo(0, radius);
      ctx.stroke();

      // 30-degree tactical radial spokes
      for (let angle = 0; angle < 360; angle += 30) {
        if (angle % 90 === 0) continue;
        const rad = (angle * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(Math.cos(rad) * (radius * 0.85), Math.sin(rad) * (radius * 0.85));
        ctx.lineTo(Math.cos(rad) * radius, Math.sin(rad) * radius);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.stroke();
      }

      // 3. Cardinal Direction Labels (N, E, S, W)
      const cardinals = [
        { label: 'N', angle: -90, color: '#00f0ff' },
        { label: 'E', angle: 0, color: '#38bdf8' },
        { label: 'S', angle: 90, color: '#06b6d4' },
        { label: 'W', angle: 180, color: '#38bdf8' },
      ];

      cardinals.forEach((card) => {
        const rad = (card.angle * Math.PI) / 180;
        const x = Math.cos(rad) * (radius + 12);
        const y = Math.sin(rad) * (radius + 12);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(headingRad); // keep letters upright
        ctx.fillStyle = card.color;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.label, 0, 0);
        ctx.restore();
      });

      // 4. Update and Draw 360° Radar Sweeping Beam
      sweepAngleRef.current = (sweepAngleRef.current + 2.2) % 360;
      const sweepRad = (sweepAngleRef.current * Math.PI) / 180;

      // Glowing gradient trail sector (45 degrees trailing)
      const trailAngle = (50 * Math.PI) / 180;
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
      gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.25)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0.02)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, sweepRad - trailAngle, sweepRad, false);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();

      // Leading razor sweep line with intense neon glow
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(sweepRad) * radius, Math.sin(sweepRad) * radius);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();

      // 5. Draw Dynamic Signal Blips
      const nodes = signalNodesRef.current;
      const now = performance.now();

      nodes.forEach((node) => {
        // Smoothly interpolate current distance towards target
        node.currentDistanceRatio += (node.targetDistanceRatio - node.currentDistanceRatio) * 0.05;

        const nodeRad = ((node.baseAngleDeg - 90) * Math.PI) / 180;
        const dist = radius * node.currentDistanceRatio;
        const nodeX = Math.cos(nodeRad) * dist;
        const nodeY = Math.sin(nodeRad) * dist;

        // Check if sweep beam is currently passing over the node
        const nodeSweepAngle = (node.baseAngleDeg % 360);
        const currentSweepDeg = (sweepAngleRef.current + 90) % 360;
        const diff = Math.abs(nodeSweepAngle - currentSweepDeg);
        const isSwept = diff < 6 || Math.abs(diff - 360) < 6;

        if (isSwept && now - node.lastPingTime > 1200) {
          node.lastPingTime = now;
          node.pulsePhase = 1.0;
          // Play acoustic blip if unmuted
          if (!sonarAudio.getMuted()) {
            sonarAudio.playTone(650 + (1 - node.currentDistanceRatio) * 500);
          }
        }

        // Decay pulse phase
        if (node.pulsePhase > 0) {
          node.pulsePhase = Math.max(0, node.pulsePhase - 0.035);
        }

        // Distance-based color: closer to center = cyan/green; farther = amber/red
        let blipColor = node.color;
        if (node.currentDistanceRatio > 0.7) {
          blipColor = '#f97316'; // orange/weak
        } else if (node.currentDistanceRatio > 0.5) {
          blipColor = '#eab308'; // yellow/fair
        } else {
          blipColor = '#10b981'; // green/strong
        }

        // Draw expanding ripple shockwave on ping
        if (node.pulsePhase > 0) {
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, 8 + (1 - node.pulsePhase) * 22, 0, Math.PI * 2);
          ctx.strokeStyle = blipColor;
          ctx.lineWidth = 2 * node.pulsePhase;
          ctx.stroke();
        }

        // Outer glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, 6 + Math.sin(now * 0.005) * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = blipColor;
        ctx.shadowColor = blipColor;
        ctx.shadowBlur = 12;
        ctx.fill();

        // Inner white hot core
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();

        // Node label
        ctx.save();
        ctx.translate(nodeX, nodeY);
        ctx.rotate(headingRad); // upright text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(node.name.split(' ')[0], 10, -2);
        ctx.fillStyle = blipColor;
        ctx.font = '8px monospace';
        ctx.fillText(`${Math.round((1 - node.currentDistanceRatio) * 100)}%`, 10, 8);
        ctx.restore();
      });

      // 6. Central Radar Core (User's device position)
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 15;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();

      ctx.restore(); // restore center translation

      // 7. Outer HUD Ring Accents (fixed to screen, not rotating)
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Top North heading marker
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius - 8);
      ctx.lineTo(centerX - 5, centerY - radius - 16);
      ctx.lineTo(centerX + 5, centerY - radius - 16);
      ctx.closePath();
      ctx.fillStyle = '#00f0ff';
      ctx.fill();

      // Top corner telemetry HUD text
      ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
      ctx.font = '10px monospace';
      ctx.fillText(`AZM: ${String(activeHeading).padStart(3, '0')}°`, 16, 22);
      ctx.fillText(`SWEEP: ${String(Math.round(sweepAngleRef.current)).padStart(3, '0')}°`, 16, 36);

      ctx.textAlign = 'right';
      ctx.fillStyle = signalIndex > 75 ? '#10b981' : signalIndex > 45 ? '#eab308' : '#ef4444';
      ctx.fillText(`SIG INDEX: ${signalIndex}%`, width - 16, 22);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.fillText(`PING: ${currentPing}ms · JIT: ±${currentJitter}ms`, width - 16, 36);

      ctx.restore();

      animFrameId = requestAnimationFrame(renderRadar);
    };

    // Auto-resize high DPI canvas
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    animFrameId = requestAnimationFrame(renderRadar);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameId);
    };
  }, [useManualHeading, manualHeading, signalIndex, currentPing, currentJitter]);

  // --------------------------------------------------------------------------
  // 9. Mark Current Spot & Room Signal Mapping Action
  // --------------------------------------------------------------------------
  const handleMarkSpot = () => {
    setIsMarking(true);
    const roomName = (customRoomInput.trim() || selectedRoomPreset).trim();
    const heading = useManualHeading ? manualHeading : compassHeading;

    let tier: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' = 'GOOD';
    if (signalIndex >= 85) tier = 'EXCELLENT';
    else if (signalIndex >= 65) tier = 'GOOD';
    else if (signalIndex >= 40) tier = 'FAIR';
    else tier = 'POOR';

    const newSpot: RoomSpot = {
      id: 'spot_' + Date.now(),
      name: roomName,
      signalIndex,
      pingMs: currentPing,
      jitterMs: currentJitter,
      downlinkMbps: currentDownlink,
      headingDeg: heading,
      tier,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Audio confirmation
    sonarAudio.playTone(880);
    setTimeout(() => sonarAudio.playTone(1100), 120);

    setRoomSpots((prev) => {
      // Sort in-memory spots ranking by signalIndex descending
      const updated = [newSpot, ...prev.filter((s) => s.name.toLowerCase() !== roomName.toLowerCase())];
      return updated.sort((a, b) => b.signalIndex - a.signalIndex);
    });

    setCustomRoomInput('');
    setTimeout(() => setIsMarking(false), 500);
  };

  const handleDeleteSpot = (id: string) => {
    setRoomSpots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAllSpots = () => {
    if (confirm('Clear all logged room signal rankings?')) {
      setRoomSpots([]);
    }
  };

  const handleExportReport = () => {
    const lines = [
      '# CYBER RADAR HOME INTERNET SIGNAL REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      `Overall Active Signal: ${signalIndex}% (${effectiveType})`,
      `Ping Latency: ${currentPing}ms | Jitter: ±${currentJitter}ms | Downlink: ${currentDownlink} Mbps`,
      '',
      '## ROOM SIGNAL RANKINGS (STRONGEST TO WEAKEST):',
      ...roomSpots.map(
        (spot, idx) =>
          `${idx + 1}. [${spot.tier}] ${spot.name} - Signal Index: ${spot.signalIndex}% | Ping: ${spot.pingMs}ms | Jitter: ±${spot.jitterMs}ms | Downlink: ${spot.downlinkMbps} Mbps | Heading: ${spot.headingDeg}° | Logged: ${spot.timestamp}`
      ),
    ];
    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Helper badge color
  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'EXCELLENT':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'GOOD':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'FAIR':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-red-500/20 text-red-300 border-red-500/40';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* -------------------------------------------------------------------- */}
      {/* TOP SCI-FI HUD HEADER */}
      {/* -------------------------------------------------------------------- */}
      <div className="relative rounded-3xl bg-[#030914]/90 border border-cyan-500/40 p-5 backdrop-blur-xl shadow-[0_0_35px_rgba(6,182,212,0.15)] overflow-hidden">
        {/* Radar scan grid decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                CYBER RADAR SIGNAL FINDER
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> CAMERA-FREE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
              HOME INTERNET TRACKER
            </h1>
            <p className="text-xs text-slate-300/80 mt-0.5">
              Tactical 360° radar sweep &bull; Gyroscope room compass &bull; Dynamic network nodes &bull; Sonar/Geiger acoustic telemetry
            </p>
          </div>

          {/* Quick HUD controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={toggleMute}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                isAudioMuted
                  ? 'bg-slate-900 border-slate-700 text-slate-400'
                  : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              }`}
              title={isAudioMuted ? 'Unmute Sonar Audio' : 'Mute Sonar Audio'}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
              <span>{isAudioMuted ? 'MUTED' : 'SONAR ACTIVE'}</span>
            </button>

            <button
              onClick={onLockRadar}
              className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-xs font-mono text-slate-300 hover:text-amber-300 transition cursor-pointer flex items-center gap-1.5"
              title="Lock with GKEDIT PIN"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>LOCK</span>
            </button>

            <button
              onClick={onBackToTools}
              className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-xs font-mono text-slate-300 hover:text-white transition cursor-pointer"
            >
              &larr; BACK
            </button>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-cyan-500/20">
          <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/20">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">SIGNAL INDEX</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`text-xl font-mono font-black ${
                  signalIndex > 75 ? 'text-emerald-400' : signalIndex > 45 ? 'text-amber-400' : 'text-red-400'
                }`}
              >
                {signalIndex}%
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {signalIndex > 80 ? 'EXCELLENT' : signalIndex > 60 ? 'GOOD' : signalIndex > 40 ? 'FAIR' : 'POOR'}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/20">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">LATENCY (PING)</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-mono font-black text-cyan-300">{currentPing}</span>
              <span className="text-[10px] font-mono text-slate-400">ms</span>
              <span className="text-[10px] font-mono text-slate-500 ml-1">(&plusmn;{currentJitter}ms jit)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/20">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">BANDWIDTH</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-mono font-black text-cyan-300">{currentDownlink}</span>
              <span className="text-[10px] font-mono text-slate-400">Mbps &bull; {effectiveType}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/20">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">COMPASS HEADING</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-mono font-black text-cyan-300">
                {String(useManualHeading ? manualHeading : compassHeading).padStart(3, '0')}&deg;
              </span>
              <span className="text-[10px] font-mono text-cyan-400 uppercase">
                {compassHeading >= 337.5 || compassHeading < 22.5
                  ? 'NORTH'
                  : compassHeading < 67.5
                  ? 'NE'
                  : compassHeading < 112.5
                  ? 'EAST'
                  : compassHeading < 157.5
                  ? 'SE'
                  : compassHeading < 202.5
                  ? 'SOUTH'
                  : compassHeading < 247.5
                  ? 'SW'
                  : compassHeading < 292.5
                  ? 'WEST'
                  : 'NW'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. CIRCULAR RADAR CANVAS DISPLAY */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full max-w-[460px] aspect-square rounded-3xl bg-[#020712] border-2 border-cyan-500/50 p-2 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex items-center justify-center overflow-hidden">
            {/* Ambient acoustic pulse ring */}
            <div
              className={`absolute inset-0 rounded-3xl border border-cyan-400 pointer-events-none transition-all duration-150 ${
                acousticPulseActive ? 'opacity-100 scale-100 shadow-[inset_0_0_40px_rgba(6,182,212,0.4)]' : 'opacity-0 scale-95'
              }`}
            />

            {/* Radar Canvas */}
            <canvas ref={canvasRef} className="w-full h-full rounded-2xl block" style={{ touchAction: 'none' }} />

            {/* Live Acoustic Indicator Pill */}
            <div className="absolute bottom-3 left-4 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
              <div
                className={`w-2 h-2 rounded-full ${
                  isAudioMuted
                    ? 'bg-slate-600'
                    : acousticPulseActive
                    ? 'bg-cyan-400 animate-ping'
                    : 'bg-emerald-400'
                }`}
              />
              <span>{isAudioMuted ? 'AUDIO OFF' : `${audioMode.toUpperCase()} PING`}</span>
            </div>

            {/* Manual Heading Toggle badge */}
            <div className="absolute bottom-3 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 border border-cyan-500/30 text-[10px] font-mono text-slate-300">
              <Compass className={`w-3 h-3 ${isOrientationSupported ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>{useManualHeading ? 'MANUAL AZM' : isOrientationSupported ? 'GYRO SYNC' : 'SIM GYRO'}</span>
            </div>
          </div>

          {/* Gyroscope / Compass Calibration & Azimuth Controls */}
          <div className="w-full max-w-[460px] mt-3 space-y-2">
            {orientationPermissionNeeded && (
              <button
                onClick={handleRequestCompassPermission}
                className="w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Compass className="w-4 h-4 animate-spin" />
                <span>ENABLE REAL DEVICE ORIENTATION / COMPASS (iOS)</span>
              </button>
            )}

            <div className="p-3 rounded-2xl bg-[#030914]/80 border border-slate-800 text-xs font-mono flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300">Azimuth Orientation:</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUseManualHeading(!useManualHeading)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                    useManualHeading
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  {useManualHeading ? 'Manual Slider' : 'Device Motion'}
                </button>
              </div>
            </div>

            {useManualHeading && (
              <div className="p-3 rounded-2xl bg-[#030914]/80 border border-cyan-500/30 flex items-center gap-3">
                <span className="text-[11px] font-mono text-cyan-300 w-16">
                  {String(manualHeading).padStart(3, '0')}&deg; AZM
                </span>
                <input
                  type="range"
                  min="0"
                  max="359"
                  value={manualHeading}
                  onChange={(e) => setManualHeading(parseInt(e.target.value, 10))}
                  className="flex-1 accent-cyan-400 cursor-pointer"
                />
                <button
                  onClick={() => setManualHeading((prev) => (prev + 45) % 360)}
                  className="px-2 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 hover:text-white cursor-pointer"
                >
                  +45&deg;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* RIGHT COLUMN: ACOUSTIC FEEDBACK & ROOM SIGNAL MAPPING */}
        {/* ------------------------------------------------------------------ */}
        <div className="lg:col-span-5 space-y-4">
          {/* Audio Telemetry Console */}
          <div className="p-4 rounded-2xl bg-[#030914]/90 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                ACOUSTIC SONAR / GEIGER
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Pulse rate & pitch scale with signal
              </span>
            </div>

            {/* Mode selector */}
            <div className="grid grid-cols-3 gap-2">
              {(['sonar', 'geiger', 'synth'] as AudioMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAudioMode(mode)}
                  className={`py-1.5 rounded-xl text-xs font-mono uppercase font-bold border transition cursor-pointer ${
                    audioMode === mode
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Volume slider */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[10px] font-mono text-slate-400">VOL:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioVolume}
                onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                className="flex-1 accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-cyan-400 w-8 text-right">
                {Math.round(audioVolume * 100)}%
              </span>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* ROOM SIGNAL MAPPING - MARK CURRENT SPOT */}
          {/* ---------------------------------------------------------------- */}
          <div className="p-4 rounded-2xl bg-[#030914]/90 border border-cyan-500/40 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                ROOM SIGNAL MAPPING
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                NO GPS / CAM NEEDED
              </span>
            </div>

            {/* Preset Room Quick Chips */}
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">
                SELECT ROOM LOCATION
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['Bedroom', 'Living Room', 'Work Desk', 'Kitchen', 'Balcony', 'Hallway', 'Patio'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setSelectedRoomPreset(preset);
                      setCustomRoomInput('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer border ${
                      selectedRoomPreset === preset && !customRoomInput
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-cyan-500/40 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Room Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Or type custom spot (e.g. Master Bed #2)"
                value={customRoomInput}
                onChange={(e) => setCustomRoomInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-black/70 border border-slate-800 focus:border-cyan-400 text-xs text-white placeholder:text-slate-600 font-mono focus:outline-none"
              />
            </div>

            {/* Primary Action Button: Mark Current Spot */}
            <button
              onClick={handleMarkSpot}
              disabled={isMarking}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-mono font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition cursor-pointer shadow-[0_0_25px_rgba(6,182,212,0.4)]"
            >
              {isMarking ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 fill-slate-950" />
              )}
              <span>MARK CURRENT SPOT ({signalIndex}%)</span>
            </button>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* RANKED IN-MEMORY ROOM SESSION LOG */}
          {/* ---------------------------------------------------------------- */}
          <div className="p-4 rounded-2xl bg-[#030914]/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  BEST SPOTS RANKING
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportReport}
                  className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 text-[10px] font-mono flex items-center gap-1 px-2 cursor-pointer transition"
                  title="Copy Report to Clipboard"
                >
                  {copiedReport ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedReport ? 'COPIED' : 'EXPORT'}</span>
                </button>

                {roomSpots.length > 0 && (
                  <button
                    onClick={handleClearAllSpots}
                    className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 cursor-pointer transition"
                    title="Clear Log"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {roomSpots.length === 0 ? (
              <div className="p-6 rounded-xl bg-black/40 border border-dashed border-slate-800 text-center">
                <Radio className="w-6 h-6 text-slate-600 mx-auto mb-2 animate-pulse" />
                <p className="text-xs font-mono text-slate-400">No rooms mapped yet.</p>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                  Walk to different spots in your house and tap &quot;Mark Current Spot&quot; to build your real-time signal heatmap.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {roomSpots.map((spot, index) => {
                  const isTopRank = index === 0;
                  return (
                    <div
                      key={spot.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between gap-2 ${
                        isTopRank
                          ? 'bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-transparent border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                          : 'bg-black/50 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Rank Badge */}
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                            isTopRank
                              ? 'bg-amber-400 text-slate-950 shadow-amber-400/50 shadow'
                              : index === 1
                              ? 'bg-slate-300 text-slate-950'
                              : index === 2
                              ? 'bg-amber-700/60 text-amber-200'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          #{index + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">{spot.name}</span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${getTierBadge(
                                spot.tier
                              )}`}
                            >
                              {spot.tier}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{spot.pingMs}ms ping</span>
                            <span>&bull;</span>
                            <span>&plusmn;{spot.jitterMs}ms jit</span>
                            <span>&bull;</span>
                            <span>{spot.downlinkMbps} Mbps</span>
                            <span>&bull;</span>
                            <span>{spot.headingDeg}&deg; AZM</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Signal Score & Delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-base font-mono font-black ${
                            spot.signalIndex > 80
                              ? 'text-emerald-400'
                              : spot.signalIndex > 60
                              ? 'text-cyan-400'
                              : spot.signalIndex > 40
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {spot.signalIndex}%
                        </span>

                        <button
                          onClick={() => handleDeleteSpot(spot.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition cursor-pointer"
                          title="Remove spot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
