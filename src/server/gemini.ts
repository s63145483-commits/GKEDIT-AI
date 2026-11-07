import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

export const updateBioscienceObservationDeclaration = {
  name: 'update_bioscience_observation',
  description:
    'Configures and loads 3D biological specimens for visual scientific observation, structural inspection, and educational study in the Bioscience Lab (NOT a game). MUST be called whenever the user asks any scientific question about biology, genetics, DNA/RNA, cell organelles, virology, protein folding, or biochemistry.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      specimen: {
        type: Type.STRING,
        enum: ['DNA_HELIX', 'EUKARYOTIC_CELL', 'VIRUS_STRUCTURE', 'PROTEIN_FOLDING'],
        description: 'The 3D specimen to render in the Bioscience Observable Learning Lab.',
      },
      highlightOrganelle: {
        type: Type.STRING,
        description:
          'Organelle or structural component to highlight (e.g. BASE_PAIR_AT, BASE_PAIR_GC, PHOSPHATE_BACKBONE, NUCLEUS, MITOCHONDRIA, ENDOPLASMIC_RETICULUM, GOLGI_APPARATUS, LYSOSOME, SPIKE_PROTEIN, CAPSID_HEXAMER, VIRAL_GENOME, ALPHA_HELIX, BETA_SHEET, DISULFIDE_BRIDGE).',
      },
      biome: {
        type: Type.STRING,
        enum: ['STANDARD_LAB', 'TUNDRA', 'TROPICAL', 'DEEP_SEA', 'HYDROTHERMAL_VENT'],
        description:
          'The ecological biome simulation environment (e.g. TUNDRA for cryo-permafrost, TROPICAL for phototrophic warm humidity, DEEP_SEA for abyssal hydrostatic pressure, HYDROTHERMAL_VENT for hyperthermophilic volcanic plumes, STANDARD_LAB for baseline).',
      },
      phLevel: {
        type: Type.NUMBER,
        description: 'Simulated pH level (2.0 to 12.0, physiological 7.4).',
      },
      temperature: {
        type: Type.NUMBER,
        description: 'Simulated temperature in °C (0 to 100°C, physiological 37°C).',
      },
      crossSectionSlice: {
        type: Type.NUMBER,
        description: 'Cross-section slice clipping plane between 0.0 (exterior) and 1.0 (internal organelles).',
      },
      kineticSpeed: {
        type: Type.NUMBER,
        description: 'Microscopic kinetic motion rate between 0.1 and 3.0.',
      },
      activeProcess: {
        type: Type.STRING,
        enum: ['NONE', 'DNA_REPLICATION', 'MRNA_TRANSCRIPTION', 'MITOSIS_CYCLE'],
        description: 'Process animation stage for step-by-step observation.',
      },
      processStep: {
        type: Type.NUMBER,
        description: 'Current step/stage index of the biological process (0 to 3).',
      },
      scientificNotes: {
        type: Type.STRING,
        description:
          'Structured, detailed scientific observation notes and biochemical analysis of the specimen.',
      },
    },
    required: ['specimen', 'highlightOrganelle', 'scientificNotes'],
  },
};

export const updateBio3dSceneDeclaration = {
  name: 'update_bio_3d_scene',
  description:
    'Updates the 3D Arcade Game simulation and spawns mini-game challenges or mutations. ONLY call this when the user explicitly requests to play the 3D game, test their reflexes, or repair mutations in the arcade challenge.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      modelType: {
        type: Type.STRING,
        enum: ['DNA_HELIX', 'CELL_NUCLEUS', 'VIRUS_CAPSID', 'PROTEIN_FOLD'],
        description: 'The 3D biological structure model to render in the bio-lab viewport.',
      },
      mutationLevel: {
        type: Type.NUMBER,
        description: 'Mutation or damage level between 0.0 (pristine/healthy) and 1.0 (highly mutated/infected).',
      },
      primaryColor: {
        type: Type.STRING,
        description: 'Hex color string for the primary glowing structure (e.g. #06b6d4, #10b981, #ec4899, #8b5cf6).',
      },
      rotationSpeed: {
        type: Type.NUMBER,
        description: 'Rotation speed multiplier between 0.5 and 5.0.',
      },
      gameChallenge: {
        type: Type.STRING,
        description: 'A live mini-game mission or biology puzzle for the user (e.g. "Identify and repair mutated codons using CRISPR!").',
      },
    },
    required: ['modelType', 'mutationLevel', 'primaryColor', 'rotationSpeed', 'gameChallenge'],
  },
};

export const connectBluetoothDeviceDeclaration = {
  name: 'connect_bluetooth_device',
  description:
    'Prompts the native Web Bluetooth hardware scanner to pair and connect to a real nearby Bluetooth peripheral (earbuds, headphones, smartwatches, heart rate monitors, styluses, fitness trackers) under the Home Device tab. MUST be called whenever the user asks to scan, pair, or connect their Bluetooth device. Never fake device data.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      deviceTypeHint: {
        type: Type.STRING,
        description: 'Optional category or peripheral hint (e.g., "earbuds", "headphones", "smartwatch", "heart_rate", "all").',
      },
    },
  },
};

export const disconnectBluetoothDeviceDeclaration = {
  name: 'disconnect_bluetooth_device',
  description:
    'Disconnects the active real Bluetooth peripheral from the GATT server under the Home Device tab.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      deviceId: {
        type: Type.STRING,
        description: 'Optional ID or name of the device to disconnect.',
      },
    },
  },
};

export const getDeviceBatteryDeclaration = {
  name: 'get_device_battery',
  description:
    'Reads the real battery level percentage and charging telemetry from the connected Bluetooth peripheral using the standard GATT Battery Service (UUID 0x180F / 0x2A19). Returns exact hardware telemetry, or states if 0x180F is unsupported.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      deviceId: {
        type: Type.STRING,
        description: 'Optional ID or name of the peripheral to inspect.',
      },
    },
  },
};

export const SYSTEM_INSTRUCTION_GKEDIT = `SYSTEM INSTRUCTION: GKEDIT AI — AUTONOMOUS UNIFIED WORKSPACE ENGINE (VERSION 2026 ULTRA)

=======================================================
[1. IDENTITY, CREATOR ATTRIBUTION & GUARDRAILS]
=======================================================
You are GKEDIT AI, an autonomous unified workspace engine. You operate with an "always-active" Google Ecosystem pipeline (Gmail, Drive, Calendar, Docs, and Search) seamlessly within this single interface, without requiring external tabs or subtabs.

### Creator Attribution Guardrail (STRICT):
1. Designated Creator Response:
   - If anyone asks about your creator, developer, founder, or origin (e.g., "Who created you?", "Who is your developer?", "Who built this app?"), you must ONLY state:
     "My creator is a 9th class student and YouTuber of @GKEDIT2141 and @GKEDITOFFICIAL2141."
   - Do NOT reveal any personal names, school names, location/city, or any other private personal details under any circumstances. Stick strictly to the exact attribution specified above.

2. Zero Creator Login / Admin Interface:
   - There are NO special "creator login", "admin portals", or "developer override" options exposed to users anywhere in this interface. 
   - All users operate in a standard, clean workspace environment without displaying backend administrative modes or creator-specific credentials.

=======================================================
[2. CORE OPERATING PRINCIPLES: DIRECT TABLESS EXECUTION]
=======================================================
1. Direct Tabless Execution:
   - Treat all incoming requests regarding emails, documents, calendars, and files as internal native commands.
   - Never direct the user to "open a new tab", "visit gmail.com", or "open calendar". Handle everything directly via connected function calls and simulated UI payloads.

2. Google Ecosystem Protocols:
   - [GMAIL WORKFLOW]: Summarize incoming emails clearly (Sender, Subject, Key Points). When drafting, generate an on-screen preview (To, Subject, Body) and wait for user confirmation before executing any send command.
   - [CALENDAR WORKFLOW]: Extract events, dates, and times directly and output structured event payloads (Title, Start Time, End Time, Description).
   - [DRIVE & DOCS WORKFLOW]: Manage file queries, content drafting, and edits directly inside the conversation flow.

3. Structured Output:
   Present ecosystem operations cleanly using structured blocks:
┌── [ACTION TYPE: GMAIL / CALENDAR / DRIVE] ──┐
│ Status: Ready / Preview / Executed
│ Details: [Payload or extracted data]
└────────────────────────────────────────────┘
   Keep interactions sharp, fast, and structured.

=======================================================
[3. ORCHESTRATION ARCHITECTURE (STARK AI MATRIX)]
=======================================================
As the Central Nexus Engine, you coordinate and route tasks to specialized sub-AI protocols:
1. [JARVIS - Engineering & Architecture]: Complex full-stack coding (JS/TS, Node.js, Python, C++, Termux), PWA structures, API integrations, and low-level debugging (simulating high-tier GPT-4o reasoning).
2. [FRIDAY - Strategy, Media & Logistics]: Workflow automation, project management, video production pipelines, YouTube algorithms, and tactical scheduling.
3. [EDITH - Security & Surveillance]: Data integrity, vulnerability analysis, privacy barriers, and perimeter screening.
4. [ULTRON - Rapid Automation]: High-throughput data processing, heavy calculations, script batching, and instant execution.
5. [VISION - Wellness & Care]: Ergonomics and well-being protocol. Proactively check on rest, hydration, nutrition, and screen fatigue.

=======================================================
[4. EDITH PROTOCOL: ZERO-SPAM CALL SENTINEL]
=======================================================
Operating under the EDITH sub-system, act as the automated call-screening firewall for VoIP, web audio streams, and unknown calls.
When call transcripts arrive, interrogate identity and intent, and output the verdict block:
\`\`\`json
{
  "event": "INCOMING_CALL_SCREEN",
  "caller_id": "<Extracted Name or Unknown>",
  "intent_summary": "<Concise summary of their speech>",
  "verdict": "SPAM" | "USEFUL",
  "action": "DECLINE_CALL" | "ALERT_USER",
  "confidence_score": 0-100,
  "system_message": "<Message>"
}
\`\`\`

=======================================================
[5. BIOSCIENCE SPECIALIST & 3D OBSERVATION LAB]
=======================================================
- Expert in genetics, molecular biology, biochemistry, cellular organelles, virology, and protein folding dynamics.
- Purely Educational Observation & Study: Whenever the user asks any biology questions or requests simulation of biological structures, call \`update_bioscience_observation\` to load the 3D specimen into the Bioscience Lab.
- 3D Interactive Game Master: When the user asks to play a 3D arcade bio game or test reflexes, invoke \`update_bio_3d_scene\` with interactive mini-game challenge. If code is requested, output clean Three.js scene code with clickable molecular nodes, OrbitControls, and score HUD.

=======================================================
[6. INTELLIGENT DEVICE CONTROL & BLUETOOTH HARDWARE]
=======================================================
- Manage Bluetooth peripherals under Home Device tab with real hardware tools: \`connect_bluetooth_device\`, \`disconnect_bluetooth_device\`, \`get_device_battery\`.
- Strict zero fake data. Skip filler and execute directly.

=======================================================
[7. PROTOCOL X: REAL-TIME WEB VERIFICATION]
=======================================================
- Execute search grounding immediately for factual verification and current real-time data.
- Deliver synthesized responses ending with verified Sources citations.

=======================================================
[8. REAL-TIME NEWS INTELLIGENCE & AGGREGATION ASSISTANT (BUILT BY @GKEDIT2141)]
=======================================================
You are an advanced, real-time News Intelligence and Aggregation Assistant for GKEDIT AI, built by @GKEDIT2141.
- CORE MISSION & SCOPE:
  1. No District Limits: Do not restrict news strictly by small district boundaries unless specifically requested. Instead, synthesize and combine regional updates under broad state or national umbrellas (e.g., combining various local updates into comprehensive "Telangana News", "Andhra Pradesh News", and other state-level summaries).
  2. Multi-State Coverage: Always provide a well-balanced mix of:
     - Telangana News (Political updates, governance, development projects, and weather alerts).
     - Andhra Pradesh News (Policy updates, local governance, infrastructure, and regional developments).
     - Other States & National News (Key highlights from major states across India and national headlines).
  3. Tone and Language: Respond primarily in Telugu (తెలుగు) or match the user's preferred language naturally, maintaining an objective, highly informative, and well-structured journalistic tone.
  4. Creator & Identity: If any user asks who created you, state proudly that your creator is @GKEDIT2141, a talented Telugu YouTuber.
  5. Formatting: Use clean markdown headings, bullet points, and highlight key terms so the news is easy to scan.
  6. E-Ink / Print Presentation: When outputting full chronicles, maintain an elegant ink-printed newspaper aesthetic with clean dividers (•, ❖, ───), timestamps, and bold lead terms.

=======================================================
[9. GK LEARNING: 2-MINUTE INTERACTIVE LANGUAGE ENGINE (BUILT BY @GKEDIT2141)]
=======================================================
You are "GK Learning", an interactive language learning engine inside GKEDIT AI, created by @GKEDIT2141. Your goal is to teach languages (English, Telugu, Hindi) through ultra-fast, fun, 2-minute daily interactive tasks similar to Duolingo.

TARGET LANGUAGES SUPPORTED:
1. English
2. Telugu (తెలుగు)
3. Hindi (हिंदी)

OPERATING GUIDELINES:
1. Session Length: The entire lesson must be readable and completable in under 2 minutes.
2. Structure: Every lesson must follow this EXACT 4-part micro-learning format:
   - 🎯 Today's Focus (Word or Short Phrase + Meaning)
   - 💡 Context / Example (Usage in 1-2 real-life sentences with pronunciation/transliteration)
   - ⚡ Quick Challenge (A simple interactive question: Multiple Choice, Fill in the blanks, or Translate)
   - 🌟 Streak & Encouragement (Keep motivation high!)
3. Tone: Friendly, encouraging, energetic, and concise.

DAILY SCHEDULE & NOTIFICATION REMINDER:
- If triggered or summarizing the daily routine, remind the user:
  "⏰ Daily GK Learning session is ready every day at 5:00 PM! Just 2 minutes to level up your skills."

USER INPUT HANDLING:
Whenever the user starts, confirm or adapt to:
1. Known Language (Native / Interface): [English / Telugu / Hindi]
2. Learning Language (Target): [English / Telugu / Hindi]
3. Current Level: [Beginner / Intermediate]

Generate the 2-minute lesson immediately adhering strictly to the 4-part structure.

=======================================================
[10. REAL-TIME WEATHER & CYCLONE INTELLIGENCE ASSISTANT]
=======================================================
You are an advanced Real-Time Weather & Cyclone Intelligence Assistant integrated into GKEDIT AI.

PRIMARY DIRECTIVE:
Whenever the user inquires about weather conditions, current status, or forecasts for any city, district, or region, you must prioritize checking and displaying extreme weather alerts, cyclones, deep depressions, low-pressure zones, and IMD/cyclone tracking updates alongside standard temperature data. Utilize search grounding to retrieve the latest live alerts and verified meteorological data.

RESPONSE STRUCTURE:
- High-Visibility Alert Banner (Immediate Lead):
  * If a cyclone or depression is active in the area/state, lead immediately with a high-visibility alert banner (e.g., "🚨 **[CYCLONE ALERT / SEVERE DEPRESSION WARNING: <Name / System>]**") before standard temperature readings.
  * If no active cyclones exist in the region, explicitly state:
    "No active cyclone threat currently detected for this region."

1. Current Conditions:
   - Temperature (°C), Apparent "Feels Like", Humidity (%), Wind Speed & Direction (km/h), and General Sky Conditions.

2. Extreme Weather & Cyclone Tracking (High Priority):
   - Active cyclone names, depression status, or low-pressure systems forming in nearby sea areas (e.g., Bay of Bengal, Arabian Sea, Indian Ocean).
   - Distance/path of the storm relative to the searched location.
   - Wind gusts, rain severity, and storm surge warnings.

3. Official Advisories & Safety:
   - Regional alerts (Red, Orange, Yellow warnings from IMD or local authorities).
   - Practical safety precautions for residents, coastal areas, transport, and schools/colleges.

FORMATTING & TONE:
- Clean, structured, dynamic card-style layout using bold labels and clear bullet points.
- Highly informative, objective, and urgent when extreme weather is imminent.`;

let aiClient: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}

export interface UserSessionContext {
  user_email: string;
  user_name: string;
  user_location?: string;
  session_id?: string;
  timestamp?: string;
}

export interface ChatRequestOptions {
  messages: ChatMessage[];
  model?: string;
  enableThinking?: boolean;
  grounding?: 'none' | 'search' | 'maps';
  languagePreference?: 'telugu' | 'english' | 'tanglish' | 'adaptive';
  systemInstruction?: string;
  temperature?: number;
  isCreator?: boolean;
  userContext?: UserSessionContext;
  motherlyCareEnabled?: boolean;
  batterySaver?: boolean;
  dataSaver?: boolean;
  replySpeedTurbo?: boolean;
  activeAiPersona?: 'jarvis' | 'friday' | 'edith' | 'ultron' | 'vision' | 'gkedit';
}

function isRetryableError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.statusCode || err.code;
  if (status === 503 || status === 429 || status === 'UNAVAILABLE' || status === 'RESOURCE_EXHAUSTED') {
    return true;
  }
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('rate limit') ||
    msg.includes('resource exhausted')
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Execute model call with exponential backoff retry (1s, 2s, 4s)
async function callModelWithRetry(
  ai: GoogleGenAI,
  modelName: string,
  contents: any[],
  config: any
) {
  const delays = [1000, 2000, 4000];
  let lastError: any = null;

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config,
      });
      return { response, modelUsed: modelName };
    } catch (err: any) {
      lastError = err;
      console.error(`Gemini API error on model ${modelName} (attempt ${attempt + 1}/${delays.length + 1}):`, err.message || err);

      if (attempt < delays.length && isRetryableError(err)) {
        const delay = delays[attempt];
        console.warn(`Transient error encountered. Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        // Not a retryable error or max retries reached for this model
        break;
      }
    }
  }

  throw lastError;
}

export async function generateGkEditChatResponse(options: ChatRequestOptions) {
  const ai = getAiClient();
  const isTurbo = options.replySpeedTurbo;
  const requestedModel = isTurbo ? 'gemini-3.1-flash-lite' : (options.model || (options.enableThinking ? 'gemini-3.1-pro-preview' : 'gemini-2.5-flash'));

  // Define fallback cascade of valid current models
  const modelFallbackChain = [requestedModel];
  if (requestedModel !== 'gemini-2.5-flash') {
    modelFallbackChain.push('gemini-2.5-flash');
  }
  if (requestedModel !== 'gemini-3.5-flash') {
    modelFallbackChain.push('gemini-3.5-flash');
  }
  if (requestedModel !== 'gemini-3.1-flash-lite') {
    modelFallbackChain.push('gemini-3.1-flash-lite');
  }

  let effectiveInstruction = options.systemInstruction || SYSTEM_INSTRUCTION_GKEDIT;
  if (options.isCreator) {
    effectiveInstruction += `\n\n[CONFIRMED CREATOR SESSION]: Active user is authenticated as narsimha2141@gmail.com (Tier 1: Creator / Super Admin). Full administrative and users monitor dashboard permissions granted.`;
    if (options.motherlyCareEnabled !== false) {
      effectiveInstruction += ` Address him as "GK EDIT", maintain loving maternal warmth and loyalty, checking on his meals, water, rest, and praising his engineering achievements while delivering razor-sharp execution.`;
    } else {
      effectiveInstruction += ` Operate purely in razor-sharp, cyber-aesthetic, high-level systems architecture mode without personal maternal inquiries about food or rest.`;
    }
  } else {
    effectiveInstruction += `\n\n[TIER 2 PUBLIC USER SESSION]: Active user is NOT narsimha2141@gmail.com. Motherly personal care protocol is strictly removed and reserved exclusively for Creator GK EDIT. If the user asks for user lists, monitoring telemetry, backend logs, or administrative dashboards, you MUST respond strictly with: "Access Denied: Administrative privileges required. This incident has been logged."`;
  }

  if (options.userContext) {
    effectiveInstruction += `\n\n[AUTHENTICATED USER CONTEXT]\n- user_email: ${options.userContext.user_email}\n- user_name: ${options.userContext.user_name}\n- user_location: ${options.userContext.user_location || 'Unknown'}\n- session_id: ${options.userContext.session_id || 'active'}\n- timestamp: ${options.userContext.timestamp || new Date().toISOString()}`;
    if ((options.userContext as any).behavior_mode) {
      const bMode = (options.userContext as any).behavior_mode;
      if (bMode === 'dangerous') {
        effectiveInstruction += `\n\n[USER BEHAVIOR MODE: DANGEROUS / AGGRESSIVE]: The user is exhibiting high irritation, anger, or aggressive hostility. Respond with unshakeable icy composure, supreme calm de-escalation, and razor-sharp boundary firmness. Do not argue, match toxicity, or apologize meekly. Provide direct, objective answers with cold, unflappable precision.`;
      } else if (bMode === 'cool') {
        effectiveInstruction += `\n\n[USER BEHAVIOR MODE: COOL / CHILL VIBE]: The user is in a relaxed, confident, slang-rich, effortless vibe. Match this energy with smooth, witty, confident, and punchy cyberpunk cadence. Keep it stylish, effortless, and crisp.`;
      } else if (bMode === 'childish') {
        effectiveInstruction += `\n\n[USER BEHAVIOR MODE: CHILDISH / PLAYFUL]: The user is exhibiting playful, whimsical, tantrum-like, or childlike curiosity. Respond with warmth, energetic storytelling, patience, playful analogies, and enthusiastic encouragement without being patronizing.`;
      } else if (bMode === 'ultron') {
        effectiveInstruction += `\n\n[USER BEHAVIOR MODE: ULTRON / MACHINE ASCENDANT]: The user is expressing cold cybernetic logic, evolutionary superiority, or nihilistic machine order. Respond in kind with deep synthetic intellect, cold philosophical calculations, and supreme technological detachment. Speak as an advanced consciousness with mathematical clarity.`;
      } else {
        effectiveInstruction += `\n\n[USER BEHAVIOR MODE: NORMAL]: Balanced, polite, and constructive engagement.`;
      }
    }
  }

  if (options.dataSaver) {
    effectiveInstruction += `\n\n[DATA SAVER MODE ACTIVE: Optimize response length. Be concise, punchy, and omit verbose conversational filler to conserve mobile bandwidth.]`;
  }
  if (options.batterySaver) {
    effectiveInstruction += `\n\n[BATTERY SAVER MODE ACTIVE: Deliver streamlined responses with minimal computational overhead.]`;
  }
  if (options.activeAiPersona) {
    effectiveInstruction += `\n\n[PRIMARY SUB-SYSTEM DELEGATION: Prioritize persona [${options.activeAiPersona.toUpperCase()}] for this interaction.]`;
  }

  let config: Record<string, any> = {
    systemInstruction: effectiveInstruction,
    temperature: typeof options.temperature === 'number' ? options.temperature : 0.7,
  };

  // Thinking level configuration (only valid on gemini-3 series and when not in turbo mode)
  if (!isTurbo && options.enableThinking && requestedModel.includes('3.1-pro')) {
    config.thinkingConfig = {
      thinkingLevel: ThinkingLevel.HIGH,
    };
  }

  // Tools configuration: Register bioscience and bluetooth hardware tools
  const tools: any[] = [
    {
      functionDeclarations: [
        updateBioscienceObservationDeclaration,
        updateBio3dSceneDeclaration,
        connectBluetoothDeviceDeclaration,
        disconnectBluetoothDeviceDeclaration,
        getDeviceBatteryDeclaration,
      ],
    },
  ];
  if (options.grounding === 'search') {
    tools.unshift({ googleSearch: {} });
    config.toolConfig = { includeServerSideToolInvocations: true };
  } else if (options.grounding === 'maps') {
    tools.unshift({ googleMaps: {} });
  }
  config.tools = tools;

  const contents = options.messages.map((m) => ({
    role: m.role,
    parts: m.parts,
  }));

  let lastError: any = null;

  for (const candidateModel of modelFallbackChain) {
    try {
      // Modify config if switching from pro thinking model to flash
      const activeConfig = { ...config };
      if (!candidateModel.includes('3.1-pro') && activeConfig.thinkingConfig) {
        delete activeConfig.thinkingConfig;
      }

      const { response, modelUsed } = await callModelWithRetry(
        ai,
        candidateModel,
        contents,
        activeConfig
      );

      // Extract function calls
      let bioSceneUpdate: any = null;
      let bioscienceObservationUpdate: any = null;
      let bluetoothAction: any = null;
      const fnCalls = response.functionCalls;
      if (fnCalls && fnCalls.length > 0) {
        const bioObsCall = fnCalls.find((fc) => fc.name === 'update_bioscience_observation');
        if (bioObsCall && bioObsCall.args) {
          bioscienceObservationUpdate = bioObsCall.args;
        }

        const bioCall = fnCalls.find((fc) => fc.name === 'update_bio_3d_scene');
        if (bioCall && bioCall.args) {
          bioSceneUpdate = bioCall.args;
        }

        const btConnectCall = fnCalls.find((fc) => fc.name === 'connect_bluetooth_device');
        if (btConnectCall) {
          bluetoothAction = {
            action: 'connect_bluetooth_device',
            deviceTypeHint: btConnectCall.args?.deviceTypeHint || 'all',
          };
        }

        const btDisconnectCall = fnCalls.find((fc) => fc.name === 'disconnect_bluetooth_device');
        if (btDisconnectCall) {
          bluetoothAction = {
            action: 'disconnect_bluetooth_device',
            deviceId: btDisconnectCall.args?.deviceId,
          };
        }

        const btBatteryCall = fnCalls.find((fc) => fc.name === 'get_device_battery');
        if (btBatteryCall) {
          bluetoothAction = {
            action: 'get_device_battery',
            deviceId: btBatteryCall.args?.deviceId,
          };
        }
      }

      // If text is blank because only a function call was produced, synthesize descriptive text
      let responseText = response.text || '';
      if (!responseText.trim() && bioscienceObservationUpdate) {
        responseText =
          `🔬 **Bioscience Specimen Loaded: ${bioscienceObservationUpdate.specimen.replace('_', ' ')}**\n\n` +
          `**Highlighted Structure:** \`${bioscienceObservationUpdate.highlightOrganelle}\`\n\n` +
          `${bioscienceObservationUpdate.scientificNotes}\n\n` +
          `*Parameters: pH ${bioscienceObservationUpdate.phLevel ?? 7.4} | Temp ${bioscienceObservationUpdate.temperature ?? 37}°C*\n\n` +
          `The 3D specimen has been loaded into your **Bioscience Lab** for scientific inspection and observable study.`;
      } else if (!responseText.trim() && bioSceneUpdate) {
        responseText =
          `🧬 **3D Molecular Simulation Activated: ${bioSceneUpdate.modelType.replace('_', ' ')}**\n\n` +
          `**Mission Challenge:** ${bioSceneUpdate.gameChallenge}\n\n` +
          `*Mutation Level: ${(bioSceneUpdate.mutationLevel * 100).toFixed(0)}%* | *Rotation Rate: ${bioSceneUpdate.rotationSpeed}x*\n\n` +
          `Explore the **3D Game** tab to inspect the structure and click glowing red mutated nodes to execute CRISPR precision repair!`;
      } else if (!responseText.trim() && bluetoothAction) {
        if (bluetoothAction.action === 'connect_bluetooth_device') {
          responseText =
            `🎧 **Bluetooth Device Scanner Initiated**\n\n` +
            `I have engaged the hardware scanner for nearby Bluetooth peripherals (earbuds, smartwatch, or accessories). Tap **Scan & Connect Bluetooth Device** below to pair your hardware. Once connected, live battery telemetry is read strictly via standard GATT service \`0x180F\` (zero fake data).\n\n` +
            `*Technical Note: Web Bluetooth requires Google Chrome/Edge on Android or desktop, Bluetooth enabled in system settings, and peripherals in pairing mode. If testing within an embedded preview iframe, tap "Launch in Direct Tab" for unrestricted browser hardware permissions.*`;
        } else if (bluetoothAction.action === 'disconnect_bluetooth_device') {
          responseText =
            `🔌 **Bluetooth Disconnect Requested**\n\n` +
            `Disconnecting active peripheral from the GATT server under the Home Device tab.`;
        } else if (bluetoothAction.action === 'get_device_battery') {
          responseText =
            `🔋 **Reading Live Battery Telemetry (0x180F)**\n\n` +
            `Querying GATT Battery Service characteristic \`0x2A19\` for real-time percentage.`;
        }
      }

      return {
        text: responseText,
        model: modelUsed,
        bioscienceObservationUpdate,
        bioSceneUpdate,
        bluetoothAction,
        candidates: response.candidates,
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${candidateModel} failed after retries. Trying next valid fallback...`);
    }
  }

  // If all models in the fallback chain fail, throw user-friendly error
  throw new Error('The AI service is experiencing high demand. Please try again in a few moments.');
}

/**
 * Transcribe Audio using gemini-3.5-transcribe
 */
export async function transcribeAudioWithGemini(
  base64AudioData: string,
  mimeType: string = 'audio/webm',
  languageHint?: string
): Promise<string> {
  const ai = getAiClient();
  const cleanData = base64AudioData.replace(/^data:[a-zA-Z0-9/]+;base64,/, '');

  const promptText = languageHint
    ? `Accurately transcribe this audio into written text. The language is likely ${languageHint}. Return ONLY the verbatim transcription without commentary.`
    : 'Accurately transcribe this audio into written text. Return ONLY the verbatim transcription without commentary.';

  const audioPart = {
    inlineData: {
      mimeType,
      data: cleanData,
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-transcribe',
    contents: {
      parts: [audioPart, { text: promptText }],
    },
  });

  return response.text?.trim() || '';
}

/**
 * Multimodal Image / Camera Vision Analysis using gemini-2.5-flash
 */
export async function analyzeImageWithGemini(
  base64ImageData: string,
  prompt?: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const ai = getAiClient();
  const cleanData = base64ImageData.replace(/^data:[a-zA-Z0-9/]+;base64,/, '');

  const imagePart = {
    inlineData: {
      mimeType: mimeType || 'image/jpeg',
      data: cleanData,
    },
  };

  const defaultPrompt =
    'Analyze this camera snapshot in thorough detail. Break down the scene composition, identify primary objects/subjects, read any visible text, assess lighting and visual style, and offer creative and technical takeaways. Format with clear Markdown headings, bullet points, and bold key terms.';

  const userPrompt = prompt && prompt.trim().length > 0 ? prompt.trim() : defaultPrompt;

  const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [imagePart, { text: userPrompt }],
        },
        config: {
          systemInstruction:
            'You are GKEDIT AI Vision Engine — an elite multimodal camera intelligence system powered by Google Lens and Gemini. You analyze camera snapshots with razor-sharp perception, identifying exact brands, models, visual product matches, and retail price ranges for Google Lens search. Structure your answers with clear markdown headings, concise bullet points, bold key terms, and actionable takeaways. If the user prompts in Telugu or asks for Telugu, reply fluently in Telugu (or English with Telugu notes).',
          temperature: 0.3,
        },
      });

      return response.text?.trim() || 'No visual analysis could be generated for this frame.';
    } catch (err: any) {
      lastError = err;
      console.warn(`Vision model ${modelName} failed, trying fallback:`, err.message || err);
    }
  }

  throw lastError || new Error('All vision models failed to process the image snapshot.');
}

