// ========================================================================
// FACE & EYE TRACKING SERVICE (MediaPipe Face Mesh + Accessibility Switch)
// 100% On-device client-side video processing (Zero upload / complete privacy)
// ========================================================================

import { controlSystemHub } from './controlSystemHubService.ts';

// 1D Kalman Filter for smooth gaze cursor movement
class Kalman1D {
  private x: number = 50;
  private p: number = 1;
  private q: number = 0.008;
  private r: number = 0.05;
  private init: boolean = false;

  update(val: number): number {
    if (!this.init) {
      this.x = val;
      this.init = true;
      return this.x;
    }
    this.p = this.p + this.q;
    const k = this.p / (this.p + this.r);
    this.x = this.x + k * (val - this.x);
    this.p = (1 - k) * this.p;
    return this.x;
  }

  reset(startVal = 50) {
    this.x = startVal;
    this.p = 1;
    this.init = false;
  }
}

export interface NeutralFaceCalibration {
  pitch: number;
  yaw: number;
  irisOffsetX: number;
  irisOffsetY: number;
}

export type FaceEyeCallback = (data: {
  landmarks?: any[];
  blendshapes?: Record<string, number>;
  headRotation?: { pitch: number; yaw: number; roll: number };
  detectedAction?: string | null;
  cursor: { x: number; y: number };
}) => void;

class FaceEyeTrackingService {
  private videoEl: HTMLVideoElement | null = null;
  private mediaStream: MediaStream | null = null;
  private landmarker: any = null;
  private isRunning: boolean = false;
  private animFrameId: number | null = null;

  private kalmanX = new Kalman1D();
  private kalmanY = new Kalman1D();

  // Calibration anchors
  private neutral: NeutralFaceCalibration = {
    pitch: 0,
    yaw: 0,
    irisOffsetX: 0,
    irisOffsetY: 0,
  };

  // Trigger state tracking
  private blinkHoldStart: number = 0;
  private isBlinking: boolean = false;
  private eyebrowTriggered: boolean = false;
  private mouthTriggered: boolean = false;
  private smileTriggered: boolean = false;

  private listeners: Set<FaceEyeCallback> = new Set();

  public subscribe(cb: FaceEyeCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notifyListeners(data: any) {
    this.listeners.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error('Error in FaceEye listener:', err);
      }
    });
  }

  public setNeutralCalibration(calibration: NeutralFaceCalibration) {
    this.neutral = { ...calibration };
  }

  public getNeutralCalibration(): NeutralFaceCalibration {
    return { ...this.neutral };
  }

  /**
   * Initializes webcam video stream
   */
  public async initCamera(videoElement?: HTMLVideoElement): Promise<MediaStream> {
    if (this.mediaStream) {
      return this.mediaStream;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      });

      this.mediaStream = stream;

      if (videoElement) {
        this.videoEl = videoElement;
        this.videoEl.srcObject = stream;
        await this.videoEl.play();
      } else if (!this.videoEl) {
        const v = document.createElement('video');
        v.autoplay = true;
        v.playsInline = true;
        v.muted = true;
        v.style.display = 'none';
        document.body.appendChild(v);
        v.srcObject = stream;
        await v.play();
        this.videoEl = v;
      }

      controlSystemHub.updateTracking({ isCameraActive: true });
      return stream;
    } catch (err: any) {
      controlSystemHub.updateTracking({ isCameraActive: false, isTracking: false });
      controlSystemHub.setMode('normal');
      throw new Error(`Webcam access error: ${err.message || 'Permission denied'}`);
    }
  }

  /**
   * Loads MediaPipe FaceLandmarker
   */
  public async loadModel(): Promise<any> {
    if (this.landmarker) return this.landmarker;

    try {
      let vision: any = null;
      try {
        vision = await import('@mediapipe/tasks-vision');
      } catch {
        const dynamicImport = new Function('url', 'return import(url)');
        vision = await dynamicImport('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/+esm');
      }

      if (!vision) throw new Error('MediaPipe Vision library could not be loaded');

      const wasmFileset = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.landmarker = await vision.FaceLandmarker.createFromOptions(wasmFileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
      });

      return this.landmarker;
    } catch (err: any) {
      console.warn('FaceLandmarker load attempt 1 (GPU) failed, trying CPU delegate:', err);
      try {
        let vision: any = null;
        try {
          vision = await import('@mediapipe/tasks-vision');
        } catch {
          const dynamicImport = new Function('url', 'return import(url)');
          vision = await dynamicImport('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/+esm');
        }

        const wasmFileset = await vision.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        this.landmarker = await vision.FaceLandmarker.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true,
        });

        return this.landmarker;
      } catch (cpuErr: any) {
        console.error('FaceLandmarker failed to load:', cpuErr);
        throw cpuErr;
      }
    }
  }

  /**
   * Starts the continuous detection loop
   */
  public async startTracking(videoElement?: HTMLVideoElement) {
    if (this.isRunning) return;

    await this.initCamera(videoElement);
    await this.loadModel();

    this.isRunning = true;
    this.kalmanX.reset(50);
    this.kalmanY.reset(50);

    let lastVideoTime = -1;
    let frameCount = 0;
    let fpsTime = performance.now();

    const loop = () => {
      if (!this.isRunning) return;

      if (this.videoEl && this.videoEl.readyState >= 2 && this.landmarker) {
        const currentTime = this.videoEl.currentTime;

        if (currentTime !== lastVideoTime) {
          lastVideoTime = currentTime;
          const startTimeMs = performance.now();

          try {
            const results = this.landmarker.detectForVideo(this.videoEl, startTimeMs);
            this.processFaceResults(results);

            frameCount++;
            if (performance.now() - fpsTime >= 1000) {
              controlSystemHub.updateTracking({ fps: frameCount });
              frameCount = 0;
              fpsTime = performance.now();
            }
          } catch (detErr) {
            console.warn('Frame detection notice:', detErr);
          }
        }
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public stopTracking() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.videoEl && this.videoEl.parentElement === document.body) {
      this.videoEl.remove();
      this.videoEl = null;
    }

    controlSystemHub.updateTracking({
      isCameraActive: false,
      isTracking: false,
      dwellProgress: 0,
      currentActionName: null,
    });
  }

  /**
   * Process landmarks and blendshapes to compute gaze cursor & action triggers
   */
  private processFaceResults(results: any) {
    const landmarks = results.faceLandmarks?.[0];
    const blendshapesArray = results.faceBlendshapes?.[0]?.categories || [];

    if (!landmarks || landmarks.length === 0) {
      controlSystemHub.updateTracking({ isTracking: false, currentActionName: null });
      this.notifyListeners({ cursor: { x: 50, y: 50 } });
      return;
    }

    controlSystemHub.updateTracking({ isTracking: true });

    // Map blendshapes into key-value map
    const blendshapes: Record<string, number> = {};
    for (const b of blendshapesArray) {
      blendshapes[b.categoryName] = b.score;
    }

    const settings = controlSystemHub.getSettings();

    // 1. Compute Head Yaw & Pitch from key facial geometry
    // Nose tip = 1, Chin = 152, Left cheek = 234, Right cheek = 454, Forehead = 10
    const nose = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const chin = landmarks[152];
    const forehead = landmarks[10];

    // Horizontal head yaw (ratio of nose offset from midpoint between cheeks)
    const midX = (leftCheek.x + rightCheek.x) / 2;
    const faceWidth = Math.abs(rightCheek.x - leftCheek.x) || 0.3;
    const rawYaw = (nose.x - midX) / faceWidth; // Negative = looking right (mirror), positive = left

    // Vertical head pitch
    const midY = (forehead.y + chin.y) / 2;
    const faceHeight = Math.abs(chin.y - forehead.y) || 0.4;
    const rawPitch = (nose.y - midY) / faceHeight;

    // Relative offset from neutral calibration
    const deltaYaw = (rawYaw - this.neutral.yaw) * -1; // Invert for natural cursor mirror
    const deltaPitch = rawPitch - this.neutral.pitch;

    // Gaze deadzone filtering
    let targetX = 50;
    let targetY = 50;

    if (Math.abs(deltaYaw) > settings.deadzone) {
      const sign = Math.sign(deltaYaw);
      const mag = (Math.abs(deltaYaw) - settings.deadzone) * settings.gazeSensitivity * 160;
      targetX = 50 + sign * mag;
    }

    if (Math.abs(deltaPitch) > settings.deadzone) {
      const sign = Math.sign(deltaPitch);
      const mag = (Math.abs(deltaPitch) - settings.deadzone) * settings.gazeSensitivity * 160;
      targetY = 50 + sign * mag;
    }

    // Clamp 0 - 100%
    targetX = Math.max(2, Math.min(98, targetX));
    targetY = Math.max(2, Math.min(98, targetY));

    // Smooth with Kalman
    const smoothX = this.kalmanX.update(targetX);
    const smoothY = this.kalmanY.update(targetY);

    controlSystemHub.updateTracking({
      cursorX: smoothX,
      cursorY: smoothY,
    });

    // 2. Expression & Accessibility Triggers
    let detectedAction: string | null = null;

    // A. Eyebrow Raise (Click / Select)
    const browUp = Math.max(
      blendshapes['browInnerUp'] || 0,
      blendshapes['browOuterUpLeft'] || 0,
      blendshapes['browOuterUpRight'] || 0
    );

    if (browUp > settings.eyebrowRaiseThreshold) {
      detectedAction = 'Eyebrows Raised (Select)';
      if (!this.eyebrowTriggered) {
        this.eyebrowTriggered = true;
        controlSystemHub.executeClickAt(smoothX, smoothY);
      }
    } else {
      this.eyebrowTriggered = false;
    }

    // B. Intentional Blink (Both eyes closed > threshold)
    const blinkLeft = blendshapes['eyeBlinkLeft'] || 0;
    const blinkRight = blendshapes['eyeBlinkRight'] || 0;
    const avgBlink = (blinkLeft + blinkRight) / 2;

    if (avgBlink > settings.blinkThreshold && !this.eyebrowTriggered) {
      if (!this.isBlinking) {
        this.isBlinking = true;
        this.blinkHoldStart = performance.now();
      } else {
        const holdDuration = performance.now() - this.blinkHoldStart;
        if (holdDuration >= 280 && holdDuration <= 900) {
          detectedAction = 'Deliberate Blink (Click)';
          controlSystemHub.executeClickAt(smoothX, smoothY);
          this.blinkHoldStart = performance.now() + 1000; // debounce
        }
      }
    } else {
      this.isBlinking = false;
    }

    // C. Mouth Open (Back / Menu action)
    const jawOpen = blendshapes['jawOpen'] || 0;
    if (jawOpen > settings.mouthOpenThreshold) {
      detectedAction = 'Mouth Open (Menu / Back)';
      if (!this.mouthTriggered) {
        this.mouthTriggered = true;
        controlSystemHub.playClickSound();
        // Dispatch synthetic escape / back or menu event
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }
    } else {
      this.mouthTriggered = false;
    }

    // D. Smile (Action / Home action)
    const smile = Math.max(blendshapes['mouthSmileLeft'] || 0, blendshapes['mouthSmileRight'] || 0);
    if (smile > settings.smileThreshold) {
      detectedAction = 'Smiling (Action)';
      if (!this.smileTriggered) {
        this.smileTriggered = true;
        controlSystemHub.playClickSound();
        window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'dashboard' } }));
      }
    } else {
      this.smileTriggered = false;
    }

    // Directional orientation text if no trigger
    if (!detectedAction) {
      if (deltaYaw > 0.12) detectedAction = 'Looking Left';
      else if (deltaYaw < -0.12) detectedAction = 'Looking Right';
      else if (deltaPitch > 0.12) detectedAction = 'Looking Down';
      else if (deltaPitch < -0.12) detectedAction = 'Looking Up';
    }

    controlSystemHub.setActionName(detectedAction);

    this.notifyListeners({
      landmarks,
      blendshapes,
      headRotation: { pitch: rawPitch, yaw: rawYaw, roll: 0 },
      detectedAction,
      cursor: { x: smoothX, y: smoothY },
    });
  }
}

export const faceEyeTracker = new FaceEyeTrackingService();
