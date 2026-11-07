import { useState, useRef, useEffect, useCallback } from 'react';
import { triggerGlobalCameraFlash } from '../components/CaptureFlashOverlay.tsx';

export interface PalmDetectionState {
  isPalmDetected: boolean;
  holdProgress: number; // 0.0 to 1.0 (1.0 = 100% / 1.5s held)
  countdownRemainingSec: number; // e.g. 1.5, 1.0, 0.5, 0.0
  palmCenter: { x: number; y: number } | null; // Normalized 0..1 in video space
  handConfidence: number;
}

export interface UsePalmGestureOptions {
  enabled?: boolean;
  facingMode?: 'user' | 'environment';
  holdDurationMs?: number; // Defaults to 1500ms (1.5 seconds)
  onCapture?: (photoDataUrl: string) => void;
}

export function usePalmGesture({
  enabled = true,
  facingMode = 'user',
  holdDurationMs = 1500,
  onCapture,
}: UsePalmGestureOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handLandmarkerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const holdStartTimeRef = useRef<number | null>(null);
  const lastCaptureTimeRef = useRef<number>(0);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(false);

  const [detectionState, setDetectionState] = useState<PalmDetectionState>({
    isPalmDetected: false,
    holdProgress: 0,
    countdownRemainingSec: holdDurationMs / 1000,
    palmCenter: null,
    handConfidence: 0,
  });

  // Stop camera stream tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported on this browser/environment.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => console.warn('Video playback interrupted', err));
          setIsCameraActive(true);
        };
      }
    } catch (err: any) {
      console.error('Camera stream access failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access blocked. Please grant camera permission in your browser.');
      } else {
        setCameraError(`Camera initialisation failed: ${err.message || 'Device in use or unavailable'}`);
      }
    }
  }, [facingMode, stopCamera]);

  // Load MediaPipe HandLandmarker with graceful fallback
  useEffect(() => {
    let isMounted = true;

    async function initModel() {
      if (!enabled) return;
      setModelLoading(true);

      try {
        let vision: any = null;
        try {
          vision = await import('@mediapipe/tasks-vision');
        } catch {
          // Dynamic import fallback
          const dynamicImport = new Function('url', 'return import(url)');
          vision = await dynamicImport('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/+esm');
        }

        if (!vision || !vision.FilesetResolver) {
          throw new Error('Tasks-vision library unavailable');
        }

        const filesetResolver = await vision.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const landmarker = await vision.HandLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.55,
        });

        if (isMounted) {
          handLandmarkerRef.current = landmarker;
          setModelLoading(false);
        }
      } catch (err) {
        console.warn('GPU HandLandmarker failed, trying CPU mode:', err);
        try {
          const dynamicImport = new Function('url', 'return import(url)');
          const vision = await dynamicImport('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/+esm');
          const filesetResolver = await vision.FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );
          const landmarker = await vision.HandLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.55,
          });

          if (isMounted) {
            handLandmarkerRef.current = landmarker;
            setModelLoading(false);
          }
        } catch (cpuErr) {
          console.error('All MediaPipe Hand Landmarker initialisations failed:', cpuErr);
          if (isMounted) setModelLoading(false);
        }
      }
    }

    initModel();

    return () => {
      isMounted = false;
      if (handLandmarkerRef.current?.close) {
        try {
          handLandmarkerRef.current.close();
        } catch {
          // ignore
        }
        handLandmarkerRef.current = null;
      }
    };
  }, [enabled]);

  // Capture frame function
  const triggerCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Trigger haptic vibration (200ms)
    if (navigator.vibrate) {
      try {
        navigator.vibrate(200);
      } catch {
        // ignore
      }
    }

    // Trigger white flash overlay & shutter sound
    triggerGlobalCameraFlash();

    // Render live frame onto offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror image if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    lastCaptureTimeRef.current = Date.now();
    holdStartTimeRef.current = null;

    setDetectionState({
      isPalmDetected: false,
      holdProgress: 0,
      countdownRemainingSec: holdDurationMs / 1000,
      palmCenter: null,
      handConfidence: 0,
    });

    onCapture?.(dataUrl);
  }, [facingMode, holdDurationMs, onCapture]);

  // Hand detection loop
  useEffect(() => {
    if (!enabled || !isCameraActive) return;

    let isRunning = true;

    const detect = () => {
      const video = videoRef.current;
      const landmarker = handLandmarkerRef.current;

      if (
        isRunning &&
        video &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        landmarker
      ) {
        const now = performance.now();
        let results: any = null;
        try {
          results = landmarker.detectForVideo(video, now);
        } catch {
          // Video frame not ready or busy
        }

        const landmarks = results?.landmarks?.[0];
        let isOpenPalm = false;
        let confidence = 0;
        let palmCenterPos: { x: number; y: number } | null = null;

        if (landmarks && landmarks.length >= 21) {
          const wrist = landmarks[0];
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const middleTip = landmarks[12];
          const ringTip = landmarks[16];
          const pinkyTip = landmarks[20];

          // Palm Center: approximated by middle MCP (landmark 9)
          palmCenterPos = { x: landmarks[9].x, y: landmarks[9].y };

          // Radial distance from wrist (0) to finger tips vs knuckles (MCP / PIP)
          const wristDist = (pt: { x: number; y: number }) => Math.hypot(pt.x - wrist.x, pt.y - wrist.y);

          const isThumbOpen = wristDist(thumbTip) > wristDist(landmarks[2]) * 1.15;
          const isIndexOpen = wristDist(indexTip) > wristDist(landmarks[6]) * 1.18;
          const isMiddleOpen = wristDist(middleTip) > wristDist(landmarks[10]) * 1.18;
          const isRingOpen = wristDist(ringTip) > wristDist(landmarks[14]) * 1.18;
          const isPinkyOpen = wristDist(pinkyTip) > wristDist(landmarks[18]) * 1.18;

          // All 5 fingers extended facing camera
          isOpenPalm = isThumbOpen && isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen;
          confidence = results?.handedness?.[0]?.[0]?.score || 0.85;
        }

        const timeSinceLastCapture = Date.now() - lastCaptureTimeRef.current;
        // Don't re-trigger immediately after capturing (cooldown 2.5s)
        if (timeSinceLastCapture < 2500) {
          isOpenPalm = false;
        }

        if (isOpenPalm) {
          if (holdStartTimeRef.current === null) {
            holdStartTimeRef.current = now;
          }

          const elapsed = now - holdStartTimeRef.current;
          const progress = Math.min(1, elapsed / holdDurationMs);
          const remainingSec = Math.max(0, (holdDurationMs - elapsed) / 1000);

          setDetectionState({
            isPalmDetected: true,
            holdProgress: progress,
            countdownRemainingSec: parseFloat(remainingSec.toFixed(1)),
            palmCenter: palmCenterPos,
            handConfidence: confidence,
          });

          // If continuous 1.5-second hold completed (100% progress)
          if (progress >= 1) {
            triggerCapture();
          }
        } else {
          // Reset hold progress when palm is lost
          holdStartTimeRef.current = null;
          setDetectionState((prev) => ({
            isPalmDetected: false,
            holdProgress: 0,
            countdownRemainingSec: holdDurationMs / 1000,
            palmCenter: null,
            handConfidence: 0,
          }));
        }
      }

      if (isRunning) {
        animFrameRef.current = requestAnimationFrame(detect);
      }
    };

    animFrameRef.current = requestAnimationFrame(detect);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [enabled, isCameraActive, holdDurationMs, triggerCapture]);

  // Start/stop camera with dependencies
  useEffect(() => {
    if (enabled) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [enabled, startCamera, stopCamera]);

  return {
    videoRef,
    isCameraActive,
    cameraError,
    modelLoading,
    detectionState,
    startCamera,
    stopCamera,
    triggerCapture,
  };
}
