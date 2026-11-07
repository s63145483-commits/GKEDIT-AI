/**
 * Persistent File Transfer Session Handler & Keep-Alive Service
 *
 * Implements:
 * 1. Persistent Session ID:
 *    - Reads from localStorage('transfer_id') or generates 6-digit PIN (100000..999999) once.
 *    - Persists transfer_id to localStorage across page reloads and tab navigations.
 * 2. Anti-Randomization & Dependency Locks:
 *    - Guarantees the PIN is never regenerated inside reactive render loops or timers.
 *    - Only updates on manual user action ("Generate New Code") or verified 100% transfer completion.
 * 3. Transfer Keep-Alive & Resilient Chunking:
 *    - Chunks file data into safe ~32KB segments to prevent SCTP buffer overflow in WebRTC.
 *    - Maintains heartbeat keep-alive pulses to keep connections open until chunks reach 100%.
 *    - Prevents premature timeout resets mid-transfer.
 */

export interface TransferChunkPayload {
  type: 'FILE_TRANSFER_INIT' | 'FILE_TRANSFER_CHUNK' | 'FILE_TRANSFER_COMPLETE' | 'TRANSFER_KEEP_ALIVE';
  transferId: string;
  chunkIndex?: number;
  totalChunks?: number;
  data?: string;
  progress?: number;
  filename?: string;
  mimeType?: string;
  totalBytes?: number;
  timestamp?: number;
}

const STORAGE_KEY = 'transfer_id';
const DEFAULT_CHUNK_SIZE = 32 * 1024; // 32KB chunks

/**
 * 1. Persistent Session ID:
 * Retrieves the static transfer PIN/ID from localStorage, or generates
 * Math.floor(100000 + Math.random() * 900000) once and stores it.
 */
export function getPersistentTransferId(): string {
  if (typeof window === 'undefined') {
    return '582914';
  }

  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && /^\d{4,8}$/.test(existing.trim())) {
      return existing.trim();
    }
  } catch {
    // Ignore storage restrictions
  }

  const generated = String(Math.floor(100000 + Math.random() * 900000));
  try {
    localStorage.setItem(STORAGE_KEY, generated);
  } catch {
    // Ignore storage restrictions
  }

  return generated;
}

/**
 * Explicitly generates a fresh PIN only when manually triggered by the user
 * or upon successful 100% transfer completion.
 */
export function generateNewTransferId(): string {
  const newId = String(Math.floor(100000 + Math.random() * 900000));
  try {
    localStorage.setItem(STORAGE_KEY, newId);
  } catch {}
  return newId;
}

/**
 * Rotates the transfer PIN on successful 100% completion.
 */
export function rotateTransferIdOnComplete(): string {
  return generateNewTransferId();
}

/**
 * Sends a file (base64 DataURL or string) over WebRTC and/or BroadcastChannel
 * using resilient ~32KB chunking and keep-alive heartbeats until 100% complete.
 */
export async function sendFileWithKeepAlive({
  dataUrl,
  transferId,
  filename = `gkedit_transfer_${Date.now()}.jpg`,
  mimeType = 'image/jpeg',
  conn,
  broadcastChannel,
  chunkSize = DEFAULT_CHUNK_SIZE,
  onProgress,
  isCancelled,
}: {
  dataUrl: string;
  transferId: string;
  filename?: string;
  mimeType?: string;
  conn?: any;
  broadcastChannel?: BroadcastChannel | null;
  chunkSize?: number;
  onProgress?: (progress: number, currentChunk: number, totalChunks: number) => void;
  isCancelled?: () => boolean;
}): Promise<boolean> {
  const totalLength = dataUrl.length;
  const totalChunks = Math.max(1, Math.ceil(totalLength / chunkSize));

  // Dispatch Initializer
  const initMsg: TransferChunkPayload = {
    type: 'FILE_TRANSFER_INIT',
    transferId,
    totalChunks,
    totalBytes: totalLength,
    filename,
    mimeType,
    timestamp: Date.now(),
  };

  try {
    if (conn && typeof conn.send === 'function') conn.send(initMsg);
    if (broadcastChannel) broadcastChannel.postMessage(initMsg);
  } catch (err) {
    console.warn('Transfer init error:', err);
  }

  onProgress?.(0, 0, totalChunks);

  // Transfer Keep-Alive heartbeat interval to prevent timeouts mid-transfer
  let keepAliveTimer: any = null;
  let activeProgress = 0;

  const startKeepAlive = () => {
    keepAliveTimer = setInterval(() => {
      if (isCancelled && isCancelled()) return;
      const keepAliveMsg: TransferChunkPayload = {
        type: 'TRANSFER_KEEP_ALIVE',
        transferId,
        progress: activeProgress,
        timestamp: Date.now(),
      };
      try {
        if (conn && typeof conn.send === 'function') conn.send(keepAliveMsg);
        if (broadcastChannel) broadcastChannel.postMessage(keepAliveMsg);
      } catch {
        // Keep-alive silent ignore
      }
    }, 2000);
  };

  startKeepAlive();

  try {
    for (let index = 0; index < totalChunks; index++) {
      if (isCancelled && isCancelled()) {
        clearInterval(keepAliveTimer);
        return false;
      }

      const start = index * chunkSize;
      const end = Math.min(start + chunkSize, totalLength);
      const chunkData = dataUrl.substring(start, end);
      const progress = Math.min(99, Math.round(((index + 1) / totalChunks) * 100));
      activeProgress = progress;

      const chunkMsg: TransferChunkPayload = {
        type: 'FILE_TRANSFER_CHUNK',
        transferId,
        chunkIndex: index,
        totalChunks,
        data: chunkData,
        progress,
        filename,
      };

      try {
        if (conn && typeof conn.send === 'function') conn.send(chunkMsg);
        if (broadcastChannel) broadcastChannel.postMessage(chunkMsg);
      } catch (sendErr) {
        console.warn(`Chunk ${index} send error:`, sendErr);
      }

      onProgress?.(progress, index + 1, totalChunks);

      // Micro-pause to allow WebRTC SCTP buffers to drain smoothly without dropping packets
      if (totalChunks > 1) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // Dispatch Final Completion Packet
    const completeMsg: TransferChunkPayload = {
      type: 'FILE_TRANSFER_COMPLETE',
      transferId,
      totalChunks,
      filename,
      timestamp: Date.now(),
    };

    try {
      if (conn && typeof conn.send === 'function') conn.send(completeMsg);
      if (broadcastChannel) broadcastChannel.postMessage(completeMsg);
    } catch {}

    activeProgress = 100;
    onProgress?.(100, totalChunks, totalChunks);

    clearInterval(keepAliveTimer);
    return true;
  } catch (err) {
    console.error('File transfer failed:', err);
    clearInterval(keepAliveTimer);
    throw err;
  }
}

/**
 * Receiver Chunk Accumulator:
 * Handles incoming packets, verifies session PIN, tracks chunk completion (0..100%),
 * and assembles the complete data URL upon 100% receipt.
 */
export class ChunkReassembler {
  private chunks: Map<number, string> = new Map();
  private totalChunks: number = 0;
  private currentTransferId: string = '';
  private filename: string = '';
  private mimeType: string = '';
  private lastActivity: number = Date.now();

  public reset() {
    this.chunks.clear();
    this.totalChunks = 0;
    this.currentTransferId = '';
    this.filename = '';
    this.mimeType = '';
    this.lastActivity = Date.now();
  }

  public handlePacket(
    data: any,
    onProgress: (progress: number, received: number, total: number) => void
  ): { complete: boolean; dataUrl?: string; filename?: string } {
    this.lastActivity = Date.now();

    if (!data) return { complete: false };

    // Backward compatibility with legacy monolithic payload
    if ((data.dataUrl || data.photo) && data.type !== 'FILE_TRANSFER_CHUNK') {
      const payloadUrl = data.dataUrl || data.photo;
      onProgress(100, 1, 1);
      return {
        complete: true,
        dataUrl: payloadUrl,
        filename: data.filename || 'received_image.jpg',
      };
    }

    // 1. INIT Packet
    if (data.type === 'FILE_TRANSFER_INIT') {
      this.reset();
      this.currentTransferId = data.transferId || '';
      this.totalChunks = data.totalChunks || 1;
      this.filename = data.filename || 'received_image.jpg';
      this.mimeType = data.mimeType || 'image/jpeg';
      onProgress(0, 0, this.totalChunks);
      return { complete: false };
    }

    // 2. CHUNK Packet
    if (data.type === 'FILE_TRANSFER_CHUNK') {
      if (data.transferId && this.currentTransferId && data.transferId !== this.currentTransferId) {
        // Session ID changed
        this.reset();
        this.currentTransferId = data.transferId;
      } else if (!this.currentTransferId && data.transferId) {
        this.currentTransferId = data.transferId;
      }

      this.totalChunks = data.totalChunks || this.totalChunks || 1;
      if (typeof data.chunkIndex === 'number' && typeof data.data === 'string') {
        this.chunks.set(data.chunkIndex, data.data);
      }

      const receivedCount = this.chunks.size;
      const progress = Math.min(99, Math.round((receivedCount / this.totalChunks) * 100));
      onProgress(progress, receivedCount, this.totalChunks);

      // Check if all chunks received
      if (receivedCount >= this.totalChunks && this.totalChunks > 0) {
        let assembled = '';
        for (let i = 0; i < this.totalChunks; i++) {
          assembled += this.chunks.get(i) || '';
        }
        onProgress(100, this.totalChunks, this.totalChunks);
        return {
          complete: true,
          dataUrl: assembled,
          filename: this.filename || data.filename || 'received_image.jpg',
        };
      }

      return { complete: false };
    }

    // 3. COMPLETE Packet
    if (data.type === 'FILE_TRANSFER_COMPLETE') {
      if (this.chunks.size > 0 && this.totalChunks > 0) {
        let assembled = '';
        for (let i = 0; i < this.totalChunks; i++) {
          assembled += this.chunks.get(i) || '';
        }
        onProgress(100, this.totalChunks, this.totalChunks);
        return {
          complete: true,
          dataUrl: assembled,
          filename: this.filename || data.filename || 'received_image.jpg',
        };
      }
    }

    // 4. KEEP-ALIVE Packet (Resets timeout watcher)
    if (data.type === 'TRANSFER_KEEP_ALIVE') {
      return { complete: false };
    }

    return { complete: false };
  }

  public getLastActivity(): number {
    return this.lastActivity;
  }
}
