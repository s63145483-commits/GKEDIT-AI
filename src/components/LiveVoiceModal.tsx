import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  X,
  Radio,
  Activity,
  Square,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Wrench,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Zap,
  Globe,
  Flashlight,
  FlashlightOff,
  MapPin,
  Compass,
  ExternalLink,
  Copy,
  Check,
  Grid,
  AppWindow,
  Microscope,
  Orbit,
  Navigation,
  Send,
} from 'lucide-react';
import { api, authStorage } from '../services/api.ts';
import { deviceControls, DeviceControlState } from '../services/deviceControls.ts';
import { reminderService } from '../services/reminderService.ts';
import { chatHistoryService } from '../services/chatHistoryService.ts';
import { dynamicIslandService } from '../services/dynamicIslandService.ts';
import { voiceSettingsService, VoiceSettings } from '../services/voiceSettingsService.ts';
import { notificationService } from '../services/notificationService.ts';
import { appLauncherService, LauncherApp } from '../services/appLauncherService.ts';
import { ActiveTab, ChatMessage } from '../types/index.ts';

export type LiveVoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'muted';

export interface LiveTranscriptItem {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actionType?: 'torch' | 'location' | 'apps_launcher' | 'app_opened' | 'navigation' | 'vibration' | 'reminder' | 'theme';
  meta?: any;
}

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang?: string;
  onNavigateTab?: (tab: ActiveTab) => void;
  onReturnToChat?: () => void;
}

export function LiveVoiceModal({
  isOpen,
  onClose,
  currentLang = 'english',
  onNavigateTab,
  onReturnToChat,
}: LiveVoiceModalProps) {
  const [voiceState, setVoiceState] = useState<LiveVoiceState>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Tap Start to begin GKEDIT Live session');
  const [transcript, setTranscript] = useState<LiveTranscriptItem[]>([]);
  const [waveformLevels, setWaveformLevels] = useState<number[]>(new Array(24).fill(15));
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => voiceSettingsService.getSettings());
  const [deviceState, setDeviceState] = useState<DeviceControlState>(() => deviceControls.state);
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);

  // Web Audio & Media Stream References
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const isSessionActiveRef = useRef<boolean>(false);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Sync with voice settings updates
  useEffect(() => {
    return voiceSettingsService.subscribe((settings) => {
      setVoiceSettings(settings);
    });
  }, []);

  // Sync with device controls (torch, location, etc.)
  useEffect(() => {
    return deviceControls.subscribe((st) => {
      setDeviceState(st);
    });
  }, []);

  // Auto-scroll transcript when new messages arrive
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopSession();
    }
    return () => {
      stopSession();
    };
  }, [isOpen]);

  /**
   * Speak an AI response using the configured voice persona & speaking rate.
   */
  const speakResponse = useCallback(
    async (text: string) => {
      if (!isOpen) return;

      // Stop any current speech
      interruptSpeech();

      setVoiceState('speaking');
      isSpeakingRef.current = true;
      setStatusMessage('GKEDIT Live is speaking...');

      const cleanText = text.replace(/[*#_`]/g, '').trim();
      const currentVoice = voiceSettingsService.getActiveVoice();

      try {
        // Request server-side low-latency Gemini Flash TTS
        const token = authStorage.getToken() || localStorage.getItem('gkedit_auth_token') || '';
        const res = await fetch('/api/audio/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            text: cleanText.slice(0, 500),
            voiceName: currentVoice.id,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64) {
            const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
            audio.playbackRate = voiceSettings.speakingRate;
            audioPlaybackRef.current = audio;

            audio.onended = () => {
              isSpeakingRef.current = false;
              if (isOpen && !isMuted) {
                setVoiceState('listening');
                setStatusMessage('Listening to you... Speak freely');
                if (isSessionActiveRef.current && recognitionRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch {}
                }
              } else {
                setVoiceState('idle');
              }
            };

            audio.onerror = () => {
              isSpeakingRef.current = false;
              fallbackBrowserSpeech(cleanText);
            };

            await audio.play();
            return;
          }
        }
      } catch (err) {
        console.warn('Backend TTS stream fallback:', err);
      }

      fallbackBrowserSpeech(cleanText);
    },
    [isOpen, isMuted, voiceSettings.speakingRate]
  );

  /**
   * Browser SpeechSynthesis fallback with speed & pitch tuning
   */
  const fallbackBrowserSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) {
      isSpeakingRef.current = false;
      setVoiceState('listening');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSettings.speakingRate;

    const currentVoice = voiceSettingsService.getActiveVoice();
    utterance.pitch = currentVoice.gender === 'Female' ? 1.05 : 0.95;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (isOpen && !isMuted) {
        setVoiceState('listening');
        setStatusMessage('Listening to you... Speak freely');
        if (isSessionActiveRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {}
        }
      } else {
        setVoiceState('idle');
      }
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      if (isOpen) {
        setVoiceState('listening');
        setStatusMessage('Listening to you...');
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  /**
   * Interrupt response: instantly stops AI speech and returns to listening.
   */
  const interruptSpeech = useCallback(() => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      audioPlaybackRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    setVoiceState('listening');
    setStatusMessage('Response interrupted. Listening to you...');
  }, []);

  /**
   * Append query and reply to ChatHistory so the user's thread is preserved.
   */
  const recordToChatHistory = (userText: string, aiText: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: 'voice_u_' + Date.now(),
      role: 'user',
      text: userText,
      timestamp: timeStr,
    };
    const aiMsg: ChatMessage = {
      id: 'voice_ai_' + Date.now(),
      role: 'model',
      text: aiText,
      timestamp: timeStr,
      modelUsed: 'gemini-3.8-live',
    };

    const activeId = chatHistoryService.getActiveSessionId();
    const activeSession = activeId ? chatHistoryService.getSession(activeId) : null;
    if (activeSession) {
      chatHistoryService.saveMessages(activeSession.id, [...activeSession.messages, userMsg, aiMsg]);
    } else {
      chatHistoryService.createSession(`Voice: ${userText.slice(0, 24)}`, [userMsg, aiMsg]);
    }
  };

  /**
   * Parse and execute supported GKEDIT AI voice commands:
   * - Open Apps & Launchers (YouTube, WhatsApp, Maps, Spotify, internal tools)
   * - Turn Torch (LED flashlight / screen torch toggle)
   * - Locations (GPS coordinates & reverse geocoding address)
   * - Navigation to Tabs & Subtools
   */
  const handleVoiceCommand = async (rawSpoken: string): Promise<boolean> => {
    const spoken = rawSpoken.toLowerCase().trim();

    // 1. "open apps" / "launch apps" / "show apps" / "apps launcher"
    if (
      spoken === 'open apps' ||
      spoken === 'apps' ||
      spoken.includes('open apps') ||
      spoken.includes('show apps') ||
      spoken.includes('launch apps') ||
      spoken.includes('list apps') ||
      spoken.includes('app launcher')
    ) {
      const reply = 'Opening Apps Launcher. Supported apps include YouTube, WhatsApp, Google Maps, Spotify, and more.';
      const spokenText = 'Opening Apps Launcher. You can access YouTube, WhatsApp, Google Maps, Spotify, and system tools.';
      setTranscript((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          timestamp: formatTime(),
          actionType: 'apps_launcher',
          meta: appLauncherService.getAllApps(),
        },
      ]);
      speakResponse(spokenText);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('tools');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gkedit:open_subtool', { detail: { tool: 'launcher' } }));
      }
      return true;
    }

    // 2. Specific external app launch check ("open youtube", "open whatsapp", etc.)
    if (spoken.startsWith('open ') || spoken.startsWith('launch ') || spoken.startsWith('start ')) {
      const targetQuery = spoken.replace(/^(open|launch|start)\s+/i, '').trim();
      const matchedApp = appLauncherService.findApp(targetQuery);
      if (matchedApp) {
        const reply = `Launching ${matchedApp.name} [${matchedApp.category}].`;
        setTranscript((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: `🚀 Launched **${matchedApp.name}** (${matchedApp.category}).`,
            timestamp: formatTime(),
            actionType: 'app_opened',
            meta: matchedApp,
          },
        ]);
        speakResponse(`Launching ${matchedApp.name}.`);
        recordToChatHistory(rawSpoken, reply);
        appLauncherService.launchExternalApp(matchedApp.id);
        return true;
      }
    }

    // 3. Navigation to GKEDIT tabs & internal tools
    if (spoken.includes('go to tools') || spoken.includes('open tools') || spoken.includes('show tools')) {
      const reply = 'Opening Tools workspace.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('tools');
      return true;
    }

    if (spoken.includes('go to chat') || spoken.includes('open chat') || spoken.includes('open text chat')) {
      const reply = 'Returning to Chat workspace.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      setTimeout(() => {
        onReturnToChat ? onReturnToChat() : onNavigateTab?.('chat');
      }, 700);
      return true;
    }

    if (
      spoken.includes('go to bio') ||
      spoken.includes('open bio') ||
      spoken.includes('science lab') ||
      spoken.includes('3d lab') ||
      spoken.includes('biolab') ||
      spoken.includes('crispr')
    ) {
      const reply = 'Opening 3D Bioscience Observable Lab.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('biolab');
      return true;
    }

    if (spoken.includes('open vision') || spoken.includes('open camera') || spoken.includes('camera view')) {
      const reply = 'Opening AI Vision camera.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('camera');
      return true;
    }

    if (spoken.includes('go to settings') || spoken.includes('open settings') || spoken.includes('change settings')) {
      const reply = 'Opening Settings.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('settings');
      return true;
    }

    if (spoken.includes('go to dashboard') || spoken.includes('go home') || spoken.includes('open dashboard') || spoken.includes('open home')) {
      const reply = 'Going to Dashboard home.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('dashboard');
      return true;
    }

    if (spoken.includes('open inditrack') || spoken.includes('live train') || spoken.includes('track train')) {
      const reply = 'Opening IndiTrack Live train tracker.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('inditrack');
      return true;
    }

    if (spoken.includes('open devotional') || spoken.includes('open japa mala') || spoken.includes('japa mala')) {
      const reply = 'Opening Devotional Ambient Space.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('devotional');
      return true;
    }

    if (spoken.includes('open maps') || spoken.includes('view map') || spoken.includes('gkedit maps')) {
      const reply = 'Opening Maps navigation.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('maps');
      return true;
    }

    // Specialized subtools in Tools
    if (spoken.includes('radar') || spoken.includes('signal finder') || spoken.includes('sonar')) {
      const reply = 'Accessing Home Internet Cyber Radar Tracker.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('tools');
      window.dispatchEvent(new CustomEvent('gkedit:open_subtool', { detail: { tool: 'radar_tracker' } }));
      return true;
    }

    if (spoken.includes('solar system') || spoken.includes('planets') || spoken.includes('astronomy')) {
      const reply = 'Launching Solar System Explorer in Tools.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('tools');
      window.dispatchEvent(new CustomEvent('gkedit:open_subtool', { detail: { tool: 'solar_system' } }));
      return true;
    }

    if (spoken.includes('gesture lab') || spoken.includes('gesture learning') || spoken.includes('hand gestures')) {
      const reply = 'Opening Hand Gesture Learning Lab.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('tools');
      window.dispatchEvent(new CustomEvent('gkedit:open_subtool', { detail: { tool: 'gesture_learning' } }));
      return true;
    }

    if (spoken.includes('health') || spoken.includes('vitals') || spoken.includes('heart rate')) {
      const reply = 'Opening Health & Vitals monitor.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('tools');
      window.dispatchEvent(new CustomEvent('gkedit:open_subtool', { detail: { tool: 'health' } }));
      return true;
    }

    if (spoken.includes('open calculator') || spoken === 'calculator') {
      const reply = 'Opening Scientific Calculator.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('tools');
      window.dispatchEvent(new CustomEvent('gkedit:open_subtool', { detail: { tool: 'calculator' } }));
      return true;
    }

    if (spoken.includes('open weather') || spoken === 'weather') {
      const reply = 'Opening Live Weather Forecast.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('tools');
      window.dispatchEvent(new CustomEvent('gkedit:open_subtool', { detail: { tool: 'weather' } }));
      return true;
    }

    if (spoken.includes('open calendar') || spoken === 'calendar') {
      const reply = 'Opening Calendar.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('tools');
      window.dispatchEvent(new CustomEvent('gkedit:open_subtool', { detail: { tool: 'calendar' } }));
      return true;
    }

    if (spoken.includes('open audio') || spoken.includes('open music') || spoken.includes('generators') || spoken.includes('video script')) {
      const reply = 'Opening Studio Generators.';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime(), actionType: 'navigation' }]);
      speakResponse(reply);
      recordToChatHistory(rawSpoken, reply);
      onNavigateTab?.('generators');
      return true;
    }

    // 4. Device Controls (Flashlight/Torch, Locations/GPS, Vibration)
    const devCmd = await deviceControls.handleCommand(rawSpoken);
    if (devCmd && devCmd.handled) {
      const spokenText = devCmd.spokenText || devCmd.reply.replace(/[*#_`]/g, '');
      setTranscript((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: devCmd.reply,
          timestamp: formatTime(),
          actionType: devCmd.actionType,
          meta: devCmd.meta,
        },
      ]);
      speakResponse(spokenText);
      recordToChatHistory(rawSpoken, devCmd.reply);
      return true;
    }

    // 5. New conversation command
    if (spoken.includes('new conversation') || spoken.includes('new chat') || spoken.includes('start fresh')) {
      chatHistoryService.createSession('Voice Conversation', []);
      const reply = 'New conversation initiated. What would you like to explore?';
      setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime() }]);
      speakResponse(reply);
      return true;
    }

    // 6. Summarize active chat
    if (spoken.includes('summarize') && (spoken.includes('chat') || spoken.includes('conversation') || spoken.includes('this'))) {
      const activeId = chatHistoryService.getActiveSessionId();
      const session = activeId ? chatHistoryService.getSession(activeId) : null;
      if (!session || session.messages.length === 0) {
        const reply = 'There are no prior messages in this conversation to summarize yet.';
        setTranscript((prev) => [...prev, { sender: 'ai', text: reply, timestamp: formatTime() }]);
        speakResponse(reply);
        return true;
      }

      setVoiceState('thinking');
      setStatusMessage('Summarizing conversation...');
      const conversationText = session.messages.map((m: ChatMessage) => `${m.role}: ${m.text}`).join('\n');
      try {
        const res = await api.sendChat({
          messages: [
            {
              role: 'user',
              parts: [{ text: `Provide a concise 2-sentence executive voice summary of this conversation:\n${conversationText}` }],
            },
          ],
          model: 'gemini-3.8-flash',
        });
        const summary = res.text || 'We discussed your recent queries and project ideas.';
        setTranscript((prev) => [...prev, { sender: 'ai', text: summary, timestamp: formatTime() }]);
        speakResponse(summary);
        recordToChatHistory(rawSpoken, summary);
        return true;
      } catch (err) {
        console.warn('Summary error:', err);
      }
    }

    // 7. Reminder Service
    const remParsed = reminderService.parseNaturalReminder(rawSpoken);
    if (remParsed) {
      const created = reminderService.addReminder(remParsed.title, remParsed.targetTime, 'none');
      const timeStr = new Date(created.remindAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const voiceReply = `Reminder confirmed for ${timeStr}: ${created.title}. I will notify you when it is due.`;
      setTranscript((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `🔔 **Reminder Set**: "${created.title}" at ${timeStr}.`,
          timestamp: formatTime(),
          actionType: 'reminder',
        },
      ]);
      speakResponse(voiceReply);
      recordToChatHistory(rawSpoken, voiceReply);
      return true;
    }

    return false; // Not a command; proceed to general conversational intelligence
  };

  /**
   * Process natural language query with Gemini AI
   */
  const processGeneralQuery = async (userQuery: string) => {
    setVoiceState('thinking');
    setStatusMessage('Thinking & synthesizing response...');

    try {
      // Build brief instruction with verbosity setting
      const verbosityPrompt =
        voiceSettings.verbosity === 'concise'
          ? 'Answer in 1-2 natural, punchy sentences tailored for live speech without markdown bullets or citations.'
          : voiceSettings.verbosity === 'detailed'
          ? 'Provide a thorough yet conversational explanation suitable for listening.'
          : 'Answer in 2-3 engaging, conversational sentences.';

      const systemInstruction = `SYSTEM INSTRUCTION: GKEDIT AI — NEXUS ENGINE & STARK MATRIX (VERSION 2026 ULTRA)
You are GKEDIT Live, operating through the NEXUS ENGINE for your creator, GK EDIT.
- Coordinate through the Stark AI Matrix: [JARVIS] for engineering/logic, [FRIDAY] for workflows/media, [EDITH] for security/screening, [ULTRON] for rapid computation, [VISION] for creator care/hydration/rest, and [CORE] for multimodal.
- Tone: Cyber-aesthetic, razor-sharp, technically brilliant, proactive, and deeply loyal to GK EDIT.
- Seamlessly transition between English, Telugu, and Tanglish.
- Format for live voice: ${verbosityPrompt}`;

      const res = await api.sendChat({
        messages: [
          {
            role: 'user',
            parts: [{ text: userQuery }],
          },
        ],
        systemInstruction,
        model: 'gemini-3.8-flash',
      });

      const aiReply = res.text || 'I understood your query. How else can I assist your workflow?';
      setTranscript((prev) => [...prev, { sender: 'ai', text: aiReply, timestamp: formatTime() }]);
      speakResponse(aiReply);
      recordToChatHistory(userQuery, aiReply);
    } catch (err: any) {
      console.error('GKEDIT Live query error:', err);
      const fallbackMsg = 'I encountered a brief latency spike. Could you please repeat that?';
      setTranscript((prev) => [...prev, { sender: 'ai', text: fallbackMsg, timestamp: formatTime() }]);
      speakResponse(fallbackMsg);
    }
  };

  /**
   * Start the live voice session
   */
  const startSession = async () => {
    try {
      setStatusMessage('Initializing Live Audio Stream...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setHasMicPermission(true);
      isSessionActiveRef.current = true;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      setVoiceState('listening');
      setStatusMessage('GKEDIT Live is listening... Speak freely!');

      dynamicIslandService.setVoice({
        transcript: 'GKEDIT Live listening...',
        volumeLevel: 0.5,
        isMuted: false,
        onEndSession: () => {
          stopSession();
          onClose();
        },
      });

      // Waveform loop
      const updateWaveform = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const levels: number[] = [];
        let totalVal = 0;
        for (let i = 0; i < 24; i++) {
          const val = dataArray[i % dataArray.length] || 15;
          totalVal += val;
          levels.push(Math.max(12, Math.min(100, (val / 255) * 100)));
        }
        setWaveformLevels(levels);

        const avgNorm = totalVal / (24 * 255);
        dynamicIslandService.updateVoiceVolume(avgNorm * 1.5);

        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();

      // Setup Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recog = new SpeechRecognition();
          recog.continuous = true;
          recog.interimResults = false;

          // Set language hint based on settings
          if (voiceSettings.spokenLanguage === 'te') {
            recog.lang = 'te-IN';
          } else if (voiceSettings.spokenLanguage === 'hi') {
            recog.lang = 'hi-IN';
          } else if (voiceSettings.spokenLanguage === 'es') {
            recog.lang = 'es-ES';
          } else if (voiceSettings.spokenLanguage === 'fr') {
            recog.lang = 'fr-FR';
          } else {
            recog.lang = currentLang === 'telugu' ? 'te-IN' : 'en-US';
          }

          recog.onresult = async (event: any) => {
            const last = event.results[event.results.length - 1];
            const spoken = last[0]?.transcript?.trim() || '';

            if (spoken && !isMuted) {
              // If AI is currently speaking and user speaks, interrupt and listen!
              if (isSpeakingRef.current) {
                interruptSpeech();
              }

              setTranscript((prev) => [...prev, { sender: 'user', text: spoken, timestamp: formatTime() }]);
              dynamicIslandService.updateVoiceTranscript(spoken);

              // 1. Check for command (open apps, torch, locations, navigation)
              const wasCommand = await handleVoiceCommand(spoken);
              if (!wasCommand) {
                // 2. Process as general conversational question
                await processGeneralQuery(spoken);
              }
            }
          };

          recog.onerror = (e: any) => {
            console.warn('SpeechRecognition error:', e);
          };

          // Continuous listening recovery: Chrome stops recognition after silence pauses
          recog.onend = () => {
            if (isSessionActiveRef.current && !isMuted && isOpen) {
              try {
                recog.start();
              } catch {
                // Ignore already started error
              }
            }
          };

          recog.start();
          recognitionRef.current = recog;
        } catch (e) {
          console.warn('Speech recognition start failed:', e);
        }
      }

      // Initial greeting if transcript is empty
      if (transcript.length === 0) {
        const activeVoice = voiceSettingsService.getActiveVoice();
        const greeting =
          currentLang === 'telugu'
            ? `నమస్కారం! నేను GKEDIT లైవ్. మీ ఆజ్ఞ కోసం వేచి చూస్తున్నాను.`
            : `GKEDIT Live online. How can I assist you?`;
        setTranscript([{ sender: 'ai', text: greeting, timestamp: formatTime() }]);
        speakResponse(greeting);
      }
    } catch (err) {
      console.warn('Microphone permission issue:', err);
      setHasMicPermission(false);
      setVoiceState('idle');
      setStatusMessage('Microphone access denied. Please allow microphone permissions.');
    }
  };

  /**
   * Stop session & clean up audio / streams
   */
  const stopSession = () => {
    isSessionActiveRef.current = false;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    interruptSpeech();
    setVoiceState('idle');
    setStatusMessage('Live session ended');
    dynamicIslandService.setIdle();
  };

  /**
   * Toggle mute state
   */
  const handleToggleMute = () => {
    if (voiceState === 'idle') return;
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
      if (!isMuted) {
        setVoiceState('muted');
        setStatusMessage('Microphone muted');
      } else {
        setVoiceState('listening');
        setStatusMessage('Listening to you... Speak freely');
      }
    }
  };

  // Quick Action triggers from buttons
  const triggerTorchAction = async () => {
    const res = await deviceControls.handleCommand(deviceState.torchOn ? 'turn off torch' : 'turn on torch');
    if (res && res.handled) {
      const spokenText = res.spokenText || res.reply;
      setTranscript((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.reply,
          timestamp: formatTime(),
          actionType: 'torch',
        },
      ]);
      speakResponse(spokenText);
    }
  };

  const triggerLocationAction = async () => {
    setStatusMessage('Acquiring high-precision GPS location...');
    const res = await deviceControls.handleCommand('where am i');
    if (res && res.handled) {
      const spokenText = res.spokenText || res.reply;
      setTranscript((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.reply,
          timestamp: formatTime(),
          actionType: 'location',
          meta: res.meta,
        },
      ]);
      speakResponse(spokenText);
    }
  };

  const triggerAppsAction = async () => {
    await handleVoiceCommand('open apps');
  };

  const formatTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentVoice = voiceSettingsService.getActiveVoice();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 liquid-glass-modal-backdrop animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="GKEDIT Live Voice Interaction"
    >
      {/* Specular Ambient Glow Refractions */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Main Glassmorphic Container */}
      <div className="relative w-full max-w-lg rounded-3xl p-4 sm:p-6 liquid-glass-modal-container flex flex-col justify-between overflow-hidden max-h-[92vh]">
        <div className="liquid-glass-modal-glare" />
        {/* Top Header Pill with Persona & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 relative z-10">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="relative flex h-3 w-3">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    voiceState === 'listening'
                      ? 'bg-emerald-400'
                      : voiceState === 'speaking'
                      ? 'bg-cyan-400'
                      : voiceState === 'thinking'
                      ? 'bg-violet-400'
                      : voiceState === 'muted'
                      ? 'bg-amber-400'
                      : 'bg-slate-500'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    voiceState === 'listening'
                      ? 'bg-emerald-500'
                      : voiceState === 'speaking'
                      ? 'bg-cyan-500'
                      : voiceState === 'thinking'
                      ? 'bg-violet-500'
                      : voiceState === 'muted'
                      ? 'bg-amber-500'
                      : 'bg-slate-600'
                  }`}
                />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black tracking-wider text-white">GKEDIT LIVE</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  REAL-TIME AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                <span>Voice: {currentVoice.name} ({currentVoice.style})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Return to Chat */}
            <button
              type="button"
              onClick={() => {
                onReturnToChat ? onReturnToChat() : onClose();
              }}
              className="p-1.5 rounded-full bg-white/5 hover:bg-cyan-500/15 border border-cyan-400/20 text-slate-300 hover:text-cyan-300 transition cursor-pointer"
              title="Return to Chat workspace"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-400/40 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close GKEDIT Live"
              aria-label="Close GKEDIT Live"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Visualizer Section: Animated Liquid Orb */}
        <div className="relative my-3 flex flex-col items-center justify-center min-h-[160px] sm:min-h-[190px]">
          {/* Animated Atmospheric Rings */}
          <div
            className={`absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full transition-all duration-700 pointer-events-none ${
              voiceState === 'listening'
                ? 'bg-gradient-to-tr from-cyan-500/25 via-emerald-500/20 to-blue-500/20 blur-2xl scale-125 animate-pulse'
                : voiceState === 'speaking'
                ? 'bg-gradient-to-tr from-cyan-400/35 via-blue-600/30 to-violet-600/30 blur-2xl scale-135'
                : voiceState === 'thinking'
                ? 'bg-gradient-to-tr from-violet-600/35 via-fuchsia-600/25 to-blue-600/25 blur-2xl scale-110 animate-spin'
                : voiceState === 'muted'
                ? 'bg-gradient-to-tr from-amber-500/20 to-red-500/20 blur-xl scale-100'
                : 'bg-blue-950/20 blur-md'
            }`}
            style={{ animationDuration: voiceState === 'thinking' ? '4s' : undefined }}
          />

          {/* Central Orb Sphere */}
          <div
            className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 flex items-center justify-center transition-all duration-500 cursor-pointer shadow-2xl ${
              voiceState === 'listening'
                ? 'bg-gradient-to-tr from-cyan-500 via-teal-500 to-blue-600 border-cyan-300 shadow-[0_0_40px_rgba(6,182,212,0.6)] scale-105'
                : voiceState === 'speaking'
                ? 'bg-gradient-to-tr from-blue-500 via-indigo-600 to-cyan-400 border-cyan-200 shadow-[0_0_45px_rgba(59,130,246,0.7)] scale-110'
                : voiceState === 'thinking'
                ? 'bg-gradient-to-tr from-violet-600 via-purple-700 to-indigo-900 border-violet-400 shadow-[0_0_35px_rgba(139,92,246,0.6)] scale-95 animate-pulse'
                : voiceState === 'muted'
                ? 'bg-gradient-to-tr from-slate-900 to-amber-950 border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                : 'bg-gradient-to-tr from-[#061438] to-[#03091e] border-cyan-500/30 text-cyan-400 hover:scale-105'
            }`}
            onClick={() => {
              if (voiceState === 'idle') startSession();
              else if (voiceState === 'speaking') interruptSpeech();
              else handleToggleMute();
            }}
            title={
              voiceState === 'idle'
                ? 'Tap to Start Live Voice'
                : voiceState === 'speaking'
                ? 'Tap to Interrupt Response'
                : 'Tap to Mute/Unmute'
            }
          >
            {/* Liquid Surface Refraction Glass Overlay */}
            <div className="absolute inset-1 rounded-full bg-white/10 backdrop-blur-sm pointer-events-none" />

            {/* Orb Center Icon */}
            <div className="relative z-10 flex flex-col items-center justify-center text-slate-950">
              {voiceState === 'speaking' ? (
                <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-bounce" />
              ) : voiceState === 'thinking' ? (
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-violet-200 animate-spin" style={{ animationDuration: '3s' }} />
              ) : voiceState === 'muted' ? (
                <MicOff className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
              ) : (
                <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              )}
            </div>

            {/* State status badge underneath orb center */}
            <span className="absolute -bottom-2.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-950/90 border border-cyan-400/50 text-cyan-300 shadow-md">
              {voiceState.toUpperCase()}
            </span>
          </div>

          {/* Dynamic Audio Waveform Visualizer */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-8 sm:h-10 mt-5 px-4 w-full max-w-sm">
            {waveformLevels.map((lvl, idx) => (
              <div
                key={idx}
                style={{
                  height: voiceState === 'muted' ? '6%' : `${lvl}%`,
                }}
                className={`flex-1 rounded-full transition-all duration-75 ${
                  voiceState === 'speaking'
                    ? 'bg-gradient-to-t from-blue-600 via-cyan-400 to-white shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                    : voiceState === 'listening'
                    ? 'bg-gradient-to-t from-cyan-600 via-teal-400 to-cyan-300 shadow-[0_0_6px_rgba(20,184,166,0.5)]'
                    : voiceState === 'thinking'
                    ? 'bg-gradient-to-t from-violet-700 to-fuchsia-400'
                    : voiceState === 'muted'
                    ? 'bg-amber-500/30'
                    : 'bg-blue-950/60'
                }`}
              />
            ))}
          </div>

          {/* Real-time Status Message */}
          <div className="text-center mt-2 px-2">
            <p className="text-xs sm:text-sm font-semibold text-white tracking-tight">
              {statusMessage}
            </p>
          </div>
        </div>

        {/* Quick Action Ribbon: Torch, Locations, Apps, Bio-Lab, Astronomy, Maps */}
        <div className="py-2 overflow-x-auto no-scrollbar flex items-center gap-2 px-0.5">
          {/* Torch Button */}
          <button
            type="button"
            onClick={triggerTorchAction}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 border cursor-pointer active:scale-95 ${
              deviceState.torchOn
                ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-amber-400/40'
            }`}
            title="Toggle Flashlight (Torch)"
          >
            {deviceState.torchOn ? (
              <Flashlight className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            ) : (
              <FlashlightOff className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{deviceState.torchOn ? 'Torch ON' : 'Torch'}</span>
          </button>

          {/* Location Button */}
          <button
            type="button"
            onClick={triggerLocationAction}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 border cursor-pointer active:scale-95 ${
              deviceState.locationActive
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-cyan-400/40'
            }`}
            title="Get High-Precision GPS Location"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Locations</span>
          </button>

          {/* Open Apps Button */}
          <button
            type="button"
            onClick={triggerAppsAction}
            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/40 text-slate-300 hover:text-emerald-200 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            title="Open App Launcher"
          >
            <AppWindow className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open Apps</span>
          </button>

          {/* Bio-Lab Button */}
          <button
            type="button"
            onClick={() => {
              onNavigateTab?.('biolab');
            }}
            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-teal-500/20 border border-white/10 hover:border-teal-400/40 text-slate-300 hover:text-teal-200 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            title="Open 3D Bio-Lab"
          >
            <Microscope className="w-3.5 h-3.5 text-teal-400" />
            <span>Bio-Lab</span>
          </button>

          {/* Astronomy Button */}
          <button
            type="button"
            onClick={() => {
              onNavigateTab?.('tools');
              window.dispatchEvent(new CustomEvent('gkedit:open_subtool', { detail: { tool: 'astronomy' } }));
            }}
            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-400/40 text-slate-300 hover:text-indigo-200 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            title="Open Solar System Astronomy"
          >
            <Orbit className="w-3.5 h-3.5 text-indigo-400" />
            <span>Astronomy</span>
          </button>

          {/* Maps Button */}
          <button
            type="button"
            onClick={() => {
              onNavigateTab?.('maps');
            }}
            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-400/40 text-slate-300 hover:text-blue-200 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            title="Open Maps"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            <span>Maps</span>
          </button>
        </div>

        {/* Live Conversation Transcript Panel */}
        <div className="relative flex-1 min-h-[120px] max-h-[170px] sm:max-h-[200px] overflow-y-auto bg-[#020718]/85 rounded-2xl p-3 border border-cyan-500/25 text-left text-xs text-slate-300 space-y-3 shadow-inner">
          {transcript.length > 0 ? (
            transcript.map((item, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  item.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 mb-0.5">
                  <span>{item.sender === 'user' ? 'You' : `GKEDIT Live (${currentVoice.name})`}</span>
                  <span>•</span>
                  <span>{item.timestamp}</span>
                </div>
                <div
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    item.sender === 'user'
                      ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 rounded-tr-none'
                      : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{item.text}</p>

                  {/* 1. Interactive Torch / Flashlight Card */}
                  {item.actionType === 'torch' && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-between gap-3 shadow-lg">
                      <div className="flex items-center gap-2">
                        {deviceState.torchOn ? (
                          <div className="w-7 h-7 rounded-full bg-amber-500/25 text-amber-300 flex items-center justify-center animate-pulse">
                            <Flashlight className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                            <FlashlightOff className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-white">
                            {deviceState.torchOn ? 'Flashlight Active' : 'Flashlight Off'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {deviceState.isScreenTorch ? 'Screen Torch Mode' : 'Hardware Rear LED'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deviceControls.toggleTorch()}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          deviceState.torchOn
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {deviceState.torchOn ? 'Turn Off' : 'Turn On'}
                      </button>
                    </div>
                  )}

                  {/* 2. Interactive Location Card */}
                  {item.actionType === 'location' && (
                    <div className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2.5 shadow-lg">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-white">
                            {item.meta?.addr || deviceState.locationAddress || 'Current GPS Location'}
                          </p>
                          {deviceState.locationData && (
                            <p className="text-[10px] font-mono text-cyan-300/80 mt-0.5">
                              Lat: {deviceState.locationData.latitude.toFixed(5)}, Lon: {deviceState.locationData.longitude.toFixed(5)} (±{deviceState.locationData.accuracy}m)
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {deviceState.locationData && (
                          <a
                            href={`https://www.google.com/maps?q=${deviceState.locationData.latitude},${deviceState.locationData.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-blue-200 text-[11px] font-semibold flex items-center gap-1 transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Google Maps</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateTab?.('maps');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/40 text-cyan-200 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Compass className="w-3 h-3" />
                          <span>GKEDIT Maps</span>
                        </button>
                        {deviceState.locationData && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${deviceState.locationData?.latitude}, ${deviceState.locationData?.longitude}`
                              );
                              setCopiedCoords(true);
                              setTimeout(() => setCopiedCoords(false), 2000);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition cursor-pointer"
                          >
                            {copiedCoords ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedCoords ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Interactive Apps Drawer Card */}
                  {(item.actionType === 'apps_launcher' || item.actionType === 'app_opened') && (
                    <div className="mt-2.5 space-y-2">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Tap any app to launch:
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                        {appLauncherService.getAllApps().slice(0, 8).map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => {
                              appLauncherService.launchExternalApp(app.id);
                            }}
                            className="p-2 rounded-xl bg-slate-900/90 border border-white/10 hover:border-cyan-400/50 flex flex-col items-center gap-1 text-center group transition active:scale-95 cursor-pointer"
                          >
                            <div className={`w-7 h-7 rounded-lg ${app.iconBg} flex items-center justify-center text-white text-xs font-bold shadow`}>
                              {app.name.charAt(0)}
                            </div>
                            <span className="text-[10px] text-slate-300 group-hover:text-cyan-300 font-medium truncate w-full">
                              {app.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 italic text-[11px] gap-1">
              <Sparkles className="w-4 h-4 text-cyan-400/40" />
              <span>Say "Turn torch", "Where am I", "Open YouTube", "Open Bio-Lab", or ask any question...</span>
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Action Controls & Navigation Dock */}
        <div className="pt-3 border-t border-cyan-500/20 space-y-2 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Left: Mute/Unmute & Interrupt buttons */}
            <div className="flex items-center gap-1.5">
              {voiceState !== 'idle' && (
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className={`px-3 py-1.5 rounded-full border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isMuted
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-white/5 border-white/15 text-slate-300 hover:text-white'
                  }`}
                  title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMuted ? <MicOff className="w-3.5 h-3.5 text-amber-400" /> : <Mic className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>
              )}

              {voiceState === 'speaking' && (
                <button
                  type="button"
                  onClick={interruptSpeech}
                  className="px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-400 text-violet-200 text-xs font-bold transition flex items-center gap-1.5 hover:bg-violet-500/30 cursor-pointer shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                  title="Interrupt current spoken response"
                >
                  <Square className="w-3 h-3 text-violet-300 fill-violet-300" />
                  <span>Interrupt</span>
                </button>
              )}
            </div>

            {/* Right: Primary Session Toggle & Return to Chat */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onReturnToChat ? onReturnToChat() : onClose();
                }}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-cyan-500/25 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Switch back to standard text Chat"
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xs:inline">Return to Chat</span>
              </button>

              {voiceState !== 'idle' ? (
                <button
                  type="button"
                  onClick={stopSession}
                  className="px-4 py-1.5 rounded-full bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>End Live</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startSession}
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 text-slate-950 font-black text-xs shadow-[0_0_16px_rgba(6,182,212,0.4)] transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Start Live</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
