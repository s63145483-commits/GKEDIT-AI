// ========================================================================
// CUSTOM GESTURE & BIOMECHANICAL TRAINING SERVICE
// Powers the Gesture Learning Lab & Custom Gesture Builder
// Evaluates 21 MediaPipe hand landmarks, finger state vectors, and actions
// ========================================================================

export interface FingerStateVector {
  thumb: boolean;   // true = extended, false = curled
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
  isPinching: boolean; // thumb tip + index tip touching
  pinchDistance: number; // normalized distance 0 - 1
  handSpan: number; // distance from wrist to middle tip
}

export type GestureTargetAction =
  | 'chat'          // Open AI Chat
  | 'voice'         // Toggle Voice Mode
  | 'torch'         // Toggle Flashlight (Torch)
  | 'clear'         // Clear Input / Reset
  | 'stop'          // Stop Audio / AI Generation
  | 'home_device'   // Navigate to Home Device Tab
  | 'haptic'        // Play Chime & Vibration
  | 'custom_prompt';// Fire custom prompt to AI

export interface GestureDefinition {
  id: string;
  name: string;
  teluguName: string;
  emoji: string;
  tagline: string;
  description: string;
  category: 'core' | 'advanced' | 'custom';
  // Required finger states: 'open' | 'closed' | 'any'
  rules: {
    thumb: 'open' | 'closed' | 'any';
    index: 'open' | 'closed' | 'any';
    middle: 'open' | 'closed' | 'any';
    ring: 'open' | 'closed' | 'any';
    pinky: 'open' | 'closed' | 'any';
    requirePinch?: boolean;
  };
  // Action triggered
  action: GestureTargetAction;
  customPromptText?: string;
  // Biomechanics teaching notes
  biomechanics: {
    activeJoints: string;
    keyLandmarks: number[]; // indices in MediaPipe 21 landmarks
    knuckleAngleDesc: string;
    detectionFormula: string;
    commonMistakes: string;
  };
  // Stats
  holdRequiredMs: number;
  timesPracticed: number;
  bestSpeedMs?: number;
  isCustom?: boolean;
}

export interface TrainingDrillResult {
  gestureId: string;
  gestureName: string;
  reactionTimeMs: number;
  accuracy: number;
  passed: boolean;
  timestamp: number;
}

export interface SpeedRunSession {
  totalGestures: number;
  completedCount: number;
  averageSpeedMs: number;
  highestCombo: number;
  score: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
}

const STORAGE_KEY_CUSTOM_GESTURES = 'gkedit_custom_gestures_v2';
const STORAGE_KEY_TRAINING_STATS = 'gkedit_gesture_training_stats_v2';

export const BUILT_IN_GESTURES: GestureDefinition[] = [
  {
    id: 'open_palm',
    name: 'Open Palm',
    teluguName: 'అరచేయి తెరవడం (హోవర్ & స్టాప్)',
    emoji: '✋',
    tagline: 'Hover, Wake & Clear Input',
    description: 'Extend all five fingers flat facing the camera with your palm upright.',
    category: 'core',
    rules: {
      thumb: 'open',
      index: 'open',
      middle: 'open',
      ring: 'open',
      pinky: 'open',
      requirePinch: false,
    },
    action: 'clear',
    biomechanics: {
      activeJoints: 'All MCP & PIP Extensors',
      keyLandmarks: [0, 4, 8, 12, 16, 20],
      knuckleAngleDesc: 'All metacarpophalangeal (MCP) joints fully extended (angle ~180°).',
      detectionFormula: 'Dist(Tip[i], Wrist) > Dist(MCP[i], Wrist) * 1.18 for all 5 fingers.',
      commonMistakes: 'Curling pinky or holding hand tilted away from the camera.',
    },
    holdRequiredMs: 1200,
    timesPracticed: 14,
  },
  {
    id: 'fist',
    name: 'Closed Fist',
    teluguName: 'పిడికిలి బిగించడం (ఆపు & ఎగ్జిట్)',
    emoji: '✊',
    tagline: 'Emergency Stop & Audio Cut',
    description: 'Curl all fingers and thumb tightly into a solid fist.',
    category: 'core',
    rules: {
      thumb: 'closed',
      index: 'closed',
      middle: 'closed',
      ring: 'closed',
      pinky: 'closed',
      requirePinch: false,
    },
    action: 'stop',
    biomechanics: {
      activeJoints: 'Flexor Digitorum Profundus & Superficialis',
      keyLandmarks: [0, 4, 8, 12, 16, 20],
      knuckleAngleDesc: 'PIP and DIP joints flexed ~90°, fingertips tucked into palm.',
      detectionFormula: 'Dist(Tip[i], Wrist) <= Dist(MCP[i], Wrist) * 1.10 for all fingers.',
      commonMistakes: 'Leaving the thumb sticking out upright (triggers Thumb Up instead).',
    },
    holdRequiredMs: 1200,
    timesPracticed: 11,
  },
  {
    id: 'pinch',
    name: 'Pinch to Click',
    teluguName: 'చిటికె వేయడం (క్లిక్ & ఎయిర్ టైపింగ్)',
    emoji: '🤏',
    tagline: 'Precision Air Click & Virtual Typing',
    description: 'Bring the tip of your Index Finger (8) and Thumb (4) together to touch.',
    category: 'core',
    rules: {
      thumb: 'any',
      index: 'any',
      middle: 'any',
      ring: 'any',
      pinky: 'any',
      requirePinch: true,
    },
    action: 'haptic',
    biomechanics: {
      activeJoints: 'Thumb Opponens & First Dorsal Interosseous',
      keyLandmarks: [4, 8],
      knuckleAngleDesc: 'Precision grip contact between distal phalanges 4 & 8.',
      detectionFormula: 'EuclideanDistance(Landmark[4], Landmark[8]) < 0.05 (normalized viewport).',
      commonMistakes: 'Pinching with middle finger instead of index finger.',
    },
    holdRequiredMs: 800,
    timesPracticed: 22,
  },
  {
    id: 'thumb_up',
    name: 'Thumbs Up',
    teluguName: 'బొటనవేలు పైకి (సందేశం పంపడం)',
    emoji: '👍',
    tagline: 'Send Prompt & Confirm Action',
    description: 'Extend only the thumb upright while keeping all other 4 fingers curled.',
    category: 'core',
    rules: {
      thumb: 'open',
      index: 'closed',
      middle: 'closed',
      ring: 'closed',
      pinky: 'closed',
      requirePinch: false,
    },
    action: 'chat',
    biomechanics: {
      activeJoints: 'Extensor Pollicis Longus & Brevis',
      keyLandmarks: [4, 2, 8, 12, 16, 20],
      knuckleAngleDesc: 'Thumb extended vertically, 4 fingers flexed tight into palm.',
      detectionFormula: 'ThumbTip.y < ThumbIP.y AND Dist(4, 0) > Dist(2, 0) * 1.25 AND others curled.',
      commonMistakes: 'Pointing thumb sideways instead of pointing upwards.',
    },
    holdRequiredMs: 1000,
    timesPracticed: 18,
  },
  {
    id: 'victory',
    name: 'Victory / Peace (V)',
    teluguName: 'విక్టరీ సైన్ (వాయిస్ మోడ్ ఆన్)',
    emoji: '✌️',
    tagline: 'Toggle Voice Mode & Speech Input',
    description: 'Extend both Index and Middle fingers in a V-shape, curl Ring, Pinky and Thumb.',
    category: 'core',
    rules: {
      thumb: 'closed',
      index: 'open',
      middle: 'open',
      ring: 'closed',
      pinky: 'closed',
      requirePinch: false,
    },
    action: 'voice',
    biomechanics: {
      activeJoints: 'Lumbricals 1 & 2 + First Palmar Interosseous',
      keyLandmarks: [4, 8, 12, 16, 20],
      knuckleAngleDesc: 'Fingers 8 & 12 extended and abducted apart in V geometry.',
      detectionFormula: 'Index & Middle extended AND Ring & Pinky flexed AND Dist(8, 12) > 0.04.',
      commonMistakes: 'Keeping fingers clamped together instead of spreading into a V.',
    },
    holdRequiredMs: 1000,
    timesPracticed: 16,
  },
  {
    id: 'pointing_up',
    name: 'Pointing Up (Reticle)',
    teluguName: 'పైకి చూపడం (లేజర్ టార్గెటింగ్)',
    emoji: '☝️',
    tagline: 'Laser Reticle Air Navigation',
    description: 'Extend only the index finger upright to guide the on-screen targeting cursor.',
    category: 'advanced',
    rules: {
      thumb: 'closed',
      index: 'open',
      middle: 'closed',
      ring: 'closed',
      pinky: 'closed',
      requirePinch: false,
    },
    action: 'haptic',
    biomechanics: {
      activeJoints: 'Extensor Indicis Proprius',
      keyLandmarks: [8, 6, 0],
      knuckleAngleDesc: 'Index MCP at 180° isolated extension; other 3 digits curled.',
      detectionFormula: 'Index extended AND Middle, Ring, Pinky flexed.',
      commonMistakes: 'Lifting the thumb together with the index (becomes L-Shape gun).',
    },
    holdRequiredMs: 900,
    timesPracticed: 15,
  },
  {
    id: 'iloveyou',
    name: 'Rock / Spider-Man (🤟)',
    teluguName: 'రాక్ / స్పైడర్ మ్యాన్ జెస్టర్',
    emoji: '🤟',
    tagline: 'Creator Hub & Aesthetic Pulse',
    description: 'Extend Thumb, Index, and Pinky fingers while keeping Middle and Ring curled.',
    category: 'advanced',
    rules: {
      thumb: 'open',
      index: 'open',
      middle: 'closed',
      ring: 'closed',
      pinky: 'open',
      requirePinch: false,
    },
    action: 'torch',
    biomechanics: {
      activeJoints: 'Extensor Digiti Minimi + Extensor Indicis + Extensor Pollicis',
      keyLandmarks: [4, 8, 12, 16, 20],
      knuckleAngleDesc: 'Digits 1, 2, and 5 fully extended; digits 3 and 4 held flexed into palm.',
      detectionFormula: 'Thumb, Index, Pinky extended AND Middle, Ring flexed.',
      commonMistakes: 'Curling the thumb (makes standard heavy-metal horns 🤘 instead of 🤟).',
    },
    holdRequiredMs: 1100,
    timesPracticed: 9,
  },
  {
    id: 'shaka',
    name: 'Shaka / Call Me (🤙)',
    teluguName: 'షాకా / కాల్ మీ సైన్',
    emoji: '🤙',
    tagline: 'Quick Home Device & Sensors',
    description: 'Extend only Thumb and Pinky outward while curling Index, Middle, and Ring.',
    category: 'advanced',
    rules: {
      thumb: 'open',
      index: 'closed',
      middle: 'closed',
      ring: 'closed',
      pinky: 'open',
      requirePinch: false,
    },
    action: 'home_device',
    biomechanics: {
      activeJoints: 'Abductor Pollicis Longus + Abductor Digiti Minimi',
      keyLandmarks: [4, 8, 12, 16, 20],
      knuckleAngleDesc: 'Lateral abduction of digits 1 & 5 with medial digits flexed.',
      detectionFormula: 'Thumb & Pinky extended AND Index, Middle, Ring flexed.',
      commonMistakes: 'Holding the hand vertical instead of relaxed horizontal.',
    },
    holdRequiredMs: 1100,
    timesPracticed: 7,
  },
  {
    id: 'ok_sign',
    name: 'OK Sign (👌)',
    teluguName: 'ఓకే సైన్ (సమ్మతి & నిర్ధారణ)',
    emoji: '👌',
    tagline: 'Approve & Confirm Modal',
    description: 'Pinch Thumb and Index tips into a circle while extending Middle, Ring, and Pinky.',
    category: 'advanced',
    rules: {
      thumb: 'any',
      index: 'any',
      middle: 'open',
      ring: 'open',
      pinky: 'open',
      requirePinch: true,
    },
    action: 'haptic',
    biomechanics: {
      activeJoints: 'FDP 1 + OP + Extensors 3-5',
      keyLandmarks: [4, 8, 12, 16, 20],
      knuckleAngleDesc: 'Circular pinch contact between digits 1 & 2; digits 3, 4, 5 fan out.',
      detectionFormula: 'Pinch < 0.05 AND Middle, Ring, Pinky all extended.',
      commonMistakes: 'Curling the other three fingers into the palm.',
    },
    holdRequiredMs: 1000,
    timesPracticed: 8,
  },
];

class CustomGestureService {
  private customGestures: GestureDefinition[] = [];
  private listeners: Set<() => void> = new Set();
  private bestScores: Record<string, number> = {};

  constructor() {
    this.loadCustomGestures();
  }

  private loadCustomGestures() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_GESTURES);
      if (saved) {
        this.customGestures = JSON.parse(saved);
      }
      const savedStats = localStorage.getItem(STORAGE_KEY_TRAINING_STATS);
      if (savedStats) {
        this.bestScores = JSON.parse(savedStats);
      }
    } catch (e) {
      console.warn('Error loading custom gestures from storage:', e);
    }
  }

  public saveCustomGestures() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_GESTURES, JSON.stringify(this.customGestures));
      localStorage.setItem(STORAGE_KEY_TRAINING_STATS, JSON.stringify(this.bestScores));
      this.notify();
    } catch (e) {
      console.warn('Error saving custom gestures to storage:', e);
    }
  }

  public getAllGestures(): GestureDefinition[] {
    return [...BUILT_IN_GESTURES, ...this.customGestures];
  }

  public getGestureById(id: string): GestureDefinition | undefined {
    return this.getAllGestures().find((g) => g.id === id);
  }

  public addCustomGesture(def: Omit<GestureDefinition, 'id' | 'timesPracticed' | 'isCustom'>): GestureDefinition {
    const newId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullDef: GestureDefinition = {
      ...def,
      id: newId,
      timesPracticed: 0,
      isCustom: true,
      category: 'custom',
    };
    this.customGestures.push(fullDef);
    this.saveCustomGestures();
    return fullDef;
  }

  public deleteCustomGesture(id: string): boolean {
    const prevLen = this.customGestures.length;
    this.customGestures = this.customGestures.filter((g) => g.id !== id);
    if (this.customGestures.length !== prevLen) {
      this.saveCustomGestures();
      return true;
    }
    return false;
  }

  public recordPractice(gestureId: string, reactionTimeMs?: number) {
    const all = this.getAllGestures();
    const g = all.find((item) => item.id === gestureId);
    if (g) {
      g.timesPracticed = (g.timesPracticed || 0) + 1;
      if (reactionTimeMs) {
        if (!g.bestSpeedMs || reactionTimeMs < g.bestSpeedMs) {
          g.bestSpeedMs = reactionTimeMs;
          this.bestScores[gestureId] = reactionTimeMs;
        }
      }
      this.saveCustomGestures();
    }
  }

  public getBestSpeed(gestureId: string): number | undefined {
    return this.bestScores[gestureId];
  }

  /**
   * Evaluates raw 21 landmarks into a high-level FingerStateVector
   */
  public extractFingerVector(landmarks: Array<{ x: number; y: number; z?: number }>): FingerStateVector | null {
    if (!landmarks || landmarks.length < 21) return null;

    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    const distFromWrist = (pt: { x: number; y: number }) => Math.hypot(pt.x - wrist.x, pt.y - wrist.y);

    // Dynamic thresholds based on MCP joints
    const isThumbOpen = distFromWrist(thumbTip) > distFromWrist(landmarks[2]) * 1.15;
    const isIndexOpen = distFromWrist(indexTip) > distFromWrist(landmarks[6]) * 1.18;
    const isMiddleOpen = distFromWrist(middleTip) > distFromWrist(landmarks[10]) * 1.18;
    const isRingOpen = distFromWrist(ringTip) > distFromWrist(landmarks[14]) * 1.18;
    const isPinkyOpen = distFromWrist(pinkyTip) > distFromWrist(landmarks[18]) * 1.18;

    const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    const isPinching = pinchDist < 0.055;
    const handSpan = distFromWrist(middleTip);

    return {
      thumb: isThumbOpen,
      index: isIndexOpen,
      middle: isMiddleOpen,
      ring: isRingOpen,
      pinky: isPinkyOpen,
      isPinching,
      pinchDistance: pinchDist,
      handSpan,
    };
  }

  /**
   * Matches a FingerStateVector against a GestureDefinition ruleset.
   * Returns match confidence (0.0 to 1.0) and detailed diagnostic mismatches.
   */
  public evaluateMatch(
    vector: FingerStateVector,
    gesture: GestureDefinition
  ): {
    matched: boolean;
    confidence: number;
    mismatches: string[];
  } {
    const mismatches: string[] = [];
    let matchScore = 0;
    const totalChecks = 6;

    // Check pinch condition
    if (gesture.rules.requirePinch !== undefined) {
      if (gesture.rules.requirePinch) {
        if (vector.isPinching) {
          matchScore += 1;
        } else {
          mismatches.push('Bring Thumb & Index fingertips together to pinch.');
        }
      } else {
        if (!vector.isPinching) {
          matchScore += 1;
        } else {
          mismatches.push('Release pinch; separate Thumb and Index tips.');
        }
      }
    } else {
      matchScore += 1;
    }

    // Check 5 fingers
    const checkFinger = (
      name: string,
      expected: 'open' | 'closed' | 'any',
      actual: boolean
    ) => {
      if (expected === 'any') {
        matchScore += 1;
        return;
      }
      const actualState = actual ? 'open' : 'closed';
      if (expected === actualState) {
        matchScore += 1;
      } else {
        mismatches.push(
          expected === 'open'
            ? `Extend your ${name} straight.`
            : `Curl your ${name} into your palm.`
        );
      }
    };

    checkFinger('Thumb', gesture.rules.thumb, vector.thumb);
    checkFinger('Index finger', gesture.rules.index, vector.index);
    checkFinger('Middle finger', gesture.rules.middle, vector.middle);
    checkFinger('Ring finger', gesture.rules.ring, vector.ring);
    checkFinger('Pinky finger', gesture.rules.pinky, vector.pinky);

    const confidence = Math.max(0, Math.min(1, matchScore / totalChecks));
    const matched = mismatches.length === 0;

    return {
      matched,
      confidence,
      mismatches,
    };
  }

  /**
   * Executes the real action mapped to a gesture
   */
  public executeAction(gesture: GestureDefinition) {
    this.recordPractice(gesture.id);

    // Audio & Haptic feedback
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 30, 40]);
      } catch {}
    }

    switch (gesture.action) {
      case 'chat':
        window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'chat' } }));
        break;
      case 'voice':
        window.dispatchEvent(new CustomEvent('gkedit:toggle_voice_modal'));
        break;
      case 'torch':
        window.dispatchEvent(new CustomEvent('gkedit:toggle_torch'));
        break;
      case 'clear':
        window.dispatchEvent(new CustomEvent('gkedit:clear_input'));
        break;
      case 'stop':
        window.dispatchEvent(new CustomEvent('gkedit:stop_stream'));
        break;
      case 'home_device':
        window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'tools' } }));
        window.dispatchEvent(new CustomEvent('gkedit:open_subtool', { detail: { tool: 'device' } }));
        break;
      case 'custom_prompt':
        if (gesture.customPromptText) {
          window.dispatchEvent(
            new CustomEvent('gkedit:fill_chat_prompt', { detail: { prompt: gesture.customPromptText } })
          );
          window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'chat' } }));
        }
        break;
      case 'haptic':
      default:
        // Already buzzed
        break;
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Error in custom gesture listener:', err);
      }
    });
  }
}

export const customGestureService = new CustomGestureService();
