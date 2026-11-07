import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Pin,
  CheckCheck,
  CircleDot,
  X,
  Phone,
  User,
  Shield,
  Lock,
  UserX,
  Sparkles,
  Users,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { ChatSessionData, gkMessengerService } from '../../services/gkMessengerService.ts';
import { GKStory, GKContact } from '../../types/gkChat.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { webRtcCallService } from '../../services/webRtcCallService.ts';
import { googleContactsService } from '../../services/googleContactsService.ts';
import { GoogleContactsModal } from './GoogleContactsModal.tsx';
import { LiquidGlassNav } from '../LiquidGlassNav.tsx';

interface MessengerSidebarProps {
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onOpenStoryModal: (story: GKStory) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=200&auto=format&fit=crop&q=80',
];

export function MessengerSidebar({
  activeChatId,
  onSelectChat,
  onOpenStoryModal,
}: MessengerSidebarProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatSessionData[]>([]);
  const [unknownRequests, setUnknownRequests] = useState<ChatSessionData[]>([]);
  const [stories, setStories] = useState<GKStory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'requests' | 'unread' | 'pinned' | 'blocked'>('all');
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [saveToGoogleToo, setSaveToGoogleToo] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(
    !!googleContactsService.getAccessToken()
  );

  // New Contact Form State
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactTag, setNewContactTag] = useState('');
  const [newContactAbout, setNewContactAbout] = useState('');
  const [newContactAvatar, setNewContactAvatar] = useState(PRESET_AVATARS[0]);

  useEffect(() => {
    const update = () => {
      setChats(gkMessengerService.getChatsList(false));
      setUnknownRequests(gkMessengerService.getUnknownRequests());
      setStories(gkMessengerService.getStories());
    };
    update();
    const unsubMessenger = gkMessengerService.subscribe(update);
    const unsubGoogle = googleContactsService.subscribeAuth((_u, token) => {
      setIsGoogleConnected(!!token);
    });
    return () => {
      unsubMessenger();
      unsubGoogle();
    };
  }, []);

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) {
      alert('Please enter both name and phone number.');
      return;
    }

    const created = gkMessengerService.addContact({
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      tag: newContactTag.trim() || (saveToGoogleToo ? 'Google Contact' : 'Contact'),
      about: newContactAbout.trim(),
      avatar: newContactAvatar,
    });

    // If user requested to also save to Google Contacts and is connected
    if (saveToGoogleToo && googleContactsService.getAccessToken()) {
      googleContactsService
        .createContact({
          name: newContactName.trim(),
          phone: newContactPhone.trim(),
        })
        .catch((err) => {
          console.warn('Could not sync newly created contact to Google Contacts:', err);
        });
    }

    // Reset form
    setNewContactName('');
    setNewContactPhone('');
    setNewContactTag('');
    setNewContactAbout('');
    setNewContactAvatar(PRESET_AVATARS[0]);
    setSaveToGoogleToo(false);
    setShowAddContactModal(false);

    // Select the new contact
    onSelectChat(created.id);
  };

  const sourceList = activeFilter === 'requests' ? unknownRequests : chats;
  const filteredChats = sourceList.filter((c) => {
    const matchesSearch =
      c.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessageText.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === 'unread') return c.unreadCount > 0;
    if (activeFilter === 'pinned') return c.isPinned;
    if (activeFilter === 'blocked') return !!c.contact.isBlocked;
    return true;
  });

  return (
    <div className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-[#030712] border-r border-cyan-500/20 select-none">
      {/* Top Header: User Profile Avatar, Status Trigger, Add Contact */}
      <div className="p-3.5 bg-[#03091e] border-b border-cyan-500/15 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-full ring-2 ring-emerald-500/60 overflow-hidden bg-slate-900 flex items-center justify-center shadow-lg">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-cyan-600 to-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                  {user?.name?.slice(0, 2).toUpperCase() || 'GK'}
                </div>
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#030712]" />
          </div>

          <div>
            <h2 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>GK-Chat</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" />
                <span>P2P</span>
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Private Contacts Messenger</p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Google Contacts Sync Button */}
          <button
            onClick={() => setShowGoogleModal(true)}
            className={`p-1.5 sm:p-2 rounded-xl transition flex items-center gap-1.5 border shadow-sm ${
              isGoogleConnected
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/70'
                : 'bg-[#081535] border-cyan-500/30 text-cyan-300 hover:bg-[#0c1f4d] hover:border-cyan-400'
            }`}
            title="Sync Real Google Contacts"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
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
            <span className="text-[11px] font-bold hidden sm:inline">
              {isGoogleConnected ? 'Contacts' : 'Google'}
            </span>
          </button>

          {/* Status Stories Button */}
          <button
            onClick={() => stories[0] && onOpenStoryModal(stories[0])}
            className="p-2 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition relative"
            title="View Contact Status Stories"
          >
            <CircleDot className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400" />
          </button>

          {/* Add Contact Button */}
          <button
            onClick={() => setShowAddContactModal(true)}
            className="p-2 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition flex items-center gap-1"
            title="Add New Contact"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* WhatsApp Status Stories Bar */}
      {stories.length > 0 && (
        <div className="px-3 py-2.5 bg-[#020510] border-b border-cyan-500/10 overflow-x-auto scrollbar-none flex items-center gap-3">
          <div className="flex flex-col items-center shrink-0 cursor-pointer">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-cyan-400/60 p-0.5 flex items-center justify-center hover:scale-105 transition">
              <div className="w-full h-full rounded-full bg-blue-950/80 flex items-center justify-center text-cyan-300 text-xs font-bold">
                + Story
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">My Status</span>
          </div>

          {stories.map((story) => (
            <div
              key={story.id}
              onClick={() => onOpenStoryModal(story)}
              className="flex flex-col items-center shrink-0 cursor-pointer group"
            >
              <div
                className={`w-12 h-12 rounded-full p-0.5 transition transform group-hover:scale-105 ${
                  story.viewed
                    ? 'border-2 border-slate-700'
                    : 'bg-gradient-to-tr from-emerald-400 via-cyan-400 to-blue-500'
                }`}
              >
                <img
                  src={story.contactAvatar}
                  alt={story.contactName}
                  className="w-full h-full rounded-full object-cover ring-2 ring-[#030712]"
                />
              </div>
              <span className="text-[10px] text-slate-300 mt-1 truncate max-w-[60px] text-center">
                {story.contactName.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Search Input Bar */}
      <div className="p-3 bg-[#030712]">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts, numbers or messages..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#081229] border border-cyan-500/25 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills with Apple iOS Liquid Glass Droplet indicator */}
        <LiquidGlassNav
          activeId={activeFilter}
          className="flex items-center gap-1 mt-2.5 overflow-x-auto no-scrollbar scrollbar-none p-1 border border-white/10 rounded-full"
        >
          <button
            data-nav-id="all"
            onClick={() => setActiveFilter('all')}
            className={`liquid-nav-btn px-2.5 py-1 rounded-full text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'all'
                ? 'text-emerald-300 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Contacts ({chats.length})
          </button>

          <button
            data-nav-id="requests"
            onClick={() => setActiveFilter('requests')}
            className={`liquid-nav-btn px-2.5 py-1 rounded-full text-[11px] font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'requests'
                ? 'text-amber-300 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Unknown Requests</span>
            {unknownRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[9px]">
                {unknownRequests.length}
              </span>
            )}
          </button>

          <button
            data-nav-id="unread"
            onClick={() => setActiveFilter('unread')}
            className={`liquid-nav-btn px-2.5 py-1 rounded-full text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'unread'
                ? 'text-emerald-300 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Unread
          </button>

          <button
            data-nav-id="pinned"
            onClick={() => setActiveFilter('pinned')}
            className={`liquid-nav-btn px-2.5 py-1 rounded-full text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'pinned'
                ? 'text-emerald-300 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pinned
          </button>

          <button
            data-nav-id="blocked"
            onClick={() => setActiveFilter('blocked')}
            className={`liquid-nav-btn px-2.5 py-1 rounded-full text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'blocked'
                ? 'text-rose-300 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Blocked
          </button>
        </LiquidGlassNav>
      </div>

      {/* Contact List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-cyan-500/10">
        {filteredChats.length === 0 ? (
          activeFilter === 'requests' ? (
            /* Empty State for Unknown Requests */
            <div className="p-6 text-center text-slate-500 text-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-md">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-200">No Unknown Requests</h3>
                <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                  Strict privacy is active. Messages from unverified senders stay isolated here without ever auto-saving to your contact book.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  gkMessengerService.receiveUnknownRequest({
                    phone: '+91 98480 99999',
                    senderName: 'Unknown Client',
                    text: 'Hello! I saw your video portfolio. Are you open for a freelance project?',
                  });
                  setActiveFilter('requests');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition mx-auto flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Simulate Unknown Sender</span>
              </button>
            </div>
          ) : (
            /* REQUIRED EMPTY STATE UI:
               - Icon: Shield or User-check icon.
               - Title: "No Contacts Yet"
               - Subtitle: "Your privacy is protected. Only your verified imported Google Contacts will appear here."
               - Action Button: "Import Google Contacts" (with Google icon) and "Add Number Manually".
            */
            <div className="p-6 text-center text-slate-500 text-xs space-y-3.5">
              <div className="w-16 h-16 rounded-2xl bg-[#081836] border border-cyan-500/40 flex items-center justify-center mx-auto shadow-lg">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white tracking-wide">No Contacts Yet</h3>
                <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                  Your privacy is protected. Only your verified imported Google Contacts will appear here.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-1 max-w-[220px] mx-auto">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md hover:brightness-110 transition active:scale-98"
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
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(true)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-slate-300 font-bold text-xs hover:text-white flex items-center justify-center gap-1.5 transition hover:bg-slate-800"
                >
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Add Number Manually</span>
                </button>
              </div>
            </div>
          )
        ) : (
          filteredChats.map((c) => {
            const isActive = activeChatId === c.contact.id;
            return (
              <div
                key={c.contact.id}
                onClick={() => onSelectChat(c.contact.id)}
                className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition relative group ${
                  isActive
                    ? 'bg-[#081b3b]/90 border-l-4 border-emerald-400'
                    : 'hover:bg-[#06122c]/70'
                }`}
              >
                {/* Contact Avatar + Online Pulse */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-900 ring-1 ring-cyan-500/30">
                    <img
                      src={c.contact.avatar}
                      alt={c.contact.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {c.contact.status === 'online' && !c.contact.isBlocked && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#030712]" />
                  )}
                  {c.contact.isBlocked && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-[#030712] flex items-center justify-center text-[7px] text-white font-bold">
                      ✕
                    </span>
                  )}
                  {c.contact.status === 'typing' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </div>

                {/* Content Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 truncate min-w-0">
                      <h3 className="text-xs font-bold text-white truncate max-w-[110px] sm:max-w-[140px]">
                        {c.contact.name}
                      </h3>
                      {c.contact.phone && (
                        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-1 py-0.2 rounded shrink-0">
                          {c.contact.phone}
                        </span>
                      )}
                      {c.isPinned && (
                        <Pin className="w-3 h-3 text-cyan-400 fill-cyan-400/30 shrink-0" />
                      )}
                      {c.contact.tag && (
                        <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-300 font-normal shrink-0">
                          {c.contact.tag}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {c.lastMessageTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                      {c.contact.isBlocked ? (
                        <span className="text-rose-400 italic">Contact blocked</span>
                      ) : c.contact.status === 'typing' ? (
                        <span className="text-emerald-400 font-semibold italic animate-pulse">
                          typing...
                        </span>
                      ) : (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 inline" />
                          <span className="truncate">{c.lastMessageText || 'Tap to chat'}</span>
                        </>
                      )}
                    </p>

                    {/* Unread Pill */}
                    {c.unreadCount > 0 && (
                      <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0 shadow-md">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- Add Contact Modal --- */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
          <div className="w-full max-w-sm rounded-3xl bg-[#040e24] border border-cyan-500/40 p-5 sm:p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Add New Contact</span>
              </h3>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Google Import Banner */}
            <div className="p-2.5 rounded-2xl bg-[#081533] border border-cyan-500/25 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
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
                <span className="text-[11px] text-slate-300">Have real contacts in Google?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddContactModal(false);
                  setShowGoogleModal(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 font-bold text-[11px] border border-cyan-500/30 transition shrink-0"
              >
                Sync Google
              </button>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh, Director Rao"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98480 00000"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Role / Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Video Editor, VFX Lead, Family"
                  value={newContactTag}
                  onChange={(e) => setNewContactTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Choose Profile Photo</label>
                <div className="flex items-center gap-2 py-1 overflow-x-auto scrollbar-none">
                  {PRESET_AVATARS.map((av, idx) => (
                    <img
                      key={idx}
                      src={av}
                      alt="Preset"
                      onClick={() => setNewContactAvatar(av)}
                      className={`w-9 h-9 rounded-full object-cover cursor-pointer ring-2 transition ${
                        newContactAvatar === av
                          ? 'ring-emerald-400 scale-105'
                          : 'ring-transparent hover:ring-cyan-400/50 opacity-70'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">About / Status Note</label>
                <input
                  type="text"
                  placeholder="e.g. Working on upcoming video teaser"
                  value={newContactAbout}
                  onChange={(e) => setNewContactAbout(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {isGoogleConnected && (
                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 pt-1">
                  <input
                    type="checkbox"
                    checked={saveToGoogleToo}
                    onChange={(e) => setSaveToGoogleToo(e.target.checked)}
                    className="rounded border-cyan-500/40 text-emerald-500 focus:ring-0 bg-slate-900"
                  />
                  <span>Also sync and save to your Google Contacts</span>
                </label>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold transition hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 text-slate-950 font-bold shadow-md transition"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Google Contacts Sync Modal --- */}
      <GoogleContactsModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onContactsImported={(count) => {
          setChats(gkMessengerService.getChatsList());
        }}
      />
    </div>
  );
}
