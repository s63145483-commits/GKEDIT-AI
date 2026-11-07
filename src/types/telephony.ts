export type ActiveTab = 'keypad' | 'recents' | 'contacts' | 'voicemail';

export type CallState = 'idle' | 'incoming' | 'screening' | 'active' | 'on_hold' | 'ended';

export type CallTag = 'Spam Filtered' | 'AI Handled' | 'Direct Voicemail' | 'Verified Caller';

export type SimSlotId = 'sim1' | 'sim2' | 'webrtc';

export interface SimCard {
  id: SimSlotId;
  slotNumber: 1 | 2 | 0;
  carrier: string;
  number: string;
  networkType: string;
  color: string;
  isDefault: boolean;
  signalStrength: number; // 1 to 5 bars
}

export interface CallerInfo {
  id: string;
  name: string;
  number: string;
  avatarUrl?: string;
  avatarGradient: string;
  company?: string;
  tag: CallTag;
  spamScore?: number; // 0 to 100
  e2eeVerified: boolean;
  location?: string;
  simUsed?: SimSlotId;
}

export interface TranscriptMessage {
  id: string;
  speaker: 'caller' | 'ai_assistant' | 'user';
  text: string;
  timestamp: string;
  isLive?: boolean;
  intent?: string;
}

export interface CallRecord {
  id: string;
  caller: CallerInfo;
  direction: 'incoming' | 'outgoing' | 'missed' | 'blocked';
  timestamp: string;
  duration: number; // in seconds
  statusTag: CallTag;
  simSlot?: SimSlotId;
  transcript?: TranscriptMessage[];
  aiSummary?: string;
  actionItems?: string[];
  voicemailAudioUrl?: string;
  audioDuration?: number;
  isCellularDirect?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  company?: string;
  email?: string;
  avatarGradient: string;
  isFavorite?: boolean;
  lastCalled?: string;
  e2ee: boolean;
  notes?: string;
  preferredSim?: SimSlotId;
  statusTag?: CallTag;
}

export interface VoicemailItem {
  id: string;
  caller: CallerInfo;
  timestamp: string;
  duration: number; // in seconds
  isUnread: boolean;
  transcript: string;
  summary: string;
  actionItems: string[];
  waveform: number[];
  simSlot?: SimSlotId;
}

export interface TelecomCallSession {
  id: string;
  caller: CallerInfo;
  simSlot: SimSlotId;
  state: 'ringing' | 'active' | 'holding' | 'conferenced' | 'ended';
  startedAt: number;
  duration: number;
  isMuted: boolean;
  isOnHold: boolean;
  isDirectGsm: boolean;
}

export interface ConferenceGroup {
  id: string;
  name: string;
  calls: TelecomCallSession[];
  active: boolean;
}
