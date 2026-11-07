export interface RoomChatMessage {
  id: string;
  roomId: string;
  sender: 'host' | 'guest';
  senderName: string;
  text: string;
  imageUrl?: string;
  audioBase64?: string;
  mediaFileName?: string;
  timestamp: string;
  createdAt: number;
}

export type RoomEvent =
  | { type: 'message'; roomId: string; data: RoomChatMessage }
  | { type: 'typing'; roomId: string; data: { sender: 'host' | 'guest'; isTyping: boolean } }
  | { type: 'call_signal'; roomId: string; data: { signalType: string; payload?: any } }
  | { type: 'presence'; roomId: string; data: { status: string } };

type RoomListener = (event: RoomEvent) => void;

class P2PRoomSyncService {
  private broadcastChannels: Map<string, BroadcastChannel> = new Map();
  private eventSources: Map<string, EventSource> = new Map();
  private listeners: Map<string, Set<RoomListener>> = new Map();
  private processedMsgIds: Set<string> = new Set();
  private pollingTimers: Map<string, any> = new Map();

  /**
   * Subscribes to a real-time room locked to room_${contactId}
   */
  public joinRoom(roomId: string, listener: RoomListener): () => void {
    if (!roomId) return () => {};

    if (!this.listeners.has(roomId)) {
      this.listeners.set(roomId, new Set());
    }
    this.listeners.get(roomId)!.add(listener);

    // Setup BroadcastChannel for 0ms same-device / multi-tab synchronization
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      if (!this.broadcastChannels.has(roomId)) {
        try {
          const bc = new BroadcastChannel(`gk_room_${roomId}`);
          bc.onmessage = (e) => {
            if (e.data) {
              this.handleIncomingEvent(roomId, e.data);
            }
          };
          this.broadcastChannels.set(roomId, bc);
        } catch (err) {
          console.warn('BroadcastChannel init error:', err);
        }
      }
    }

    // Setup Server-Sent Events (SSE) for cross-device / mobile guest synchronization
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      if (!this.eventSources.has(roomId)) {
        try {
          const es = new EventSource(`/api/gkchat/room/stream?roomId=${encodeURIComponent(roomId)}`);
          es.onmessage = (e) => {
            try {
              const parsed = JSON.parse(e.data);
              this.handleIncomingEvent(roomId, parsed);
            } catch (parseErr) {
              console.warn('Error parsing SSE event:', parseErr);
            }
          };
          es.onerror = () => {
            // If SSE drops or server doesn't stream, start fallback polling
            this.startFallbackPolling(roomId);
          };
          this.eventSources.set(roomId, es);
        } catch (err) {
          console.warn('EventSource init error:', err);
          this.startFallbackPolling(roomId);
        }
      }
    } else {
      this.startFallbackPolling(roomId);
    }

    // Return unsubscribe function
    return () => {
      const roomListeners = this.listeners.get(roomId);
      if (roomListeners) {
        roomListeners.delete(listener);
        if (roomListeners.size === 0) {
          this.leaveRoom(roomId);
        }
      }
    };
  }

  private startFallbackPolling(roomId: string) {
    if (this.pollingTimers.has(roomId)) return;
    const timer = setInterval(() => {
      this.fetchHistory(roomId).then((msgs) => {
        msgs.forEach((m) => {
          this.handleIncomingEvent(roomId, {
            type: 'message',
            roomId,
            data: m,
          });
        });
      }).catch(() => {});
    }, 3000);
    this.pollingTimers.set(roomId, timer);
  }

  private leaveRoom(roomId: string) {
    const bc = this.broadcastChannels.get(roomId);
    if (bc) {
      bc.close();
      this.broadcastChannels.delete(roomId);
    }
    const es = this.eventSources.get(roomId);
    if (es) {
      es.close();
      this.eventSources.delete(roomId);
    }
    const timer = this.pollingTimers.get(roomId);
    if (timer) {
      clearInterval(timer);
      this.pollingTimers.delete(roomId);
    }
    this.listeners.delete(roomId);
  }

  private handleIncomingEvent(roomId: string, event: RoomEvent) {
    if (event.type === 'message' && event.data?.id) {
      if (this.processedMsgIds.has(event.data.id)) {
        return; // Deduplicate already received message
      }
      this.processedMsgIds.add(event.data.id);
      if (this.processedMsgIds.size > 2000) {
        // Prune old IDs
        const arr = Array.from(this.processedMsgIds);
        this.processedMsgIds = new Set(arr.slice(arr.length - 1000));
      }
    }

    const roomListeners = this.listeners.get(roomId);
    if (roomListeners) {
      roomListeners.forEach((fn) => {
        try {
          fn(event);
        } catch (err) {
          console.error('Room listener error:', err);
        }
      });
    }
  }

  /**
   * Broadcast message to room both locally (BroadcastChannel) and to server (for cross-device)
   */
  public async sendMessage(
    roomId: string,
    sender: 'host' | 'guest',
    senderName: string,
    payload: {
      text?: string;
      imageUrl?: string;
      audioBase64?: string;
      mediaFileName?: string;
    }
  ): Promise<RoomChatMessage> {
    const tempId = 'rmsg_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localMsg: RoomChatMessage = {
      id: tempId,
      roomId,
      sender,
      senderName,
      text: payload.text || '',
      imageUrl: payload.imageUrl,
      audioBase64: payload.audioBase64,
      mediaFileName: payload.mediaFileName,
      timestamp: timeFormatted,
      createdAt: Date.now(),
    };

    // Mark as processed locally
    this.processedMsgIds.add(tempId);

    // Broadcast on local channel immediately
    const bc = this.broadcastChannels.get(roomId);
    if (bc) {
      try {
        bc.postMessage({
          type: 'message',
          roomId,
          data: localMsg,
        });
      } catch (err) {
        console.warn('BC postMessage error:', err);
      }
    }

    // Send to server for cross-device guests
    try {
      const res = await fetch('/api/gkchat/room/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          sender,
          senderName,
          text: payload.text || '',
          imageUrl: payload.imageUrl,
          audioBase64: payload.audioBase64,
          mediaFileName: payload.mediaFileName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          this.processedMsgIds.add(data.message.id);
          return data.message;
        }
      }
    } catch (err) {
      console.warn('Server room message sync notice:', err);
    }

    return localMsg;
  }

  /**
   * Broadcast typing status
   */
  public sendTyping(roomId: string, sender: 'host' | 'guest', isTyping: boolean) {
    const bc = this.broadcastChannels.get(roomId);
    if (bc) {
      try {
        bc.postMessage({
          type: 'typing',
          roomId,
          data: { sender, isTyping },
        });
      } catch {}
    }

    fetch('/api/gkchat/room/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, sender, isTyping }),
    }).catch(() => {});
  }

  /**
   * Broadcast Call Signal (offer/answer/end)
   */
  public sendCallSignal(
    roomId: string,
    signalType: 'call_offer' | 'call_answer' | 'call_end' | 'call_reject',
    payload?: any
  ) {
    const bc = this.broadcastChannels.get(roomId);
    if (bc) {
      try {
        bc.postMessage({
          type: 'call_signal',
          roomId,
          data: { signalType, payload },
        });
      } catch {}
    }

    fetch('/api/gkchat/room/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, signalType, payload }),
    }).catch(() => {});
  }

  /**
   * Fetch room history from server
   */
  public async fetchHistory(roomId: string): Promise<RoomChatMessage[]> {
    try {
      const res = await fetch(`/api/gkchat/room/messages?roomId=${encodeURIComponent(roomId)}`);
      if (res.ok) {
        const data = await res.json();
        return data.messages || [];
      }
    } catch (err) {
      console.warn('Fetch room history notice:', err);
    }
    return [];
  }
}

export const p2pRoomSyncService = new P2PRoomSyncService();
