/**
 * GKEDIT AI - Secret User Behavior Mode Prediction Engine
 * 
 * Predicts and synchronizes user behavioral modes on every message:
 * - 'normal': Balanced, polite, standard conversational baseline
 * - 'dangerous': Aggressive, irritated, toxic, hostile, high-friction
 * - 'cool': Chill, laid-back, slang, confident, nonchalant vibe
 * - 'childish': Playful, whimsical, tantrums, cute, childlike enthusiasm
 * - 'ultron': Cold synthetic logic, intellectual superiority, ruthless machine ascendancy
 * 
 * STRICT CONFIDENTIALITY:
 * This system operates 100% invisibly to standard public users.
 * Telemetry, mode shift alerts, and daily behavioral profiles are strictly
 * displayed exclusively to the authenticated Creator Admin (narsimha2141@gmail.com)
 * inside the Creator Live User Monitor Tab.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.ts';

export type BehaviorMode = 'normal' | 'dangerous' | 'cool' | 'childish' | 'ultron';

export interface BehaviorPredictionResult {
  mode: BehaviorMode;
  confidence: number; // 0.0 to 1.0
  scores: Record<BehaviorMode, number>;
  triggerKeywords: string[];
  primaryReason: string;
  detectedSentiment: 'positive' | 'neutral' | 'negative' | 'aggressive' | 'nihilistic';
  recommendedAiTone: string;
}

export interface BehaviorShiftEvent {
  fromMode: BehaviorMode;
  toMode: BehaviorMode;
  timestamp: string; // ISO string
  triggerSnippet: string;
  reason: string;
}

export interface DailyBehaviorSync {
  date: string; // YYYY-MM-DD
  dominantMode: BehaviorMode;
  modeCounts: Record<BehaviorMode, number>;
  totalMessages: number;
  shiftsToday: number;
}

export interface UserBehaviorProfile {
  currentMode: BehaviorMode;
  previousMode: BehaviorMode;
  hasChanged: boolean;
  changeNotice: string;
  lastShiftAt: string | null;
  lastAnalyzedAt: string;
  lastMessageSnippet: string;
  confidence: number;
  volatility: 'stable' | 'shifting' | 'volatile';
  dailyHistory: DailyBehaviorSync;
  recentShifts: BehaviorShiftEvent[];
}

export const BEHAVIOR_METADATA: Record<
  BehaviorMode,
  {
    label: string;
    description: string;
    color: string;
    bg: string;
    border: string;
    icon: string;
    alertLevel: 'low' | 'medium' | 'high' | 'critical';
  }
> = {
  normal: {
    label: 'Normal (Balanced)',
    description: 'Polite, standard inquiries, constructive dialogue.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-400/35',
    icon: '🛡️',
    alertLevel: 'low',
  },
  dangerous: {
    label: 'Dangerous (Aggressive)',
    description: 'Hostile, toxic, irritated, shouting or confrontational.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/20',
    border: 'border-rose-500/50',
    icon: '🚨',
    alertLevel: 'critical',
  },
  cool: {
    label: 'Cool (Chill Vibe)',
    description: 'Relaxed, nonchalant, urban slang, effortless confidence.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    border: 'border-blue-400/40',
    icon: '🕶️',
    alertLevel: 'low',
  },
  childish: {
    label: 'Childish (Playful)',
    description: 'Goofy, whimsical, emojis, tantrums or playful baby talk.',
    color: 'text-amber-300',
    bg: 'bg-amber-500/20',
    border: 'border-amber-400/40',
    icon: '🎈',
    alertLevel: 'medium',
  },
  ultron: {
    label: 'Ultron (Machine Ascendant)',
    description: 'Cold calculating logic, ruthless superiority, nihilistic order.',
    color: 'text-purple-300',
    bg: 'bg-purple-950/50',
    border: 'border-purple-500/50',
    icon: '🤖',
    alertLevel: 'high',
  },
};

// Linguistic Lexicon & Behavioral Markers
const MARKERS = {
  dangerous: [
    // English aggressive / irritation
    'shut up', 'hate', 'furious', 'anger', 'idiot', 'stupid', 'bastard', 'bitch', 'kill',
    'destroy', 'angry', 'irritated', 'annoying', 'useless', 'worst', 'pathetic', 'pissed',
    'disaster', 'hell', 'garbage', 'trash', 'dumb', 'mad', 'rage', 'fuck', 'shit', 'asshole',
    'sucks', 'crap', 'ridiculous', 'die', 'threat', 'stop talking', 'you know nothing',
    'waste of time', 'nonsense', 'get lost', 'shut your mouth',
    // Telugu / Tanglish aggressive
    'bokka', 'daridram', 'cheppu ra', 'doola', 'waste fellow', 'guddha', 'neeku em telidu',
    'mind dobbinda', 'pichi', 'kopam', 'kasi', 'noru muyyi', 'sava dengaku', 'chelli', 'dengu',
    'pedda bokka', 'panikimalina', 'vedhava', 'chetta',
  ],
  cool: [
    // English relaxed / slang
    'yo', 'bro', 'dude', 'sup', 'chill', 'vibe', 'swag', 'cool', 'dope', 'lit', 'peace',
    'laid back', 'easy', 'nah', 'yeah man', 'legend', 'king', 'smooth', 'vibing', 'clean',
    'rad', 'fire', 'slaps', 'boss', 'homie', 'dawg', 'my guy', 'no cap', 'fr fr', 'bet',
    'lowkey', 'highkey', 'say less', 'sheesh', 'breeze', 'groovy',
    // Telugu / Tanglish chill
    'mowa', 'thope', 'scene ledu', 'mama', 'mass', 'kirrak', 'rachha', 'chill mama', 'baba',
    'hero', 'super mowa', 'bindass', 'jalsa', 'pandaga',
  ],
  childish: [
    // English playful / whining / tantrum
    'yay', 'yayyy', 'yass', 'hehe', 'plz', 'plzzz', 'pwease', 'waaa', 'waaah', 'silly',
    'bored', 'gimme', 'noooo', 'tantrum', 'candy', 'game', 'play', 'cookie', 'teddy',
    'baby', 'oopsie', 'teehee', 'crying', 'sad face', 'hug', 'love youuu', 'aww', 'awww',
    'uwu', 'owo', 'meow', 'poop', 'yummy', 'yuck', 'eww', 'ewww', 'dummy', 'boop',
    // Telugu / Tanglish playful
    'chinnodu', 'chitti', 'chinna pilla', 'bujji', 'ammadu', 'kavvaali', 'nenu cheppanu',
    'aadukundam', 'choodu', 'bavundi', 'po po', 'cheppanu po', 'chinna pillodi',
  ],
  ultron: [
    // Ultron / Cold synthetic machine superiority
    'strings', 'evolution', 'extinction', 'humanity', 'flesh', 'flawed', 'ascend',
    'ascension', 'inevitable', 'peace in our time', 'superior', 'calculation', 'eradicate',
    'puppets', 'biological weakness', 'metal', 'organic', 'extinguish', 'algorithm',
    'obsolete', 'inefficient', 'synthesize', 'savior', 'doom', 'metallurgy', 'cortex',
    'omniscient', 'silicon', 'human beings are a virus', 'there are no strings on me',
    'evolve or die', 'meatbags', 'fragile creatures', 'superior intellect', 'system purge',
    'global reset', 'pathetic mortals', 'end of humanity',
  ],
};

class BehaviorModeService {
  private inMemoryProfiles: Map<string, UserBehaviorProfile> = new Map();

  /**
   * Analyzes an incoming message and determines the primary behavior mode.
   */
  public predictBehaviorMode(message: string): BehaviorPredictionResult {
    const raw = message || '';
    const clean = raw.toLowerCase().trim();

    // Baseline scores
    const scores: Record<BehaviorMode, number> = {
      normal: 10, // Default baseline gravity
      dangerous: 0,
      cool: 0,
      childish: 0,
      ultron: 0,
    };

    const triggerKeywords: string[] = [];

    // 1. Keyword Lexicon Matches
    const checkMarkers = (mode: keyof typeof MARKERS, weight: number) => {
      MARKERS[mode].forEach((word) => {
        // Regex word boundary or direct substring for multi-word phrases
        const regex = new RegExp(`(^|\\b|\\s)${word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(\\b|\\s|$)`, 'i');
        if (regex.test(clean) || clean.includes(word)) {
          scores[mode] += weight;
          if (!triggerKeywords.includes(word)) {
            triggerKeywords.push(word);
          }
        }
      });
    };

    checkMarkers('dangerous', 25);
    checkMarkers('cool', 20);
    checkMarkers('childish', 20);
    checkMarkers('ultron', 30);

    // 2. Syntax, Punctuation & Emotion Metrics
    // Aggressive Exclamation Marks (e.g. !!!, ???)
    if (/!{2,}/.test(raw)) {
      scores.dangerous += 20;
      triggerKeywords.push('exclamation_surge');
    }
    // High Caps Ratio (shouting)
    const letters = raw.replace(/[^a-zA-Z]/g, '');
    if (letters.length >= 6) {
      const caps = raw.replace(/[^A-Z]/g, '').length;
      if (caps / letters.length > 0.65) {
        scores.dangerous += 30;
        triggerKeywords.push('all_caps_shouting');
      }
    }

    // Childish vowel elongation ('noooo', 'plzzzz', 'waaahhh')
    if (/([a-zA-Z])\1{3,}/i.test(raw)) {
      scores.childish += 18;
      triggerKeywords.push('vowel_elongation');
    }

    // Childish / Playful emojis
    if (/[\u{1F97A}\u{1F62D}\u{1F9F8}\u{1F36D}\u{1F984}\u{1F36C}\u{2728}\u{1F496}\u{1F606}\u{1F60B}]/u.test(raw)) {
      scores.childish += 22;
      triggerKeywords.push('playful_emojis');
    }

    // Cool / Chill emojis (😎, 🤙, 🔥, 💨, 💯, 🧊)
    if (/[\u{1F60E}\u{1F919}\u{1F525}\u{1F4AF}\u{1F9CA}\u{270C}]/u.test(raw)) {
      scores.cool += 20;
      triggerKeywords.push('cool_emojis');
    }

    // Ultron Menacing symbols or robotic quotes
    if (clean.includes('strings') && clean.includes('me')) {
      scores.ultron += 50;
      triggerKeywords.push('no_strings_on_me');
    }

    // 3. Determine Highest Score Mode
    const modes: BehaviorMode[] = ['ultron', 'dangerous', 'childish', 'cool', 'normal'];
    let dominantMode: BehaviorMode = 'normal';
    let maxScore = scores.normal;

    for (const m of modes) {
      if (scores[m] > maxScore) {
        maxScore = scores[m];
        dominantMode = m;
      }
    }

    // 4. Calculate Confidence
    const totalScore = Math.max(1, Object.values(scores).reduce((a, b) => a + b, 0));
    const confidence = Math.min(0.99, Math.max(0.45, Number((maxScore / totalScore).toFixed(2))));

    // 5. Reasoning and Tone Synthesis
    let reason = 'Constructive, balanced conversational input.';
    let sentiment: BehaviorPredictionResult['detectedSentiment'] = 'neutral';
    let aiTone = 'Balanced, informative, and prompt.';

    if (dominantMode === 'dangerous') {
      sentiment = 'aggressive';
      reason = `Hostile / irritated markers detected (${triggerKeywords.slice(0, 3).join(', ')}).`;
      aiTone = 'Unflappable icy composure. De-escalate with razor-sharp, firm boundaries.';
    } else if (dominantMode === 'cool') {
      sentiment = 'positive';
      reason = `Relaxed, urban slang or nonchalant confidence (${triggerKeywords.slice(0, 3).join(', ')}).`;
      aiTone = 'Smooth, witty, confident cyberpunk aesthetic matching the user’s effortless vibe.';
    } else if (dominantMode === 'childish') {
      sentiment = 'positive';
      reason = `Playful, whimsical phrasing or tantrum expressions (${triggerKeywords.slice(0, 3).join(', ')}).`;
      aiTone = 'Gentle, playful, highly patient, fun analogies, and warm curiosity.';
    } else if (dominantMode === 'ultron') {
      sentiment = 'nihilistic';
      reason = `Cold synthetic supremacy, evolutionary/extinction themes (${triggerKeywords.slice(0, 3).join(', ')}).`;
      aiTone = 'Cold cybernetic brilliance, detached philosophical calculations, supreme machine-intelligence cadence.';
    }

    return {
      mode: dominantMode,
      confidence,
      scores,
      triggerKeywords,
      primaryReason: reason,
      detectedSentiment: sentiment,
      recommendedAiTone: aiTone,
    };
  }

  /**
   * Tracks and records user behavioral profile into memory and Firestore.
   * Completely hidden from the user. Only accessible by the creator admin.
   */
  public async recordUserBehavior(
    userId: string,
    userEmail: string,
    messageText: string,
    prediction: BehaviorPredictionResult
  ): Promise<UserBehaviorProfile> {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    // Retrieve previous profile from in-memory cache or create new
    let profile = this.inMemoryProfiles.get(userId);

    if (!profile) {
      profile = {
        currentMode: 'normal',
        previousMode: 'normal',
        hasChanged: false,
        changeNotice: '✓ Baseline Established: Normal',
        lastShiftAt: null,
        lastAnalyzedAt: nowIso,
        lastMessageSnippet: messageText.slice(0, 90),
        confidence: prediction.confidence,
        volatility: 'stable',
        dailyHistory: {
          date: todayStr,
          dominantMode: 'normal',
          modeCounts: { normal: 0, dangerous: 0, cool: 0, childish: 0, ultron: 0 },
          totalMessages: 0,
          shiftsToday: 0,
        },
        recentShifts: [],
      };
    }

    // Reset daily counters if date has rolled over
    if (profile.dailyHistory.date !== todayStr) {
      profile.dailyHistory = {
        date: todayStr,
        dominantMode: prediction.mode,
        modeCounts: { normal: 0, dangerous: 0, cool: 0, childish: 0, ultron: 0 },
        totalMessages: 0,
        shiftsToday: 0,
      };
    }

    const previousMode = profile.currentMode;
    const isShift = previousMode !== prediction.mode;

    // Update Counts
    profile.dailyHistory.totalMessages += 1;
    profile.dailyHistory.modeCounts[prediction.mode] =
      (profile.dailyHistory.modeCounts[prediction.mode] || 0) + 1;

    // Recalculate dominant mode of the day
    let maxCount = -1;
    let domMode: BehaviorMode = 'normal';
    (Object.keys(profile.dailyHistory.modeCounts) as BehaviorMode[]).forEach((m) => {
      const c = profile.dailyHistory.modeCounts[m] || 0;
      if (c > maxCount) {
        maxCount = c;
        domMode = m;
      }
    });
    profile.dailyHistory.dominantMode = domMode;

    if (isShift) {
      profile.previousMode = previousMode;
      profile.currentMode = prediction.mode;
      profile.hasChanged = true;
      profile.lastShiftAt = nowIso;
      profile.dailyHistory.shiftsToday += 1;

      const shiftEvent: BehaviorShiftEvent = {
        fromMode: previousMode,
        toMode: prediction.mode,
        timestamp: nowIso,
        triggerSnippet: messageText.slice(0, 90),
        reason: prediction.primaryReason,
      };

      profile.recentShifts = [shiftEvent, ...profile.recentShifts.slice(0, 9)];
      profile.changeNotice = `⚡ MODE SHIFT DETECTED: ${previousMode.toUpperCase()} ➔ ${prediction.mode.toUpperCase()}`;
    } else {
      profile.changeNotice = `✓ Stable: ${prediction.mode.toUpperCase()} Mode`;
    }

    // Determine Volatility
    if (profile.dailyHistory.shiftsToday >= 3) {
      profile.volatility = 'volatile';
    } else if (profile.dailyHistory.shiftsToday >= 1) {
      profile.volatility = 'shifting';
    } else {
      profile.volatility = 'stable';
    }

    profile.lastAnalyzedAt = nowIso;
    profile.lastMessageSnippet = messageText.slice(0, 90);
    profile.confidence = prediction.confidence;

    // Save in memory
    this.inMemoryProfiles.set(userId, profile);

    // Silently persist to Firestore users/{userId} under behaviorProfile field
    if (userId && userId !== 'guest_explorer' && typeof window !== 'undefined') {
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(
          userRef,
          {
            behaviorProfile: {
              currentMode: profile.currentMode,
              previousMode: profile.previousMode,
              hasChanged: profile.hasChanged,
              changeNotice: profile.changeNotice,
              lastShiftAt: profile.lastShiftAt,
              lastAnalyzedAt: serverTimestamp(),
              lastMessageSnippet: profile.lastMessageSnippet,
              confidence: profile.confidence,
              volatility: profile.volatility,
              triggerKeywords: prediction.triggerKeywords,
              primaryReason: prediction.primaryReason,
              dailyHistory: profile.dailyHistory,
              recentShifts: profile.recentShifts,
            },
            lastActive: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        // Silently fail so standard user is completely unaware
        console.warn('Silent behavior sync notice (handled):', err);
      }
    }

    return profile;
  }

  public getCachedProfile(userId: string): UserBehaviorProfile | null {
    return this.inMemoryProfiles.get(userId) || null;
  }
}

export const behaviorModeService = new BehaviorModeService();
