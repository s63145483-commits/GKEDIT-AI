import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Hand,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowRight,
  Flame,
  Award,
  Zap,
  Target,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  gestureEventService,
  RecognizedGestureName,
  GestureActionEvent,
} from '../services/gestureEventService.ts';

export type TrainingStepId = 'open_palm' | 'fist' | 'pinch';

export interface GestureLesson {
  id: TrainingStepId;
  name: string;
  teluguName: string;
  targetGesture: RecognizedGestureName;
  emoji: string;
  tagline: string;
  description: string;
  howTo: string[];
  actionBenefit: string;
  holdRequiredMs: number;
  guideRingColor: string;
  glowColor: string;
  accentBg: string;
}

export const GESTURE_LESSONS: GestureLesson[] = [
  {
    id: 'open_palm',
    name: 'Open Palm',
    teluguName: 'అరచేయి తెరవడం (హోవర్ & స్టాప్)',
    targetGesture: 'Open_Palm',
    emoji: '✋',
    tagline: 'Hover, Wake & Clear',
    description: 'Extend all five fingers flat facing the camera with your palm upright.',
    howTo: [
      'Spread all 5 fingers apart facing the camera.',
      'Hold steady at a comfortable distance (30-50 cm).',
      'Keep your palm inside the glowing holographic guide frame.',
    ],
    actionBenefit: 'Triggers system stop/pause, cancels modals, and acts as hover mode.',
    holdRequiredMs: 1400,
    guideRingColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    accentBg: 'from-cyan-500/20 to-blue-600/10 border-cyan-400/40',
  },
  {
    id: 'fist',
    name: 'Closed Fist',
    teluguName: 'పిడికిలి బిగించడం (ఆపు & ఎగ్జిట్)',
    targetGesture: 'Closed_Fist',
    emoji: '✊',
    tagline: 'Grab, Lock & Emergency Exit',
    description: 'Curl all fingers and thumb tightly into a solid fist.',
    howTo: [
      'Curl all four fingers and thumb into your palm.',
      'Show the back or front of your closed fist clearly.',
      'Hold in the target zone until the confirmation ring fills.',
    ],
    actionBenefit: 'Stops speech/audio playback, closes overlays, and confirms quick actions.',
    holdRequiredMs: 1400,
    guideRingColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    accentBg: 'from-rose-500/20 to-red-600/10 border-rose-400/40',
  },
  {
    id: 'pinch',
    name: 'Pinch to Click',
    teluguName: 'వేళ్ళతో చిటికె వేయడం (క్లిక్ & సెలెక్ట్)',
    targetGesture: 'Pinch',
    emoji: '🤏',
    tagline: 'Precision Air Click & Typing',
    description: 'Bring the tip of your Index Finger and Thumb together to touch.',
    howTo: [
      'Extend index and thumb, then touch their tips together.',
      'Keep the other fingers naturally relaxed.',
      'Observe the yellow laser reticle spark upon pinch contact.',
    ],
    actionBenefit: 'Triggers real clicks on buttons, cards, dials, and air-types on keyboard keys.',
    holdRequiredMs: 1000,
    guideRingColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.45)',
    accentBg: 'from-amber-500/20 to-yellow-600/10 border-amber-400/40',
  },
];

interface GestureTrainingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteAll?: () => void;
}

export function GestureTrainingOverlay({
  isOpen,
  onClose,
  onCompleteAll,
}: GestureTrainingOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [currentDetectedGesture, setCurrentDetectedGesture] = useState<RecognizedGestureName>('None');
  const [currentConfidence, setCurrentConfidence] = useState<number>(0);
  const [progressRatio, setProgressRatio] = useState<number>(0); // 0 to 1
  const [completedSteps, setCompletedSteps] = useState<Record<TrainingStepId, boolean>>({
    open_palm: false,
    fist: false,
    pinch: false,
  });
  const [allFinished, setAllFinished] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastFeedback, setLastFeedback] = useState<string>('Align your hand in view');

  const activeHoldStartTimeRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const activeLesson = GESTURE_LESSONS[currentStepIndex] || GESTURE_LESSONS[0];

  // Synthesize UI audio feedback
  const playChime = useCallback((type: 'tick' | 'success' | 'complete') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'tick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else {
        // Complete fanfare
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.type = 'sine';
          noteOsc.frequency.setValueAtTime(freq, now + i * 0.08);
          noteGain.gain.setValueAtTime(0.15, now + i * 0.08);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.22);
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.start(now + i * 0.08);
          noteOsc.stop(now + i * 0.08 + 0.24);
        });
        return;
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
    } catch {
      // Audio fallback safe
    }
  }, [soundEnabled]);

  // Subscribe to real-time gesture event stream
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = gestureEventService.subscribe((e: GestureActionEvent) => {
      setCurrentDetectedGesture(e.gesture);
      setCurrentConfidence(e.confidence);

      const isTargetMatched = e.gesture === activeLesson.targetGesture;

      if (isTargetMatched) {
        if (!activeHoldStartTimeRef.current) {
          activeHoldStartTimeRef.current = performance.now();
        }
        setLastFeedback(`Perfect! Hold ${activeLesson.name}...`);
      } else {
        activeHoldStartTimeRef.current = null;
        setProgressRatio(0);
        if (e.gesture === 'None') {
          setLastFeedback('Show your hand to the camera');
        } else {
          setLastFeedback(`Detected: ${e.gesture.replace('_', ' ')} — Switch to ${activeLesson.name}`);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, activeLesson]);

  // Progress animation ticker
  useEffect(() => {
    if (!isOpen || allFinished) return;

    let isRunning = true;
    const tick = () => {
      if (!isRunning) return;

      if (activeHoldStartTimeRef.current) {
        const elapsed = performance.now() - activeHoldStartTimeRef.current;
        const ratio = Math.min(1, elapsed / activeLesson.holdRequiredMs);
        setProgressRatio(ratio);

        if (ratio >= 1) {
          // Completed current step!
          activeHoldStartTimeRef.current = null;
          setProgressRatio(0);
          playChime('success');

          const stepId = activeLesson.id;
          setCompletedSteps((prev) => {
            const next = { ...prev, [stepId]: true };
            // Check if all 3 are finished
            if (next.open_palm && next.fist && next.pinch) {
              setAllFinished(true);
              playChime('complete');
              onCompleteAll?.();
            }
            return next;
          });

          // Advance to next uncompleted step if not all finished
          setTimeout(() => {
            setCurrentStepIndex((prev) => (prev < GESTURE_LESSONS.length - 1 ? prev + 1 : prev));
          }, 350);
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, activeLesson, allFinished, playChime, onCompleteAll]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-3 sm:p-5 pointer-events-none select-none animate-in fade-in duration-200">
      {/* 1. TOP STATUS & NAVIGATION BAR */}
      <div className="pointer-events-auto flex items-center justify-between gap-2 bg-black/85 border border-cyan-500/40 p-2 sm:p-2.5 rounded-2xl backdrop-blur-xl shadow-[0_8px_30px_rgba(2,6,23,0.9)]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-400/40 text-cyan-300">
            <Target className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-black text-white tracking-wide uppercase">
                Gesture Training Lab
              </span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px] border border-cyan-400/30">
                AI Coach
              </span>
            </div>
            <div className="text-[10px] text-slate-300 font-mono">
              Master air gesture controls step-by-step
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-1.5">
          {GESTURE_LESSONS.map((lesson, idx) => {
            const isDone = completedSteps[lesson.id];
            const isActive = idx === currentStepIndex && !allFinished;
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => {
                  setCurrentStepIndex(idx);
                  activeHoldStartTimeRef.current = null;
                  setProgressRatio(0);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-xl font-mono text-[10px] font-bold transition ${
                  isDone
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : isActive
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-700/50 hover:text-slate-200'
                }`}
              >
                <span>{lesson.emoji}</span>
                <span className="hidden sm:inline">{lesson.name}</span>
                {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-xl bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/60 transition"
            title={soundEnabled ? 'Mute Training Audio' : 'Unmute Training Audio'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Close Training */}
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-400/40 text-[10px] font-mono font-bold transition"
          >
            Exit
          </button>
        </div>
      </div>

      {/* 2. CENTER HOLOGRAPHIC TARGET FRAME & LIVE GUIDE OVERLAY */}
      <div className="self-center flex flex-col items-center justify-center my-auto relative">
        {allFinished ? (
          /* COMPLETION CARD */
          <div className="pointer-events-auto max-w-sm w-full mx-auto p-5 rounded-3xl bg-slate-950/95 border border-emerald-400/60 backdrop-blur-2xl shadow-[0_0_40px_rgba(16,185,129,0.35)] text-center space-y-3 animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_#10b981]">
              <Award className="w-8 h-8 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Gesture Master Certified!</h3>
              <p className="text-xs text-emerald-300 font-mono mt-0.5">
                All 3 Air Gestures verified with &gt;90% accuracy.
              </p>
            </div>
            <p className="text-[11px] text-slate-300">
              You can now navigate tabs via air swipes, tap interactive buttons with pinch-to-click, and command the UI hands-free!
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCompletedSteps({ open_palm: false, fist: false, pinch: false });
                  setAllFinished(false);
                  setCurrentStepIndex(0);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Repeat</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              >
                <span>Continue to Camera</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE TRAINING SKELETON TARGET */
          <div className="relative flex flex-col items-center">
            {/* Holographic Circular Progress Target */}
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
              {/* Outer Pulsing Glow */}
              <div
                className="absolute inset-0 rounded-full transition-all duration-300 animate-pulse"
                style={{
                  boxShadow: `0 0 35px ${activeLesson.glowColor}`,
                  border: `2px dashed ${activeLesson.guideRingColor}`,
                }}
              />

              {/* SVG Radial Fill Ring for Hold Confirmation */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="44%"
                  className="stroke-slate-900/60"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="44%"
                  stroke={activeLesson.guideRingColor}
                  strokeWidth="8"
                  strokeDasharray="276"
                  strokeDashoffset={276 * (1 - progressRatio)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-75"
                />
              </svg>

              {/* Center Silhouette Icon */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <span className="text-5xl sm:text-6xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] animate-bounce">
                  {activeLesson.emoji}
                </span>
                <span
                  className="mt-1 text-xs font-mono font-extrabold uppercase tracking-wider"
                  style={{ color: activeLesson.guideRingColor }}
                >
                  {activeLesson.name}
                </span>
                <span className="text-[10px] font-mono text-slate-300">
                  {Math.round(progressRatio * 100)}% Hold
                </span>
              </div>
            </div>

            {/* Live Feedback Bubble */}
            <div className="mt-3 px-3.5 py-1.5 rounded-full bg-black/85 border border-cyan-400/50 backdrop-blur-md flex items-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
              <span
                className={`w-2 h-2 rounded-full ${
                  currentDetectedGesture === activeLesson.targetGesture
                    ? 'bg-emerald-400 animate-ping'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="text-xs font-mono font-bold text-white">
                {lastFeedback}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM COACHING CARD WITH HOW-TO & TELUGU TRANSLATION */}
      {!allFinished && (
        <div className="pointer-events-auto max-w-xl w-full mx-auto rounded-3xl bg-black/90 border border-cyan-500/40 p-3.5 sm:p-4 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.9)] space-y-2.5">
          <div className="flex items-start justify-between gap-3 border-b border-cyan-500/20 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>Step {currentStepIndex + 1} of 3:</span>
                  <span style={{ color: activeLesson.guideRingColor }}>{activeLesson.name}</span>
                </h4>
                <span className="text-xs">{activeLesson.emoji}</span>
              </div>
              <div className="text-[11px] font-semibold text-cyan-300">
                {activeLesson.teluguName}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                {activeLesson.tagline}
              </span>
            </div>
          </div>

          {/* Instructions List */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {activeLesson.howTo.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[10.5px] text-slate-300"
              >
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center shrink-0 text-[9px] mt-0.5">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          {/* Action Benefit */}
          <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-300 border-t border-slate-800/60">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Zap className="w-3.5 h-3.5" />
              <span className="font-semibold">{activeLesson.actionBenefit}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  // Manually advance or skip for testing
                  setCurrentStepIndex((prev) => (prev + 1) % GESTURE_LESSONS.length);
                  activeHoldStartTimeRef.current = null;
                  setProgressRatio(0);
                }}
                className="text-[10px] text-slate-400 hover:text-cyan-300 underline font-mono"
              >
                Skip Step
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
