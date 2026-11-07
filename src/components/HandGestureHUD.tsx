import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Hand,
  X,
  Minimize2,
  Maximize2,
  Eye,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Keyboard,
  Sliders,
  HelpCircle,
  ChevronRight,
  Power,
  Sparkles,
  Target,
  Sun,
  Moon,
  Lightbulb,
} from 'lucide-react';
import {
  gestureEventService,
  RecognizedGestureName,
  AirKeyAction,
} from '../services/gestureEventService.ts';
import { customGestureService } from '../services/customGestureService.ts';

// Standard 21 hand landmarks connections in MediaPipe
const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm Base
  [5, 9], [9, 13], [13, 17],
];

/**
 * 1D Kalman Filter with dynamic process noise adaptivity.
 * Eliminates high-frequency webcam sensor micro-jitter when hovering over small UI targets
 * while maintaining low latency responsiveness during swift hand movements.
 */
class KalmanFilter1D {
  private x: number = 0; // State estimate
  private p: number = 1; // Estimation error covariance
  private q: number = 0.005; // Process noise covariance (lower = more smoothing)
  private r: number = 0.08; // Measurement noise covariance (sensor noise)
  private k: number = 0; // Kalman gain
  private initialized: boolean = false;

  constructor(processNoise = 0.005, measurementNoise = 0.08) {
    this.q = processNoise;
    this.r = measurementNoise;
  }

  reset() {
    this.initialized = false;
    this.x = 0;
    this.p = 1;
  }

  update(measurement: number): number {
    if (!this.initialized) {
      this.x = measurement;
      this.initialized = true;
      return this.x;
    }

    // Prediction update
    this.p = this.p + this.q;

    // Measurement update
    this.k = this.p / (this.p + this.r);
    this.x = this.x + this.k * (measurement - this.x);
    this.p = (1 - this.k) * this.p;

    return this.x;
  }
}

/**
 * 2D Kalman Filter specifically tuned for index fingertip screen coordinates.
 */
class KalmanFilter2D {
  private kx: KalmanFilter1D;
  private ky: KalmanFilter1D;

  constructor(processNoise = 0.008, measurementNoise = 0.09) {
    this.kx = new KalmanFilter1D(processNoise, measurementNoise);
    this.ky = new KalmanFilter1D(processNoise, measurementNoise);
  }

  reset() {
    this.kx.reset();
    this.ky.reset();
  }

  update(x: number, y: number): { x: number; y: number } {
    return {
      x: this.kx.update(x),
      y: this.ky.update(y),
    };
  }
}

// Holographic Air Keyboard Keys Definition
export interface AirKeyDef {
  id: string;
  label: string;
  row: number;
  widthRatio: number;
  action: AirKeyAction;
}

const KEYBOARD_ROWS: AirKeyDef[][] = [
  // Row 1
  [
    { id: 'Q', label: 'Q', row: 0, widthRatio: 1, action: { type: 'char', char: 'Q' } },
    { id: 'W', label: 'W', row: 0, widthRatio: 1, action: { type: 'char', char: 'W' } },
    { id: 'E', label: 'E', row: 0, widthRatio: 1, action: { type: 'char', char: 'E' } },
    { id: 'R', label: 'R', row: 0, widthRatio: 1, action: { type: 'char', char: 'R' } },
    { id: 'T', label: 'T', row: 0, widthRatio: 1, action: { type: 'char', char: 'T' } },
    { id: 'Y', label: 'Y', row: 0, widthRatio: 1, action: { type: 'char', char: 'Y' } },
    { id: 'U', label: 'U', row: 0, widthRatio: 1, action: { type: 'char', char: 'U' } },
    { id: 'I', label: 'I', row: 0, widthRatio: 1, action: { type: 'char', char: 'I' } },
    { id: 'O', label: 'O', row: 0, widthRatio: 1, action: { type: 'char', char: 'O' } },
    { id: 'P', label: 'P', row: 0, widthRatio: 1, action: { type: 'char', char: 'P' } },
  ],
  // Row 2
  [
    { id: 'A', label: 'A', row: 1, widthRatio: 1, action: { type: 'char', char: 'A' } },
    { id: 'S', label: 'S', row: 1, widthRatio: 1, action: { type: 'char', char: 'S' } },
    { id: 'D', label: 'D', row: 1, widthRatio: 1, action: { type: 'char', char: 'D' } },
    { id: 'F', label: 'F', row: 1, widthRatio: 1, action: { type: 'char', char: 'F' } },
    { id: 'G', label: 'G', row: 1, widthRatio: 1, action: { type: 'char', char: 'G' } },
    { id: 'H', label: 'H', row: 1, widthRatio: 1, action: { type: 'char', char: 'H' } },
    { id: 'J', label: 'J', row: 1, widthRatio: 1, action: { type: 'char', char: 'J' } },
    { id: 'K', label: 'K', row: 1, widthRatio: 1, action: { type: 'char', char: 'K' } },
    { id: 'L', label: 'L', row: 1, widthRatio: 1, action: { type: 'char', char: 'L' } },
  ],
  // Row 3
  [
    { id: 'Z', label: 'Z', row: 2, widthRatio: 1, action: { type: 'char', char: 'Z' } },
    { id: 'X', label: 'X', row: 2, widthRatio: 1, action: { type: 'char', char: 'X' } },
    { id: 'C', label: 'C', row: 2, widthRatio: 1, action: { type: 'char', char: 'C' } },
    { id: 'V', label: 'V', row: 2, widthRatio: 1, action: { type: 'char', char: 'V' } },
    { id: 'B', label: 'B', row: 2, widthRatio: 1, action: { type: 'char', char: 'B' } },
    { id: 'N', label: 'N', row: 2, widthRatio: 1, action: { type: 'char', char: 'N' } },
    { id: 'M', label: 'M', row: 2, widthRatio: 1, action: { type: 'char', char: 'M' } },
    { id: 'BACKSPACE', label: '⌫ DEL', row: 2, widthRatio: 1.7, action: { type: 'backspace' } },
  ],
  // Row 4
  [
    { id: 'SPACE', label: '␣ SPACE', row: 3, widthRatio: 4.5, action: { type: 'space' } },
    { id: 'SEND', label: '➤ SEND', row: 3, widthRatio: 2.8, action: { type: 'send' } },
  ],
];

interface ComputedKeyBounds {
  keyDef: AirKeyDef;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HandGestureHUDProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerAction?: (actionName: string, gesture: string) => void;
  onSwipeTab?: (direction: 'left' | 'right') => void;
}

export type GestureOSStatus =
  | 'Initializing Camera...'
  | 'Loading MediaPipe Model...'
  | 'Model Ready - Show Hand'
  | 'Hand Locked'
  | 'Camera Blocked - Using Touch Mode';

export type ActiveGestureState =
  | 'IDLE'
  | 'HOVER'
  | 'PINCH CLICK'
  | 'OPEN PALM'
  | 'FIST'
  | 'SWIPE LEFT'
  | 'SWIPE RIGHT'
  | (string & {});

export function HandGestureHUD({ isOpen, onClose, onTriggerAction, onSwipeTab }: HandGestureHUDProps) {
  // Master ON/OFF toggle for Gesture OS
  const [isGestureOSEnabled, setIsGestureOSEnabled] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isAirKeyboardEnabled, setIsAirKeyboardEnabled] = useState<boolean>(true);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Gesture OS Status Badge & Active Gesture Display
  const [osStatus, setOsStatus] = useState<GestureOSStatus>('Initializing Camera...');
  const [activeGesture, setActiveGesture] = useState<ActiveGestureState>('IDLE');
  const [confidence, setConfidence] = useState<number>(0);

  // Confidence Threshold for Gesture Recognition (adjusts sensitivity based on lighting conditions)
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('gkedit_gesture_confidence_threshold');
      return saved ? parseFloat(saved) : 0.55;
    } catch {
      return 0.55;
    }
  });
  const confidenceThresholdRef = useRef<number>(confidenceThreshold);

  // Keep ref in sync
  useEffect(() => {
    confidenceThresholdRef.current = confidenceThreshold;
  }, [confidenceThreshold]);

  // Screen Virtual Cursor (Mapped to window viewport with lerp smoothing)
  const [virtualCursor, setVirtualCursor] = useState<{ x: number; y: number; visible: boolean; isPinching: boolean }>({
    x: -100,
    y: -100,
    visible: false,
    isPinching: false,
  });
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  // Calibration state
  const [showCalibration, setShowCalibration] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gkedit_hand_calibrated') !== 'true';
    } catch {
      return true;
    }
  });
  const [calibrationStep, setCalibrationStep] = useState<number>(1);
  const [calibrationStatus, setCalibrationStatus] = useState<{
    inZone: boolean;
    distanceOk: boolean;
    openPalmOk: boolean;
    pinchOk: boolean;
    handDetected: boolean;
    score: number;
  }>({
    inZone: false,
    distanceOk: false,
    openPalmOk: false,
    pinchOk: false,
    handDetected: false,
    score: 0,
  });

  // 3-Second Pose Estimation Baseline Calibration
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [countdownNumber, setCountdownNumber] = useState<number>(3);
  const [calibrationSuccessToast, setCalibrationSuccessToast] = useState<string | null>(null);
  const handBaselineRef = useRef<{ span: number; neutralX: number; neutralY: number; pinchOffset: number } | null>(null);
  const lastRawLandmarksRef = useRef<any[] | null>(null);

  // Air typing states
  const [hoveredKeyId, setHoveredKeyId] = useState<string | null>(null);
  const [hoverProgress, setHoverProgress] = useState<number>(0);
  const [pressedKeyFlash, setPressedKeyFlash] = useState<string | null>(null);
  const [typedBuffer, setTypedBuffer] = useState<string>('');
  const [lastActionToast, setLastActionToast] = useState<{ label: string; icon: string } | null>(null);
  const lastKeyTriggerTimeRef = useRef<number>(0);

  // Audio synthesizer
  const audioCtxRef = useRef<AudioContext | null>(null);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<any>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isRunningRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Kalman Filter instances for screen cursor and HUD reticle (removes high-frequency jitter)
  const kalmanScreenRef = useRef<KalmanFilter2D>(new KalmanFilter2D(0.008, 0.085));
  const kalmanHudRef = useRef<KalmanFilter2D>(new KalmanFilter2D(0.008, 0.085));

  // Lerp smoothing coordinates for screen cursor
  const targetCursorRef = useRef<{ x: number; y: number }>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const currentCursorRef = useRef<{ x: number; y: number }>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  // Air Swipe tracking (Horizontal wrist velocity)
  const lastWristPosRef = useRef<{ x: number; time: number } | null>(null);
  const lastSwipeTimeRef = useRef<number>(0);
  const lastCustomTriggerRef = useRef<number>(0);

  // Pinch-click cooldown
  const lastClickTimeRef = useRef<number>(0);
  const keyBoundsRef = useRef<ComputedKeyBounds[]>([]);
  const hoverStartTimeRef = useRef<number | null>(null);
  const activeHoverKeyRef = useRef<string | null>(null);
  // Handler to adjust gesture recognition confidence threshold based on lighting
  const handleThresholdChange = useCallback((newVal: number) => {
    const clamped = Math.max(0.2, Math.min(0.9, newVal));
    setConfidenceThreshold(clamped);
    confidenceThresholdRef.current = clamped;
    try {
      localStorage.setItem('gkedit_gesture_confidence_threshold', clamped.toFixed(2));
    } catch {}

    // Dynamically update MediaPipe HandLandmarker options if running
    if (landmarkerRef.current?.setOptions) {
      try {
        landmarkerRef.current.setOptions({
          minHandDetectionConfidence: clamped,
          minHandPresenceConfidence: clamped,
          minTrackingConfidence: Math.max(0.3, clamped - 0.1),
        });
      } catch (err) {
        console.warn('Could not update MediaPipe options dynamically:', err);
      }
    }
  }, []);

  // Synthesize pleasant sound
  const playAirKeySound = useCallback((isSpecial = false) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (isSpecial) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now);
        osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.04);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
    } catch {
      // Audio safe fallback
    }
  }, []);

  // 3-Second Pose Estimation Baseline Calibration Runner
  const startHandCalibration = useCallback(() => {
    if (isCalibrating) return;
    setIsCalibrating(true);
    setCountdownNumber(3);
    setCalibrationSuccessToast(null);
    playAirKeySound(true);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNumber(count);
        playAirKeySound(false);
      } else {
        clearInterval(interval);
        setIsCalibrating(false);
        setCountdownNumber(0);

        // 1. Reset Kalman filters to eliminate accumulated covariance drift
        kalmanScreenRef.current.reset();
        kalmanHudRef.current.reset();

        // 2. Reset dynamic velocity and cursor tracking
        lastWristPosRef.current = null;
        lastSwipeTimeRef.current = 0;
        currentCursorRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        // 3. Sample current pose landmarks for personalized scale baseline
        if (lastRawLandmarksRef.current && lastRawLandmarksRef.current.length >= 21) {
          const lm = lastRawLandmarksRef.current;
          const wrist = lm[0];
          const middleTip = lm[12];
          const span = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y);
          const thumbTip = lm[4];
          const indexTip = lm[8];
          const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

          handBaselineRef.current = {
            span: span > 0.05 ? span : 0.35,
            neutralX: (1 - lm[9].x) * window.innerWidth,
            neutralY: lm[9].y * window.innerHeight,
            pinchOffset: pinchDist,
          };
        } else {
          handBaselineRef.current = {
            span: 0.35,
            neutralX: window.innerWidth / 2,
            neutralY: window.innerHeight / 2,
            pinchOffset: 0.045,
          };
        }

        try {
          localStorage.setItem('gkedit_hand_calibrated', 'true');
        } catch {}

        playAirKeySound(true);
        setOsStatus('Hand Locked');
        setCalibrationSuccessToast('Baseline Calibrated: Pose estimation accuracy optimized!');
        setTimeout(() => {
          setCalibrationSuccessToast(null);
        }, 3200);
      }
    }, 1000);
  }, [isCalibrating, playAirKeySound]);

  // Compute Holographic Keyboard Geometry
  const computeKeyboardLayout = (width: number, height: number): ComputedKeyBounds[] => {
    const bounds: ComputedKeyBounds[] = [];
    const kbY = height * 0.44;
    const kbHeight = height * 0.54;
    const kbX = width * 0.03;
    const kbWidth = width * 0.94;
    const rowCount = KEYBOARD_ROWS.length;
    const rowHeight = (kbHeight - (rowCount - 1) * 6) / rowCount;

    KEYBOARD_ROWS.forEach((row, rowIdx) => {
      const y = kbY + rowIdx * (rowHeight + 6);
      const totalUnits = row.reduce((sum, k) => sum + k.widthRatio, 0);
      const gap = 5;
      const totalGaps = (row.length - 1) * gap;
      const unitWidth = (kbWidth - totalGaps) / totalUnits;

      let currentX = kbX;
      row.forEach((keyDef) => {
        const w = keyDef.widthRatio * unitWidth;
        bounds.push({
          keyDef,
          x: currentX,
          y,
          width: w,
          height: rowHeight,
        });
        currentX += w + gap;
      });
    });

    return bounds;
  };

  // Trigger Air Key Press
  const triggerAirKeyPress = useCallback(
    (keyBound: ComputedKeyBounds, reason: 'hover' | 'pinch') => {
      const now = Date.now();
      if (now - lastKeyTriggerTimeRef.current < 350) return;
      lastKeyTriggerTimeRef.current = now;

      const def = keyBound.keyDef;
      setPressedKeyFlash(def.id);
      playAirKeySound(def.id === 'SEND' || def.id === 'BACKSPACE');

      const action = def.action;
      if (action.type === 'char') {
        const char = action.char;
        setTypedBuffer((prev) => (prev.length > 25 ? prev.slice(-24) + char : prev + char));
      } else if (action.type === 'space') {
        setTypedBuffer((prev) => (prev.length > 25 ? prev.slice(-24) + ' ' : prev + ' '));
      } else if (action.type === 'backspace') {
        setTypedBuffer((prev) => prev.slice(0, -1));
      } else if (action.type === 'send') {
        setTypedBuffer('');
      }

      gestureEventService.dispatchAirKey(def.action);
      gestureEventService.recordTapMethod(reason);

      hoverStartTimeRef.current = null;
      activeHoverKeyRef.current = null;
      setHoverProgress(0);

      setTimeout(() => {
        setPressedKeyFlash((prev) => (prev === def.id ? null : prev));
      }, 300);
    },
    [playAirKeySound]
  );

  // Trigger Real DOM Click using document.elementFromPoint
  const triggerRealDomClick = useCallback((clientX: number, clientY: number) => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 400) return;
    lastClickTimeRef.current = now;

    // Show visual click ripple on virtual cursor
    setClickRipple({ x: clientX, y: clientY, id: now });
    playAirKeySound(false);

    try {
      const elem = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      if (elem) {
        // If element is a button, anchor, or has click handler
        const clickable = elem.closest('button, a, input, textarea, select, [role="button"], [tabindex]') as HTMLElement | null;
        if (clickable) {
          clickable.click();
          clickable.focus();
        } else {
          elem.click();
        }
      }
    } catch (e) {
      console.warn('DOM click trigger notice:', e);
    }

    setTimeout(() => {
      setClickRipple((prev) => (prev?.id === now ? null : prev));
    }, 450);
  }, [playAirKeySound]);

  // Load MediaPipe HandLandmarker with GPU fallback to CPU
  const loadMediaPipe = async () => {
    try {
      setIsLoadingModel(true);
      setOsStatus('Loading MediaPipe Model...');
      setErrorMsg(null);

      let vision: any = null;
      try {
        vision = await import('@mediapipe/tasks-vision');
      } catch (bundlerErr) {
        console.warn('Local tasks-vision import failed, trying CDN ESM...', bundlerErr);
      }

      if (!vision || !vision.FilesetResolver) {
        try {
          const dynamicImport = new Function('url', 'return import(url)');
          vision = await dynamicImport(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/+esm'
          );
        } catch (cdnErr) {
          console.warn('CDN dynamic import failed, checking window globals...', cdnErr);
          if ((window as any).FilesetResolver) {
            vision = window;
          }
        }
      }

      if (!vision || !vision.FilesetResolver) {
        throw new Error('MediaPipe Tasks Vision library failed to load.');
      }

      const filesetResolver = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const modelAssetPath =
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

      // Try GPU first, with graceful fallback to CPU
      let handLandmarker: any;
      try {
        handLandmarker = await vision.HandLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: confidenceThresholdRef.current,
          minHandPresenceConfidence: confidenceThresholdRef.current,
          minTrackingConfidence: Math.max(0.3, confidenceThresholdRef.current - 0.1),
        });
      } catch (gpuErr) {
        console.warn('GPU delegate unavailable, falling back to CPU delegate...', gpuErr);
        handLandmarker = await vision.HandLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: confidenceThresholdRef.current,
          minHandPresenceConfidence: confidenceThresholdRef.current,
          minTrackingConfidence: Math.max(0.3, confidenceThresholdRef.current - 0.1),
        });
      }

      landmarkerRef.current = handLandmarker;
      setIsLoadingModel(false);
      setOsStatus('Model Ready - Show Hand');
      return handLandmarker;
    } catch (err: any) {
      console.error('Failed to load MediaPipe HandLandmarker:', err);
      setErrorMsg('Failed to load vision model. Running in Touch Mode.');
      setIsLoadingModel(false);
      setOsStatus('Camera Blocked - Using Touch Mode');
      return null;
    }
  };

  // Start Front Camera Stream
  const startCamera = async () => {
    try {
      setErrorMsg(null);
      setOsStatus('Initializing Camera...');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API not supported in this browser.');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: 640,
            height: 480,
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve();
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => resolve()).catch(() => resolve());
          };
          setTimeout(() => {
            videoRef.current?.play().then(() => resolve()).catch(() => resolve());
          }, 400);
        });
        setIsCameraActive(true);
        setOsStatus('Model Ready - Show Hand');
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      setErrorMsg(isDenied ? 'Webcam permission denied.' : err.message || 'Camera error.');
      setIsCameraActive(false);
      setOsStatus('Camera Blocked - Using Touch Mode');
    }
  };

  // Stop Camera & Clean Resources
  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    isRunningRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
    setActiveGesture('IDLE');
    setConfidence(0);
    setVirtualCursor((prev) => ({ ...prev, visible: false }));
  };

  // Real-time Detection Loop wrapped safely in try/catch
  const runDetectionLoop = () => {
    if (!videoRef.current || !canvasRef.current || !landmarkerRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTimestamp = -1;

    const detectFrame = () => {
      if (!isRunningRef.current || !isGestureOSEnabled) return;

      try {
        // Robust execution requirement: video.readyState >= 2 and video.videoWidth > 0
        if (video.readyState >= 2 && video.videoWidth > 0) {
          const nowMs = performance.now();
          if (nowMs > lastTimestamp) {
            lastTimestamp = nowMs;

            // Keep canvas dimensions synced
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              keyBoundsRef.current = computeKeyboardLayout(canvas.width, canvas.height);
            }

            const results = landmarkerRef.current.detectForVideo(video, nowMs);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let detectedIndexTipHUD: { x: number; y: number } | null = null;
            let isPinching = false;
            let handDetected = false;

            // Process Hand Landmarks
            if (results.landmarks && results.landmarks.length > 0) {
              handDetected = true;
              lastRawLandmarksRef.current = results.landmarks[0];
              setOsStatus('Hand Locked');
              setConfidence(0.92);

              for (const landmarks of results.landmarks) {
                const wrist = landmarks[0];
                const thumbTip = landmarks[4];
                const indexTip = landmarks[8];
                const middleTip = landmarks[12];
                const ringTip = landmarks[16];
                const pinkyTip = landmarks[20];

                // 1. Raw screen target coordinates (mirrored X): (1 - landmark.x) * window.innerWidth
                const rawScreenX = (1 - indexTip.x) * window.innerWidth;
                const rawScreenY = indexTip.y * window.innerHeight;

                // 2. Kalman Filter Smoothing to eradicate high-frequency measurement noise/jitter
                const filteredScreen = kalmanScreenRef.current.update(rawScreenX, rawScreenY);

                // 3. Adaptive Lerp smoothing: low alpha when stationary for rock-solid stability, higher alpha when moving
                const screenDist = Math.hypot(filteredScreen.x - currentCursorRef.current.x, filteredScreen.y - currentCursorRef.current.y);
                const lerpAlpha = Math.min(0.45, Math.max(0.18, screenDist / 120));
                currentCursorRef.current.x += (filteredScreen.x - currentCursorRef.current.x) * lerpAlpha;
                currentCursorRef.current.y += (filteredScreen.y - currentCursorRef.current.y) * lerpAlpha;

                // HUD canvas mirrored coordinates with dedicated Kalman filtering
                const rawHudX = (1 - indexTip.x) * canvas.width;
                const rawHudY = indexTip.y * canvas.height;
                const filteredHud = kalmanHudRef.current.update(rawHudX, rawHudY);
                detectedIndexTipHUD = { x: filteredHud.x, y: filteredHud.y };

                let isOpenPalm = false;
                let isFist = false;

                if (isCalibrating) {
                  setActiveGesture(`CALIBRATING (${countdownNumber}s)`);
                } else {
                  // 1. PINCH TO CLICK: Euclidean distance between Thumb Tip (4) and Index Tip (8)
                  const pinchDistNorm = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
                  if (pinchDistNorm < 0.05) {
                    isPinching = true;
                    setActiveGesture('PINCH CLICK');
                    gestureEventService.dispatchGesture('Pinch', 0.95);
                    triggerRealDomClick(currentCursorRef.current.x, currentCursorRef.current.y);
                  }

                  // 2. OPEN PALM vs FIST DETECTION
                  // Radial distance from wrist (0) to finger tips vs knuckles (MCP / PIP)
                  const wristDist = (pt: { x: number; y: number }) => Math.hypot(pt.x - wrist.x, pt.y - wrist.y);
                  const isThumbOpen = wristDist(thumbTip) > wristDist(landmarks[2]) * 1.15;
                  const isIndexOpen = wristDist(indexTip) > wristDist(landmarks[6]) * 1.18;
                  const isMiddleOpen = wristDist(middleTip) > wristDist(landmarks[10]) * 1.18;
                  const isRingOpen = wristDist(ringTip) > wristDist(landmarks[14]) * 1.18;
                  const isPinkyOpen = wristDist(pinkyTip) > wristDist(landmarks[18]) * 1.18;

                  isOpenPalm = isThumbOpen && isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen;
                  isFist = !isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen;

                  // Evaluate against custom user gestures from CustomGestureService
                  const vector = customGestureService.extractFingerVector(landmarks);
                  let customMatched = false;
                  if (vector) {
                    const customList = customGestureService.getAllGestures().filter((g) => g.isCustom);
                    for (const cg of customList) {
                      const match = customGestureService.evaluateMatch(vector, cg);
                      if (match.matched) {
                        setActiveGesture(cg.name.toUpperCase());
                        customMatched = true;
                        const nowTime = Date.now();
                        if (nowTime - lastCustomTriggerRef.current > 1800) {
                          lastCustomTriggerRef.current = nowTime;
                          customGestureService.executeAction(cg);
                          setLastActionToast({ label: cg.name, icon: cg.emoji });
                          setTimeout(() => setLastActionToast(null), 2500);
                        }
                        break;
                      }
                    }
                  }

                  if (!customMatched) {
                    if (isPinching) {
                      setActiveGesture('PINCH CLICK');
                    } else if (isOpenPalm) {
                      setActiveGesture('OPEN PALM');
                      gestureEventService.dispatchGesture('Open_Palm', 0.9);
                    } else if (isFist) {
                      setActiveGesture('FIST');
                      gestureEventService.dispatchGesture('Closed_Fist', 0.9);
                    } else {
                      setActiveGesture('HOVER');
                    }
                  }
                }

              // 3. AIR SWIPE: Track rapid horizontal wrist/palm velocity
              const now = Date.now();
              const mirroredWristX = (1 - wrist.x) * window.innerWidth;
              if (lastWristPosRef.current) {
                const dt = now - lastWristPosRef.current.time;
                if (dt > 40 && dt < 280) {
                  const dx = mirroredWristX - lastWristPosRef.current.x;
                  const velocity = dx / dt; // px per ms

                  // If velocity exceeds threshold (0.9 px/ms) and cooldown satisfied
                  if (Math.abs(velocity) > 0.9 && now - lastSwipeTimeRef.current > 750) {
                    lastSwipeTimeRef.current = now;
                    if (velocity < -0.9) {
                      setActiveGesture('SWIPE LEFT');
                      onSwipeTab?.('left');
                      gestureEventService.dispatchGesture('Open_Palm', 0.9);
                    } else if (velocity > 0.9) {
                      setActiveGesture('SWIPE RIGHT');
                      onSwipeTab?.('right');
                      gestureEventService.dispatchGesture('Pointing_Up', 0.9);
                    }
                  }
                }
              }
              lastWristPosRef.current = { x: mirroredWristX, time: now };

              // Update Virtual Cursor State
              setVirtualCursor({
                x: currentCursorRef.current.x,
                y: currentCursorRef.current.y,
                visible: true,
                isPinching,
              });

              // Calibration helper check
              if (showCalibration) {
                const middleMcp = landmarks[9];
                const handCenterX = ((1 - wrist.x) + (1 - middleMcp.x)) / 2;
                const handCenterY = (wrist.y + middleMcp.y) / 2;
                const inZone = handCenterX >= 0.22 && handCenterX <= 0.78 && handCenterY >= 0.18 && handCenterY <= 0.82;
                const handSpan = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y);
                const distanceOk = handSpan >= 0.20 && handSpan <= 0.60;

                setCalibrationStatus({
                  inZone,
                  distanceOk,
                  openPalmOk: isOpenPalm,
                  pinchOk: isPinching,
                  handDetected: true,
                  score: (inZone ? 30 : 0) + (distanceOk ? 30 : 0) + (isOpenPalm ? 20 : 0) + (isPinching ? 20 : 0),
                });
              }

              // Draw Mirrored Skeleton on HUD Canvas
              ctx.save();
              ctx.lineWidth = 3;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';

              for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
                const s = landmarks[startIdx];
                const e = landmarks[endIdx];
                if (!s || !e) continue;

                const x1 = (1 - s.x) * canvas.width;
                const y1 = s.y * canvas.height;
                const x2 = (1 - e.x) * canvas.width;
                const y2 = e.y * canvas.height;

                const grad = ctx.createLinearGradient(x1, y1, x2, y2);
                grad.addColorStop(0, 'rgba(6, 182, 212, 0.75)');
                grad.addColorStop(1, 'rgba(59, 130, 246, 0.9)');
                ctx.strokeStyle = grad;
                ctx.shadowColor = '#06b6d4';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
              }

              // Draw joints
              for (let i = 0; i < landmarks.length; i++) {
                const pt = landmarks[i];
                const px = (1 - pt.x) * canvas.width;
                const py = pt.y * canvas.height;
                ctx.beginPath();
                const isFingertip = [4, 8, 12, 16, 20].includes(i);
                ctx.arc(px, py, isFingertip ? 4.5 : 2.5, 0, 2 * Math.PI);
                ctx.fillStyle = i === 8 ? '#22d3ee' : isFingertip ? '#38bdf8' : '#ffffff';
                ctx.shadowColor = '#06b6d4';
                ctx.shadowBlur = 8;
                ctx.fill();
              }
              ctx.restore();
            }
          } else {
            kalmanScreenRef.current.reset();
            kalmanHudRef.current.reset();
            setOsStatus('Model Ready - Show Hand');
            setActiveGesture('IDLE');
            setVirtualCursor((prev) => ({ ...prev, visible: false }));
          }

          // -------------------------------------------------------------
          // Render Holographic Air Keyboard if Enabled
          // -------------------------------------------------------------
          if (isAirKeyboardEnabled && keyBoundsRef.current.length > 0) {
            const kbTop = keyBoundsRef.current[0].y - 8;
            const lastKey = keyBoundsRef.current[keyBoundsRef.current.length - 1];
            const kbBottom = lastKey.y + lastKey.height + 8;

            ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(canvas.width * 0.02, kbTop, canvas.width * 0.96, kbBottom - kbTop, 14);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('⚡ AIR KEYBOARD (PINCH OR HOVER)', canvas.width * 0.05, kbTop - 5);

            keyBoundsRef.current.forEach((k) => {
              const isHovered = activeHoverKeyRef.current === k.keyDef.id;
              const isFlashing = pressedKeyFlash === k.keyDef.id;

              if (isFlashing) {
                ctx.fillStyle = 'rgba(34, 211, 238, 0.95)';
                ctx.shadowColor = '#06b6d4';
                ctx.shadowBlur = 18;
              } else if (isHovered) {
                ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
                ctx.shadowColor = '#22d3ee';
                ctx.shadowBlur = 10;
              } else if (k.keyDef.id === 'SEND') {
                ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
                ctx.shadowColor = '#10b981';
                ctx.shadowBlur = 4;
              } else if (k.keyDef.id === 'BACKSPACE') {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 4;
              } else {
                ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
              }

              ctx.beginPath();
              ctx.roundRect(k.x, k.y, k.width, k.height, 6);
              ctx.fill();

              ctx.lineWidth = isHovered || isFlashing ? 2 : 1;
              ctx.strokeStyle = isFlashing
                ? '#ffffff'
                : isHovered
                ? '#38bdf8'
                : k.keyDef.id === 'SEND'
                ? '#34d399'
                : 'rgba(6, 182, 212, 0.35)';
              ctx.stroke();

              // Hover progress
              if (isHovered && hoverProgress > 0 && !isFlashing) {
                ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.roundRect(
                  k.x + 2,
                  k.y + k.height - 3,
                  (k.width - 4) * Math.min(1, hoverProgress),
                  2.5,
                  1
                );
                ctx.stroke();
              }

              ctx.fillStyle = isFlashing ? '#020617' : isHovered ? '#ffffff' : '#e0f2fe';
              ctx.font = k.keyDef.widthRatio > 1.5 ? 'bold 11px monospace' : 'bold 12px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.shadowColor = 'transparent';
              ctx.fillText(k.keyDef.label, k.x + k.width / 2, k.y + k.height / 2);
            });
          }

          // Keyboard Collision with index tip
          if (detectedIndexTipHUD && isAirKeyboardEnabled && keyBoundsRef.current.length > 0) {
            const { x: curX, y: curY } = detectedIndexTipHUD;
            const matchedKey = keyBoundsRef.current.find(
              (k) => curX >= k.x && curX <= k.x + k.width && curY >= k.y && curY <= k.y + k.height
            );

            if (matchedKey) {
              const keyId = matchedKey.keyDef.id;
              if (isPinching) {
                triggerAirKeyPress(matchedKey, 'pinch');
              } else {
                if (activeHoverKeyRef.current === keyId) {
                  const elapsed = performance.now() - (hoverStartTimeRef.current || performance.now());
                  const progress = Math.min(1, elapsed / 800);
                  setHoverProgress(progress);
                  if (elapsed >= 800) {
                    triggerAirKeyPress(matchedKey, 'hover');
                  }
                } else {
                  activeHoverKeyRef.current = keyId;
                  hoverStartTimeRef.current = performance.now();
                  setHoveredKeyId(keyId);
                  setHoverProgress(0);
                }
              }
            } else {
              activeHoverKeyRef.current = null;
              hoverStartTimeRef.current = null;
              setHoveredKeyId(null);
              setHoverProgress(0);
            }
            }
          }
        }
      } catch (err) {
        console.warn('Frame processing safely caught:', err);
      }

      animFrameIdRef.current = requestAnimationFrame(detectFrame);
    };

    isRunningRef.current = true;
    animFrameIdRef.current = requestAnimationFrame(detectFrame);
  };

  // Lifecycle
  useEffect(() => {
    if (!isOpen || !isGestureOSEnabled) {
      stopCamera();
      return;
    }

    let isMounted = true;
    const init = async () => {
      let landmarker = landmarkerRef.current;
      if (!landmarker) {
        landmarker = await loadMediaPipe();
      }
      if (!isMounted) return;
      if (landmarker) {
        await startCamera();
        if (isMounted) {
          runDetectionLoop();
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, isGestureOSEnabled]);

  if (!isOpen) return null;

  return (
    <>
      {/* 1. HIGH-VISIBILITY SCREEN VIRTUAL CURSOR (Z-INDEX 9999, POINTER-EVENTS NONE) */}
      {virtualCursor.visible && isGestureOSEnabled && (
        <div
          style={{
            position: 'fixed',
            left: `${virtualCursor.x}px`,
            top: `${virtualCursor.y}px`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
          className="transition-transform duration-75 select-none"
        >
          {/* Glowing Target Ring */}
          <div
            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
              virtualCursor.isPinching
                ? 'border-yellow-300 bg-yellow-400/30 scale-125 shadow-[0_0_25px_#facc15]'
                : 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_20px_#06b6d4]'
            }`}
          >
            {/* Center Core */}
            <div
              className={`w-2 h-2 rounded-full ${
                virtualCursor.isPinching ? 'bg-yellow-200 shadow-[0_0_10px_#facc15]' : 'bg-white shadow-[0_0_8px_#38bdf8]'
              }`}
            />
          </div>

          {/* Pinch-to-click label */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-950/90 border border-cyan-400/40 text-[9px] font-mono text-cyan-200">
            {virtualCursor.isPinching ? '⚡ CLICK' : activeGesture}
          </div>
        </div>
      )}

      {/* Click Ripple Effect */}
      {clickRipple && (
        <div
          style={{
            position: 'fixed',
            left: `${clickRipple.x}px`,
            top: `${clickRipple.y}px`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 9998,
          }}
          className="w-12 h-12 rounded-full border-2 border-yellow-400 animate-cursor-ripple"
        />
      )}

      {/* 2. FLOATING GESTURE OS HUD & CORNER WEBCAM PREVIEW */}
      <aside
        aria-label="Floating Gesture OS HUD"
        className={`fixed z-50 transition-all duration-300 ${
          isMinimized
            ? 'bottom-20 sm:bottom-24 right-4 w-72'
            : 'bottom-20 sm:bottom-24 right-2 sm:right-6 w-[310px] sm:w-[380px]'
        } rounded-3xl bg-[#03091e]/95 border border-cyan-500/40 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.9)] overflow-hidden select-none animate-in fade-in slide-in-from-bottom-6`}
      >
        {/* HUD Top Bar with ON/OFF Master Toggle & Live Diagnostics */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-blue-950/90 via-slate-900/90 to-[#020713]/90 border-b border-cyan-500/25">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGestureOSEnabled(!isGestureOSEnabled)}
              className={`p-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-bold transition ${
                isGestureOSEnabled
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}
              title={isGestureOSEnabled ? 'Turn Gesture OS OFF' : 'Turn Gesture OS ON'}
            >
              <Power className={`w-3.5 h-3.5 ${isGestureOSEnabled ? 'text-cyan-400 animate-pulse' : 'text-red-400'}`} />
              <span>{isGestureOSEnabled ? 'OS ON' : 'OS OFF'}</span>
            </button>

            {/* Calibrate Hand Button */}
            <button
              onClick={startHandCalibration}
              disabled={isCalibrating || !isGestureOSEnabled}
              className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-bold transition cursor-pointer ${
                isCalibrating
                  ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-400/40 text-cyan-300 hover:text-white'
              }`}
              title="Calibrate hand baseline (triggers a 3-second countdown to reset pose estimation baseline)"
            >
              <Target className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin text-amber-300' : 'text-cyan-400'}`} />
              <span>{isCalibrating ? `Calibrating ${countdownNumber}s...` : 'Calibrate Hand'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            {/* Calibration Button */}
            <button
              onClick={() => {
                setIsMinimized(false);
                setShowCalibration(true);
              }}
              className="p-1 rounded-lg text-xs font-mono font-semibold hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300 transition"
              title="Hand Calibration Guide"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Toggle Air Keyboard */}
            <button
              onClick={() => setIsAirKeyboardEnabled(!isAirKeyboardEnabled)}
              className={`p-1 rounded-lg text-xs font-mono font-semibold transition ${
                isAirKeyboardEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                  : 'hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300'
              }`}
              title={isAirKeyboardEnabled ? 'Hide Holographic Keyboard' : 'Show Holographic Keyboard'}
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>

            {/* Minimize */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-300 transition"
              title={isMinimized ? 'Expand HUD' : 'Minimize HUD'}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-rose-500/20 hover:text-rose-300 transition"
              title="Close Gesture Recognition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Diagnostics Badge */}
        <div className="px-3.5 py-1.5 bg-[#020617] border-b border-cyan-500/15 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={`w-2 h-2 rounded-full ${
                osStatus === 'Hand Locked'
                  ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]'
                  : osStatus === 'Camera Blocked - Using Touch Mode'
                  ? 'bg-rose-400'
                  : 'bg-cyan-400 animate-ping'
              }`}
            />
            <span
              className={`truncate font-semibold ${
                osStatus === 'Hand Locked'
                  ? 'text-emerald-300'
                  : osStatus === 'Camera Blocked - Using Touch Mode'
                  ? 'text-rose-300'
                  : 'text-cyan-300'
              }`}
            >
              {osStatus}
            </span>
          </div>

          <div className="flex items-center gap-1 font-bold text-cyan-200">
            <span className="text-[9px] text-slate-400 uppercase">Gesture:</span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              {activeGesture}
            </span>
          </div>
        </div>

        {/* Main Video & Mirrored Skeleton Viewport */}
        {!isMinimized && (
          <div className="relative w-full aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
            {/* Mirrored Webcam Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100 opacity-75"
            />

            {/* Skeleton & Holographic Air-Keyboard Overlay Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            {/* Corner Reticles */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400/80 pointer-events-none" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400/80 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400/80 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400/80 pointer-events-none" />

            {/* Live Typed Buffer Ribbon */}
            {typedBuffer && (
              <div className="absolute top-2 inset-x-8 py-0.5 px-2 rounded-lg bg-blue-950/80 border border-cyan-400/40 text-center font-mono text-xs text-cyan-200 truncate backdrop-blur-md shadow-md animate-in fade-in">
                <span className="text-slate-400 text-[10px] mr-1">Typed:</span>
                <span className="font-bold">{typedBuffer}</span>
                <span className="animate-pulse ml-0.5 text-cyan-400">|</span>
              </div>
            )}

            {/* Loading / Error States */}
            {isLoadingModel && (
              <div className="absolute inset-0 bg-[#03091e]/90 flex flex-col items-center justify-center gap-2 p-4 text-center">
                <Zap className="w-7 h-7 text-cyan-400 animate-spin" />
                <p className="text-xs font-semibold text-cyan-200">Loading MediaPipe HandLandmarker...</p>
                <p className="text-[10px] text-slate-400">GPU with CPU fallback enabled</p>
              </div>
            )}

            {errorMsg && (
              <div className="absolute inset-0 bg-[#03091e]/95 flex flex-col items-center justify-center gap-2 p-4 text-center">
                <AlertTriangle className="w-7 h-7 text-rose-400 animate-bounce" />
                <p className="text-xs font-bold text-rose-300">{errorMsg}</p>
                <button
                  onClick={() => {
                    setErrorMsg(null);
                    startCamera().then(runDetectionLoop);
                  }}
                  className="mt-1 px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-semibold hover:bg-cyan-500/30 transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" /> Retry Camera
                </button>
              </div>
            )}

            {/* Calibration Tutorial Screen */}
            {showCalibration && (
              <div className="absolute inset-0 bg-[#03091e]/92 backdrop-blur-md p-3.5 flex flex-col justify-between z-20 animate-in fade-in zoom-in-95 duration-200">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-xs font-bold">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>HAND CALIBRATION</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 font-mono">
                      Step {calibrationStep}/3
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-2">
                    {calibrationStep === 1 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🖐️</span>
                          <div>
                            <h4 className="text-xs font-bold text-white">Position Hand in Front of Camera</h4>
                            <p className="text-[10px] text-slate-300">Hold palm 30-50 cm away in center frame.</p>
                          </div>
                        </div>
                        <div className="relative h-14 w-full rounded-xl border border-dashed border-cyan-400/50 bg-blue-950/40 flex items-center justify-center">
                          <div
                            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[11px] font-mono transition ${
                              calibrationStatus.inZone && calibrationStatus.distanceOk
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                : 'text-cyan-300'
                            }`}
                          >
                            {calibrationStatus.inZone && calibrationStatus.distanceOk ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Optimal Zone Detected ✓</span>
                              </>
                            ) : (
                              <>
                                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                                <span>Align hand in center box</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {calibrationStep === 2 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">☝️</span>
                          <div>
                            <h4 className="text-xs font-bold text-white">Screen Virtual Cursor</h4>
                            <p className="text-[10px] text-slate-300">Index tip controls smooth glowing pointer.</p>
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-blue-950/40 border border-cyan-500/20 space-y-1 text-[10px] font-mono text-slate-200">
                          <div className="flex items-center justify-between">
                            <span>Hand Locked:</span>
                            <span className={calibrationStatus.handDetected ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                              {calibrationStatus.handDetected ? 'YES ✓' : 'Looking...'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {calibrationStep === 3 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">👌</span>
                          <div>
                            <h4 className="text-xs font-bold text-white">Pinch to Click UI</h4>
                            <p className="text-[10px] text-slate-300">Pinch Thumb & Index to click any button.</p>
                          </div>
                        </div>
                        <div
                          className={`p-2 rounded-xl border text-[11px] font-mono flex items-center justify-center gap-2 transition ${
                            calibrationStatus.pinchOk
                              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50'
                              : 'bg-blue-950/40 text-cyan-300 border-cyan-500/20'
                          }`}
                        >
                          <span>{calibrationStatus.pinchOk ? '⚡ PINCH REGISTERED!' : 'Try pinching Thumb & Index'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        localStorage.setItem('gkedit_hand_calibrated', 'true');
                      } catch {}
                      setShowCalibration(false);
                    }}
                    className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white transition"
                  >
                    Skip
                  </button>

                  <div className="flex items-center gap-1.5">
                    {calibrationStep > 1 && (
                      <button
                        type="button"
                        onClick={() => setCalibrationStep((prev) => prev - 1)}
                        className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition"
                      >
                        Back
                      </button>
                    )}

                    {calibrationStep < 3 ? (
                      <button
                        type="button"
                        onClick={() => setCalibrationStep((prev) => prev + 1)}
                        className="px-3 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-black transition flex items-center gap-1 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            localStorage.setItem('gkedit_hand_calibrated', 'true');
                          } catch {}
                          setShowCalibration(false);
                          setIsAirKeyboardEnabled(true);
                        }}
                        className="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 text-[11px] font-black transition flex items-center gap-1 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Launch Gesture OS</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Air-Typing Telemetry Bar */}
        <div className="p-3 bg-gradient-to-b from-[#03091e] to-[#020512] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">{hoveredKeyId ? '🎯' : '✋'}</span>
              <div>
                <div className="font-extrabold text-white text-xs tracking-wide">
                  {hoveredKeyId ? `Targeting: [ ${hoveredKeyId} ]` : `Gesture Mode: ${activeGesture}`}
                </div>
                <div className="text-[10px] font-semibold text-cyan-300">
                  {hoveredKeyId ? 'Pinch to tap air-key' : 'Air Swipe or Pinch to click anywhere'}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono font-bold text-xs text-emerald-400">
                {Math.round(confidence * 100)}%
              </div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">CONFIDENCE</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
