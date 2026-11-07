import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Video,
  MoreVertical,
  Search,
  ArrowLeft,
  Trash2,
  Download,
  Info,
  CheckCircle,
  ShieldCheck,
  KeyRound,
  Lock,
  Copy,
  X,
  Upload,
  AlertCircle,
  UserCheck,
  UserX,
  Edit3,
  PhoneCall,
  User,
  Users,
  ShieldAlert,
  Smartphone,
  Globe,
  Share2,
} from 'lucide-react';
import { ChatSessionData, gkMessengerService } from '../../services/gkMessengerService.ts';
import { MessageBubble } from './MessageBubble.tsx';
import { ChatInput } from './ChatInput.tsx';
import { notificationService } from '../../services/notificationService.ts';
import { E2EEKeyManager } from '../../services/e2eeKeyManager.ts';
import { webRtcCallService } from '../../services/webRtcCallService.ts';
import { GKContact } from '../../types/gkChat.ts';
import { GoogleContactsModal } from './GoogleContactsModal.tsx';
import { DialerCallOptionsModal } from './DialerCallOptionsModal.tsx';
import { GuestInviteModal } from './GuestInviteModal.tsx';
import { p2pRoomSyncService } from '../../services/p2pRoomSyncService.ts';
import { HyperOSDialerBar } from './HyperOSDialerBar.tsx';

interface ChatAreaProps {
  chatId: string;
  onBackToSidebar?: () => void;
  onStartVoiceCall?: () => void;
}

export function ChatArea({ chatId, onBackToSidebar, onStartVoiceCall }: ChatAreaProps) {
  const [chat, setChat] = useState<ChatSessionData | undefined>(() =>
    gkMessengerService.getChat(chatId)
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [messageFilter, setMessageFilter] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [keyFingerprint, setKeyFingerprint] = useState<string>('GK-8F2A-44B1');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showDialerModal, setShowDialerModal] = useState(false);
  const [showGuestInviteModal, setShowGuestInviteModal] = useState(false);
  const [showHyperOSDialer, setShowHyperOSDialer] = useState(false);
  const [dialerMode, setDialerMode] = useState<'audio' | 'video'>('audio');
  const [keyTab, setKeyTab] = useState<'export' | 'import'>('export');
  const [passphrase, setPassphrase] = useState('');
  const [exportedKeyData, setExportedKeyData] = useState<string | null>(null);
  const [importJsonData, setImportJsonData] = useState('');
  const [importPassphrase, setImportPassphrase] = useState('');
  const [keySuccessMsg, setKeySuccessMsg] = useState<string | null>(null);
  const [keyErrorMsg, setKeyErrorMsg] = useState<string | null>(null);
  const [isProcessingKey, setIsProcessingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Contact Info / Edit Modal State
  const [showContactInfoModal, setShowContactInfoModal] = useState(false);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editAbout, setEditAbout] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimerRef = useRef<any>(null);

  useEffect(() => {
    E2EEKeyManager.getFingerprint().then((fp) => setKeyFingerprint(fp));
  }, []);

  // Listen to peer real-time typing indicators via BroadcastChannel & WebSockets / SSE
  useEffect(() => {
    if (!chatId) return;
    setIsPeerTyping(false);

    const unsub = p2pRoomSyncService.joinRoom(chatId, (event) => {
      if (event.type === 'typing') {
        if (event.data.sender === 'guest') {
          setIsPeerTyping(event.data.isTyping);
          if (event.data.isTyping) {
            clearTimeout(peerTypingTimerRef.current);
            peerTypingTimerRef.current = setTimeout(() => {
              setIsPeerTyping(false);
            }, 3500);
          }
        }
      }
    });

    return () => {
      unsub();
      clearTimeout(peerTypingTimerRef.current);
    };
  }, [chatId]);

  useEffect(() => {
    const update = () => {
      setChat(gkMessengerService.getChat(chatId));
    };
    update();
    return gkMessengerService.subscribe(update);
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages.length, isPeerTyping]);

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-[#030712] relative overflow-hidden select-none">
        <div className="w-16 h-16 rounded-2xl bg-[#081836] border border-cyan-500/40 flex items-center justify-center mx-auto mb-4 shadow-xl">
          <ShieldCheck className="w-9 h-9 text-emerald-400" />
        </div>
        <h3 className="text-base font-bold text-white tracking-wide">No Contacts Yet</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
          Your privacy is protected. Only your verified imported Google Contacts will appear here.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 mt-6 w-full max-w-xs justify-center">
          <button
            onClick={() => setShowGoogleModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <span>Import Google Contacts</span>
          </button>
        </div>

        {/* Google Contacts Sync Modal */}
        <GoogleContactsModal
          isOpen={showGoogleModal}
          onClose={() => setShowGoogleModal(false)}
        />
      </div>
    );
  }

  const contact = chat.contact;

  const handleSendMessage = (text: string, options?: { audioBase64?: string; imageUrl?: string }) => {
    try {
      p2pRoomSyncService.sendTyping(chatId, 'host', false);
      gkMessengerService.sendMessage(chatId, {
        text,
        imageUrl: options?.imageUrl,
        audioBase64: options?.audioBase64,
      });
      notificationService.playSoftChime();
    } catch (err: any) {
      alert(err.message || 'Could not send message.');
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    gkMessengerService.deleteMessage(chatId, messageId);
    setFeedback('Message deleted');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleExportText = () => {
    const textData = gkMessengerService.exportChatAsText(chatId);
    const blob = new Blob([textData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${contact.name.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    a.click();
    setShowDropdown(false);
    setFeedback('Chat exported as text file ✓');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleClearChat = () => {
    if (confirm(`Clear all messages with ${contact.name}?`)) {
      gkMessengerService.clearChatHistory(chatId);
      setShowDropdown(false);
      setFeedback('Chat history cleared');
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleToggleBlock = () => {
    gkMessengerService.toggleBlockContact(chatId);
    setShowDropdown(false);
    setShowContactInfoModal(false);
    setFeedback(contact.isBlocked ? 'Contact unblocked' : 'Contact blocked');
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleDeleteContact = () => {
    if (confirm(`Delete ${contact.name} and remove all messages?`)) {
      gkMessengerService.deleteContact(chatId);
      setShowDropdown(false);
      setShowContactInfoModal(false);
      if (onBackToSidebar) onBackToSidebar();
    }
  };

  const handleOpenEditModal = () => {
    setEditName(contact.name);
    setEditPhone(contact.phone || '');
    setEditTag(contact.tag || '');
    setEditAbout(contact.about || '');
    setEditAvatar(contact.avatar);
    setShowEditContactModal(true);
    setShowDropdown(false);
  };

  const handleSaveContactEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    gkMessengerService.updateContact(chatId, {
      name: editName.trim(),
      phone: editPhone.trim(),
      tag: editTag.trim() || 'Contact',
      about: editAbout.trim(),
      avatar: editAvatar.trim() || contact.avatar,
    });
    setShowEditContactModal(false);
    setFeedback('Contact details updated ✓');
    setTimeout(() => setFeedback(null), 2500);
  };

  const visibleMessages = messageFilter.trim()
    ? chat.messages.filter((m) => m.text.toLowerCase().includes(messageFilter.toLowerCase()))
    : chat.messages;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030712] relative overflow-hidden">
      {/* Background Subtle Cyber Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Top Bar: Contact Info, Audio & Video Call Actions, 3-Dot Menu */}
      <div className="px-3 sm:px-4 py-2.5 bg-[#03091e] border-b border-cyan-500/20 flex items-center justify-between gap-3 z-10 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Back button on Mobile */}
          {onBackToSidebar && (
            <button
              onClick={onBackToSidebar}
              className="md:hidden p-1.5 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 transition"
              title="Back to Contacts"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Contact Avatar */}
          <div
            className="relative shrink-0 cursor-pointer"
            onClick={() => setShowContactInfoModal(true)}
            title="View Contact Details"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-slate-900 ring-2 ring-emerald-500/50 hover:ring-cyan-400 transition">
              <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
            </div>
            {contact.status === 'online' && !contact.isBlocked && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#030712]" />
            )}
            {contact.isBlocked && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-[#030712] flex items-center justify-center text-[7px] text-white font-bold">
                ✕
              </span>
            )}
          </div>

          {/* Title & Status */}
          <div
            className="min-w-0 cursor-pointer"
            onClick={() => setShowContactInfoModal(true)}
            title="View Contact Details"
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px] sm:max-w-[200px]">
                {contact.name}
              </h3>
              {contact.phone ? (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-1.5 py-0.2 rounded-md shrink-0 shadow-sm">
                  <Phone className="w-2.5 h-2.5 text-cyan-400" />
                  <span>{contact.phone}</span>
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">No phone</span>
              )}
              {contact.tag && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono hidden sm:inline">
                  {contact.tag}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
              {contact.isBlocked ? (
                <span className="text-rose-400 font-semibold">Blocked Contact</span>
              ) : isPeerTyping || contact.status === 'typing' ? (
                <span className="text-emerald-400 font-semibold animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>typing...</span>
                </span>
              ) : contact.status === 'online' ? (
                <>
                  <span className="text-emerald-400 font-medium">online</span>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGuestInviteModal(true);
                    }}
                    className="text-[10px] text-cyan-300 font-mono inline-flex items-center gap-1 hover:text-cyan-200 transition px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/30"
                    title="P2P Room Live • Click to invite guest"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>P2P Room Live</span>
                  </button>
                </>
              ) : (
                <span className="text-slate-400">{contact.lastSeen || 'offline'}</span>
              )}
            </p>
          </div>
        </div>

        {/* Right Actions: Invite Guest, Audio Call, Video Call, Search & Dropdown */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Invite Guest (P2P Web Chat) */}
          <button
            onClick={() => setShowGuestInviteModal(true)}
            className="px-2 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold"
            title="Invite Guest via Unlimited Free P2P Web Link"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Invite Guest</span>
          </button>

          {/* Audio Call: Opens Google Phone Dialer / SIM Call Hub */}
          <button
            onClick={() => {
              if (contact.isBlocked) {
                setFeedback('Cannot call a blocked contact.');
                setTimeout(() => setFeedback(null), 2000);
                return;
              }
              setDialerMode('audio');
              setShowDialerModal(true);
            }}
            className="p-2 rounded-xl text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 transition"
            title="Real Phone Call (Google Phone Dialer / SIM Call)"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Video Call: Opens Google Meet / WhatsApp / WebRTC Video Hub */}
          <button
            onClick={() => {
              if (contact.isBlocked) {
                setFeedback('Cannot call a blocked contact.');
                setTimeout(() => setFeedback(null), 2000);
                return;
              }
              setDialerMode('video');
              setShowDialerModal(true);
            }}
            className="p-2 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition"
            title="Real Video Call (Google Meet / WhatsApp Video)"
          >
            <Video className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Search inside this chat */}
          <button
            onClick={() => setShowSearchInChat(!showSearchInChat)}
            className="p-2 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition"
            title="Search Messages"
          >
            <Search className="w-4 h-4 text-slate-300" />
          </button>

          {/* 3-Dot Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition"
              title="More Options"
            >
              <MoreVertical className="w-4 h-4 text-slate-300" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-11 z-30 w-56 rounded-2xl bg-[#040e24] border border-cyan-500/30 p-1.5 shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => {
                    setShowGuestInviteModal(true);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-cyan-300 hover:bg-cyan-500/20 flex items-center gap-2 transition font-medium"
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Invite Guest (P2P Link)</span>
                </button>
                <button
                  onClick={() => {
                    setShowHyperOSDialer(true);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-emerald-300 hover:bg-emerald-500/20 flex items-center gap-2 transition font-medium"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>HyperOS 4 Glass Dialer</span>
                </button>
                <button
                  onClick={() => {
                    setShowContactInfoModal(true);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-cyan-500/20 flex items-center gap-2 transition"
                >
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Contact Info</span>
                </button>
                <button
                  onClick={handleOpenEditModal}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-cyan-300 hover:bg-cyan-500/20 flex items-center gap-2 transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Edit Contact</span>
                </button>
                <button
                  onClick={() => {
                    webRtcCallService.receiveIncomingCall(contact.name, contact.avatar, false);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-emerald-300 hover:bg-emerald-500/20 flex items-center gap-2 transition"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Simulate Incoming Call</span>
                </button>
                <button
                  onClick={() => {
                    setDialerMode('audio');
                    setShowDialerModal(true);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-emerald-300 hover:bg-emerald-500/20 flex items-center gap-2 transition"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Phone Dialer</span>
                </button>
                <button
                  onClick={() => {
                    setShowGoogleModal(true);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-cyan-300 hover:bg-cyan-500/20 flex items-center gap-2 transition"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sync Google Contacts</span>
                </button>
                <button
                  onClick={() => {
                    setShowKeyModal(true);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-cyan-300 hover:bg-cyan-500/20 flex items-center gap-2 transition"
                >
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>E2EE Key Backup</span>
                </button>
                <button
                  onClick={handleExportText}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-cyan-500/20 flex items-center gap-2 transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export Chat (.txt)</span>
                </button>
                <button
                  onClick={handleClearChat}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-amber-300 hover:bg-amber-500/20 flex items-center gap-2 transition"
                >
                  <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Clear Conversation</span>
                </button>
                <div className="border-t border-cyan-500/20 my-1" />
                <button
                  onClick={handleToggleBlock}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-300 hover:bg-rose-500/20 flex items-center gap-2 transition"
                >
                  {contact.isBlocked ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Unblock Contact</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-3.5 h-3.5 text-rose-400" />
                      <span>Block Contact</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDeleteContact}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/30 flex items-center gap-2 transition"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete Contact</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Isolated Unknown Request Privacy Banner */}
      {contact.isUnknownRequest && (
        <div className="px-3.5 sm:px-4 py-3 bg-amber-950/70 border-b border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-200">Unknown Sender Request</p>
              <p className="text-[11px] text-amber-300/80">
                This sender is not in your contact book. Only accepted contacts are saved.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => {
                const customName = prompt('Save contact name as:', contact.name || contact.phone);
                if (customName !== null) {
                  gkMessengerService.acceptUnknownRequest(chatId, customName);
                  setFeedback('Contact accepted and saved to contact book ✓');
                  setTimeout(() => setFeedback(null), 3000);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Accept & Add Contact</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Decline this request and remove this conversation?')) {
                  gkMessengerService.declineUnknownRequest(chatId, false);
                  if (onBackToSidebar) onBackToSidebar();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
            >
              Decline
            </button>
            <button
              onClick={() => {
                if (confirm('Block this unknown sender?')) {
                  gkMessengerService.declineUnknownRequest(chatId, true);
                  if (onBackToSidebar) onBackToSidebar();
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 font-medium text-xs transition"
            >
              Block
            </button>
          </div>
        </div>
      )}

      {/* Search in Chat Bar */}
      {showSearchInChat && (
        <div className="p-2.5 bg-[#040e24] border-b border-cyan-500/15 flex items-center gap-2 animate-in slide-in-from-top-1 z-10">
          <Search className="w-4 h-4 text-cyan-400 ml-2" />
          <input
            type="text"
            value={messageFilter}
            onChange={(e) => setMessageFilter(e.target.value)}
            placeholder="Search text in this chat..."
            className="flex-1 bg-transparent text-white text-xs placeholder-slate-500 focus:outline-none"
          />
          {messageFilter && (
            <button onClick={() => setMessageFilter('')} className="text-slate-400 hover:text-white mr-2 text-xs">
              Clear
            </button>
          )}
        </div>
      )}

      {/* Temporary Feedback Banner */}
      {feedback && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-400/50 text-emerald-300 text-xs flex items-center gap-1.5 shadow-lg">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Blocked Contact Warning Bar */}
      {contact.isBlocked && (
        <div className="p-2.5 bg-rose-950/60 border-b border-rose-500/30 text-rose-300 text-xs flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-2">
            <UserX className="w-4 h-4 text-rose-400" />
            <span>You have blocked this contact. Messages cannot be sent or received.</span>
          </div>
          <button
            onClick={handleToggleBlock}
            className="px-2.5 py-1 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-white font-bold text-[11px] transition"
          >
            Unblock
          </button>
        </div>
      )}

      {/* Message Canvas */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 z-0">
        {/* End-to-End Encryption Banner */}
        <div className="flex justify-center my-2">
          <div className="px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-300/80 text-[10.5px] flex items-center gap-1.5 font-mono shadow-sm">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>Messages are end-to-end encrypted (AES-256-GCM). No one outside can read them.</span>
          </div>
        </div>

        {visibleMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onDeleteMessage={handleDeleteMessage}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Real-time Typing Indicator with bouncing dots */}
      {(isPeerTyping || contact.status === 'typing') && (
        <div className="px-3.5 py-1.5 bg-[#040e24]/95 border-t border-cyan-500/25 flex items-center justify-between gap-2 text-xs text-emerald-400 backdrop-blur-md z-10 animate-in slide-in-from-bottom-1 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.18s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.36s]" />
            </div>
            <span className="font-semibold text-emerald-300 text-[11px] sm:text-xs">
              {contact.name} is typing...
            </span>
          </div>
          <span className="text-[10px] text-cyan-400/80 font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20">
            P2P Live Sync
          </span>
        </div>
      )}

      {/* HyperOS 4 x Google Phone Hybrid Dialer or Standard Message Input */}
      {showHyperOSDialer ? (
        <div className="p-2 sm:p-3 bg-[#020713]/95 border-t border-cyan-500/25 shrink-0 z-20">
          <HyperOSDialerBar
            currentContact={contact}
            onCloseDialer={() => setShowHyperOSDialer(false)}
            onOpenContacts={() => setShowGoogleModal(true)}
            onOpenSettings={() => setShowKeyModal(true)}
            onStartCall={(num, isVideo) => {
              if (isVideo) {
                setDialerMode('video');
                setShowDialerModal(true);
              } else {
                const clean = num.replace(/[^\d+]/g, '');
                window.location.href = `tel:${clean}`;
              }
            }}
          />
        </div>
      ) : (
        <ChatInput
          onSendMessage={handleSendMessage}
          onTyping={(isTyping) => p2pRoomSyncService.sendTyping(chatId, 'host', isTyping)}
          onOpenDialer={() => setShowHyperOSDialer(true)}
          disabled={contact.isBlocked}
          placeholder={contact.isBlocked ? 'Unblock contact to send messages...' : `Message ${contact.name}... (Enter to send)`}
        />
      )}

      {/* --- Contact Info Profile Modal --- */}
      {showContactInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#040e24] border border-cyan-500/35 p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>Contact Details</span>
              </h3>
              <button
                onClick={() => setShowContactInfoModal(false)}
                className="p-1 rounded-xl hover:bg-cyan-500/20 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-2 pt-2">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-cyan-500/40 bg-slate-900 shadow-xl">
                <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
              </div>
              <h4 className="text-base font-black text-white">{contact.name}</h4>
              <p className="text-xs text-cyan-300 font-mono">{contact.phone}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {contact.tag || 'Direct Contact'}
              </span>
            </div>

            {/* Quick Mobile Dialer Actions */}
            <div className="grid grid-cols-3 gap-2 w-full pt-1">
              <a
                href={`tel:${contact.phone.replace(/\D/g, '')}`}
                className="p-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60 transition flex flex-col items-center justify-center gap-1 text-[11px] font-bold shadow-sm"
                title="Call via Default Mobile Dialer (Google Phone)"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Google Phone</span>
              </a>

              <a
                href="https://meet.google.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 transition flex flex-col items-center justify-center gap-1 text-[11px] font-bold shadow-sm"
                title="Google Meet Video Call"
              >
                <Video className="w-4 h-4 text-cyan-400" />
                <span>Meet Video</span>
              </a>

              <a
                href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-2xl bg-[#08201a] border border-emerald-500/30 text-emerald-300 hover:bg-emerald-950 transition flex flex-col items-center justify-center gap-1 text-[11px] font-bold shadow-sm"
                title="WhatsApp Call / Chat"
              >
                <Smartphone className="w-4 h-4 text-[#25D366]" />
                <span>WhatsApp</span>
              </a>
            </div>

            {contact.about && (
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-cyan-500/20 text-xs space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">About</span>
                <p className="text-slate-200">{contact.about}</p>
              </div>
            )}

            <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Security:</span>
                <span className="font-mono text-emerald-400">End-to-End Encrypted</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="capitalize text-cyan-300 font-semibold">{contact.isBlocked ? 'Blocked' : contact.status}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleOpenEditModal}
                className="w-full py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/40 text-cyan-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Contact Details</span>
              </button>

              <button
                onClick={handleToggleBlock}
                className="w-full py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                {contact.isBlocked ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                <span>{contact.isBlocked ? 'Unblock Contact' : 'Block Contact'}</span>
              </button>

              <button
                onClick={handleDeleteContact}
                className="w-full py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Contact</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Contact Modal --- */}
      {showEditContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#040e24] border border-cyan-500/40 p-5 sm:p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Edit Contact</span>
              </h3>
              <button
                onClick={() => setShowEditContactModal(false)}
                className="p-1 rounded-xl hover:bg-cyan-500/20 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContactEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Category / Tag</label>
                <input
                  type="text"
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  placeholder="e.g. Editor, Producer, Family"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">About / Bio</label>
                <textarea
                  rows={2}
                  value={editAbout}
                  onChange={(e) => setEditAbout(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditContactModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold transition hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 text-slate-950 font-bold shadow-md transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- E2EE Key Persistence & Backup Modal --- */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
          <div className="relative w-full max-w-md rounded-3xl bg-[#040e24] border border-cyan-500/40 p-5 sm:p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">E2EE Key Persistence & Backup</h3>
              </div>
              <button
                onClick={() => {
                  setShowKeyModal(false);
                  setKeySuccessMsg(null);
                  setKeyErrorMsg(null);
                }}
                className="p-1 rounded-xl hover:bg-cyan-500/20 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Fingerprint:</span>
                <span className="font-mono font-bold text-cyan-300">{keyFingerprint}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cipher Algorithm:</span>
                <span className="font-mono text-emerald-400">AES-256-GCM / SubtleCrypto</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Key Persistence:</span>
                <span className="font-mono text-cyan-400">IndexedDB (Survives Refresh)</span>
              </div>
            </div>

            <div className="flex rounded-xl bg-slate-900/80 p-1 border border-cyan-500/20 text-xs">
              <button
                onClick={() => {
                  setKeyTab('export');
                  setKeySuccessMsg(null);
                  setKeyErrorMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                  keyTab === 'export' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                }`}
              >
                Export / Backup Key
              </button>
              <button
                onClick={() => {
                  setKeyTab('import');
                  setKeySuccessMsg(null);
                  setKeyErrorMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                  keyTab === 'import' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                }`}
              >
                Restore Key on Device
              </button>
            </div>

            {keySuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{keySuccessMsg}</span>
              </div>
            )}
            {keyErrorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{keyErrorMsg}</span>
              </div>
            )}

            {keyTab === 'export' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-400">
                  Set a passphrase to encrypt your AES-256 key with PBKDF2 before exporting.
                </p>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Passphrase</label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter strong passphrase..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  onClick={async () => {
                    if (!passphrase || passphrase.length < 4) {
                      setKeyErrorMsg('Passphrase must be at least 4 characters');
                      return;
                    }
                    setIsProcessingKey(true);
                    setKeyErrorMsg(null);
                    try {
                      const encryptedJson = await E2EEKeyManager.exportEncryptedKey(passphrase);
                      setExportedKeyData(encryptedJson);
                      setKeySuccessMsg('Key encrypted and exported successfully!');
                    } catch (err: any) {
                      setKeyErrorMsg('Failed to export key: ' + err.message);
                    } finally {
                      setIsProcessingKey(false);
                    }
                  }}
                  disabled={isProcessingKey}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-bold transition shadow-md"
                >
                  {isProcessingKey ? 'Encrypting Key...' : 'Generate Encrypted Backup'}
                </button>

                {exportedKeyData && (
                  <div className="space-y-2 pt-2">
                    <textarea
                      readOnly
                      rows={3}
                      value={exportedKeyData}
                      className="w-full p-2.5 rounded-xl bg-[#020512] border border-cyan-500/30 text-[10px] font-mono text-cyan-200 resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(exportedKeyData);
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-semibold hover:bg-cyan-900 transition flex items-center justify-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedKey ? 'Copied!' : 'Copy Payload'}</span>
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([exportedKeyData], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `gkedit_e2ee_backup_${Date.now()}.gkkey`;
                          a.click();
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 font-semibold hover:bg-emerald-900 transition flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .gkkey</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {keyTab === 'import' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-400">
                  Paste backup payload or upload <code className="text-cyan-300 font-mono">.gkkey</code> file to restore keys.
                </p>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-slate-400">Backup JSON Payload</label>
                    <label className="text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1 font-semibold">
                      <Upload className="w-3 h-3" />
                      <span>Upload .gkkey</span>
                      <input
                        type="file"
                        accept=".gkkey,.json"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setImportJsonData(ev.target?.result as string);
                            reader.readAsText(f);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={importJsonData}
                    onChange={(e) => setImportJsonData(e.target.value)}
                    placeholder="Paste encrypted backup JSON..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-[10px] font-mono text-cyan-200 resize-none focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Passphrase</label>
                  <input
                    type="password"
                    value={importPassphrase}
                    onChange={(e) => setImportPassphrase(e.target.value)}
                    placeholder="Enter backup passphrase..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  onClick={async () => {
                    if (!importJsonData.trim() || !importPassphrase) {
                      setKeyErrorMsg('Please provide backup payload and passphrase');
                      return;
                    }
                    setIsProcessingKey(true);
                    setKeyErrorMsg(null);
                    try {
                      const ok = await E2EEKeyManager.importEncryptedKey(importJsonData, importPassphrase);
                      if (ok) {
                        const fp = await E2EEKeyManager.getFingerprint();
                        setKeyFingerprint(fp);
                        setKeySuccessMsg(`Identity restored! New Fingerprint: ${fp}`);
                        setFeedback('E2EE Keys restored successfully ✓');
                        setTimeout(() => setFeedback(null), 3000);
                      } else {
                        setKeyErrorMsg('Invalid passphrase or corrupted key file.');
                      }
                    } catch (err: any) {
                      setKeyErrorMsg('Failed to restore: ' + err.message);
                    } finally {
                      setIsProcessingKey(false);
                    }
                  }}
                  disabled={isProcessingKey}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 text-white font-bold transition shadow-md"
                >
                  {isProcessingKey ? 'Verifying & Importing...' : 'Restore Encryption Key to IndexedDB'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Google Contacts Sync Modal */}
      <GoogleContactsModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onContactsImported={() => {
          setChat(gkMessengerService.getChat(chatId));
        }}
      />

      {/* Real Phone Call & Video Call (Google Phone Dialer, Meet & WhatsApp) Modal */}
      <DialerCallOptionsModal
        isOpen={showDialerModal}
        onClose={() => setShowDialerModal(false)}
        contact={contact}
        initialMode={dialerMode}
      />

      {/* Unlimited Free P2P Guest Web Messaging Modal */}
      {showGuestInviteModal && (
        <GuestInviteModal
          contact={contact}
          hostName="GK EDIT"
          onClose={() => setShowGuestInviteModal(false)}
        />
      )}
    </div>
  );
}
