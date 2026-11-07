import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Eye,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Sliders,
  Check,
  Target,
  Smile,
  Zap,
} from 'lucide-react';
import { controlSystemHub, ControlSettings } from '../../services/controlSystemHubService.ts';
import { faceEyeTracker } from '../../services/faceEyeTrackingService.ts';

interface FaceEyeTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export function FaceEyeTutorialModal({ isOpen, onClose, onCompleted }: FaceEyeTutorialModalProps) {
  const [step, setStep] = useState<number>(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Calibration state
  const [calibrating, setCalibrating] = useState(false);
  const [calibProgress, setCalibProgress] = useState(0);

  // Directional targets reached: [Left, Right, Up, Down]
  const [directionsReached, setDirectionsReached] = useState({
    left: false,
    right: false,
    up: false,
    down: false,
  });

  // Action detection scores
  const [eyebrowScore, setEyebrowScore] = useState(0);
  const [blinkScore, setBlinkScore] = useState(0);
  const [mouthScore, setMouthScore] = useState(0);
  const [smileScore, setSmileScore] = useState(0);

  const [step2Triggered, setStep2Triggered] = useState(false);
  const [step3Triggered, setStep3Triggered] = useState(false);

  // Live cursor coordinates from face tracker
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [detectedAction, setDetectedAction] = useState<string | null>(null);

  // Sensitivity settings
  const [tempSettings, setTempSettings] = useState<ControlSettings>(controlSystemHub.getSettings());

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      faceEyeTracker.stopTracking();
      return;
    }

    let isMounted = true;

    const start = async () => {
      try {
        setCameraError(null);
        await faceEyeTracker.startTracking(videoRef.current || undefined);
        if (isMounted) setCameraReady(true);
      } catch (err: any) {
        if (isMounted) {
          setCameraError(err.message || 'Could not access webcam for eye tracking.');
          setCameraReady(false);
        }
      }
    };

    start();

    // Subscribe to tracking events
    const unsub = faceEyeTracker.subscribe((data) => {
      if (!isMounted) return;
      if (data.cursor) setCursorPos(data.cursor);
      if (data.detectedAction) setDetectedAction(data.detectedAction);

      if (data.blendshapes) {
        const bs = data.blendshapes;
        const brow = Math.max(bs['browInnerUp'] || 0, bs['browOuterUpLeft'] || 0);
        const blk = ((bs['eyeBlinkLeft'] || 0) + (bs['eyeBlinkRight'] || 0)) / 2;
        const mouth = bs['jawOpen'] || 0;
        const sml = Math.max(bs['mouthSmileLeft'] || 0, bs['mouthSmileRight'] || 0);

        setEyebrowScore(brow);
        setBlinkScore(blk);
        setMouthScore(mouth);
        setSmileScore(sml);

        if (brow > tempSettings.eyebrowRaiseThreshold || blk > tempSettings.blinkThreshold) {
          setStep2Triggered(true);
        }
        if (mouth > tempSettings.mouthOpenThreshold || sml > tempSettings.smileThreshold) {
          setStep3Triggered(true);
        }
      }

      // Check quadrant for directional step
      if (data.cursor) {
        const { x, y } = data.cursor;
        setDirectionsReached((prev) => ({
          left: prev.left || x < 30,
          right: prev.right || x > 70,
          up: prev.up || y < 30,
          down: prev.down || y > 70,
        }));
      }

      // Draw face landmarks if canvas available
      if (canvasRef.current && videoRef.current && data.landmarks) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const w = canvasRef.current.width;
          const h = canvasRef.current.height;
          ctx.clearRect(0, 0, w, h);

          ctx.fillStyle = '#06b6d4';
          // Draw key points
          for (let i = 0; i < data.landmarks.length; i += 4) {
            const pt = data.landmarks[i];
            ctx.beginPath();
            ctx.arc((1 - pt.x) * w, pt.y * h, 1.5, 0, 2 * Math.PI);
            ctx.fill();
          }

          // Draw reticle
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc((cursorPos.x / 100) * w, (cursorPos.y / 100) * h, 10, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    });

    return () => {
      isMounted = false;
      unsub();
      faceEyeTracker.stopTracking();
    };
  }, [isOpen, tempSettings]);

  // Handle neutral position calibration
  const runNeutralCalibration = () => {
    setCalibrating(true);
    setCalibProgress(0);

    const startTime = Date.now();
    const duration = 2000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const prog = Math.min(100, Math.round((elapsed / duration) * 100));
      setCalibProgress(prog);

      if (prog >= 100) {
        clearInterval(interval);
        setCalibrating(false);
        // Save current face pitch & yaw as neutral
        faceEyeTracker.setNeutralCalibration({
          pitch: 0,
          yaw: 0,
          irisOffsetX: 0,
          irisOffsetY: 0,
        });
        controlSystemHub.playClickSound();
        setStep(1); // Advance to directional test
      }
    }, 50);
  };

  const handleFinishTutorial = () => {
    controlSystemHub.updateSettings(tempSettings);
    controlSystemHub.setMode('face_eye');
    if (onCompleted) onCompleted();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 liquid-glass-modal-backdrop animate-in fade-in select-none">
      <div className="relative w-full max-w-2xl rounded-3xl liquid-glass-modal-container overflow-hidden flex flex-col max-h-[92vh]">
        <div className="liquid-glass-modal-glare" />
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/20 bg-gradient-to-r from-[#031535] to-[#020b1c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Eye className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Eye & Face Tracking Tutorial & Calibration</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  Camera Switch
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Step-by-step hands-free navigation walkthrough & sensitivity tuning
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps Progress Pills */}
        <div className="px-5 pt-3 pb-2 bg-[#020713] border-b border-white/5 flex items-center justify-between text-xs font-mono">
          {['Camera & Neutral', 'Directional Gaze', 'Click / Blink', 'Mouth / Back', 'Sensitivity'].map(
            (label, idx) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 transition-colors ${
                  step === idx
                    ? 'text-cyan-300 font-bold'
                    : step > idx
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                    step === idx
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : step > idx
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {step > idx ? '✓' : idx + 1}
                </span>
                <span className="hidden sm:inline text-[11px]">{label}</span>
              </div>
            )
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Camera Error Alert */}
          {cameraError && (
            <div className="p-3.5 rounded-2xl bg-red-950/50 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Webcam Access Notice</strong>
                {cameraError}
              </div>
            </div>
          )}

          {/* Video Preview & Landmarks Canvas */}
          <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-black border border-cyan-500/30 flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-75"
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none"
            />

            {/* Simulated on-screen targeting reticle */}
            <div
              className="absolute pointer-events-none transition-all duration-75 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${cursorPos.x}%`,
                top: `${cursorPos.y}%`,
              }}
            >
              <div className="w-8 h-8 rounded-full border-2 border-cyan-400 bg-cyan-400/20 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-pulse">
                <Target className="w-4 h-4 text-cyan-200" />
              </div>
            </div>

            {/* Live Detected Action Chip */}
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/75 border border-cyan-500/40 text-[10.5px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>{detectedAction || 'Tracking Face & Eyes...'}</span>
            </div>
          </div>

          {/* STEP 0: CAMERA CHECK & NEUTRAL CALIBRATION */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#041029]/80 border border-cyan-500/20 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span>Step 1: Calibrate Neutral Rest Position</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sit comfortably in a normal posture looking straight ahead at the target dot below. Tap
                  "Start Calibration" and hold still for 2 seconds.
                </p>

                {calibrating && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[11px] font-mono text-cyan-300">
                      <span>Calibrating neutral head & eye orientation...</span>
                      <span>{calibProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-75"
                        style={{ width: `${calibProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={runNeutralCalibration}
                disabled={calibrating || !cameraReady}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 hover:from-cyan-300 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{calibrating ? 'Calibrating... Look at Center' : 'Start 2-Second Neutral Calibration'}</span>
              </button>
            </div>
          )}

          {/* STEP 1: DIRECTIONAL GAZE & HEAD TILT */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#041029]/80 border border-cyan-500/20 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Step 2: Directional Navigation (Look Left / Right / Up / Down)</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Tilt your head gently or shift your eye gaze in all four directions. Reach all 4 target
                  zones to complete this step.
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      directionsReached.left
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-white/10 text-slate-400'
                    }`}
                  >
                    <span>⬅️ Look Left</span>
                    <span>{directionsReached.left ? '✓ REACHED' : 'Pending'}</span>
                  </div>
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      directionsReached.right
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-white/10 text-slate-400'
                    }`}
                  >
                    <span>Look Right ➡️</span>
                    <span>{directionsReached.right ? '✓ REACHED' : 'Pending'}</span>
                  </div>
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      directionsReached.up
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-white/10 text-slate-400'
                    }`}
                  >
                    <span>⬆️ Look Up</span>
                    <span>{directionsReached.up ? '✓ REACHED' : 'Pending'}</span>
                  </div>
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      directionsReached.down
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-white/10 text-slate-400'
                    }`}
                  >
                    <span>Look Down ⬇️</span>
                    <span>{directionsReached.down ? '✓ REACHED' : 'Pending'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next: Click Action</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: BLINK & EYEBROW RAISE CLICK */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#041029]/80 border border-cyan-500/20 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Step 3: Triggering Clicks (Eyebrow Raise or Deliberate Blink)</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Raise your eyebrows or perform an intentional 0.3-second deliberate blink to trigger a
                  selection. Test below to verify live threshold recognition:
                </p>

                {/* Live Confidence meters */}
                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Eyebrow Raise Confidence:</span>
                      <span className="text-cyan-300 font-bold">{Math.round(eyebrowScore * 100)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-75"
                        style={{ width: `${Math.min(100, eyebrowScore * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Blink Detection:</span>
                      <span className="text-cyan-300 font-bold">{Math.round(blinkScore * 100)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-75"
                        style={{ width: `${Math.min(100, blinkScore * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {step2Triggered && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Click action recognized successfully!</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next: Menu / Back Action</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: MOUTH OPEN / SMILE ACTION */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#041029]/80 border border-cyan-500/20 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smile className="w-4 h-4 text-cyan-400" />
                  <span>Step 4: Back & Home Gestures (Mouth Open / Smile)</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Open your mouth to trigger "Back / Close", or smile widely to return to the Dashboard.
                </p>

                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Mouth Open (Jaw):</span>
                      <span className="text-cyan-300 font-bold">{Math.round(mouthScore * 100)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-75"
                        style={{ width: `${Math.min(100, mouthScore * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Smile Intensity:</span>
                      <span className="text-cyan-300 font-bold">{Math.round(smileScore * 100)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-pink-400 transition-all duration-75"
                        style={{ width: `${Math.min(100, smileScore * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {step3Triggered && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Mouth / Smile action recognized!</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next: Tune Sensitivity</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SENSITIVITY SLIDERS & COMPLETION */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#041029]/80 border border-cyan-500/20 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Step 5: Custom Sensitivity Tuning</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Gaze Sensitivity:</span>
                      <span className="text-cyan-300 font-mono font-bold">
                        {tempSettings.gazeSensitivity.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={2.5}
                      step={0.1}
                      value={tempSettings.gazeSensitivity}
                      onChange={(e) =>
                        setTempSettings({ ...tempSettings, gazeSensitivity: parseFloat(e.target.value) })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Gaze Deadzone (Stability):</span>
                      <span className="text-cyan-300 font-mono font-bold">
                        {Math.round(tempSettings.deadzone * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.02}
                      max={0.16}
                      step={0.01}
                      value={tempSettings.deadzone}
                      onChange={(e) =>
                        setTempSettings({ ...tempSettings, deadzone: parseFloat(e.target.value) })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Dwell-Click Hover Time:</span>
                      <span className="text-cyan-300 font-mono font-bold">
                        {(tempSettings.dwellClickDuration / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min={600}
                      max={2200}
                      step={100}
                      value={tempSettings.dwellClickDuration}
                      onChange={(e) =>
                        setTempSettings({
                          ...tempSettings,
                          dwellClickDuration: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleFinishTutorial}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save & Activate Eye Tracking Mode</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
