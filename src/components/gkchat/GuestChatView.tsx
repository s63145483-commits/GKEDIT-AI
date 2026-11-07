import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  ShieldCheck,
  Phone,
  Video,
  Image as ImageIcon,
  Mic,
  Smile,
  X,
  Lock,
  Sparkles,
  ArrowLeft,
  Check,
  CheckCheck,
  User,
  ExternalLink,
  Volume2,
} from 'lucide-react';
import { p2pRoomSyncService, RoomChatMessage } from '../../services/p2pRoomSyncService.ts';

interface GuestChatViewProps {
  room: string;
  to: string;
  onExitGuestView?: () => void;
}

export function GuestChatView({ room, to, onExitGuestView }: GuestChatViewProps) {
  const hostName = to ? decodeURIComponent(to) : 'GK EDIT';
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [guestName, setGuestName] = useState(() => {
    try {
      return localStorage.getItem('gk_guest_user_name') || 'Guest';
    } catch {
      return 'Guest';
    }
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [hostIsTyping, setHostIsTyping] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [callNotification, setCallNotification] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<any>(null);

  // Play audio chime
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // AudioContext unavailable
    }
  };

  // Subscribe to real-time room sync
  useEffect(() => {
    if (!room) return;

    // 1. Fetch initial message history from server
    p2pRoomSyncService.fetchHistory(room).then((hist) => {
      if (hist && hist.length > 0) {
        setMessages(hist);
      }
    });

    // 2. Join room for real-time BroadcastChannel & SSE stream
    const unsubscribe = p2pRoomSyncService.joinRoom(room, (event) => {
      if (event.type === 'message') {
        const msg = event.data;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.sender === 'host') {
          playChime();
        }
      } else if (event.type === 'typing') {
        if (event.data.sender === 'host') {
          setHostIsTyping(event.data.isTyping);
          if (event.data.isTyping) {
            clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => setHostIsTyping(false), 4000);
          }
        }
      } else if (event.type === 'call_signal') {
        if (event.data.signalType === 'call_offer') {
          setCallNotification(`${hostName} is calling you...`);
          setTimeout(() => setCallNotification(null), 8000);
        }
      } else if (event.type === 'presence') {
        setIsConnected(true);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(typingTimerRef.current);
    };
  }, [room, hostName]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, hostIsTyping]);

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    if (val.trim().length > 0) {
      p2pRoomSyncService.sendTyping(room, 'guest', true);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        p2pRoomSyncService.sendTyping(room, 'guest', false);
      }, 2500);
    } else {
      p2pRoomSyncService.sendTyping(room, 'guest', false);
    }
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !mediaPreview) return;

    clearTimeout(typingTimerRef.current);
    p2pRoomSyncService.sendTyping(room, 'guest', false);

    const textToSend = inputText.trim();
    const mediaToSend = mediaPreview || undefined;
    const fileNameToSend = selectedFileName || undefined;

    setInputText('');
    setMediaPreview(null);
    setSelectedFileName(null);
    setShowEmojiPicker(false);

    const sent = await p2pRoomSyncService.sendMessage(room, 'guest', guestName, {
      text: textToSend,
      imageUrl: mediaToSend,
      mediaFileName: fileNameToSend,
    });

    setMessages((prev) => {
      if (prev.some((m) => m.id === sent.id)) return prev;
      return [...prev, sent];
    });
  };

  // Image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Photo must be smaller than 8MB');
      return;
    }

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGuestName = (newName: string) => {
    const trimmed = newName.trim() || 'Guest';
    setGuestName(trimmed);
    setIsEditingName(false);
    try {
      localStorage.setItem('gk_guest_user_name', trimmed);
    } catch {}
  };

  const handleAudioCall = () => {
    p2pRoomSyncService.sendCallSignal(room, 'call_offer', { type: 'audio' });
    setCallNotification(`Calling ${hostName}...`);
    setTimeout(() => setCallNotification(null), 5000);
  };

  const handleVideoCall = () => {
    p2pRoomSyncService.sendCallSignal(room, 'call_offer', { type: 'video' });
    setCallNotification(`Requesting video call with ${hostName}...`);
    setTimeout(() => setCallNotification(null), 5000);
  };

  const emojis = ['👍', '❤️', '👋', '🔥', '🙏', '😊', '🎉', '⚡'];

  return (
    <div className="min-h-screen bg-[#020713] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 -left-20 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-30 px-3 sm:px-4 py-2.5 bg-[#03091e]/90 backdrop-blur-xl border-b border-cyan-500/25 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2.5 min-w-0">
          {onExitGuestView && (
            <button
              onClick={onExitGuestView}
              className="p-1.5 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-white/5 transition"
              title="Open Full App"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Host Avatar */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 shadow-md">
              <div className="w-full h-full rounded-full bg-[#03091e] flex items-center justify-center font-black text-cyan-300 text-sm">
                {hostName.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#03091e]" />
          </div>

          {/* Title & Host info */}
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
              <span>Chatting with {hostName}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5 text-emerald-400" />
                P2P Encrypted
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-medium">Live Two-Way Sync</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-[10px] text-slate-400">Room: {room.slice(0, 14)}</span>
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleAudioCall}
            className="p-2 rounded-xl text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 transition"
            title="Audio Call"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
          </button>
          <button
            onClick={handleVideoCall}
            className="p-2 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition"
            title="Video Call"
          >
            <Video className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </header>

      {/* Call notification banner */}
      {callNotification && (
        <div className="z-20 bg-gradient-to-r from-emerald-600 to-cyan-600 text-slate-950 font-bold text-xs py-2 px-4 text-center shadow-lg animate-in slide-in-from-top flex items-center justify-center gap-2">
          <Phone className="w-3.5 h-3.5 animate-bounce" />
          <span>{callNotification}</span>
        </div>
      )}

      {/* Main Chat Stream */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-3 py-4 flex flex-col justify-between overflow-y-auto z-10 space-y-4">
        {/* Welcome Security Card */}
        <div className="p-3.5 rounded-2xl bg-[#040e24]/70 border border-cyan-500/25 text-center space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-xs font-bold text-white">Private P2P Guest Session</h4>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
            You are directly connected with <strong className="text-cyan-300">{hostName}</strong>. Zero
            login or app download required. Messages and media are synchronized end-to-end in real-time.
          </p>

          {/* Guest Identity Editor */}
          <div className="pt-1 flex items-center justify-center gap-2 text-xs">
            {isEditingName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveGuestName(guestName);
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your Name"
                  className="px-2 py-0.5 rounded-lg bg-[#020713] border border-cyan-500 text-xs text-white outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-0.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-[10px]"
                >
                  Save
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="text-[11px] text-cyan-300 hover:text-cyan-200 underline underline-offset-2 flex items-center gap-1"
              >
                <span>Chatting as: <strong>{guestName}</strong> (Tap to edit)</span>
              </button>
            )}
          </div>
        </div>

        {/* Messages Stream */}
        <div className="space-y-3 flex-1">
          {messages.map((msg) => {
            const isGuest = msg.sender === 'guest';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isGuest ? 'items-end' : 'items-start'} group`}
              >
                <div className="text-[10px] text-slate-500 px-1 mb-0.5">
                  {isGuest ? 'You' : msg.senderName || hostName}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-md rounded-2xl p-3 shadow-md relative break-words text-xs ${
                    isGuest
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none'
                      : 'bg-[#040e24] border border-cyan-500/25 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {/* Photo attachment */}
                  {msg.imageUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden max-h-60 bg-black/40">
                      <img
                        src={msg.imageUrl}
                        alt="Shared media"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Message text */}
                  {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}

                  {/* Metadata & Timestamp */}
                  <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-cyan-200/70 font-mono">
                    <span>{msg.timestamp}</span>
                    {isGuest && <CheckCheck className="w-3 h-3 text-cyan-200" />}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {hostIsTyping && (
            <div className="flex items-center gap-2 text-xs text-cyan-300 py-1.5 px-3 rounded-2xl bg-[#040e24]/90 border border-cyan-500/25 w-fit shadow-md animate-in fade-in slide-in-from-bottom-1">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.18s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.36s]" />
              </div>
              <span className="font-semibold text-[11px] sm:text-xs">{hostName} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Dock */}
      <footer className="sticky bottom-0 z-30 p-2 sm:p-3 bg-[#03091e]/95 backdrop-blur-xl border-t border-cyan-500/20">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Quick Emojis Bar */}
          {showEmojiPicker && (
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#040e24] border border-cyan-500/30 overflow-x-auto">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setInputText((prev) => prev + emoji)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-base transition"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Attachment Preview */}
          {mediaPreview && (
            <div className="p-2 rounded-xl bg-[#040e24] border border-cyan-500/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={mediaPreview}
                  alt="Attachment preview"
                  className="w-10 h-10 rounded-lg object-cover border border-cyan-400"
                />
                <span className="text-xs text-slate-300 truncate font-mono">
                  {selectedFileName || 'Photo ready'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMediaPreview(null);
                  setSelectedFileName(null);
                }}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main Input Form */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-2">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 sm:p-2.5 rounded-xl bg-[#040e24] hover:bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 transition"
              title="Attach photo"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 sm:p-2.5 rounded-xl bg-[#040e24] hover:bg-cyan-950/60 border border-cyan-500/30 text-slate-300 hover:text-cyan-400 transition hidden sm:flex"
              title="Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Message ${hostName}...`}
              className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl bg-[#020713] border border-cyan-500/30 text-white text-xs placeholder:text-slate-500 outline-none focus:border-cyan-400 transition"
            />

            <button
              type="submit"
              disabled={!inputText.trim() && !mediaPreview}
              className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold transition shadow-md active:scale-95 cursor-pointer"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
