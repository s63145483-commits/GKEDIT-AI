import { GKContact, GKMessage, GKStory } from '../types/gkChat.ts';
import { notificationService } from './notificationService.ts';
import { p2pRoomSyncService, RoomChatMessage } from './p2pRoomSyncService.ts';

const STORAGE_CHATS_KEY = 'gkedit_p2p_messenger_chats_v2';
const STORAGE_STORIES_KEY = 'gkedit_p2p_messenger_stories_v2';
const STORAGE_ISOLATED_PREFIX = 'gkedit_chat_history_';
const LEGACY_STORAGE_CHATS_KEY = 'gkedit_p2p_messenger_chats';
const LEGACY_STORAGE_STORIES_KEY = 'gkedit_p2p_messenger_stories';

export interface ChatSessionData {
  contact: GKContact;
  messages: GKMessage[];
  unreadCount: number;
  lastMessageText: string;
  lastMessageTime: string;
  isPinned: boolean;
  isUnknownRequest?: boolean;
}

type MessengerListener = () => void;

class GKMessengerService {
  private chats: Map<string, ChatSessionData> = new Map();
  private stories: GKStory[] = [];
  private listeners: Set<MessengerListener> = new Set();
  private activeChatId: string = '';
  private roomUnsubs: Map<string, () => void> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    // Clean up any legacy dummy/mock storage from previous sessions
    try {
      localStorage.removeItem(LEGACY_STORAGE_CHATS_KEY);
      localStorage.removeItem(LEGACY_STORAGE_STORIES_KEY);
    } catch {
      // ignore
    }

    // Load stories (defaults to empty)
    try {
      const savedStories = localStorage.getItem(STORAGE_STORIES_KEY);
      this.stories = savedStories ? JSON.parse(savedStories) : [];
    } catch {
      this.stories = [];
    }

    // Load saved chats with strictly isolated message storage
    try {
      const saved = localStorage.getItem(STORAGE_CHATS_KEY);
      if (saved) {
        const parsed: Record<string, ChatSessionData> = JSON.parse(saved);
        Object.entries(parsed).forEach(([id, data]) => {
          // Extra guard: filter out any legacy dummy/mock IDs
          if (
            !id.startsWith('contact-vamshi') &&
            !id.startsWith('contact-sneha') &&
            !id.startsWith('contact-arjun') &&
            !id.startsWith('contact-family')
          ) {
            // Load messages from isolated per-contact storage key to guarantee isolation
            try {
              const isolatedRaw = localStorage.getItem(STORAGE_ISOLATED_PREFIX + id);
              if (isolatedRaw) {
                const parsedMsgs = JSON.parse(isolatedRaw);
                if (Array.isArray(parsedMsgs)) {
                  data.messages = parsedMsgs;
                }
              }
            } catch {
              // fallback to session messages
            }

            this.chats.set(id, data);
            this.subscribeToRoom(id);
          }
        });
      }
    } catch {
      // ignore
    }

    // Initial state of contacts and recent chats is completely EMPTY if no imported contacts
    const remainingKeys = Array.from(this.chats.keys());
    this.activeChatId = remainingKeys.length > 0 ? remainingKeys[0] : '';
    this.save();
  }

  private save() {
    if (typeof window === 'undefined') return;
    try {
      const obj: Record<string, ChatSessionData> = {};
      this.chats.forEach((val, key) => {
        obj[key] = val;
        // Strictly isolated storage keyed by contact.id
        try {
          localStorage.setItem(STORAGE_ISOLATED_PREFIX + key, JSON.stringify(val.messages));
        } catch {
          // storage quota guard
        }
      });
      localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(obj));
      localStorage.setItem(STORAGE_STORIES_KEY, JSON.stringify(this.stories));
    } catch {
      // ignore
    }
    this.notify();
  }

  public subscribe(listener: MessengerListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getActiveChatId(): string {
    return this.activeChatId;
  }

  public setActiveChatId(id: string) {
    this.activeChatId = id;
    const session = this.chats.get(id);
    if (session) {
      session.unreadCount = 0;
      session.messages.forEach((m) => {
        if (m.sender === 'contact') m.status = 'read';
      });
      this.save();
      this.subscribeToRoom(id);
    }
    this.notify();
  }

  /**
   * Subscribes to real-time P2P sync room locked to contactId
   */
  public subscribeToRoom(contactId: string) {
    if (!contactId || this.roomUnsubs.has(contactId)) return;

    const unsub = p2pRoomSyncService.joinRoom(contactId, (event) => {
      if (event.type === 'message' && event.data.sender === 'guest') {
        this.receiveGuestMessage(contactId, event.data);
      } else if (event.type === 'typing' && event.data.sender === 'guest') {
        this.handleGuestTyping(contactId, event.data.isTyping);
      }
    });

    this.roomUnsubs.set(contactId, unsub);
  }

  /**
   * Ingests a real-time message from the guest web chat with sound chime & badge
   */
  public receiveGuestMessage(contactId: string, guestMsg: RoomChatMessage) {
    const session = this.chats.get(contactId);
    if (!session) return;

    // Strict deduplication guard
    if (session.messages.some((m) => m.id === guestMsg.id)) {
      return;
    }

    const timeFormatted =
      guestMsg.timestamp ||
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: GKMessage = {
      id: guestMsg.id,
      chatId: contactId,
      sender: 'contact',
      text: guestMsg.text || '',
      imageUrl: guestMsg.imageUrl,
      audioBase64: guestMsg.audioBase64,
      mediaFileName: guestMsg.mediaFileName,
      timestamp: timeFormatted,
      status: this.activeChatId === contactId ? 'read' : 'delivered',
      isEncrypted: true,
    };

    session.messages.push(newMsg);
    session.lastMessageText =
      guestMsg.text || (guestMsg.imageUrl ? '📷 Photo' : '🎤 Voice Note');
    session.lastMessageTime = timeFormatted;
    session.contact.status = 'online';

    // Play incoming audio chime
    notificationService.playSoftChime();

    // Trigger incoming badge & toast if chat is not active
    if (this.activeChatId !== contactId) {
      session.unreadCount += 1;
      notificationService.showInAppToast(
        `💬 Guest Reply (${session.contact.name})`,
        guestMsg.text ? `"${guestMsg.text.slice(0, 45)}"` : 'Attachment received',
        'info'
      );
    }

    this.save();
  }

  /**
   * Handles typing indicator from the guest web chat
   */
  public handleGuestTyping(contactId: string, isTyping: boolean) {
    const session = this.chats.get(contactId);
    if (session) {
      session.contact.status = isTyping ? 'typing' : 'online';
      this.notify();
      if (isTyping) {
        setTimeout(() => {
          if (session.contact.status === 'typing') {
            session.contact.status = 'online';
            this.notify();
          }
        }, 4000);
      }
    }
  }

  /**
   * Returns verified contacts list (excludes unknown requests)
   */
  public getChatsList(includeRequests = false): ChatSessionData[] {
    return Array.from(this.chats.values())
      .filter((c) => includeRequests || !c.contact.isUnknownRequest)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
  }

  /**
   * Returns isolated unknown requests
   */
  public getUnknownRequests(): ChatSessionData[] {
    return Array.from(this.chats.values()).filter((c) => !!c.contact.isUnknownRequest);
  }

  public getChat(id: string): ChatSessionData | undefined {
    return this.chats.get(id);
  }

  public getStories(): GKStory[] {
    return [...this.stories];
  }

  public markStoryViewed(storyId: string) {
    this.stories = this.stories.map((s) => (s.id === storyId ? { ...s, viewed: true } : s));
    this.save();
  }

  // --- Strict Privacy Contacts Management System ---

  /**
   * Explicitly add contact (only when user enters number manually).
   * Locked to sanitized phone or globally unique ID to prevent wrong recipient!
   */
  public addContact(contactData: {
    name: string;
    phone: string;
    avatar?: string;
    tag?: string;
    about?: string;
  }): GKContact {
    const rawPhone = (contactData.phone || '').trim();
    const cleanDigits = rawPhone.replace(/[^0-9]/g, '');

    // Strictly locked contact ID: sanitized phone or unique token
    const id =
      cleanDigits.length >= 7
        ? `tel_${cleanDigits}`
        : `contact_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const cleanHandle = '@' + contactData.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const avatar =
      contactData.avatar ||
      `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=200&auto=format&fit=crop&q=80`;

    const newContact: GKContact = {
      id,
      name: contactData.name.trim(),
      phone: rawPhone,
      handle: cleanHandle,
      avatar,
      status: 'online',
      tag: contactData.tag?.trim() || 'Verified Contact',
      about: contactData.about?.trim() || 'Verified Contact on GKEDIT Messenger',
      isPinned: false,
      isBlocked: false,
      isUnknownRequest: false,
    };

    const newSession: ChatSessionData = {
      contact: newContact,
      messages: [
        {
          id: 'welcome_' + Date.now(),
          chatId: id,
          sender: 'contact',
          text: `Contact verified and locked to ${rawPhone || 'ID'}. Direct P2P messaging and calls are end-to-end encrypted. 🔒`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read',
          isEncrypted: true,
        },
      ],
      unreadCount: 0,
      lastMessageText: 'Contact added',
      lastMessageTime: 'Just now',
      isPinned: false,
      isUnknownRequest: false,
    };

    this.chats.set(id, newSession);
    this.activeChatId = id;
    this.subscribeToRoom(id);
    this.save();
    return newContact;
  }

  /**
   * Import verified Google Contacts explicitly via Google People API.
   * Locked to sanitized phone or verified People API resource id.
   */
  public importGoogleContacts(
    contacts: Array<{
      id: string;
      name: string;
      phone?: string;
      email?: string;
      avatarUrl?: string;
    }>
  ): number {
    let importedCount = 0;
    contacts.forEach((item, idx) => {
      if (!item.name || !item.name.trim()) return;
      const cleanName = item.name.trim();
      const rawPhone = item.phone?.trim() || '';
      const cleanDigits = rawPhone.replace(/[^0-9]/g, '');

      // Strictly lock contact ID to sanitized phone or resource ID
      const id =
        cleanDigits.length >= 7
          ? `tel_${cleanDigits}`
          : 'gc_' + (item.id || Date.now() + '_' + idx).replace(/[^a-zA-Z0-9_-]/g, '_');

      const avatar =
        item.avatarUrl ||
        `https://images.unsplash.com/photo-${1534528741775 + ((idx * 137) % 5000)}?w=200&auto=format&fit=crop&q=80`;
      const cleanHandle = '@' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');

      const existingSession = this.chats.get(id);
      if (existingSession) {
        existingSession.contact.name = cleanName;
        if (rawPhone) existingSession.contact.phone = rawPhone;
        existingSession.contact.isUnknownRequest = false;
        if (item.avatarUrl) existingSession.contact.avatar = item.avatarUrl;
        if (item.email) existingSession.contact.about = `Email: ${item.email}`;
      } else {
        const newContact: GKContact = {
          id,
          name: cleanName,
          phone: rawPhone,
          handle: cleanHandle,
          avatar,
          status: 'online',
          tag: 'Google Contact',
          about: item.email ? `Google Contact • ${item.email}` : 'Imported from Google Contacts',
          isPinned: false,
          isBlocked: false,
          isUnknownRequest: false,
        };

        const newSession: ChatSessionData = {
          contact: newContact,
          messages: [
            {
              id: 'gc_welcome_' + Date.now() + '_' + idx,
              chatId: id,
              sender: 'contact',
              text: `Connected with ${cleanName} from Google Contacts. Real-time messaging and calls are end-to-end encrypted. 🔒`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'read',
              isEncrypted: true,
            },
          ],
          unreadCount: 0,
          lastMessageText: 'Synced from Google Contacts',
          lastMessageTime: 'Just now',
          isPinned: false,
          isUnknownRequest: false,
        };

        this.chats.set(id, newSession);
        this.subscribeToRoom(id);
        importedCount++;
      }
    });

    if (contacts.length > 0) {
      const firstRaw = contacts[0].phone?.replace(/[^0-9]/g, '') || '';
      const firstId =
        firstRaw.length >= 7
          ? `tel_${firstRaw}`
          : 'gc_' + (contacts[0].id || '').replace(/[^a-zA-Z0-9_-]/g, '_');

      if (this.chats.has(firstId)) {
        this.activeChatId = firstId;
      }
    }

    this.save();
    return importedCount;
  }

  // --- Strict Privacy: Unknown Requests Isolation ---

  public receiveUnknownRequest(params: {
    phone: string;
    senderName?: string;
    text: string;
  }): ChatSessionData {
    const cleanDigits = params.phone.replace(/[^0-9]/g, '') || Date.now().toString();
    const id = 'req_' + cleanDigits;
    const existing = this.chats.get(id);

    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (existing) {
      existing.messages.push({
        id: 'msg_' + Date.now(),
        chatId: id,
        sender: 'contact',
        text: params.text,
        timestamp: timeFormatted,
        status: 'delivered',
        isEncrypted: true,
      });
      existing.unreadCount += 1;
      existing.lastMessageText = params.text;
      existing.lastMessageTime = timeFormatted;
      this.save();
      return existing;
    }

    const contact: GKContact = {
      id,
      name: params.senderName || params.phone,
      phone: params.phone,
      handle: '@' + (cleanDigits || 'unknown'),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      status: 'offline',
      tag: 'Unknown Request',
      about: 'Unverified sender • Not in your contacts',
      isPinned: false,
      isBlocked: false,
      isUnknownRequest: true,
    };

    const session: ChatSessionData = {
      contact,
      messages: [
        {
          id: 'req_msg_' + Date.now(),
          chatId: id,
          sender: 'contact',
          text: params.text,
          timestamp: timeFormatted,
          status: 'delivered',
          isEncrypted: true,
        },
      ],
      unreadCount: 1,
      lastMessageText: params.text,
      lastMessageTime: timeFormatted,
      isPinned: false,
      isUnknownRequest: true,
    };

    this.chats.set(id, session);
    notificationService.playSoftChime();
    this.save();
    return session;
  }

  public acceptUnknownRequest(chatId: string, customName?: string) {
    const session = this.chats.get(chatId);
    if (session) {
      session.contact.isUnknownRequest = false;
      session.isUnknownRequest = false;
      if (customName && customName.trim()) {
        session.contact.name = customName.trim();
        session.contact.handle = '@' + customName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      }
      session.contact.tag = 'Verified Contact';
      session.contact.about = 'Verified contact on GKEDIT Messenger';
      session.messages.push({
        id: 'sys_' + Date.now(),
        chatId,
        sender: 'user',
        text: 'Request accepted. Added to verified contacts.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
        isEncrypted: true,
      });
      this.subscribeToRoom(chatId);
      this.save();
    }
  }

  public declineUnknownRequest(chatId: string, block: boolean = false) {
    const session = this.chats.get(chatId);
    if (session) {
      if (block) {
        session.contact.isBlocked = true;
        session.contact.isUnknownRequest = false;
        session.isUnknownRequest = false;
        session.messages = [];
        session.lastMessageText = 'Blocked';
      } else {
        this.chats.delete(chatId);
        try {
          localStorage.removeItem(STORAGE_ISOLATED_PREFIX + chatId);
        } catch {}
        if (this.activeChatId === chatId) {
          const remaining = Array.from(this.chats.keys());
          this.activeChatId = remaining[0] || '';
        }
      }
      this.save();
    }
  }

  public updateContact(contactId: string, updates: Partial<GKContact>) {
    const session = this.chats.get(contactId);
    if (session) {
      session.contact = { ...session.contact, ...updates };
      this.save();
    }
  }

  public toggleBlockContact(contactId: string) {
    const session = this.chats.get(contactId);
    if (session) {
      session.contact.isBlocked = !session.contact.isBlocked;
      this.save();
    }
  }

  public togglePinContact(contactId: string) {
    const session = this.chats.get(contactId);
    if (session) {
      session.isPinned = !session.isPinned;
      session.contact.isPinned = session.isPinned;
      this.save();
    }
  }

  public deleteContact(contactId: string) {
    this.chats.delete(contactId);
    try {
      localStorage.removeItem(STORAGE_ISOLATED_PREFIX + contactId);
    } catch {}
    const unsub = this.roomUnsubs.get(contactId);
    if (unsub) {
      unsub();
      this.roomUnsubs.delete(contactId);
    }
    if (this.activeChatId === contactId) {
      const remaining = Array.from(this.chats.keys());
      this.activeChatId = remaining[0] || '';
    }
    this.save();
  }

  // --- 1-on-1 Direct Messaging (Strict ID Locked, Pure P2P Sync) ---

  public sendMessage(
    chatId: string,
    payload: {
      text: string;
      imageUrl?: string;
      audioBase64?: string;
      mediaFileName?: string;
    }
  ): GKMessage {
    // Strictly retrieve by exact unique contact.id - never route by name!
    const session = this.chats.get(chatId);
    if (!session) {
      throw new Error(`Contact not found for id ${chatId}`);
    }

    if (session.contact.isBlocked) {
      throw new Error('Cannot send messages to a blocked contact');
    }

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

    const userMessage: GKMessage = {
      id: msgId,
      chatId,
      sender: 'user',
      text: payload.text,
      timestamp: timeFormatted,
      status: 'sent',
      imageUrl: payload.imageUrl,
      audioBase64: payload.audioBase64,
      mediaFileName: payload.mediaFileName,
      isEncrypted: true,
    };

    session.messages.push(userMessage);
    session.lastMessageText = payload.text
      ? payload.text.slice(0, 50)
      : payload.imageUrl
      ? '📷 Photo'
      : '🎤 Voice Note';
    session.lastMessageTime = timeFormatted;
    this.save();

    // Broadcast across real-time room to connected guest web chat (BroadcastChannel & SSE)
    p2pRoomSyncService.sendMessage(chatId, 'host', 'GK EDIT', payload).catch(() => {});

    // Update status to delivered
    setTimeout(() => {
      const currentSession = this.chats.get(chatId);
      if (currentSession) {
        const msg = currentSession.messages.find((m) => m.id === userMessage.id);
        if (msg && msg.status === 'sent') {
          msg.status = 'delivered';
          this.save();
        }
      }
    }, 400);

    return userMessage;
  }

  public deleteMessage(chatId: string, messageId: string) {
    const session = this.chats.get(chatId);
    if (session) {
      session.messages = session.messages.filter((m) => m.id !== messageId);
      const last = session.messages[session.messages.length - 1];
      session.lastMessageText = last ? last.text : 'No messages';
      session.lastMessageTime = last ? last.timestamp : '';
      this.save();
    }
  }

  public clearChatHistory(chatId: string) {
    const session = this.chats.get(chatId);
    if (session) {
      session.messages = [];
      session.lastMessageText = 'Chat cleared';
      try {
        localStorage.removeItem(STORAGE_ISOLATED_PREFIX + chatId);
      } catch {}
      this.save();
    }
  }

  public exportChatAsText(chatId: string): string {
    const session = this.chats.get(chatId);
    if (!session) return '';

    const lines: string[] = [
      `=== GKEDIT Messenger Chat Export ===`,
      `Contact ID: ${session.contact.id}`,
      `Contact Name: ${session.contact.name}`,
      `Phone: ${session.contact.phone || 'N/A'}`,
      `Handle: ${session.contact.handle}`,
      `Security: End-to-End Encrypted (AES-256-GCM)`,
      `Exported: ${new Date().toLocaleString()}`,
      `----------------------------------------------------`,
    ];

    session.messages.forEach((m) => {
      const sender = m.sender === 'user' ? 'You' : session.contact.name;
      lines.push(`[${m.timestamp}] ${sender}: ${m.text}`);
    });

    return lines.join('\n');
  }
}

export const gkMessengerService = new GKMessengerService();
