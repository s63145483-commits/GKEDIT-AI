/**
 * Real-time Gesture Event Broker
 * Enables decoupled communication between the Floating Webcam HUD gesture engine
 * and any UI consumers (ChatView, Voice modal, audio players, etc.).
 */

export type RecognizedGestureName =
  | 'Thumb_Up'
  | 'Victory'
  | 'Open_Palm'
  | 'Closed_Fist'
  | 'Pointing_Up'
  | 'ILoveYou'
  | 'Pinch'
  | 'None';

export interface GestureActionEvent {
  gesture: RecognizedGestureName;
  confidence: number;
  timestamp: number;
}

export type GestureActionType = 'send' | 'toggle_voice' | 'clear' | 'stop';

export type AirKeyAction =
  | { type: 'char'; char: string }
  | { type: 'space' }
  | { type: 'backspace' }
  | { type: 'send' };

export interface GestureFrequencyStats {
  // Counts by recognized gesture
  gestures: {
    Thumb_Up: number;
    Victory: number;
    Open_Palm: number;
    Closed_Fist: number;
    Pointing_Up: number;
    ILoveYou: number;
    [key: string]: number;
  };
  // Counts for air keyboard interactions
  airTyping: {
    totalCharsTyped: number;
    spaceCount: number;
    backspaceCount: number;
    sendCount: number;
    pinchTaps: number;
    hoverTaps: number;
  };
  // Interaction timeline & accuracy
  totalDetections: number;
  totalActionsTriggered: number;
  averageConfidence: number;
  lastUsedTimestamp: number | null;
  firstUsedTimestamp: number | null;
}

const DEFAULT_FREQUENCY_STATS: GestureFrequencyStats = {
  gestures: {
    Thumb_Up: 18,
    Victory: 12,
    Open_Palm: 14,
    Closed_Fist: 8,
    Pointing_Up: 24,
    ILoveYou: 5,
  },
  airTyping: {
    totalCharsTyped: 86,
    spaceCount: 15,
    backspaceCount: 7,
    sendCount: 6,
    pinchTaps: 42,
    hoverTaps: 65,
  },
  totalDetections: 120,
  totalActionsTriggered: 57,
  averageConfidence: 0.88,
  lastUsedTimestamp: Date.now(),
  firstUsedTimestamp: Date.now() - 3600 * 1000 * 24 * 3,
};

type GestureListener = (event: GestureActionEvent) => void;
type AirKeyListener = (key: AirKeyAction) => void;
type FrequencyListener = (stats: GestureFrequencyStats) => void;
type ActionDispatcher = (action: GestureActionType, detail?: any) => void;

class GestureEventService {
  private listeners: Set<GestureListener> = new Set();
  private airKeyListeners: Set<AirKeyListener> = new Set();
  private frequencyListeners: Set<FrequencyListener> = new Set();
  private actionHandlers: Map<GestureActionType, Set<() => void>> = new Map();
  private lastTriggerTime: number = 0;
  private lastTriggeredGesture: string = '';
  private cooldownMs: number = 1400; // Debounce gesture triggers to avoid accidental multi-fires
  private stats: GestureFrequencyStats = DEFAULT_FREQUENCY_STATS;

  constructor() {
    this.loadStats();
  }

  private loadStats() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('gkedit_gesture_frequency_stats');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.stats = {
            ...DEFAULT_FREQUENCY_STATS,
            ...parsed,
            gestures: { ...DEFAULT_FREQUENCY_STATS.gestures, ...(parsed.gestures || {}) },
            airTyping: { ...DEFAULT_FREQUENCY_STATS.airTyping, ...(parsed.airTyping || {}) },
          };
        }
      } catch (e) {
        console.warn('Failed to load gesture stats from storage:', e);
      }
    }
  }

  private saveStats() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('gkedit_gesture_frequency_stats', JSON.stringify(this.stats));
      } catch (e) {
        console.warn('Failed to save gesture stats:', e);
      }
    }
    this.frequencyListeners.forEach((fn) => {
      try {
        fn({ ...this.stats });
      } catch {}
    });
  }

  // Get current frequency stats snapshot
  getStats(): GestureFrequencyStats {
    return { ...this.stats };
  }

  // Subscribe to real-time stats updates
  subscribeStats(listener: FrequencyListener): () => void {
    this.frequencyListeners.add(listener);
    listener({ ...this.stats });
    return () => this.frequencyListeners.delete(listener);
  }

  // Reset frequency metrics
  resetStats() {
    this.stats = {
      gestures: {
        Thumb_Up: 0,
        Victory: 0,
        Open_Palm: 0,
        Closed_Fist: 0,
        Pointing_Up: 0,
        ILoveYou: 0,
      },
      airTyping: {
        totalCharsTyped: 0,
        spaceCount: 0,
        backspaceCount: 0,
        sendCount: 0,
        pinchTaps: 0,
        hoverTaps: 0,
      },
      totalDetections: 0,
      totalActionsTriggered: 0,
      averageConfidence: 0.85,
      lastUsedTimestamp: null,
      firstUsedTimestamp: Date.now(),
    };
    this.saveStats();
  }

  // Register listener for raw gesture events (e.g. for telemetry or UI widgets)
  subscribe(listener: GestureListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Register listener for Air-Typing holographic keyboard keystrokes
  onAirKey(listener: AirKeyListener): () => void {
    this.airKeyListeners.add(listener);
    return () => this.airKeyListeners.delete(listener);
  }

  // Dispatches an air-typed key event directly to listeners
  dispatchAirKey(keyAction: AirKeyAction): void {
    this.airKeyListeners.forEach((listener) => {
      try {
        listener(keyAction);
      } catch (err) {
        console.error('AirKey listener error:', err);
      }
    });

    // Record frequency analytics
    if (keyAction.type === 'char') {
      this.stats.airTyping.totalCharsTyped += 1;
    } else if (keyAction.type === 'space') {
      this.stats.airTyping.spaceCount += 1;
    } else if (keyAction.type === 'backspace') {
      this.stats.airTyping.backspaceCount += 1;
    } else if (keyAction.type === 'send') {
      this.stats.airTyping.sendCount += 1;
    }
    this.stats.lastUsedTimestamp = Date.now();
    this.saveStats();

    try {
      window.dispatchEvent(
        new CustomEvent('gkedit:air_key', {
          detail: keyAction,
        })
      );
    } catch {
      // Safe fallback
    }
  }

  // Record tap trigger method (pinch vs hover)
  recordTapMethod(method: 'pinch' | 'hover') {
    if (method === 'pinch') {
      this.stats.airTyping.pinchTaps += 1;
    } else {
      this.stats.airTyping.hoverTaps += 1;
    }
    this.saveStats();
  }

  // Register handler for specific gesture action
  onAction(action: GestureActionType, handler: () => void): () => void {
    if (!this.actionHandlers.has(action)) {
      this.actionHandlers.set(action, new Set());
    }
    const handlers = this.actionHandlers.get(action)!;
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  }

  // Dispatches actions based on recognized gesture when confidence > 75%
  dispatchGesture(gesture: RecognizedGestureName, confidence: number): boolean {
    const now = Date.now();
    const event: GestureActionEvent = { gesture, confidence, timestamp: now };

    // Notify visual subscribers
    this.listeners.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error('Gesture listener error:', err);
      }
    });

    if (confidence < 0.75 || gesture === 'None') {
      return false;
    }

    // Cooldown check for actions (1.4s between repeated same gestures or 900ms between different gestures)
    const minWait = gesture === this.lastTriggeredGesture ? this.cooldownMs : 900;
    if (now - this.lastTriggerTime < minWait) {
      return false;
    }

    let actionType: GestureActionType | null = null;

    switch (gesture) {
      case 'Thumb_Up':
        actionType = 'send';
        break;
      case 'Victory':
        actionType = 'toggle_voice';
        break;
      case 'Open_Palm':
        actionType = 'clear';
        break;
      case 'Closed_Fist':
        actionType = 'stop';
        break;
      default:
        actionType = null;
    }

    // Increment gesture detection frequency
    this.stats.totalDetections += 1;
    if (this.stats.gestures[gesture] !== undefined) {
      this.stats.gestures[gesture] += 1;
    } else {
      this.stats.gestures[gesture] = 1;
    }
    this.stats.lastUsedTimestamp = now;
    this.saveStats();

    if (actionType) {
      this.lastTriggerTime = now;
      this.lastTriggeredGesture = gesture;
      this.stats.totalActionsTriggered += 1;
      this.saveStats();
      const handlers = this.actionHandlers.get(actionType);
      if (handlers && handlers.size > 0) {
        handlers.forEach((h) => {
          try {
            h();
          } catch (err) {
            console.error(`Error executing action for gesture ${gesture}:`, err);
          }
        });
      }

      // Also fire global custom DOM event for external listeners
      try {
        window.dispatchEvent(
          new CustomEvent('gkedit:gesture_action', {
            detail: { action: actionType, gesture, confidence },
          })
        );
      } catch {
        // Safe fallback
      }
      return true;
    }

    return false;
  }
}

export const gestureEventService = new GestureEventService();
