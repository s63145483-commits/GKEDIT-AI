import { ChatSession, ChatMessage } from '../types/index.ts';

const STORAGE_KEY = 'gkedit_ai_chat_sessions_v1';
const ACTIVE_SESSION_KEY = 'gkedit_ai_active_session_id';

class ChatHistoryService {
  private sessions: ChatSession[] = [];
  private activeSessionId: string | null = null;
  private listeners: Array<(sessions: ChatSession[]) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.sessions = JSON.parse(saved);
      } else {
        this.sessions = [];
      }
      this.activeSessionId = localStorage.getItem(ACTIVE_SESSION_KEY) || (this.sessions[0]?.id ?? null);
    } catch (e) {
      console.warn('Failed to load chat history from localStorage', e);
      this.sessions = [];
      this.activeSessionId = null;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions));
      if (this.activeSessionId) {
        localStorage.setItem(ACTIVE_SESSION_KEY, this.activeSessionId);
      } else {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    } catch (e) {
      console.warn('Failed to save chat history to localStorage', e);
    }
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.sessions]);
      } catch (e) {
        console.error('Error in chat history listener', e);
      }
    });
  }

  public subscribe(listener: (sessions: ChatSession[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.sessions]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getSessions(): ChatSession[] {
    return [...this.sessions];
  }

  public getActiveSessionId(): string | null {
    return this.activeSessionId;
  }

  public setActiveSessionId(id: string | null) {
    this.activeSessionId = id;
    try {
      if (id) {
        localStorage.setItem(ACTIVE_SESSION_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    } catch (e) {
      console.warn('Error setting active session ID', e);
    }
    this.notifyListeners();
  }

  public getSession(id: string): ChatSession | null {
    return this.sessions.find((s) => s.id === id) || null;
  }

  public createSession(
    title: string,
    initialMessages: ChatMessage[] = [],
    category: 'chat' | 'astrology' | 'tools' | 'devotional' = 'chat',
    meta?: { rashi?: string; rashiTelugu?: string; rashiSymbol?: string }
  ): ChatSession {
    const newSession: ChatSession = {
      id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: title || 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: initialMessages,
      category,
      rashi: meta?.rashi,
      rashiTelugu: meta?.rashiTelugu,
      rashiSymbol: meta?.rashiSymbol,
    };

    // Place newest on top
    this.sessions.unshift(newSession);
    this.activeSessionId = newSession.id;
    this.saveToStorage();
    return newSession;
  }

  public saveMessages(sessionId: string, messages: ChatMessage[], newTitle?: string) {
    const sessionIndex = this.sessions.findIndex((s) => s.id === sessionId);
    if (sessionIndex !== -1) {
      this.sessions[sessionIndex].messages = messages;
      this.sessions[sessionIndex].updatedAt = Date.now();
      if (newTitle && this.sessions[sessionIndex].title === 'New Conversation') {
        this.sessions[sessionIndex].title = newTitle;
      }
      // Move updated session to top
      const updated = this.sessions.splice(sessionIndex, 1)[0];
      this.sessions.unshift(updated);
      this.saveToStorage();
    }
  }

  public saveAstrologyReading(
    rashi: string,
    rashiTelugu: string,
    rashiSymbol: string,
    readingText: string,
    userQueryTitle: string
  ): ChatSession {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: 'msg_user_' + Date.now(),
      role: 'user',
      text: userQueryTitle || `${rashiSymbol} ${rashiTelugu} (${rashi}) రాశి ఫలాలు కావాలి.`,
      timestamp: timeStr,
    };
    const modelMsg: ChatMessage = {
      id: 'msg_model_' + Date.now(),
      role: 'model',
      text: readingText,
      timestamp: timeStr,
      modelUsed: 'gemini-3.5-flash',
    };

    const title = `${rashiSymbol} ${rashiTelugu} (${rashi}) Horoscope`;
    const session = this.createSession(title, [userMsg, modelMsg], 'astrology', {
      rashi,
      rashiTelugu,
      rashiSymbol,
    });
    return session;
  }

  private backupSessions: ChatSession[] | null = null;
  private backupActiveId: string | null = null;

  public createBackup() {
    this.backupSessions = JSON.parse(JSON.stringify(this.sessions));
    this.backupActiveId = this.activeSessionId;
  }

  public restoreBackup(): boolean {
    if (!this.backupSessions) return false;
    this.sessions = JSON.parse(JSON.stringify(this.backupSessions));
    this.activeSessionId = this.backupActiveId;
    this.backupSessions = null;
    this.backupActiveId = null;
    this.saveToStorage();
    return true;
  }

  public hasBackup(): boolean {
    return this.backupSessions !== null;
  }

  public deleteSession(id: string, makeBackup = true): boolean {
    if (makeBackup) {
      this.createBackup();
    }
    const initialLen = this.sessions.length;
    this.sessions = this.sessions.filter((s) => s.id !== id);
    if (this.sessions.length !== initialLen) {
      if (this.activeSessionId === id) {
        this.activeSessionId = this.sessions[0]?.id || null;
      }
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public clearActiveSession(id?: string, makeBackup = true): boolean {
    const targetId = id || this.activeSessionId;
    if (!targetId) return false;
    if (makeBackup) {
      this.createBackup();
    }
    return this.deleteSession(targetId, false);
  }

  public clearAllSessions(makeBackup = true) {
    if (makeBackup) {
      this.createBackup();
    }
    this.sessions = [];
    this.activeSessionId = null;
    this.saveToStorage();
  }
}

export const chatHistoryService = new ChatHistoryService();
