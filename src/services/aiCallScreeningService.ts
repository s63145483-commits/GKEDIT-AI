export interface CallTranscriptLine {
  speaker: 'caller' | 'ai' | 'user';
  text: string;
  time: string;
}

export type CallStatusTag = 'verified' | 'spam_filtered' | 'ai_handled' | 'voicemail';

export interface CallLogItem {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  timestamp: string;
  duration: string;
  direction: 'incoming' | 'outgoing' | 'missed';
  statusTag: CallStatusTag;
  summary: string;
  notes?: string[];
  transcript?: CallTranscriptLine[];
  voicemailDuration?: string;
  carrier?: string;
  location?: string;
  isSpam?: boolean;
}

export interface LiveScreeningState {
  isActive: boolean;
  callerName: string;
  callerPhone: string;
  callerAvatar: string;
  carrier: string;
  location: string;
  mode: 'ringing' | 'ai_answering' | 'connected' | 'spam_blocked' | 'ended';
  transcripts: CallTranscriptLine[];
  aiNotes: string[];
  isMuted: boolean;
  isRecording: boolean;
  recordingSeconds: number;
}

type ScreeningListener = (state: LiveScreeningState) => void;
type LedgerListener = (logs: CallLogItem[]) => void;

const STORAGE_CALL_LOGS_KEY = 'gkedit_ai_dialer_call_logs_v1';

// Initial verified ledger seed
const DEFAULT_CALL_LOGS: CallLogItem[] = [
  {
    id: 'call_1',
    name: 'Nainu',
    phone: '+91 95815 69056',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    timestamp: 'Today, 12:45 PM',
    duration: '04:18',
    direction: 'incoming',
    statusTag: 'verified',
    carrier: 'Airtel 5G Plus',
    location: 'Hyderabad, IN',
    summary: 'Discussed video project timeline, export presets in Premiere, and weekend shoot schedule.',
    notes: ['Send 4K color grade LUT by 6 PM', 'Confirm drone shoot permit'],
    transcript: [
      { speaker: 'caller', text: 'Hey GK! Did you check the latest rough cut export?', time: '12:45' },
      { speaker: 'user', text: 'Yes, the grading looks super crisp. I am tweaking the audio mix now.', time: '12:46' },
      { speaker: 'caller', text: 'Awesome, let us finalize it before evening.', time: '12:48' },
    ],
  },
  {
    id: 'call_2',
    name: 'Suspicious Telemarketer',
    phone: '+1 (800) 492-0199',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    timestamp: 'Today, 10:14 AM',
    duration: '00:45',
    direction: 'incoming',
    statusTag: 'spam_filtered',
    isSpam: true,
    carrier: 'VoIP International',
    location: 'Unknown Region',
    summary: 'Robocall attempting automated warranty scam. GKEDIT AI Call Guard interrogated and blocked.',
    notes: ['Flagged globally in spam blacklist', 'Zero audio delivered to user'],
    transcript: [
      { speaker: 'ai', text: 'GKEDIT AI Call Screening: Please state your company and purpose.', time: '10:14' },
      { speaker: 'caller', text: 'This is an urgent call regarding your expiring auto insurance...', time: '10:14' },
      { speaker: 'ai', text: 'Unverified robocall signature detected. Call terminated.', time: '10:15' },
    ],
  },
  {
    id: 'call_3',
    name: 'Tech Studio Support',
    phone: '+91 80 4123 9000',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    timestamp: 'Yesterday, 04:30 PM',
    duration: '02:10',
    direction: 'incoming',
    statusTag: 'ai_handled',
    carrier: 'Jio True 5G',
    location: 'Bengaluru, IN',
    summary: 'AI Assistant answered while you were busy. Inquired about cloud render node status.',
    notes: ['Ticket #GK-982 opened', 'Status: All GPU nodes operating normally'],
    transcript: [
      { speaker: 'ai', text: 'Hello, GK is currently unavailable. I am his AI assistant. How may I help?', time: '04:30' },
      { speaker: 'caller', text: 'We received your cloud compute request. Render slot is reserved.', time: '04:31' },
      { speaker: 'ai', text: 'Thank you. I have logged the reservation for GK.', time: '04:32' },
    ],
  },
  {
    id: 'call_4',
    name: 'Vamshi Krishna',
    phone: '+91 98480 21410',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    timestamp: 'Yesterday, 11:02 AM',
    duration: '01:15',
    direction: 'incoming',
    statusTag: 'voicemail',
    voicemailDuration: '00:38',
    carrier: 'BSNL 4G',
    location: 'Vijayawada, IN',
    summary: 'Direct voicemail left: Shared feedback on YouTube thumbnail design.',
    notes: ['Check WhatsApp for reference image', 'Increase font contrast on headline'],
    transcript: [
      { speaker: 'caller', text: 'Hey bro, call me back when free. The yellow glow thumbnail is much better!', time: '11:02' },
    ],
  },
];

class AICallScreeningService {
  private callLogs: CallLogItem[] = [];
  private screeningListeners: Set<ScreeningListener> = new Set();
  private ledgerListeners: Set<LedgerListener> = new Set();
  private activeScreening: LiveScreeningState | null = null;
  private timerRef: any = null;

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    if (typeof window === 'undefined') {
      this.callLogs = [...DEFAULT_CALL_LOGS];
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_CALL_LOGS_KEY);
      if (saved) {
        this.callLogs = JSON.parse(saved);
      } else {
        this.callLogs = [...DEFAULT_CALL_LOGS];
        this.saveLogs();
      }
    } catch {
      this.callLogs = [...DEFAULT_CALL_LOGS];
    }
  }

  private saveLogs() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_CALL_LOGS_KEY, JSON.stringify(this.callLogs));
    } catch {}
    this.notifyLedger();
  }

  public subscribeLedger(fn: LedgerListener): () => void {
    this.ledgerListeners.add(fn);
    fn(this.callLogs);
    return () => this.ledgerListeners.delete(fn);
  }

  private notifyLedger() {
    this.ledgerListeners.forEach((fn) => fn([...this.callLogs]));
  }

  public subscribeScreening(fn: ScreeningListener): () => void {
    this.screeningListeners.add(fn);
    if (this.activeScreening) fn(this.activeScreening);
    return () => this.screeningListeners.delete(fn);
  }

  private notifyScreening() {
    if (this.activeScreening) {
      this.screeningListeners.forEach((fn) => fn({ ...this.activeScreening! }));
    }
  }

  public getCallLogs(): CallLogItem[] {
    return [...this.callLogs];
  }

  public getActiveScreening(): LiveScreeningState | null {
    return this.activeScreening;
  }

  /**
   * Starts a simulated or real Live AI Call Screening session
   */
  public startIncomingScreening(caller: {
    name: string;
    phone: string;
    avatar?: string;
    carrier?: string;
    location?: string;
    isSpam?: boolean;
  }) {
    if (this.timerRef) clearInterval(this.timerRef);

    this.activeScreening = {
      isActive: true,
      callerName: caller.name,
      callerPhone: caller.phone,
      callerAvatar:
        caller.avatar ||
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
      carrier: caller.carrier || '5G VoLTE Encrypted',
      location: caller.location || 'Verified P2P Caller',
      mode: 'ringing',
      transcripts: [],
      aiNotes: ['WebRTC 256-bit audio stream initiated'],
      isMuted: false,
      isRecording: false,
      recordingSeconds: 0,
    };

    this.notifyScreening();
  }

  /**
   * AI Answers call and interrogates / screens caller
   */
  public triggerAnswerViaAI() {
    if (!this.activeScreening) return;
    this.activeScreening.mode = 'ai_answering';
    this.activeScreening.transcripts.push({
      speaker: 'ai',
      text: `Hello! You reached ${this.activeScreening.callerName}'s line. I am GKEDIT Smart Call Assistant. Please state your name and purpose.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    this.activeScreening.aiNotes.push('AI Assistant screening caller identity...');
    this.notifyScreening();

    // Caller replies in live transcript
    setTimeout(() => {
      if (!this.activeScreening || this.activeScreening.mode !== 'ai_answering') return;
      this.activeScreening.transcripts.push({
        speaker: 'caller',
        text: 'Hi! I am calling regarding the video production edit schedule. Want to check if 4 PM works?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      this.activeScreening.aiNotes.push('Intent: Video production schedule confirmation (4:00 PM)');
      this.notifyScreening();

      // AI follow-up
      setTimeout(() => {
        if (!this.activeScreening || this.activeScreening.mode !== 'ai_answering') return;
        this.activeScreening.transcripts.push({
          speaker: 'ai',
          text: 'Got it. I have notified GK on his primary display. You may connect directly or leave a note.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        this.activeScreening.aiNotes.push('Action: User can tap "Connect Me" to take over call seamlessly');
        this.notifyScreening();
      }, 2200);
    }, 1800);
  }

  /**
   * Screen spam and block robocaller
   */
  public triggerScreenSpam() {
    if (!this.activeScreening) return;
    this.activeScreening.mode = 'spam_blocked';
    this.activeScreening.transcripts.push({
      speaker: 'ai',
      text: 'GKEDIT Spam Guard: This call has been flagged as unverified promotional traffic. Disconnecting.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    this.activeScreening.aiNotes.push('Spam challenge failed: Caller disconnected & blacklisted');
    this.notifyScreening();

    // Log spam in ledger
    this.logCompletedCall({
      name: this.activeScreening.callerName,
      phone: this.activeScreening.callerPhone,
      avatar: this.activeScreening.callerAvatar,
      statusTag: 'spam_filtered',
      summary: 'Spam call intercepted and neutralized by GKEDIT AI Call Guard.',
      notes: this.activeScreening.aiNotes,
      transcript: this.activeScreening.transcripts,
      duration: '00:18',
    });

    setTimeout(() => {
      this.endScreening();
    }, 3500);
  }

  /**
   * User connects / takes over the call
   */
  public connectUser() {
    if (!this.activeScreening) return;
    this.activeScreening.mode = 'connected';
    this.activeScreening.transcripts.push({
      speaker: 'user',
      text: 'Hey! I am on the line now. Thanks for waiting.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    this.activeScreening.aiNotes.push('User took over call • Real-time AI transcription active');
    this.notifyScreening();

    // Start live timer
    if (this.timerRef) clearInterval(this.timerRef);
    this.timerRef = setInterval(() => {
      if (this.activeScreening) {
        this.activeScreening.recordingSeconds += 1;
        this.notifyScreening();
      }
    }, 1000);
  }

  public toggleMute() {
    if (this.activeScreening) {
      this.activeScreening.isMuted = !this.activeScreening.isMuted;
      this.notifyScreening();
    }
  }

  public toggleRecording() {
    if (this.activeScreening) {
      this.activeScreening.isRecording = !this.activeScreening.isRecording;
      if (this.activeScreening.isRecording) {
        this.activeScreening.aiNotes.push('Encrypted call recording active');
      }
      this.notifyScreening();
    }
  }

  public endScreening() {
    if (this.timerRef) clearInterval(this.timerRef);
    if (this.activeScreening && this.activeScreening.mode === 'connected') {
      const minutes = Math.floor(this.activeScreening.recordingSeconds / 60);
      const seconds = this.activeScreening.recordingSeconds % 60;
      const durationStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      this.logCompletedCall({
        name: this.activeScreening.callerName,
        phone: this.activeScreening.callerPhone,
        avatar: this.activeScreening.callerAvatar,
        statusTag: 'verified',
        summary: `Call completed with ${this.activeScreening.callerName}. Live AI transcript generated.`,
        notes: this.activeScreening.aiNotes,
        transcript: this.activeScreening.transcripts,
        duration: durationStr || '01:10',
      });
    }
    this.activeScreening = null;
    this.screeningListeners.forEach((fn) =>
      fn({
        isActive: false,
        callerName: '',
        callerPhone: '',
        callerAvatar: '',
        carrier: '',
        location: '',
        mode: 'ended',
        transcripts: [],
        aiNotes: [],
        isMuted: false,
        isRecording: false,
        recordingSeconds: 0,
      })
    );
  }

  public logCompletedCall(data: {
    name: string;
    phone: string;
    avatar: string;
    statusTag: CallStatusTag;
    summary: string;
    notes?: string[];
    transcript?: CallTranscriptLine[];
    duration?: string;
  }) {
    const newLog: CallLogItem = {
      id: 'call_' + Date.now(),
      name: data.name,
      phone: data.phone,
      avatar: data.avatar,
      timestamp: 'Just now',
      duration: data.duration || '00:45',
      direction: 'incoming',
      statusTag: data.statusTag,
      summary: data.summary,
      notes: data.notes || [],
      transcript: data.transcript || [],
    };
    this.callLogs.unshift(newLog);
    if (this.callLogs.length > 50) this.callLogs.pop();
    this.saveLogs();
  }

  public deleteCallLog(id: string) {
    this.callLogs = this.callLogs.filter((c) => c.id !== id);
    this.saveLogs();
  }

  public clearAllLogs() {
    this.callLogs = [];
    this.saveLogs();
  }

  /**
   * T9 Predictive Contact Search Engine
   * Maps digit keys (2->ABC, 3->DEF, 4->GHI, etc.) to contact names & numbers
   */
  public searchT9(query: string, contacts: Array<{ id: string; name: string; phone: string; avatar?: string }>) {
    if (!query || !query.trim()) return [];
    const cleanQuery = query.trim().toLowerCase();

    // Mapping of characters to telephone digits
    const charToDigit: Record<string, string> = {
      a: '2', b: '2', c: '2',
      d: '3', e: '3', f: '3',
      g: '4', h: '4', i: '4',
      j: '5', k: '5', l: '5',
      m: '6', n: '6', o: '6',
      p: '7', q: '7', r: '7', s: '7',
      t: '8', u: '8', v: '8',
      w: '9', x: '9', y: '9', z: '9',
    };

    return contacts.filter((c) => {
      // 1. Direct phone digit match
      const phoneDigits = c.phone.replace(/\D/g, '');
      if (phoneDigits.includes(cleanQuery)) return true;

      // 2. Name to T9 digits match
      const nameDigits = c.name
        .toLowerCase()
        .split('')
        .map((ch) => charToDigit[ch] || '')
        .join('');

      return nameDigits.includes(cleanQuery) || c.name.toLowerCase().includes(cleanQuery);
    });
  }
}

export const aiCallScreeningService = new AICallScreeningService();
