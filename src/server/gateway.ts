// ============================================================================
// NEXUS ENGINE — EXTERNAL MULTI-MODEL API GATEWAY (OPENAI & SARVAM AI)
// ============================================================================

export interface GatewayConfig {
  openAiApiKey?: string;
  sarvamApiKey?: string;
}

// Runtime key cache (can be populated via process.env or secure creator gateway)
let runtimeOpenAiKey: string = process.env.OPENAI_API_KEY || '';
let runtimeSarvamKey: string = process.env.SARVAM_API_KEY || '';

export function setGatewayKeys(keys: { openAiApiKey?: string; sarvamApiKey?: string }) {
  if (typeof keys.openAiApiKey === 'string') {
    runtimeOpenAiKey = keys.openAiApiKey.trim();
  }
  if (typeof keys.sarvamApiKey === 'string') {
    runtimeSarvamKey = keys.sarvamApiKey.trim();
  }
}

export function getGatewayStatus() {
  return {
    openAiConfigured: Boolean(runtimeOpenAiKey || process.env.OPENAI_API_KEY),
    sarvamConfigured: Boolean(runtimeSarvamKey || process.env.SARVAM_API_KEY),
    geminiActive: Boolean(process.env.GEMINI_API_KEY),
  };
}

export function getOpenAiKey(): string {
  return runtimeOpenAiKey || process.env.OPENAI_API_KEY || '';
}

export function getSarvamKey(): string {
  return runtimeSarvamKey || process.env.SARVAM_API_KEY || '';
}

/**
 * Route request to OpenAI GPT-4o / ChatGPT API
 */
export async function callOpenAiChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  model: string = 'gpt-4o',
  temperature: number = 0.7
): Promise<{ text: string; modelUsed: string }> {
  const apiKey = getOpenAiKey();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured in Nexus Engine gateway.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as any;
  const reply = data.choices?.[0]?.message?.content || '';
  return {
    text: reply,
    modelUsed: `OpenAI ${model}`,
  };
}

/**
 * Route request to Sarvam AI API for Telugu & Indic processing
 */
export async function callSarvamChat(
  prompt: string,
  systemPrompt?: string
): Promise<{ text: string; modelUsed: string }> {
  const apiKey = getSarvamKey();
  if (!apiKey) {
    throw new Error('SARVAM_API_KEY not configured in Nexus Engine gateway.');
  }

  // Attempt Sarvam completions / chat endpoint
  const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'sarvam-2b',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Sarvam AI API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as any;
  const reply = data.choices?.[0]?.message?.content || '';
  return {
    text: reply,
    modelUsed: 'Sarvam AI (sarvam-2b Indic)',
  };
}
