import { CallerInfo, TranscriptMessage } from '../types/telephony.ts';

export interface ScreeningScenario {
  id: string;
  title: string;
  badge: string;
  caller: CallerInfo;
  initialTranscript: TranscriptMessage[];
  streamingSteps: {
    delayMs: number;
    message: TranscriptMessage;
    detectedIntent?: string;
    suggestedActions?: string[];
  }[];
}

export const SCREENING_SCENARIOS: ScreeningScenario[] = [
  {
    id: 'sc-1',
    title: 'Flagged Robocall / Spam Intercept',
    badge: 'Spam 94%',
    caller: {
      id: 'c-spam-live',
      name: 'Automated Solar Warranty Service',
      number: '+1 (888) 794-2041',
      avatarGradient: 'from-rose-600 to-red-800',
      company: 'Robo Dialing Matrix LLC',
      tag: 'Spam Filtered',
      spamScore: 94,
      e2eeVerified: false,
      location: 'Las Vegas, NV',
    },
    initialTranscript: [
      {
        id: 'msg-0',
        speaker: 'ai_assistant',
        text: 'GKEDIT AI Phone Screening: The person you called is screening this call with AI. Please state your name and why you are calling.',
        timestamp: '00:02',
      },
    ],
    streamingSteps: [
      {
        delayMs: 1400,
        message: {
          id: 'msg-1',
          speaker: 'caller',
          text: 'Hello! This is Kevin from Federal Energy Alliance. Urgent notice regarding your electrical meter tariff rebate...',
          timestamp: '00:08',
          intent: 'High-volume Solar Telemarketer',
        },
        detectedIntent: 'Automated Telemarketing Script',
        suggestedActions: ['Block & Terminate Line', 'Troll with AI Counter-Script', 'Report to FTC / Do Not Call'],
      },
      {
        delayMs: 2800,
        message: {
          id: 'msg-2',
          speaker: 'ai_assistant',
          text: 'GKEDIT AI: This number is listed on the Federal Do Not Call Registry. State your licensed legal entity ID.',
          timestamp: '00:16',
        },
      },
      {
        delayMs: 2400,
        message: {
          id: 'msg-3',
          speaker: 'caller',
          text: 'Uh... you have been pre-approved for $4,500 solar... click 1 now to speak to a specialist...',
          timestamp: '00:23',
          intent: 'Synthesized voice loop',
        },
        detectedIntent: 'Confirmed Robocall Bot',
        suggestedActions: ['Auto-Hangup & Add to Spam Ledger', 'Record Audio Evidence'],
      },
      {
        delayMs: 2000,
        message: {
          id: 'msg-4',
          speaker: 'ai_assistant',
          text: 'Threat threshold reached (94%). Connection rejected and carrier spam token dispatched. Goodbye.',
          timestamp: '00:29',
        },
      },
    ],
  },
  {
    id: 'sc-2',
    title: 'Dr. Elena Vance (Quantum WebRTC Labs)',
    badge: 'Verified VIP',
    caller: {
      id: 'c-2',
      name: 'Dr. Elena Vance',
      number: '+1 (650) 412-9081',
      avatarGradient: 'from-emerald-400 to-teal-600',
      company: 'Quantum WebRTC Labs',
      tag: 'Verified Caller',
      spamScore: 1,
      e2eeVerified: true,
      location: 'Palo Alto, CA',
    },
    initialTranscript: [
      {
        id: 'msg-0',
        speaker: 'ai_assistant',
        text: 'GKEDIT AI Screening: Hi Dr. Elena! GK is in a studio build sprint. I can transcribe your message or bridge you immediately. What is on your mind?',
        timestamp: '00:02',
      },
    ],
    streamingSteps: [
      {
        delayMs: 1500,
        message: {
          id: 'msg-1',
          speaker: 'caller',
          text: 'Hey GK! The HyperOS 4 WebRTC Opus 48kHz audio pipeline passed our latency benchmarks with 16ms round trip and zero packet loss!',
          timestamp: '00:09',
          intent: 'Engineering Breakthrough',
        },
        detectedIntent: 'High Priority Project Update',
        suggestedActions: ['Pick Up / Answer Now', 'Reply: "Amazing! Joining meeting now"', 'Ask to send telemetry logs'],
      },
      {
        delayMs: 2600,
        message: {
          id: 'msg-2',
          speaker: 'caller',
          text: 'We also pre-configured the DTLS-SRTP 256-bit encryption handshake so all calls are military-grade private out of the box.',
          timestamp: '00:18',
          intent: 'Security Protocol Confirmed',
        },
        detectedIntent: 'Actionable milestone',
        suggestedActions: ['Connect to Direct Voice Line', 'Live Note-Taking', 'Send thumbs up'],
      },
      {
        delayMs: 2200,
        message: {
          id: 'msg-3',
          speaker: 'ai_assistant',
          text: 'GKEDIT AI: Noted with high priority. I am preparing a live summary card for GK right now.',
          timestamp: '00:26',
        },
      },
    ],
  },
  {
    id: 'sc-3',
    title: 'DHL Express Courier (Gate Dispatch)',
    badge: 'Courier Gate',
    caller: {
      id: 'c-5',
      name: 'DHL Express Dispatch',
      number: '+1 (800) 225-5345',
      avatarGradient: 'from-yellow-500 to-amber-700',
      company: 'DHL Courier Service',
      tag: 'Direct Voicemail',
      spamScore: 8,
      e2eeVerified: false,
      location: 'San Francisco Hub',
    },
    initialTranscript: [
      {
        id: 'msg-0',
        speaker: 'ai_assistant',
        text: 'GKEDIT AI Screening: Hello, please state your name and package tracking ID.',
        timestamp: '00:02',
      },
    ],
    streamingSteps: [
      {
        delayMs: 1600,
        message: {
          id: 'msg-1',
          speaker: 'caller',
          text: 'Hi, this is Marco from DHL with the hardware kit. We are at building gate 4B and need the keypad security code to access the parcel lockers.',
          timestamp: '00:08',
          intent: 'Delivery Access Required',
        },
        detectedIntent: 'Gate code request for urgent parcel',
        suggestedActions: ['Reply: Gate code is #4902', 'Reply: Leave at front reception desk', 'Connect Call'],
      },
      {
        delayMs: 2500,
        message: {
          id: 'msg-2',
          speaker: 'ai_assistant',
          text: 'GKEDIT AI: Checking recipient security preferences... Gate code #4902 has been authorized for secure parcel locker 14.',
          timestamp: '00:18',
        },
      },
      {
        delayMs: 2000,
        message: {
          id: 'msg-3',
          speaker: 'caller',
          text: 'Got it, thank you! Package deposited in locker 14. Have a good day!',
          timestamp: '00:25',
          intent: 'Delivery Complete',
        },
        detectedIntent: 'Task Resolved',
        suggestedActions: ['Save delivery confirmation note', 'Dismiss'],
      },
    ],
  },
];
