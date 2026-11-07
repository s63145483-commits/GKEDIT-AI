export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'creator' | 'editor' | 'developer' | 'explorer';
  preferredLanguage: 'telugu' | 'english' | 'tanglish' | 'adaptive';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  groundingUsed?: 'search' | 'maps' | 'none';
  audioBase64?: string;
  isStreaming?: boolean;
  error?: boolean;
  retryable?: boolean;
  durationSec?: number;
  wordCount?: number;
  bioSceneUpdate?: {
    modelType: 'DNA_HELIX' | 'CELL_NUCLEUS' | 'VIRUS_CAPSID' | 'PROTEIN_FOLD';
    mutationLevel: number;
    primaryColor: string;
    rotationSpeed: number;
    gameChallenge: string;
  };
  bioscienceObservationUpdate?: {
    specimen: 'DNA_HELIX' | 'EUKARYOTIC_CELL' | 'VIRUS_STRUCTURE' | 'PROTEIN_FOLDING';
    highlightOrganelle: string;
    biome?: 'STANDARD_LAB' | 'TUNDRA' | 'TROPICAL' | 'DEEP_SEA' | 'HYDROTHERMAL_VENT';
    phLevel?: number;
    temperature?: number;
    crossSectionSlice?: number;
    kineticSpeed?: number;
    activeProcess?: 'NONE' | 'DNA_REPLICATION' | 'MRNA_TRANSCRIPTION' | 'MITOSIS_CYCLE';
    processStep?: number;
    scientificNotes: string;
  };
  bluetoothAction?: {
    action: 'connect_bluetooth_device' | 'disconnect_bluetooth_device' | 'get_device_battery';
    deviceTypeHint?: string;
    deviceId?: string;
    status: 'pending' | 'success' | 'failed' | 'cancelled';
    deviceName?: string;
    batteryLevel?: number | null;
    batteryServiceAvailable?: boolean;
    error?: string;
  };
}

export type ActiveTab =
  | 'dashboard'
  | 'chat'
  | 'biolab'
  | 'camera'
  | 'tools'
  | 'bookview'
  | 'generators'
  | 'showcase'
  | 'settings'
  | 'maps'
  | 'devotional'
  | 'inditrack'
  | 'monitor';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  category?: 'chat' | 'astrology' | 'tools' | 'devotional';
  rashi?: string;
  rashiTelugu?: string;
  rashiSymbol?: string;
}

export interface ScriptScene {
  sceneNumber: number;
  title: string;
  timestamp: string;
  visualDescription: string;
  spokenNarration: string;
  bRollFootage?: string;
  soundEffects?: string;
  backgroundMusic?: string;
  editingDirectives?: string;
  transition?: string;
}

export interface VideoScriptData {
  title: string;
  topic: string;
  logline: string;
  targetDuration: string;
  videoType: string;
  tone: string;
  aspectRatio: string;
  pacing: string;
  language: string;
  hookSummary?: string;
  scenes: ScriptScene[];
  editingChecklist?: {
    recommendedBpm?: string;
    colorGradingLut?: string;
    bRollIdeas?: string[];
    sfxKeywords?: string[];
    onScreenGraphics?: string[];
  };
  callToAction?: string;
  rawScriptMarkdown?: string;
}

