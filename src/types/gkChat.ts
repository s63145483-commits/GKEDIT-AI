export interface GKContact {
  id: string;
  name: string;
  phone: string;
  handle: string;
  avatar: string;
  status: 'online' | 'offline' | 'typing';
  about?: string;
  tag?: string;
  lastSeen?: string;
  isPinned?: boolean;
  isBlocked?: boolean;
  isUnknownRequest?: boolean;
}

export interface GKAttachment {
  type: 'image' | 'audio' | 'document';
  url?: string;
  name?: string;
  size?: string;
  duration?: number;
}

export interface GKMessage {
  id: string;
  chatId: string;
  sender: 'user' | 'contact';
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  imageUrl?: string;
  audioBase64?: string;
  mediaFileName?: string;
  isEncrypted?: boolean;
}

export interface GKStory {
  id: string;
  contactId: string;
  contactName: string;
  contactAvatar: string;
  mediaUrl: string;
  caption: string;
  timestamp: string;
  viewed: boolean;
}

// Strict Privacy: Initial state is completely empty - NO dummy or mock contacts!
export const INITIAL_CONTACTS: GKContact[] = [];
export const INITIAL_STATUS_STORIES: GKStory[] = [];
