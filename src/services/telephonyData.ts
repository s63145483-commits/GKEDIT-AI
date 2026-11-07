import { Contact, CallRecord, VoicemailItem, CallerInfo } from '../types/telephony.ts';

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'c-1',
    name: 'GK EDIT Studio HQ',
    number: '+1 (415) 880-9210',
    company: 'GKEDIT Productions & AI Lab',
    email: 'creator@gkedit.com',
    avatarGradient: 'from-cyan-500 to-blue-600',
    isFavorite: true,
    lastCalled: '10 mins ago',
    e2ee: true,
    statusTag: 'Verified Caller',
    notes: 'Chief creative engineering & automated media pipeline pipeline channel.',
  },
  {
    id: 'c-2',
    name: 'Dr. Elena Vance',
    number: '+1 (650) 412-9081',
    company: 'Quantum WebRTC Labs',
    email: 'elena.vance@webrtc.io',
    avatarGradient: 'from-emerald-400 to-teal-600',
    isFavorite: true,
    lastCalled: '2 hours ago',
    e2ee: true,
    statusTag: 'Verified Caller',
    notes: 'HyperOS 4 low-latency voice codec lead architect.',
  },
  {
    id: 'c-3',
    name: 'Marcus Thorne',
    number: '+1 (206) 555-0144',
    company: 'HyperOS Systems UI',
    email: 'marcus@hyperos.xiaomi.com',
    avatarGradient: 'from-violet-500 to-purple-700',
    isFavorite: true,
    lastCalled: 'Yesterday',
    e2ee: true,
    statusTag: 'Verified Caller',
    notes: 'Liquid glass acrylic shader & spring motion specialist.',
  },
  {
    id: 'c-4',
    name: 'Sarah Chen',
    number: '+1 (408) 555-8392',
    company: 'Google Phone Product Team',
    email: 'schen@android.google.com',
    avatarGradient: 'from-amber-400 to-orange-600',
    isFavorite: false,
    lastCalled: 'Oct 11',
    e2ee: true,
    statusTag: 'Verified Caller',
    notes: 'Smart Call Screening protocol sync.',
  },
  {
    id: 'c-5',
    name: 'DHL Express Dispatch',
    number: '+1 (800) 225-5345',
    company: 'DHL Global Logistics',
    email: 'dispatch@dhl.com',
    avatarGradient: 'from-yellow-500 to-amber-700',
    isFavorite: false,
    lastCalled: 'Oct 09',
    e2ee: false,
    statusTag: 'Direct Voicemail',
    notes: 'Smart courier tracking & signature bypass gate.',
  },
  {
    id: 'c-6',
    name: 'Aiden Brooks',
    number: '+1 (312) 555-9012',
    company: 'Neural Audio Research',
    email: 'aiden@neuralaudio.org',
    avatarGradient: 'from-fuchsia-500 to-pink-600',
    isFavorite: false,
    lastCalled: 'Oct 08',
    e2ee: true,
    statusTag: 'AI Handled',
    notes: 'Opus 48kHz frequency response testing.',
  },
  {
    id: 'c-7',
    name: 'Mom & Dad',
    number: '+1 (917) 555-2468',
    company: 'Family',
    email: 'family@home.net',
    avatarGradient: 'from-rose-400 to-red-600',
    isFavorite: true,
    lastCalled: 'Oct 07',
    e2ee: true,
    statusTag: 'Verified Caller',
    notes: 'Weekend dinner check-in.',
  },
  {
    id: 'c-8',
    name: 'Solar Energy Robotics [Blocked]',
    number: '+1 (888) 492-0199',
    company: 'Spam Telemarketing Co.',
    email: 'unknown@robo-leads.biz',
    avatarGradient: 'from-red-600 to-rose-900',
    isFavorite: false,
    lastCalled: 'Oct 06',
    e2ee: false,
    statusTag: 'Spam Filtered',
    notes: 'Robocall flagged with 98% threat level. Auto-intercepted.',
  },
];

export const INITIAL_RECENTS: CallRecord[] = [
  {
    id: 'rec-1',
    caller: {
      id: 'c-solar',
      name: 'Unverified Telemarketer',
      number: '+1 (888) 492-0199',
      avatarGradient: 'from-red-600 to-rose-900',
      company: 'High-Risk Robo Dial',
      tag: 'Spam Filtered',
      spamScore: 96,
      e2eeVerified: false,
      location: 'Nevada, US',
    },
    direction: 'blocked',
    timestamp: '12 mins ago',
    duration: 38,
    statusTag: 'Spam Filtered',
    aiSummary: 'Robocall screening tripped. Caller attempted aggressive solar warranty pitch without operator presence.',
    actionItems: ['Number auto-reported to FCC database', 'Carrier block token issued'],
    transcript: [
      { id: 't1', speaker: 'ai_assistant', text: 'GKEDIT AI Phone Screening: The person you called is unavailable. Please state your name and reason for calling.', timestamp: '00:03' },
      { id: 't2', speaker: 'caller', text: 'Press 1 immediately to lock in your government solar subsidy rate before October deadline...', timestamp: '00:11', intent: 'Robocall Script' },
      { id: 't3', speaker: 'ai_assistant', text: 'Automated telemarketing pattern detected. Terminating connection and blacklisting routing trunk.', timestamp: '00:24' },
    ],
  },
  {
    id: 'rec-2',
    caller: {
      id: 'c-2',
      name: 'Dr. Elena Vance',
      number: '+1 (650) 412-9081',
      avatarGradient: 'from-emerald-400 to-teal-600',
      company: 'Quantum WebRTC Labs',
      tag: 'AI Handled',
      spamScore: 2,
      e2eeVerified: true,
      location: 'Palo Alto, CA',
    },
    direction: 'incoming',
    timestamp: '1 hour ago',
    duration: 142,
    statusTag: 'AI Handled',
    aiSummary: 'Elena confirmed the 48kHz Opus audio stream mesh benchmark reached 18ms latency with zero jitter.',
    actionItems: ['Review latency benchmark JSON', 'Sign off on WebRTC E2EE release candidate'],
    transcript: [
      { id: 't1', speaker: 'ai_assistant', text: 'Hi Dr. Elena, GK is in a deep development sprint. Screening via GKEDIT Assistant. How can I assist?', timestamp: '00:02' },
      { id: 't2', speaker: 'caller', text: 'Hey! Just wanted to share that the HyperOS 4 dialer peer mesh test hit 18ms round-trip latency today! Everything is rock solid.', timestamp: '00:14', intent: 'Project Update' },
      { id: 't3', speaker: 'ai_assistant', text: 'Understood. I will log this high-priority milestone and notify GK immediately with actionable notes.', timestamp: '00:32' },
      { id: 't4', speaker: 'caller', text: 'Awesome, thanks GKEDIT AI! Talk soon.', timestamp: '00:46' },
    ],
  },
  {
    id: 'rec-3',
    caller: {
      id: 'c-5',
      name: 'DHL Express Dispatch',
      number: '+1 (800) 225-5345',
      avatarGradient: 'from-yellow-500 to-amber-700',
      company: 'DHL Courier Service',
      tag: 'Direct Voicemail',
      spamScore: 10,
      e2eeVerified: false,
      location: 'San Francisco Hub',
    },
    direction: 'missed',
    timestamp: '3 hours ago',
    duration: 45,
    statusTag: 'Direct Voicemail',
    aiSummary: 'Courier left message regarding oversized shipment delivery pin code required for safe gate access.',
    actionItems: ['Provide security gate code #4902 to DHL app'],
    transcript: [
      { id: 't1', speaker: 'caller', text: 'Hello, this is DHL Courier Alex with parcel #921-399. We need the front gate entrance pin code to drop off the hardware package securely.', timestamp: '00:05' },
    ],
    audioDuration: 45,
  },
  {
    id: 'rec-4',
    caller: {
      id: 'c-1',
      name: 'GK EDIT Studio HQ',
      number: '+1 (415) 880-9210',
      avatarGradient: 'from-cyan-500 to-blue-600',
      company: 'GKEDIT Productions',
      tag: 'Verified Caller',
      spamScore: 0,
      e2eeVerified: true,
      location: 'San Francisco, CA',
    },
    direction: 'outgoing',
    timestamp: 'Yesterday',
    duration: 312,
    statusTag: 'Verified Caller',
    aiSummary: 'Direct encrypted line. Verified Studio test session completed without dropped packets.',
    actionItems: ['Studio line cleared for live broadcast'],
  },
  {
    id: 'rec-5',
    caller: {
      id: 'c-7',
      name: 'Mom & Dad',
      number: '+1 (917) 555-2468',
      avatarGradient: 'from-rose-400 to-red-600',
      company: 'Family',
      tag: 'Verified Caller',
      spamScore: 0,
      e2eeVerified: true,
      location: 'New York, NY',
    },
    direction: 'incoming',
    timestamp: '2 days ago',
    duration: 540,
    statusTag: 'Verified Caller',
    aiSummary: 'Caught up on weekly schedule. Planned Sunday family dinner call.',
    actionItems: ['Call back Sunday 6 PM'],
  },
];

export const INITIAL_VOICEMAILS: VoicemailItem[] = [
  {
    id: 'vm-1',
    caller: {
      id: 'c-5',
      name: 'DHL Express Dispatch',
      number: '+1 (800) 225-5345',
      avatarGradient: 'from-yellow-500 to-amber-700',
      company: 'DHL Courier Service',
      tag: 'Direct Voicemail',
      e2eeVerified: false,
    },
    timestamp: '3 hours ago',
    duration: 45,
    isUnread: true,
    transcript: 'Hello, this is DHL Courier Alex with parcel #921-399. We need the front gate entrance pin code to drop off the hardware package securely. Please call back or reply in the app.',
    summary: 'Courier requiring building gate PIN #4902 to leave expedited delivery.',
    actionItems: ['Send door PIN #4902 to courier', 'Check package tracking status'],
    waveform: [15, 30, 45, 80, 60, 40, 75, 90, 85, 40, 20, 50, 70, 85, 95, 60, 35, 20, 45, 60, 40, 25, 10],
  },
  {
    id: 'vm-2',
    caller: {
      id: 'c-4',
      name: 'Sarah Chen',
      number: '+1 (408) 555-8392',
      avatarGradient: 'from-amber-400 to-orange-600',
      company: 'Google Phone Product Team',
      tag: 'AI Handled',
      e2eeVerified: true,
    },
    timestamp: 'Yesterday at 4:15 PM',
    duration: 62,
    isUnread: false,
    transcript: 'Hi GK! Sarah from the Android dialer team. Loved the HyperOS 4 liquid glass layout you previewed. We want to align on the WebRTC call screening intents before next Tuesday.',
    summary: 'Inviting to synchronize Android / HyperOS smart call screening API specifications.',
    actionItems: ['Accept calendar invite for Tuesday 10 AM', 'Prepare API specification sheet'],
    waveform: [20, 40, 65, 50, 70, 80, 60, 90, 75, 55, 30, 45, 80, 85, 70, 50, 65, 45, 30, 20],
  },
  {
    id: 'vm-3',
    caller: {
      id: 'c-3',
      name: 'Marcus Thorne',
      number: '+1 (206) 555-0144',
      avatarGradient: 'from-violet-500 to-purple-700',
      company: 'HyperOS Systems UI',
      tag: 'Verified Caller',
      e2eeVerified: true,
    },
    timestamp: 'Oct 09 at 11:20 AM',
    duration: 34,
    isUnread: false,
    transcript: 'Quick heads up: the acrylic glass refraction shader has been merged into the master branch with zero dropped frames on 120Hz OLED displays. Check the commit when free!',
    summary: 'HyperOS acrylic blur shader optimized for high-refresh 120Hz displays.',
    actionItems: ['Verify on mobile test device'],
    waveform: [10, 25, 40, 55, 75, 85, 60, 45, 70, 90, 65, 35, 20, 40, 60, 50, 30, 15],
  },
];

/**
 * T9 Letter to Number mapping
 */
const T9_MAP: Record<string, string> = {
  a: '2', b: '2', c: '2',
  d: '3', e: '3', f: '3',
  g: '4', h: '4', i: '4',
  j: '5', k: '5', l: '5',
  m: '6', n: '6', o: '6',
  p: '7', q: '7', r: '7', s: '7',
  t: '8', u: '8', v: '8',
  w: '9', x: '9', y: '9', z: '9',
};

export function convertNameToT9(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .split('')
    .map((char) => T9_MAP[char] || char)
    .join('');
}

export function searchContactsT9(query: string, contacts: Contact[]): Contact[] {
  if (!query) return [];
  const cleanQuery = query.replace(/[^0-9]/g, '');
  if (!cleanQuery) return [];

  return contacts.filter((contact) => {
    // Check phone number match
    const cleanNumber = contact.number.replace(/[^0-9]/g, '');
    if (cleanNumber.includes(cleanQuery)) return true;

    // Check name T9 match
    const nameT9 = convertNameToT9(contact.name);
    if (nameT9.includes(cleanQuery)) return true;

    // Check company T9 match
    if (contact.company) {
      const companyT9 = convertNameToT9(contact.company);
      if (companyT9.includes(cleanQuery)) return true;
    }

    return false;
  });
}
