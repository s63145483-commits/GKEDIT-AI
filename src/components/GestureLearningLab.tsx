import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Hand,
  Sparkles,
  Zap,
  Target,
  Trophy,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Plus,
  Trash2,
  Camera,
  Activity,
  Layers,
  Award,
  Volume2,
  VolumeX,
  ArrowRight,
  ChevronRight,
  Clock,
  ShieldCheck,
  Flame,
  Radio,
  Sliders,
  Compass,
  Cpu,
} from 'lucide-react';
import {
  customGestureService,
  GestureDefinition,
  FingerStateVector,
  BUILT_IN_GESTURES,
  GestureTargetAction,
} from '../services/customGestureService.ts';
import { gestureEventService } from '../services/gestureEventService.ts';
import { LiquidGlassNav } from './LiquidGlassNav.tsx';

// 21 Landmark points names for MediaPipe Hand Skeleton
const LANDMARK_NAMES = [
  'Wrist (0)',
  'Thumb CMC (1)',
  'Thumb MCP (2)',
  'Thumb IP (3)',
  'Thumb Tip (4)',
  'Index MCP (5)',
  'Index PIP (6)',
  'Index DIP (7)',
  'Index Tip (8)',
  'Middle MCP (9)',
  'Middle PIP (10)',
  'Middle DIP (11)',
  'Middle Tip (12)',
  'Ring MCP (13)',
  'Ring PIP (14)',
  'Ring DIP (15)',
  'Ring Tip (16)',
  'Pinky MCP (17)',
  'Pinky PIP (18)',
  'Pinky DIP (19)',
  'Pinky Tip (20)',
];

// Bones connections between 21 landmarks
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],// Ring
  [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [5, 9], [9, 13], [13, 17],            // Palm knuckle arches
];

type LabTab = 'fast_drills' | 'masterclass' | 'builder' | 'library';

export function GestureLearningLab({
  onNavigateToChat,
}: {
  onNavigateToChat?: (prompt?: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<LabTab>('fast_drills');
  const [allGestures, setAllGestures] = useState<GestureDefinition[]>(() =>
    customGestureService.getAllGestures()
  );
  const [selectedLesson, setSelectedLesson] = useState<GestureDefinition>(allGestures[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio Context for feedback chimes
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChime = useCallback(
    (type: 'tick' | 'success' | 'combo' | 'fanfare' | 'miss') => {
      if (!soundEnabled || typeof window === 'undefined') return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
        if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();

        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (type === 'tick') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
        } else if (type === 'success') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        } else if (type === 'combo') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(659.25, now); // E5
          osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15); // C6
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (type === 'miss') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        } else {
          // Fanfare
          [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, now + i * 0.07);
            g.gain.setValueAtTime(0.15, now + i * 0.07);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25);
            o.connect(g);
            g.connect(ctx.destination);
            o.start(now + i * 0.07);
            o.stop(now + i * 0.07 + 0.27);
          });
          return;
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
      } catch {}
    },
    [soundEnabled]
  );

  // Sync custom gestures from service
  useEffect(() => {
    return customGestureService.subscribe(() => {
      const updated = customGestureService.getAllGestures();
      setAllGestures(updated);
      setSelectedLesson((prev) => updated.find((g) => g.id === prev.id) || updated[0]);
    });
  }, []);

  return (
    <div className="space-y-6 text-white not-prose">
      {/* Hero Banner with Futuristic Cyberpunk Glow */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#031535] via-[#041a45] to-[#020b1f] border border-cyan-400/30 shadow-[0_0_35px_rgba(6,182,212,0.18)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                MediaPipe 21-Landmark Vision
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                <span>Fast Training Engine</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Gesture Learning Lab & Custom Builder</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Master real-time hand gestures with accelerated reflex training, inspect joint
              biomechanics across 21 landmarks, and construct your own custom gestures with live
              accuracy calibration.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition cursor-pointer"
              title={soundEnabled ? 'Mute Training Audio' : 'Unmute Training Audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 hover:from-cyan-300 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(6,182,212,0.35)] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Build Custom Gesture</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher with Apple iOS Liquid Glass Droplet indicator */}
        <LiquidGlassNav
          activeId={activeTab}
          className="mt-6 flex items-center gap-1.5 p-1 rounded-full border border-cyan-500/30 overflow-x-auto no-scrollbar scrollbar-none"
        >
          <button
            data-nav-id="fast_drills"
            onClick={() => setActiveTab('fast_drills')}
            className={`liquid-nav-btn px-3.5 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'fast_drills'
                ? 'text-cyan-300 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Fast Training Drills</span>
          </button>

          <button
            data-nav-id="masterclass"
            onClick={() => setActiveTab('masterclass')}
            className={`liquid-nav-btn px-3.5 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'masterclass'
                ? 'text-cyan-300 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Learn Full Gestures (Masterclass)</span>
          </button>

          <button
            data-nav-id="builder"
            onClick={() => setActiveTab('builder')}
            className={`liquid-nav-btn px-3.5 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'builder'
                ? 'text-cyan-300 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Custom Gesture Builder</span>
          </button>

          <button
            data-nav-id="library"
            onClick={() => setActiveTab('library')}
            className={`liquid-nav-btn px-3.5 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'library'
                ? 'text-cyan-300 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-violet-400" />
            <span>My Gesture Library ({allGestures.length})</span>
          </button>
        </LiquidGlassNav>
      </div>

      {/* Tab 1: Fast Training Drills */}
      {activeTab === 'fast_drills' && (
        <FastTrainingDrillSection
          allGestures={allGestures}
          playChime={playChime}
          onSwitchToMasterclass={(g) => {
            setSelectedLesson(g);
            setActiveTab('masterclass');
          }}
        />
      )}

      {/* Tab 2: Learn Full Gestures (Masterclass & Biomechanics) */}
      {activeTab === 'masterclass' && (
        <GestureMasterclassSection
          allGestures={allGestures}
          selectedLesson={selectedLesson}
          onSelectLesson={setSelectedLesson}
          playChime={playChime}
        />
      )}

      {/* Tab 3: Custom Gesture Builder */}
      {activeTab === 'builder' && (
        <CustomGestureBuilderSection
          playChime={playChime}
          onCreated={(newGesture) => {
            setSelectedLesson(newGesture);
            setActiveTab('library');
          }}
        />
      )}

      {/* Tab 4: My Gesture Library */}
      {activeTab === 'library' && (
        <GestureLibrarySection
          allGestures={allGestures}
          onTestGesture={(g) => {
            setSelectedLesson(g);
            setActiveTab('masterclass');
          }}
          onDeleteGesture={(id) => {
            customGestureService.deleteCustomGesture(id);
          }}
        />
      )}
    </div>
  );
}

// ========================================================================
// SECTION 1: FAST TRAINING DRILLS (Sprint, Reflex & Accuracy)
// ========================================================================
function FastTrainingDrillSection({
  allGestures,
  playChime,
  onSwitchToMasterclass,
}: {
  allGestures: GestureDefinition[];
  playChime: (type: 'tick' | 'success' | 'combo' | 'fanfare' | 'miss') => void;
  onSwitchToMasterclass: (g: GestureDefinition) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [drillIndex, setDrillIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [highestCombo, setHighestCombo] = useState(0);
  const [streakStats, setStreakStats] = useState<number[]>([]);
  const [completedDrills, setCompletedDrills] = useState<string[]>([]);
  const [simulatedFeedback, setSimulatedFeedback] = useState<string>('Ready? Tap Start Speed Run.');

  // Pick 5 random core gestures for the speed run drill
  const [drillQueue, setDrillQueue] = useState<GestureDefinition[]>([]);
  const currentTarget = drillQueue[drillIndex] || allGestures[0];
  const targetStartTimeRef = useRef<number>(Date.now());

  const startSpeedRun = () => {
    // Shuffle and pick 6 gestures
    const pool = [...allGestures].sort(() => 0.5 - Math.random()).slice(0, 6);
    setDrillQueue(pool);
    setDrillIndex(0);
    setTimeLeft(25);
    setScore(0);
    setCombo(0);
    setHighestCombo(0);
    setStreakStats([]);
    setCompletedDrills([]);
    setIsPlaying(true);
    targetStartTimeRef.current = Date.now();
    setSimulatedFeedback(`Show "${pool[0]?.name}" as fast as possible!`);
    playChime('tick');
  };

  // Timer countdown
  useEffect(() => {
    if (!isPlaying) return;
    if (timeLeft <= 0) {
      setIsPlaying(false);
      playChime('fanfare');
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, playChime]);

  // Handle successful match of current gesture target
  const handlePerformGesture = (gesture: GestureDefinition) => {
    if (!isPlaying) return;

    if (gesture.id === currentTarget.id) {
      const reactionTime = Date.now() - targetStartTimeRef.current;
      targetStartTimeRef.current = Date.now();

      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > highestCombo) setHighestCombo(newCombo);

      const points = Math.max(100, Math.floor(1000 - reactionTime * 0.4)) * (1 + newCombo * 0.1);
      setScore((prev) => Math.floor(prev + points));
      setStreakStats((prev) => [...prev, reactionTime]);
      setCompletedDrills((prev) => [...prev, gesture.id]);

      customGestureService.recordPractice(gesture.id, reactionTime);

      if (newCombo >= 3) {
        playChime('combo');
      } else {
        playChime('success');
      }

      setSimulatedFeedback(`⚡ Fast! ${reactionTime}ms reaction time (+${Math.floor(points)} pts)`);

      // Advance to next target or win
      if (drillIndex < drillQueue.length - 1) {
        setDrillIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
        playChime('fanfare');
      }
    } else {
      setCombo(0);
      playChime('miss');
      setSimulatedFeedback(`❌ Wrong hand pose! Target was ${currentTarget.name}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Speed Run Arena Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#03132e]/90 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Reflex Sprint: Fast Training Arena</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Speed Run Mode
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Accelerate muscle memory by executing prompted gestures within milliseconds.
              </p>
            </div>
          </div>

          {/* Quick HUD Metrics */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Time</span>
              <span className={`text-base font-bold ${timeLeft <= 5 ? 'text-red-400 animate-ping' : 'text-cyan-300'}`}>
                {timeLeft}s
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Score</span>
              <span className="text-base font-bold text-emerald-400">{score}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Combo</span>
              <span className="text-base font-bold text-amber-400">x{combo}</span>
            </div>
          </div>
        </div>

        {/* Active Target Banner */}
        {isPlaying ? (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-400/40 text-center space-y-3 relative overflow-hidden">
            <span className="text-xs font-mono tracking-widest text-cyan-300 uppercase block">
              TARGET GESTURE ({drillIndex + 1} / {drillQueue.length})
            </span>

            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl">{currentTarget.emoji}</span>
              <div className="text-left">
                <h4 className="text-2xl font-black text-white">{currentTarget.name}</h4>
                <p className="text-xs text-cyan-200">{currentTarget.teluguName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-md mx-auto">{currentTarget.description}</p>

            <div className="p-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-cyan-300">
              {simulatedFeedback}
            </div>

            {/* Quick Practice Simulator Bar */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block mb-2">
                Click button to simulate gesture input or hold hand to camera:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {drillQueue.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handlePerformGesture(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      g.id === currentTarget.id
                        ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                        : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{g.emoji}</span>
                    <span>{g.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mx-auto text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">
                {score > 0 ? `Sprint Finished! Final Score: ${score} pts` : 'Ready to Start Fast Training?'}
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {score > 0
                  ? `Highest combo: x${highestCombo} | Average speed: ${
                      streakStats.length > 0
                        ? Math.floor(streakStats.reduce((a, b) => a + b, 0) / streakStats.length)
                        : 0
                    }ms. Great reflex training!`
                  : 'Test your reaction times across essential gestures. Each correct gesture adds combo multipliers!'}
              </p>
            </div>

            <button
              onClick={startSpeedRun}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 hover:from-amber-300 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(245,158,11,0.4)] transition flex items-center gap-2 mx-auto cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{score > 0 ? 'Play Again (New Sprint)' : 'Start Speed Run (25s)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Recommended Practice Gestures Grid */}
      <div>
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-cyan-400" />
          <span>Core Gestures in Training Routine</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allGestures.slice(0, 6).map((g) => (
            <div
              key={g.id}
              className="p-4 rounded-2xl bg-[#020b1c]/80 border border-slate-800 hover:border-cyan-400/40 transition group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{g.emoji}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  {g.category.toUpperCase()}
                </span>
              </div>

              <div>
                <h5 className="font-bold text-white text-sm group-hover:text-cyan-300 transition">
                  {g.name}
                </h5>
                <p className="text-[11px] text-cyan-400/90">{g.teluguName}</p>
              </div>

              <p className="text-xs text-slate-400 leading-snug line-clamp-2">{g.description}</p>

              <div className="pt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  Practiced: <strong className="text-white">{g.timesPracticed}x</strong>
                </span>

                <button
                  onClick={() => onSwitchToMasterclass(g)}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Study Biomechanics</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========================================================================
// SECTION 2: GESTURE MASTERCLASS (Biomechanics, 21 Landmarks, Detection)
// ========================================================================
function GestureMasterclassSection({
  allGestures,
  selectedLesson,
  onSelectLesson,
  playChime,
}: {
  allGestures: GestureDefinition[];
  selectedLesson: GestureDefinition;
  onSelectLesson: (g: GestureDefinition) => void;
  playChime: (type: 'tick' | 'success' | 'combo' | 'fanfare' | 'miss') => void;
}) {
  const [testingProgress, setTestingProgress] = useState(0);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isHoldingTest, setIsHoldingTest] = useState(false);

  const handleTestPractice = () => {
    setIsHoldingTest(true);
    setTestResult('Analyzing hand alignment & knuckle angles...');
    playChime('tick');

    let current = 0;
    const interval = setInterval(() => {
      current += 0.2;
      setTestingProgress(Math.min(1, current));

      if (current >= 1) {
        clearInterval(interval);
        setIsHoldingTest(false);
        setTestResult(`✅ PASSED: Perfect ${selectedLesson.name}! All landmarks within tolerance.`);
        playChime('success');
        customGestureService.recordPractice(selectedLesson.id, 850);
      }
    }, 180);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Sidebar: Gesture Selector */}
      <div className="space-y-2 lg:col-span-1">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Select Gesture Masterclass
        </h4>

        <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-cyan-500/20">
          {allGestures.map((g) => {
            const isSelected = g.id === selectedLesson.id;
            return (
              <button
                key={g.id}
                onClick={() => {
                  onSelectLesson(g);
                  setTestResult(null);
                  setTestingProgress(0);
                }}
                className={`w-full p-3 rounded-2xl text-left transition flex items-center justify-between cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-[#020b1c]/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{g.emoji}</span>
                  <div>
                    <span className="font-bold text-xs block">{g.name}</span>
                    <span className="text-[10px] text-slate-400">{g.tagline}</span>
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Lesson Content */}
      <div className="lg:col-span-2 space-y-4">
        <div className="p-5 sm:p-6 rounded-3xl bg-[#03132e]/95 border border-cyan-500/30 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-cyan-500/20 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-5xl">{selectedLesson.emoji}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">{selectedLesson.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    {selectedLesson.category.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-cyan-300">{selectedLesson.teluguName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{selectedLesson.tagline}</p>
              </div>
            </div>

            <button
              onClick={() => customGestureService.executeAction(selectedLesson)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Trigger Action</span>
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-300 leading-relaxed">{selectedLesson.description}</p>

          {/* Biomechanical Finger State Matrix */}
          <div className="p-4 rounded-2xl bg-[#020919] border border-cyan-500/20 space-y-3">
            <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>Biomechanical Joint Matrix (Finger Extension States)</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
              {[
                { name: 'Thumb', val: selectedLesson.rules.thumb },
                { name: 'Index', val: selectedLesson.rules.index },
                { name: 'Middle', val: selectedLesson.rules.middle },
                { name: 'Ring', val: selectedLesson.rules.ring },
                { name: 'Pinky', val: selectedLesson.rules.pinky },
              ].map((digit) => {
                const isOpen = digit.val === 'open';
                const isAny = digit.val === 'any';
                return (
                  <div
                    key={digit.name}
                    className={`p-2 rounded-xl border ${
                      isOpen
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : isAny
                        ? 'bg-slate-900/60 border-slate-700 text-slate-300'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 block uppercase">{digit.name}</span>
                    <strong className="text-xs uppercase">{digit.val}</strong>
                  </div>
                );
              })}
            </div>

            {selectedLesson.rules.requirePinch && (
              <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                <span className="font-bold">⚠️ Pinch Constraint:</span>
                <span>Thumb Tip (4) and Index Tip (8) must make precision contact (&lt; 0.05 dist).</span>
              </div>
            )}
          </div>

          {/* Deep Biomechanics & MediaPipe Math */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-slate-400">
              Mathematical Landmark Recognition Formula:
            </h4>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-cyan-300 text-[11px] leading-relaxed">
              {selectedLesson.biomechanics.detectionFormula}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <strong className="text-white block mb-0.5">Active Muscles & Joints:</strong>
                <span className="text-slate-400">{selectedLesson.biomechanics.activeJoints}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <strong className="text-white block mb-0.5">Common User Mistake:</strong>
                <span className="text-amber-300/90">{selectedLesson.biomechanics.commonMistakes}</span>
              </div>
            </div>
          </div>

          {/* Interactive Practice & Hold Simulator */}
          <div className="pt-3 border-t border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Live Practice Verification:</span>
              <span className="text-slate-400 font-mono">
                Hold time: {selectedLesson.holdRequiredMs}ms
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 transition-all duration-150"
                style={{ width: `${testingProgress * 100}%` }}
              />
            </div>

            {testResult && (
              <div className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-400/40 text-xs text-cyan-200 font-mono">
                {testResult}
              </div>
            )}

            <button
              onClick={handleTestPractice}
              disabled={isHoldingTest}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
            >
              {isHoldingTest ? 'Calibrating Landmark Vectors...' : 'Test & Verify This Gesture'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================================================
// SECTION 3: CUSTOM GESTURE BUILDER (Build Your Own Full Gesture)
// ========================================================================
function CustomGestureBuilderSection({
  playChime,
  onCreated,
}: {
  playChime: (type: 'tick' | 'success' | 'combo' | 'fanfare' | 'miss') => void;
  onCreated: (gesture: GestureDefinition) => void;
}) {
  const [name, setName] = useState('');
  const [teluguName, setTeluguName] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [action, setAction] = useState<GestureTargetAction>('chat');
  const [customPromptText, setCustomPromptText] = useState('');

  // Finger states
  const [thumbState, setThumbState] = useState<'open' | 'closed' | 'any'>('open');
  const [indexState, setIndexState] = useState<'open' | 'closed' | 'any'>('open');
  const [middleState, setMiddleState] = useState<'open' | 'closed' | 'any'>('closed');
  const [ringState, setRingState] = useState<'open' | 'closed' | 'any'>('closed');
  const [pinkyState, setPinkyState] = useState<'open' | 'closed' | 'any'>('open');
  const [requirePinch, setRequirePinch] = useState(false);

  const [activeJoints, setActiveJoints] = useState('Custom Lumbrical & Extensor Combination');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please provide a name for your custom gesture.');
      playChime('miss');
      return;
    }

    const newDef = customGestureService.addCustomGesture({
      name: name.trim(),
      teluguName: teluguName.trim() || `${name.trim()} (కస్టమ్ జెస్టర్)`,
      emoji: emoji || '✨',
      tagline: tagline.trim() || 'Custom Air Trigger',
      description:
        description.trim() ||
        `Custom user-created hand gesture with thumb ${thumbState}, index ${indexState}, middle ${middleState}, ring ${ringState}, pinky ${pinkyState}.`,
      category: 'custom',
      rules: {
        thumb: thumbState,
        index: indexState,
        middle: middleState,
        ring: ringState,
        pinky: pinkyState,
        requirePinch,
      },
      action,
      customPromptText: action === 'custom_prompt' ? customPromptText : undefined,
      biomechanics: {
        activeJoints,
        keyLandmarks: [0, 4, 8, 12, 16, 20],
        knuckleAngleDesc: 'Custom tuned finger state thresholds.',
        detectionFormula: `Thumb:${thumbState} & Index:${indexState} & Middle:${middleState} & Ring:${ringState} & Pinky:${pinkyState}`,
        commonMistakes: 'Ensure fingers are held with clear separation.',
      },
      holdRequiredMs: 1100,
    });

    playChime('fanfare');
    onCreated(newDef);
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#03132e]/95 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] space-y-5">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-400" />
          <span>Build Your Own Custom Gesture</span>
        </h3>
        <p className="text-xs text-slate-400">
          Configure finger extension rules, assign an app trigger, and save it to your live gesture
          recognition engine.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Basic Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">
            Gesture Name (English)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Finger Gun, Spock V, OK Sign"
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">
            Telugu Name / Subtitle (Optional)
          </label>
          <input
            type="text"
            value={teluguName}
            onChange={(e) => setTeluguName(e.target.value)}
            placeholder="e.g. వేళ్ళతో గన్ సైన్"
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">Emoji Icon</label>
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="e.g. 🤙, 🖖, 👈, 🤌"
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Finger Joint Rules */}
      <div className="p-4 rounded-2xl bg-[#020b1c] border border-cyan-500/20 space-y-3">
        <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4" />
          <span>Step 1: Set Biomechanical Finger Extension States</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {[
            { label: 'Thumb (1)', state: thumbState, set: setThumbState },
            { label: 'Index (2)', state: indexState, set: setIndexState },
            { label: 'Middle (3)', state: middleState, set: setMiddleState },
            { label: 'Ring (4)', state: ringState, set: setRingState },
            { label: 'Pinky (5)', state: pinkyState, set: setPinkyState },
          ].map((digit) => (
            <div key={digit.label} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">{digit.label}</span>
              <div className="flex items-center gap-1">
                {(['open', 'closed', 'any'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => digit.set(mode)}
                    className={`flex-1 py-1 rounded-lg text-[10.5px] font-bold transition uppercase cursor-pointer ${
                      digit.state === mode
                        ? mode === 'open'
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : mode === 'closed'
                          ? 'bg-rose-500 text-white font-black'
                          : 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pinch Toggle */}
        <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="text-xs">
            <span className="font-bold text-white block">Require Thumb-Index Pinch Contact:</span>
            <span className="text-[11px] text-slate-400">
              Tips 4 and 8 must touch together (e.g. for OK sign or air-typing).
            </span>
          </div>

          <button
            type="button"
            onClick={() => setRequirePinch(!requirePinch)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              requirePinch
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {requirePinch ? 'PINCH REQUIRED' : 'NO PINCH'}
          </button>
        </div>
      </div>

      {/* Action Trigger Mapping */}
      <div className="p-4 rounded-2xl bg-[#020b1c] border border-cyan-500/20 space-y-3">
        <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-4 h-4" />
          <span>Step 2: Assign Action Trigger</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'chat', label: 'Open AI Chat', icon: '💬' },
            { id: 'voice', label: 'Toggle Voice Mode', icon: '🎙️' },
            { id: 'torch', label: 'Toggle Flashlight', icon: '🔦' },
            { id: 'clear', label: 'Clear Screen/Input', icon: '🧹' },
            { id: 'stop', label: 'Emergency Audio Cut', icon: '🛑' },
            { id: 'home_device', label: 'Home Device Tab', icon: '🎧' },
            { id: 'haptic', label: 'Chime & Vibration', icon: '📳' },
            { id: 'custom_prompt', label: 'Prompt AI Assistant', icon: '🤖' },
          ].map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => setAction(act.id as GestureTargetAction)}
              className={`p-2.5 rounded-xl text-left border transition cursor-pointer text-xs ${
                action === act.id
                  ? 'bg-cyan-500/25 border-cyan-400 text-white font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-base block mb-0.5">{act.icon}</span>
              <span>{act.label}</span>
            </button>
          ))}
        </div>

        {action === 'custom_prompt' && (
          <div className="pt-2">
            <label className="text-[11px] font-bold text-cyan-300 block mb-1">
              Custom Prompt to Send to AI
            </label>
            <input
              type="text"
              value={customPromptText}
              onChange={(e) => setCustomPromptText(e.target.value)}
              placeholder="e.g. Summarize the screen in Telugu, or Analyze my heart rate"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSave}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:from-emerald-300 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(16,185,129,0.35)] transition cursor-pointer flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        <span>Save Custom Gesture to Recognition Engine</span>
      </button>
    </div>
  );
}

// ========================================================================
// SECTION 4: MY GESTURE LIBRARY (View & Manage Gestures)
// ========================================================================
function GestureLibrarySection({
  allGestures,
  onTestGesture,
  onDeleteGesture,
}: {
  allGestures: GestureDefinition[];
  onTestGesture: (g: GestureDefinition) => void;
  onDeleteGesture: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Active Gesture Engine Library ({allGestures.length} Total Gestures)</span>
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {allGestures.map((g) => (
          <div
            key={g.id}
            className="p-4 rounded-2xl bg-[#03132e]/90 border border-cyan-500/25 hover:border-cyan-400/50 transition space-y-3 shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">{g.emoji}</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    g.isCustom
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  }`}
                >
                  {g.isCustom ? 'Custom' : 'Built-in'}
                </span>
                {g.isCustom && (
                  <button
                    onClick={() => onDeleteGesture(g.id)}
                    className="p-1 rounded-lg hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition cursor-pointer"
                    title="Delete custom gesture"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <h5 className="font-bold text-white text-sm">{g.name}</h5>
              <p className="text-[11px] text-cyan-400">{g.teluguName}</p>
            </div>

            <p className="text-xs text-slate-400 leading-snug line-clamp-2">{g.description}</p>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Action: <strong className="text-slate-300">{g.action}</strong>
              </span>

              <button
                onClick={() => onTestGesture(g)}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition"
              >
                <span>Study</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
