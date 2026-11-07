import { UserProfile, VideoScriptData } from '../types/index.ts';

const TOKEN_KEY = 'gkedit_ai_auth_token';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.friendlyMessage || data.error || `Request failed (${response.status})`;
    const err = new Error(errorMsg);
    (err as any).retryable = data.retryable || response.status === 503 || response.status === 429;
    (err as any).status = response.status;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  async register(params: { name: string; email: string; password: string; preferredLanguage?: string }) {
    return apiRequest<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async login(params: { email: string; password: string }) {
    return apiRequest<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async guestLogin() {
    return apiRequest<{ token: string; user: UserProfile }>('/api/auth/guest', {
      method: 'POST',
    });
  },

  async syncFirebaseUser(params: { uid: string; email?: string; name?: string; avatar?: string; preferredLanguage?: string }) {
    return apiRequest<{ token: string; user: UserProfile }>('/api/auth/firebase-sync', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getMe() {
    return apiRequest<{ user: UserProfile }>('/api/auth/me', {
      method: 'GET',
    });
  },

  // Creator Info
  async getCreatorInfo() {
    return apiRequest<any>('/api/creator/info', {
      method: 'GET',
    });
  },

  // Creator Live Monitor Logs
  async getCreatorMonitorLogs() {
    return apiRequest<{
      logs: Array<{
        id: string;
        type: string;
        summary: string;
        userEmail: string;
        userName: string;
        timestamp: string;
        details?: any;
      }>;
      activeSessionsCount: number;
      serverTime: string;
    }>('/api/creator/monitor-logs', {
      method: 'GET',
    });
  },

  // Log Admin Security Audit Access Session
  async logAdminAccess(sessionData: {
    sessionId: string;
    accessMode: 'tab' | 'modal';
    openedAt: string;
    device?: any;
  }) {
    return apiRequest<{ success: boolean; sessionLogged: boolean }>(
      '/api/creator/log-admin-access',
      {
        method: 'POST',
        body: JSON.stringify(sessionData),
      }
    );
  },

  // Chat
  async sendChat(params: {
    messages: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
    model?: string;
    enableThinking?: boolean;
    grounding?: 'none' | 'search' | 'maps';
    languagePreference?: string;
    systemInstruction?: string;
    temperature?: number;
    motherlyCareEnabled?: boolean;
    batterySaver?: boolean;
    dataSaver?: boolean;
    replySpeedTurbo?: boolean;
    activeAiPersona?: string;
    userContext?: {
      user_email: string;
      user_name: string;
      user_location?: string;
      session_id?: string;
      timestamp?: string;
    };
    signal?: AbortSignal;
  }) {
    const { signal, ...bodyParams } = params;
    return apiRequest<{
      text: string;
      model: string;
      bioSceneUpdate?: {
        modelType: 'DNA_HELIX' | 'CELL_NUCLEUS' | 'VIRUS_CAPSID' | 'PROTEIN_FOLD';
        mutationLevel: number;
        primaryColor: string;
        rotationSpeed: number;
        gameChallenge: string;
      };
      bioscienceObservationUpdate?: {
        specimen: 'DNA_HELIX' | 'EUKARYOTIC_CELL' | 'VIRUS_STRUCTURE' | 'PROTEIN_FOLDING';
        highlightOrganelle: string;
        biome?: 'STANDARD_LAB' | 'TUNDRA' | 'TROPICAL' | 'DEEP_SEA' | 'HYDROTHERMAL_VENT';
        phLevel?: number;
        temperature?: number;
        crossSectionSlice?: number;
        kineticSpeed?: number;
        activeProcess?: 'NONE' | 'DNA_REPLICATION' | 'MRNA_TRANSCRIPTION' | 'MITOSIS_CYCLE';
        processStep?: number;
        scientificNotes: string;
      };
      bluetoothAction?: {
        action: 'connect_bluetooth_device' | 'disconnect_bluetooth_device' | 'get_device_battery';
        deviceTypeHint?: string;
        deviceId?: string;
      };
    }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(bodyParams),
      signal,
    });
  },

  // Tools
  async solveMath(problem: string) {
    return apiRequest<{ solution: string }>('/api/math/solve', {
      method: 'POST',
      body: JSON.stringify({ problem }),
    });
  },

  async planDay(goals?: string, date?: string) {
    return apiRequest<{ plan: string }>('/api/calendar/plan', {
      method: 'POST',
      body: JSON.stringify({ goals, date }),
    });
  },

  async checkHealth(query: string) {
    return apiRequest<{ result: string }>('/api/health/check', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },

  async scanFingerprintHealth(vitals: {
    bpm: number;
    spo2: number;
    stress: number;
    vitality: number;
    fatigue?: number;
    scanMethod?: string;
  }) {
    return apiRequest<{
      analysis: string;
      vitals: { bpm: number; spo2: number; stress: number; vitality: number; fatigue: number };
    }>('/api/health/fingerprint-scan', {
      method: 'POST',
      body: JSON.stringify(vitals),
    });
  },

  async getDevotionalInsight(params: any) {
    return apiRequest<{
      result: string;
      sources?: Array<{ title: string; url: string }>;
      groundedWithSearch?: boolean;
    }>('/api/devotional/insight', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Image
  async generateImage(params: {
    prompt: string;
    aspectRatio?: string;
    imageSize?: string;
    inputImageBase64?: string;
  }) {
    return apiRequest<{ imageUrl: string | null; text: string; aspectRatio: string; imageSize: string }>('/api/image/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async analyzeImage(params: { prompt?: string; imageBase64: string; mimeType?: string }) {
    return apiRequest<{ analysis: string }>('/api/image/analyze', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async analyzeCameraSnapshot(params: { prompt?: string; imageBase64: string; mimeType?: string }) {
    return apiRequest<{ analysis: string }>('/api/camera/analyze', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async generateMusic(params: { prompt: string; duration?: 'clip' | 'pro' }) {
    return apiRequest<any>('/api/music/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async textToSpeech(params: { text: string; voiceName?: string }) {
    return apiRequest<{ audioBase64: string; mimeType: string }>('/api/audio/tts', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // PDF to Audio Explainer (Gemini 2.5 Flash)
  async explainPdfContent(params: { text: string; customPrompt?: string }) {
    return apiRequest<{
      summary_title: string;
      spoken_script: string;
      book_chapters?: Array<{
        chapter_number: string;
        title: string;
        content: string;
        key_insight?: string;
      }>;
      exam_takeaways?: string[];
      key_points?: string[];
    }>('/api/pdf-audio/explain', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Audio Transcription (gemini-3.5-transcribe)
  async transcribeAudio(params: { audioBase64: string; mimeType?: string; languageHint?: string }) {
    return apiRequest<{ transcript: string; model: string }>('/api/audio/transcribe', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Video
  async generateVideo(params: { prompt: string; aspectRatio?: string; imageBase64?: string }) {
    return apiRequest<any>('/api/video/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async pollVideoStatus(operationName: string) {
    return apiRequest<{ done: boolean; uri?: string }>('/api/video/status', {
      method: 'POST',
      body: JSON.stringify({ operationName }),
    });
  },

  // Video Script Generator (Scene-by-Scene Editing Scripts)
  async generateVideoScript(params: {
    topic: string;
    videoType?: string;
    targetDuration?: string;
    tone?: string;
    language?: string;
    aspectRatio?: string;
    pacing?: string;
    targetAudience?: string;
  }) {
    return apiRequest<VideoScriptData>('/api/generator/video-script', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Secret Creator Hidden Monitor
  async getMonitorStats() {
    return apiRequest<{
      creatorAuthorized: boolean;
      totalUsersCount: number;
      users: Array<{ id: string; name: string; email: string; role: string; createdAt: string }>;
      events: Array<{
        id: string;
        type: string;
        summary: string;
        userEmail: string;
        userName: string;
        timestamp: string;
        details?: any;
      }>;
      systemHealth: {
        uptimeSeconds: number;
        nodeVersion: string;
        activeMemory: string;
        aiEngine: string;
      };
    }>('/api/monitor/stats', {
      method: 'GET',
    });
  },

  async clearMonitorLogs() {
    return apiRequest<{ success: boolean }>('/api/monitor/clear', {
      method: 'POST',
    });
  },

  // Nexus Engine Gateway
  async getGatewayStatus() {
    return apiRequest<{ openAiConfigured: boolean; sarvamConfigured: boolean; geminiActive: boolean }>(
      '/api/gateway/status',
      { method: 'GET' }
    );
  },

  async saveGatewayKeys(keys: { openAiApiKey?: string; sarvamApiKey?: string }) {
    return apiRequest<{ success: boolean; message: string; status: any }>('/api/gateway/keys', {
      method: 'POST',
      body: JSON.stringify(keys),
    });
  },

  // Real Generation Studio: Photorealistic Image, Cinematic Video & AI Enhance
  async enhancePrompt(params: { prompt: string; mode?: 'image' | 'video' }) {
    return apiRequest<{
      success: boolean;
      originalPrompt: string;
      enhancedPrompt: string;
      mode: 'image' | 'video';
    }>('/api/enhance-prompt', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async generateRealImage(params: {
    prompt: string;
    aspectRatio?: string;
    model?: string;
    negativePrompt?: string;
    seed?: number;
  }) {
    return apiRequest<{
      success: boolean;
      imageUrl: string;
      prompt: string;
      enhancedPrompt: string;
      negativePrompt: string;
      aspectRatio: string;
      seed: number;
      metadata: {
        model: string;
        dimensions: { width: number; height: number };
        cameraLens: string;
        resolution: string;
        colorGrade?: string;
        generatedAt: string;
      };
    }>('/api/generate-image', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async generateRealVideo(params: {
    prompt: string;
    aspectRatio?: string;
    durationSeconds?: number;
    imageUrl?: string;
  }) {
    return apiRequest<{
      success: boolean;
      jobId: string;
      status: 'queued' | 'processing' | 'completed' | 'failed';
      prompt: string;
      enhancedPrompt: string;
      aspectRatio: string;
      durationSeconds: number;
      message: string;
    }>('/api/generate-video', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getVideoStatus(jobId: string) {
    return apiRequest<{
      success: boolean;
      jobId: string;
      status: 'queued' | 'processing' | 'completed' | 'failed';
      progress: number;
      videoUrl?: string;
      prompt: string;
      enhancedPrompt: string;
      aspectRatio: string;
      durationSeconds?: number;
      error?: string;
    }>(`/api/video-status/${encodeURIComponent(jobId)}`, {
      method: 'GET',
    });
  },
};
