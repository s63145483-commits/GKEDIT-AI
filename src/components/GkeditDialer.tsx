import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  User,
  Users,
  Search,
  Clock,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileText,
  Radio,
  Wifi,
  Signal,
  Delete,
  Plus,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Info,
  Sliders,
  X,
  Bot,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  LogOut,
  Building2,
  Lock,
  Mail,
  Loader2,
} from 'lucide-react';
import { googleContactsService, GoogleContactPerson } from '../services/googleContactsService.ts';
import type { User as FirebaseUser } from 'firebase/auth';

// ============================================================================
// TYPES & DATA STRUCTURES
// ============================================================================

export type DialerSubTab = 'keypad' | 'recents' | 'contacts' | 'ai-logs';

export type ConnectivityMode = 'sim1' | 'sim2' | 'webrtc';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  company?: string;
  email?: string;
  avatarColor: string;
  avatarUrl?: string;
  verified?: boolean;
  spamRisk?: 'none' | 'low' | 'high';
  notes?: string;
}

export interface CallRecord {
  id: string;
  number: string;
  name?: string;
  type: 'incoming' | 'outgoing' | 'missed' | 'screened';
  timestamp: number;
  durationSec: number;
  mode: ConnectivityMode;
  screenedByAi?: boolean;
  spamShieldScore?: number; // 0-100, 0 is safe
  transcriptSnippet?: string;
  summary?: string;
}

export interface AiScreeningLog {
  id: string;
  callerNumber: string;
  callerName?: string;
  timestamp: number;
  riskScore: number; // 0-100
  intentCategory: 'Delivery' | 'Business' | 'Verification' | 'Telemarketing' | 'Scam' | 'General';
  status: 'passed_to_user' | 'declined' | 'completed';
  conversation: Array<{ sender: 'ai' | 'caller'; text: string; time: string }>;
  summary: string;
  actionItems: string[];
}

// Initial Contact Seeds: Real contacts are dynamically retrieved via Google People API
const INITIAL_CONTACTS: Contact[] = [];

// Initial Recents: Clean state
const INITIAL_RECENTS: CallRecord[] = [];

// Initial AI screening logs
const INITIAL_AI_LOGS: AiScreeningLog[] = [];

// DTMF Frequencies for authentic telephone sound synthesis
const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
};

// T9 letters map
const T9_MAP: Record<string, string> = {
  '1': '',
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
  '*': '',
  '0': '+',
  '#': '',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GkeditDialer({ onBack }: { onBack?: () => void }) {
  // Navigation & Sub-views
  const [subTab, setSubTab] = useState<DialerSubTab>('keypad');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [connectivityMode, setConnectivityMode] = useState<ConnectivityMode>('sim1');
  const [networkType, setNetworkType] = useState<'5G SA' | 'Wi-Fi 7' | 'VoIP HD'>('5G SA');

  // Persistence State
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      // Clear any legacy mock contact cache
      localStorage.removeItem('gkedit_dialer_contacts_v1');
      const saved = localStorage.getItem('gkedit_dialer_contacts_v2');
      if (saved) {
        const parsed: Contact[] = JSON.parse(saved);
        return parsed.filter(
          (c) =>
            !['c_1', 'c_2', 'c_3', 'c_4', 'c_5'].includes(c.id) &&
            c.name !== 'GK Edit Studio' &&
            c.name !== 'Google Cloud Host' &&
            c.name !== 'Amazon Delivery Hub'
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  // Google Contacts & People API State
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(() => googleContactsService.getCurrentUser());
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(() => !!googleContactsService.getAccessToken());
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [isFetchingContacts, setIsFetchingContacts] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  const [recents, setRecents] = useState<CallRecord[]>(() => {
    try {
      localStorage.removeItem('gkedit_dialer_recents_v1');
      const saved = localStorage.getItem('gkedit_dialer_recents_v2');
      return saved ? JSON.parse(saved) : INITIAL_RECENTS;
    } catch {
      return INITIAL_RECENTS;
    }
  });

  const [aiLogs, setAiLogs] = useState<AiScreeningLog[]>(() => {
    try {
      const saved = localStorage.getItem('gkedit_dialer_ai_logs_v1');
      return saved ? JSON.parse(saved) : INITIAL_AI_LOGS;
    } catch {
      return INITIAL_AI_LOGS;
    }
  });

  // Active Calling Engine State
  const [isInCall, setIsInCall] = useState(false);
  const [activeCallNumber, setActiveCallNumber] = useState('');
  const [activeCallContact, setActiveCallContact] = useState<Contact | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiScreeningActive, setIsAiScreeningActive] = useState(false);
  const [showInCallKeypad, setShowInCallKeypad] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [notesList, setNotesList] = useState<string[]>([]);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactCompany, setNewContactCompany] = useState('');

  // Live Screening Simulation Feed
  const [liveTranscript, setLiveTranscript] = useState<Array<{ sender: 'ai' | 'caller'; text: string; time: string }>>([]);
  const [screeningIntent, setScreeningIntent] = useState<string>('Analyzing Audio...');
  const [spamRiskRating, setSpamRiskRating] = useState<number>(0);

  // Audio Context Ref for authentic DTMF synthesis
  const audioCtxRef = useRef<AudioContext | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const screeningIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync contacts to LocalStorage
  useEffect(() => {
    localStorage.setItem('gkedit_dialer_contacts_v2', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('gkedit_dialer_recents_v2', JSON.stringify(recents));
  }, [recents]);

  useEffect(() => {
    localStorage.setItem('gkedit_dialer_ai_logs_v1', JSON.stringify(aiLogs));
  }, [aiLogs]);

  // Fetch real Google Contacts via Google People API
  const loadGoogleContacts = useCallback(async () => {
    try {
      setIsFetchingContacts(true);
      setFetchError(null);
      const people = await googleContactsService.fetchContacts();
      const cyberGradients = [
        'from-cyan-500 to-blue-600',
        'from-emerald-400 to-teal-600',
        'from-violet-500 to-purple-700',
        'from-amber-400 to-orange-600',
        'from-fuchsia-500 to-pink-600',
        'from-cyan-400 to-teal-500',
      ];

      const mapped: Contact[] = people.map((p, idx) => ({
        id: p.id,
        name: p.name || 'Unnamed Contact',
        phone: p.phone || '',
        company: p.organization || '',
        email: p.email || '',
        avatarUrl: p.avatarUrl || undefined,
        avatarColor: cyberGradients[idx % cyberGradients.length],
        verified: true,
        spamRisk: 'none',
      }));

      setContacts(mapped);
      localStorage.setItem('gkedit_dialer_contacts_v2', JSON.stringify(mapped));
    } catch (err: any) {
      console.error('Failed to load Google Contacts:', err);
      setFetchError(err?.message || 'Failed to fetch contacts from Google People API');
    } finally {
      setIsFetchingContacts(false);
    }
  }, []);

  // Authenticate user with Google OAuth (read-only contacts scope)
  const handleConnectGoogle = async () => {
    try {
      setIsSigningInGoogle(true);
      setFetchError(null);
      const { user } = await googleContactsService.signIn();
      setGoogleUser(user);
      setIsGoogleConnected(true);
      await loadGoogleContacts();
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setFetchError(err?.message || 'Google Sign-in failed. Please try again.');
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  // Sign out and disconnect Google session
  const handleDisconnectGoogle = async () => {
    try {
      await googleContactsService.signOut();
      setGoogleUser(null);
      setIsGoogleConnected(false);
      setContacts([]);
      localStorage.removeItem('gkedit_dialer_contacts_v2');
      localStorage.removeItem('gkedit_dialer_contacts_v1');
      setFetchError(null);
    } catch (err: any) {
      console.error('Google Sign-out failed:', err);
    }
  };

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = googleContactsService.subscribeAuth((user, token) => {
      setGoogleUser(user);
      const connected = !!token;
      setIsGoogleConnected(connected);
      if (connected && contacts.length === 0) {
        loadGoogleContacts();
      }
    });
    return () => unsubscribe();
  }, [loadGoogleContacts, contacts.length]);

  // Clean AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (screeningIntervalRef.current) clearInterval(screeningIntervalRef.current);
    };
  }, []);

  // Web Audio DTMF Synthesizer & Haptics
  const playDtmf = useCallback((digit: string) => {
    // 1. Trigger haptic click
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(12);
      } catch {}
    }

    // 2. Synthesize dual tones
    const freqs = DTMF_FREQS[digit];
    if (!freqs) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freqs[0], ctx.currentTime);
      osc2.frequency.setValueAtTime(freqs[1], ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext policy fallback gracefully
    }
  }, []);

  // Handle Keypad Press
  const handleKeyPress = (digit: string) => {
    playDtmf(digit);
    setPhoneNumber((prev) => prev + digit);
  };

  const handleBackspace = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {}
    }
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    setPhoneNumber('');
  };

  // T9 Predictive Lookup Algorithm
  const t9Matches = useMemo(() => {
    if (!phoneNumber) return [];
    const cleanDigits = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanDigits) return [];

    return contacts.filter((c) => {
      // 1. Direct phone number match
      const cleanContactPhone = c.phone.replace(/[^0-9]/g, '');
      if (cleanContactPhone.includes(cleanDigits)) return true;

      // 2. Predictive T9 name match
      const nameParts = c.name.toLowerCase().split(' ');
      return nameParts.some((part) => {
        let t9String = '';
        for (const char of part) {
          for (const [digit, letters] of Object.entries(T9_MAP)) {
            if (letters.toLowerCase().includes(char)) {
              t9String += digit;
              break;
            }
          }
        }
        return t9String.includes(cleanDigits);
      });
    });
  }, [phoneNumber, contacts]);

  // Initiate Call Engine
  const startCall = (targetNum?: string, prefillContact?: Contact) => {
    const numToCall = targetNum || phoneNumber;
    if (!numToCall.trim()) return;

    const matchedContact = prefillContact || contacts.find((c) => c.phone.replace(/\s+/g, '') === numToCall.replace(/\s+/g, '')) || null;
    setActiveCallNumber(numToCall);
    setActiveCallContact(matchedContact);
    setIsInCall(true);
    setCallDuration(0);
    setIsMuted(false);
    setIsSpeakerOn(false);
    setIsRecording(false);
    setIsAiScreeningActive(false);
    setShowInCallKeypad(false);
    setNotesList([]);
    setLiveTranscript([]);
    setScreeningIntent('Encrypted Voice Connected');
    setSpamRiskRating(matchedContact?.spamRisk === 'high' ? 85 : 0);

    // If cellular SIM is chosen on mobile device, offer direct native tel: fallback
    if (connectivityMode === 'sim1' || connectivityMode === 'sim2') {
      const clean = numToCall.replace(/[^0-9+]/g, '');
      if (clean) {
        // Attempt native dialer fallback for actual mobile device SIM calls
        try {
          const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
          if (isMobile) {
            window.location.href = `tel:${clean}`;
          }
        } catch {}
      }
    }

    // Call Timer
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  };

  // End Call
  const endCall = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (screeningIntervalRef.current) clearInterval(screeningIntervalRef.current);

    // Record into recents
    const newRecord: CallRecord = {
      id: 'rec_' + Date.now(),
      number: activeCallNumber,
      name: activeCallContact?.name,
      type: 'outgoing',
      timestamp: Date.now(),
      durationSec: callDuration,
      mode: connectivityMode,
      screenedByAi: isAiScreeningActive,
      spamShieldScore: spamRiskRating,
      summary: notesList.length > 0 ? `Notes taken: ${notesList.join('; ')}` : undefined,
    };
    setRecents((prev) => [newRecord, ...prev]);

    // If AI screening was active, record into AI logs
    if (isAiScreeningActive && liveTranscript.length > 0) {
      const newAiLog: AiScreeningLog = {
        id: 'log_' + Date.now(),
        callerNumber: activeCallNumber,
        callerName: activeCallContact?.name,
        timestamp: Date.now(),
        riskScore: spamRiskRating,
        intentCategory: (activeCallContact?.company?.includes('Logistics') ? 'Delivery' : 'General') as any,
        status: 'completed',
        conversation: liveTranscript,
        summary: `Call completed with duration ${Math.floor(callDuration / 60)}m ${callDuration % 60}s.`,
        actionItems: notesList.length > 0 ? notesList : ['No immediate follow-ups logged.'],
      };
      setAiLogs((prev) => [newAiLog, ...prev]);
    }

    setIsInCall(false);
    setPhoneNumber('');
  };

  // Toggle AI Call Screening Mode during active call
  const toggleAiScreening = () => {
    if (!isAiScreeningActive) {
      setIsAiScreeningActive(true);
      setScreeningIntent('GKEDIT Jarvis AI Autonomous Assistant Active');
      // Simulate real-time screening script steps
      const transcriptSteps = [
        { sender: 'ai' as const, text: 'Hello! I am Jarvis, screening this call on behalf of GK EDIT.', time: '0:02' },
        { sender: 'caller' as const, text: 'Hi, I was calling regarding the 4K render pipeline and YouTube thumbnail collaboration.', time: '0:06' },
        { sender: 'ai' as const, text: 'Understood. Could you leave your name and best callback window?', time: '0:12' },
        { sender: 'caller' as const, text: 'This is Kiran from Design Lab. Anytime after 4 PM works.', time: '0:18' },
        { sender: 'ai' as const, text: 'Logged into notes and verified. Handing summary to creator.', time: '0:22' },
      ];

      setLiveTranscript([transcriptSteps[0]]);
      let stepIndex = 1;

      if (screeningIntervalRef.current) clearInterval(screeningIntervalRef.current);
      screeningIntervalRef.current = setInterval(() => {
        if (stepIndex < transcriptSteps.length) {
          const next = transcriptSteps[stepIndex];
          setLiveTranscript((prev) => [...prev, next]);
          stepIndex++;
        } else {
          if (screeningIntervalRef.current) clearInterval(screeningIntervalRef.current);
        }
      }, 3500);
    } else {
      setIsAiScreeningActive(false);
      if (screeningIntervalRef.current) clearInterval(screeningIntervalRef.current);
    }
  };

  // Add in-call Quick Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNote.trim()) return;
    setNotesList((prev) => [...prev, quickNote.trim()]);
    setQuickNote('');
  };

  // Add Contact Handler
  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    const newContact: Contact = {
      id: 'c_' + Date.now(),
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      company: newContactCompany.trim() || undefined,
      avatarColor: 'from-cyan-500 to-indigo-600',
      verified: true,
      spamRisk: 'none',
    };
    setContacts((prev) => [newContact, ...prev]);
    setIsAddingContact(false);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactCompany('');
  };

  // Real-time search & filter across Google Contacts (name, phone, organization, email)
  const filteredContacts = useMemo(() => {
    if (!contactSearchQuery.trim()) return contacts;
    const q = contactSearchQuery.toLowerCase().trim();
    return contacts.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchPhone = c.phone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, ''));
      const matchCompany = c.company && c.company.toLowerCase().includes(q);
      const matchEmail = c.email && c.email.toLowerCase().includes(q);
      return matchName || matchPhone || matchCompany || matchEmail;
    });
  }, [contacts, contactSearchQuery]);

  // Format Duration seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Simulate an incoming screened call demo
  const handleSimulateIncomingCall = (preset: 'delivery' | 'spam' | 'studio') => {
    let mockNumber = '+91 80001 22334';
    let mockName = 'Amazon Delivery Hub';
    let risk = 5;

    if (preset === 'spam') {
      mockNumber = '+91 14099 87654';
      mockName = 'Credit Card Pre-Approved';
      risk = 94;
    } else if (preset === 'studio') {
      mockNumber = '+91 98490 21410';
      mockName = 'GK Edit Studio Lab';
      risk = 0;
    }

    startCall(mockNumber, {
      id: 'mock_' + Date.now(),
      name: mockName,
      phone: mockNumber,
      avatarColor: preset === 'spam' ? 'from-rose-500 to-red-600' : 'from-cyan-500 to-emerald-600',
      verified: preset !== 'spam',
      spamRisk: preset === 'spam' ? 'high' : 'none',
    });
    // Auto-trigger screening
    setTimeout(() => {
      toggleAiScreening();
    }, 800);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto rounded-3xl overflow-hidden bg-slate-950/85 backdrop-blur-2xl border border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.8)] transition-all">
      {/* ====================================================================
          TOP BAR (Xiaomi HyperOS 4 Liquid Glass Header)
      ==================================================================== */}
      <div className="px-5 pt-4 pb-3 border-b border-white/5 bg-gradient-to-b from-slate-900/90 to-transparent">
        {/* Status Line */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
          {/* Brand & Network */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>GKEDIT DIALER</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-slate-400">
              <Signal className="w-3 h-3 text-cyan-400" />
              <span>{networkType}</span>
            </div>
          </div>

          {/* SIM / VoIP Selector Controls */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-xl border border-white/10 text-[10px]">
            <button
              onClick={() => {
                setConnectivityMode('sim1');
                setNetworkType('5G SA');
              }}
              className={`px-2 py-1 rounded-lg font-semibold transition ${
                connectivityMode === 'sim1'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="SIM 1: Jio 5G Cellular"
            >
              SIM 1
            </button>
            <button
              onClick={() => {
                setConnectivityMode('sim2');
                setNetworkType('Wi-Fi 7');
              }}
              className={`px-2 py-1 rounded-lg font-semibold transition ${
                connectivityMode === 'sim2'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="SIM 2: Airtel 5G Cellular"
            >
              SIM 2
            </button>
            <button
              onClick={() => {
                setConnectivityMode('webrtc');
                setNetworkType('VoIP HD');
              }}
              className={`px-2 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                connectivityMode === 'webrtc'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
              title="GKEDIT WebRTC Encrypted HD VoIP"
            >
              <Radio className="w-2.5 h-2.5" />
              <span>VoIP</span>
            </button>
          </div>
        </div>

        {/* Real-time Audio Visualizer Wave Simulation */}
        <div className="h-2 w-full flex items-center gap-1 justify-center opacity-70 overflow-hidden">
          {Array.from({ length: 32 }).map((_, i) => (
            <motion.div
              key={i}
              className={`w-1 rounded-full ${
                isInCall
                  ? 'bg-gradient-to-t from-emerald-400 to-cyan-400'
                  : 'bg-gradient-to-t from-cyan-600/40 to-blue-500/20'
              }`}
              animate={{
                height: isInCall
                  ? [4, Math.max(4, ((i * 7) % 18) + (isAiScreeningActive ? 6 : 2)), 4]
                  : [2, ((i * 3) % 8) + 2, 2],
              }}
              transition={{
                duration: isInCall ? 0.6 : 1.8,
                repeat: Infinity,
                repeatType: 'reverse',
                delay: (i * 0.04) % 0.8,
              }}
            />
          ))}
        </div>
      </div>

      {/* ====================================================================
          ACTIVE CALL SCREEN CANVAS / OVERLAY
      ==================================================================== */}
      <AnimatePresence>
        {isInCall && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-5 space-y-4 bg-gradient-to-b from-[#051124] via-slate-950 to-slate-950 border-b border-white/10"
          >
            {/* Caller Identification HUD */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                    activeCallContact?.avatarColor || 'from-cyan-500 to-blue-600'
                  } p-0.5 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center`}
                >
                  <div className="w-full h-full rounded-[14px] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center font-bold text-lg text-white">
                    {activeCallContact?.name ? activeCallContact.name.charAt(0) : <Phone className="w-6 h-6" />}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {activeCallContact?.name || activeCallNumber}
                    </h3>
                    {activeCallContact?.verified && (
                      <span className="p-0.5 rounded-full bg-cyan-500/20 text-cyan-400" title="Verified Caller">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{activeCallNumber}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="text-emerald-400 font-semibold uppercase">{connectivityMode.toUpperCase()} HD</span>
                    <span>·</span>
                    <span>{formatDuration(callDuration)}</span>
                  </div>
                </div>
              </div>

              {/* Spam Shield Status Indicator */}
              <div
                className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 ${
                  spamRiskRating > 50
                    ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                    : 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {spamRiskRating > 50 ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Spam Risk: {spamRiskRating}%</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Shield Verified</span>
                  </>
                )}
              </div>
            </div>

            {/* Real-time Call Screening Transcription Feed */}
            {isAiScreeningActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-2.5 shadow-inner"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span>Live AI Call Screening Feed</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-white/10">
                    {screeningIntent}
                  </span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-2 pr-1 text-xs">
                  {liveTranscript.map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl leading-relaxed ${
                        t.sender === 'ai'
                          ? 'bg-cyan-950/50 border border-cyan-500/20 text-cyan-100 ml-4'
                          : 'bg-slate-950 border border-white/10 text-slate-200 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span className="font-semibold uppercase tracking-wider">
                          {t.sender === 'ai' ? 'Jarvis Screening Bot' : 'Caller Audio'}
                        </span>
                        <span>{t.time}</span>
                      </div>
                      <p>{t.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Dynamic In-Call Action Bar */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {/* AI Screen Chip */}
              <button
                onClick={toggleAiScreening}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  isAiScreeningActive
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/30'
                }`}
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px]">{isAiScreeningActive ? 'Screening...' : 'AI Screen'}</span>
              </button>

              {/* Mute Button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  isMuted
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                    : 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
                <span className="text-[10px]">{isMuted ? 'Muted' : 'Mute'}</span>
              </button>

              {/* Speaker Button */}
              <button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  isSpeakerOn
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                {isSpeakerOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
                <span className="text-[10px]">{isSpeakerOn ? 'Speaker ON' : 'Speaker'}</span>
              </button>

              {/* Record Button */}
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  isRecording
                    ? 'bg-red-500/20 border-red-400 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                    : 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'border-2 border-red-400'}`} />
                <span className="text-[10px]">{isRecording ? 'Rec...' : 'Record'}</span>
              </button>
            </div>

            {/* In-Call Quick Notes Pad */}
            <div className="pt-1">
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="Quick in-call note (e.g. Call back at 4pm)..."
                  className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-white/10"
                >
                  Save Note
                </button>
              </form>
              {notesList.length > 0 && (
                <div className="mt-2 space-y-1">
                  {notesList.map((n, i) => (
                    <div key={i} className="text-[11px] text-slate-300 flex items-center gap-2 bg-slate-950/50 px-2.5 py-1 rounded-lg border border-white/5">
                      <FileText className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{n}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* In-call DTMF Keypad Overlay Toggle */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setShowInCallKeypad(!showInCallKeypad)}
                className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{showInCallKeypad ? 'Hide Dialpad' : 'Show In-Call Dialpad'}</span>
              </button>

              {/* End Call Button */}
              <button
                onClick={endCall}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2 active:scale-95 transition"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            </div>

            {/* In-Call Keypad (if opened during IVR menus) */}
            {showInCallKeypad && (
              <div className="p-3 rounded-2xl bg-slate-950/90 border border-white/10 grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
                  <button
                    key={k}
                    onClick={() => playDtmf(k)}
                    className="py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-sm hover:border-cyan-400 active:scale-95 transition"
                  >
                    {k}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          TAB CONTENT SWITCHER: KEYPAD / RECENTS / CONTACTS / AI LOGS
      ==================================================================== */}
      <div className="p-5">
        {/* ------------------------------------------------------------------
            1. KEYPAD TAB
        ------------------------------------------------------------------ */}
        {subTab === 'keypad' && !isInCall && (
          <div className="space-y-4">
            {/* Number Display & T9 Result Bar */}
            <div className="p-4 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl relative shadow-inner">
              {/* T9 Live Prediction Banner */}
              {t9Matches.length > 0 && (
                <div className="mb-2 pb-2 border-b border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold truncate">
                    <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{t9Matches[0].name}</span>
                    <span className="text-[10px] text-slate-400">({t9Matches[0].phone})</span>
                  </div>
                  <button
                    onClick={() => startCall(t9Matches[0].phone, t9Matches[0])}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 transition shrink-0"
                  >
                    Quick Call
                  </button>
                </div>
              )}

              {/* Main Number Display */}
              <div className="flex items-center justify-between min-h-[44px]">
                <div className="flex-1 overflow-x-auto text-left font-mono">
                  {phoneNumber ? (
                    <span className="text-2xl sm:text-3xl font-black tracking-wider text-white select-all">
                      {phoneNumber}
                    </span>
                  ) : (
                    <span className="text-base sm:text-lg text-slate-500 italic select-none">
                      Dial a number or T9 name...
                    </span>
                  )}
                </div>

                {/* Backspace & Clear Button */}
                {phoneNumber && (
                  <div className="flex items-center gap-1 pl-2">
                    <button
                      onClick={handleBackspace}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
                      title="Backspace"
                    >
                      <Delete className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-white/5 transition text-xs font-mono"
                      title="Clear all"
                    >
                      CLR
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Action: Add to contacts if unlisted */}
              {phoneNumber.length >= 3 && !t9Matches.some((c) => c.phone.replace(/\s+/g, '') === phoneNumber.replace(/\s+/g, '')) && (
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Unsaved number</span>
                  <button
                    onClick={() => {
                      setNewContactPhone(phoneNumber);
                      setIsAddingContact(true);
                      setSubTab('contacts');
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create Contact</span>
                  </button>
                </div>
              )}
            </div>

            {/* Translucent Frosted Glass Keypad (Xiaomi HyperOS 4 Theme) */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-sm mx-auto">
              {[
                { digit: '1', letters: '' },
                { digit: '2', letters: 'ABC' },
                { digit: '3', letters: 'DEF' },
                { digit: '4', letters: 'GHI' },
                { digit: '5', letters: 'JKL' },
                { digit: '6', letters: 'MNO' },
                { digit: '7', letters: 'PQRS' },
                { digit: '8', letters: 'TUV' },
                { digit: '9', letters: 'WXYZ' },
                { digit: '*', letters: '' },
                { digit: '0', letters: '+' },
                { digit: '#', letters: '' },
              ].map((k) => (
                <button
                  key={k.digit}
                  onClick={() => handleKeyPress(k.digit)}
                  className="group relative h-16 rounded-3xl bg-slate-900/60 hover:bg-slate-800/80 active:bg-cyan-950/80 border border-white/10 hover:border-cyan-400/30 active:scale-[0.96] backdrop-blur-2xl transition-all duration-150 flex flex-col items-center justify-center shadow-lg hover:shadow-[0_0_16px_rgba(6,182,212,0.15)]"
                >
                  <span className="text-xl sm:text-2xl font-bold text-white group-hover:text-cyan-200 transition">
                    {k.digit}
                  </span>
                  {k.letters && (
                    <span className="text-[9px] font-mono tracking-widest text-slate-400 group-hover:text-cyan-400 transition mt-[-2px]">
                      {k.letters}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Main Action Bar: Call Launchers & Quick Demo */}
            <div className="flex items-center justify-center gap-4 pt-2">
              {/* Call Button (HyperOS 4 Liquid Glow) */}
              <button
                onClick={() => startCall()}
                disabled={!phoneNumber.trim()}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 disabled:opacity-40 disabled:pointer-events-none text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.4)] flex items-center justify-center active:scale-95 transition-all"
                title="Initiate Call"
              >
                <Phone className="w-7 h-7 fill-slate-950 stroke-slate-950" />
              </button>

              {/* Direct Cellular 'tel:' Trigger Option */}
              {phoneNumber && (
                <a
                  href={`tel:${phoneNumber.replace(/[^0-9+]/g, '')}`}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Direct Native SIM Dialer"
                >
                  <PhoneOutgoing className="w-4 h-4 text-cyan-400" />
                  <span className="hidden sm:inline">Native SIM</span>
                </a>
              )}
            </div>

            {/* Quick Demo Simulator Bar */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simulate Call Test:</span>
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleSimulateIncomingCall('studio')}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-cyan-300 transition"
                >
                  Studio
                </button>
                <button
                  onClick={() => handleSimulateIncomingCall('delivery')}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-emerald-300 transition"
                >
                  Courier
                </button>
                <button
                  onClick={() => handleSimulateIncomingCall('spam')}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-rose-300 transition"
                >
                  Spam
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            2. RECENTS TAB
        ------------------------------------------------------------------ */}
        {subTab === 'recents' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs pb-1">
              <h3 className="font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Call History ({recents.length})</span>
              </h3>
              {recents.length > 0 && (
                <button
                  onClick={() => setRecents([])}
                  className="text-slate-500 hover:text-red-400 transition text-[11px]"
                >
                  Clear History
                </button>
              )}
            </div>

            {recents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No recent calls recorded.
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[380px] overflow-y-auto pr-1">
                {recents.map((rec) => {
                  const isSpam = (rec.spamShieldScore || 0) > 50;
                  return (
                    <div
                      key={rec.id}
                      className="py-3 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-2xl transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            rec.type === 'missed'
                              ? 'bg-rose-950/60 text-rose-400'
                              : rec.screenedByAi
                              ? 'bg-cyan-950/60 text-cyan-400'
                              : 'bg-slate-900 text-emerald-400'
                          }`}
                        >
                          {rec.type === 'missed' ? (
                            <PhoneMissed className="w-4 h-4" />
                          ) : rec.type === 'incoming' ? (
                            <PhoneIncoming className="w-4 h-4" />
                          ) : rec.screenedByAi ? (
                            <Bot className="w-4 h-4" />
                          ) : (
                            <PhoneOutgoing className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-white">
                              {rec.name || rec.number}
                            </p>
                            {isSpam && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-950 border border-rose-500/30 text-rose-300">
                                SPAM
                              </span>
                            )}
                            {rec.screenedByAi && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                                AI SCREENED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{rec.number}</span>
                            <span>·</span>
                            <span>{new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {rec.durationSec > 0 && (
                              <>
                                <span>·</span>
                                <span>{formatDuration(rec.durationSec)}</span>
                              </>
                            )}
                          </div>
                          {rec.summary && (
                            <p className="text-[10px] text-slate-400 italic mt-0.5 max-w-xs truncate">
                              {rec.summary}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => startCall(rec.number)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-emerald-950 hover:text-emerald-300 border border-white/10 text-slate-300 transition"
                        title="Redial"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------
            3. CONTACTS TAB (GOOGLE IDENTITY & PEOPLE API INTEGRATION)
        ------------------------------------------------------------------ */}
        {subTab === 'contacts' && (
          <div className="space-y-3">
            {/* Case A: User Not Connected to Google */}
            {!isGoogleConnected ? (
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-cyan-500/30 text-center space-y-4 shadow-xl relative overflow-hidden backdrop-blur-xl">
                {/* Cyberpunk background glow */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

                {/* Google Icon Badge */}
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center shadow-lg relative">
                  <svg className="w-7 h-7" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
                    <Lock className="w-2.5 h-2.5 text-cyan-300" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Sync Google Contacts
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Connect your Google account with read-only permission to securely load and dial your personal contacts in GKEDIT DIALER.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto text-[11px] text-slate-300">
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Read-Only Scope</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Real Google People</span>
                  </div>
                </div>

                {fetchError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-[11px] text-rose-300 flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{fetchError}</span>
                  </div>
                )}

                <button
                  onClick={handleConnectGoogle}
                  disabled={isSigningInGoogle}
                  className="w-full max-w-xs mx-auto py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group border border-slate-200"
                >
                  {isSigningInGoogle ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                      <span>Authenticating with Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      <span>Connect Google Account</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Case B: Connected to Google */
              <div className="space-y-3">
                {/* Connected Account Bar */}
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {googleUser?.photoURL ? (
                      <img
                        src={googleUser.photoURL}
                        alt="Google Account"
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full border border-cyan-400/50 object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-400/50 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {googleUser?.displayName ? googleUser.displayName.charAt(0) : 'G'}
                      </div>
                    )}
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {googleUser?.displayName || 'Google Account'}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Active OAuth Session" />
                      </div>
                      <p className="text-[10px] text-slate-400 truncate font-mono">
                        {googleUser?.email || 'Connected'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={loadGoogleContacts}
                      disabled={isFetchingContacts}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
                      title="Sync Google Contacts"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isFetchingContacts ? 'animate-spin text-cyan-400' : ''}`} />
                    </button>
                    <button
                      onClick={handleDisconnectGoogle}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1 transition"
                      title="Disconnect Google Account"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Disconnect</span>
                    </button>
                  </div>
                </div>

                {/* Search Bar & Header */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={contactSearchQuery}
                      onChange={(e) => setContactSearchQuery(e.target.value)}
                      placeholder="Search Google contacts by name, org, or number..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60"
                    />
                    {contactSearchQuery && (
                      <button
                        onClick={() => setContactSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs px-1">
                    <h3 className="font-bold text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span>Google Contacts ({filteredContacts.length})</span>
                    </h3>
                    {isFetchingContacts && (
                      <span className="text-[10px] text-cyan-400 flex items-center gap-1 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Syncing People API...</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Error Banner */}
                {fetchError && (
                  <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{fetchError}</span>
                    </div>
                    <button
                      onClick={loadGoogleContacts}
                      className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-xs text-rose-200 font-semibold shrink-0"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Loading Skeletons during fetch */}
                {isFetchingContacts && contacts.length === 0 && (
                  <div className="space-y-2 py-1">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className="p-3 rounded-2xl bg-slate-900/50 border border-white/5 animate-pulse flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800" />
                          <div className="space-y-1.5">
                            <div className="w-28 h-3 rounded bg-slate-800" />
                            <div className="w-20 h-2.5 rounded bg-slate-800/60" />
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-800" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State: Zero Contacts */}
                {!isFetchingContacts && filteredContacts.length === 0 && (
                  <div className="py-12 px-4 rounded-3xl bg-slate-900/40 border border-white/5 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center text-slate-500">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {contactSearchQuery ? `No contacts matching "${contactSearchQuery}"` : 'No Google Contacts Found'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                        {contactSearchQuery
                          ? 'Try searching with a different name, company, or phone number.'
                          : 'Your connected Google account has no contacts stored in Google Contacts. Add contacts in your Google account and click Refresh.'}
                      </p>
                    </div>
                    {contactSearchQuery ? (
                      <button
                        onClick={() => setContactSearchQuery('')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-cyan-300 font-semibold"
                      >
                        Clear Search
                      </button>
                    ) : (
                      <button
                        onClick={loadGoogleContacts}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-xs text-cyan-300 font-semibold inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh Google Contacts</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Google Contacts Directory List */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-cyan-400/30 hover:bg-slate-900/90 transition-all flex items-center justify-between gap-3 group shadow-md"
                    >
                      {/* Left: Avatar & Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        {contact.avatarUrl ? (
                          <img
                            src={contact.avatarUrl}
                            alt={contact.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border border-cyan-400/40 shrink-0 shadow-sm"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${contact.avatarColor} flex items-center justify-center font-bold text-xs text-white border border-cyan-400/30 shrink-0 shadow-sm`}
                          >
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                              {contact.name}
                            </p>
                            <span title="Verified Google Contact">
                              <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                            </span>
                          </div>

                          <p className="text-[11px] text-cyan-400/90 font-mono truncate">
                            {contact.phone || (contact.email ? contact.email : 'No phone listed')}
                          </p>

                          {contact.company && (
                            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <Building2 className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                              <span className="truncate">{contact.company}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Call Action Button */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            if (contact.phone) {
                              startCall(contact.phone, contact);
                            } else {
                              setPhoneNumber('');
                              setSubTab('keypad');
                            }
                          }}
                          className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.35)] active:scale-90 transition-all"
                          title={contact.phone ? `Call ${contact.name}` : 'Open Keypad'}
                        >
                          <Phone className="w-4 h-4 fill-slate-950" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------
            4. AI LOGS TAB
        ------------------------------------------------------------------ */}
        {subTab === 'ai-logs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs pb-1">
              <h3 className="font-bold text-white flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>AI Call Screening Intelligence ({aiLogs.length})</span>
              </h3>
            </div>

            {aiLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No screened calls recorded yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {aiLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          {log.callerName || log.callerNumber}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          log.riskScore > 50
                            ? 'bg-rose-950 border-rose-500/40 text-rose-300'
                            : 'bg-emerald-950 border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        {log.intentCategory} · Risk {log.riskScore}%
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-xl border border-white/5 leading-relaxed">
                      {log.summary}
                    </p>

                    {/* Dialogue Snippet */}
                    <div className="space-y-1.5 text-[11px] pt-1">
                      {log.conversation.map((c, i) => (
                        <div key={i} className="flex gap-2 text-slate-400">
                          <span className={`font-semibold shrink-0 ${c.sender === 'ai' ? 'text-cyan-400' : 'text-slate-300'}`}>
                            {c.sender === 'ai' ? 'AI:' : 'Caller:'}
                          </span>
                          <span className="leading-snug">{c.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Items */}
                    {log.actionItems && log.actionItems.length > 0 && (
                      <div className="pt-1.5 border-t border-white/5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Action Items:
                        </span>
                        <ul className="list-disc list-inside text-[11px] text-cyan-300/90 mt-0.5 space-y-0.5">
                          {log.actionItems.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ====================================================================
          BOTTOM FLOATING PILL BAR (HyperOS 4 Liquid Glass Sub-Navigation)
      ==================================================================== */}
      <div className="p-3 border-t border-white/10 bg-slate-900/90 backdrop-blur-2xl">
        <div className="flex items-center justify-around bg-slate-950/80 p-1.5 rounded-2xl border border-white/10 shadow-lg">
          <button
            onClick={() => setSubTab('keypad')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              subTab === 'keypad'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Keypad</span>
          </button>

          <button
            onClick={() => setSubTab('recents')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              subTab === 'recents'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Recents</span>
          </button>

          <button
            onClick={() => setSubTab('contacts')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              subTab === 'contacts'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contacts</span>
          </button>

          <button
            onClick={() => setSubTab('ai-logs')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              subTab === 'ai-logs'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default GkeditDialer;
