/**
 * _llm-client.js — CoreAdapt Multi-LLM Failover Engine
 *
 * Priority chain: DeepSeek-chat → Claude (Anthropic) → GPT-4o-mini (OpenAI)
 * If the active provider fails (network, timeout, 5xx), the next is tried automatically.
 *
 * Claude calls use the Anthropic Messages API directly via fetch (no extra SDK needed).
 * All providers return a uniform { content: string, provider: string } response.
 */

const DEEPSEEK_TIMEOUT_MS = 22_000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`LLM timeout after ${ms}ms`)), ms)
    ),
  ]);
}

// ── DeepSeek (via openai-compatible SDK) ────────────────────────────────────
async function callDeepSeek(messages, jsonMode) {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  });
  const opts = {
    model: 'deepseek-chat',
    messages,
    temperature: 0.6,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
  };
  const r = await withTimeout(client.chat.completions.create(opts), DEEPSEEK_TIMEOUT_MS);
  return r.choices[0].message.content;
}

// ── Claude (Anthropic Messages API via fetch) ────────────────────────────────
async function callClaude(messages, jsonMode) {
  const systemMsg = messages.find((m) => m.role === 'system');
  const humanMsgs = messages.filter((m) => m.role !== 'system');

  const systemContent =
    (systemMsg?.content || '') +
    (jsonMode ? '\n\nIMPORTANT: Respond ONLY with valid JSON — no markdown fences, no extra text.' : '');

  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: systemContent,
    messages:
      humanMsgs.length > 0
        ? humanMsgs
        : [{ role: 'user', content: 'Execute per system instructions.' }],
  };

  const r = await withTimeout(
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    }),
    DEEPSEEK_TIMEOUT_MS
  );

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Claude ${r.status}: ${text.slice(0, 200)}`);
  }
  const data = await r.json();
  return data.content[0].text;
}

// ── OpenAI GPT-4o-mini (last resort) ────────────────────────────────────────
async function callOpenAI(messages, jsonMode) {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const opts = {
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.6,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
  };
  const r = await client.chat.completions.create(opts);
  return r.choices[0].message.content;
}

/**
 * Unified LLM completion with automatic failover.
 *
 * @param {Array<{role:string, content:string}>} messages  OpenAI-style messages
 * @param {{ jsonMode?: boolean, skipTo?: 'claude'|'openai' }} opts
 *   skipTo: jump directly to a provider (avoids repeated timeouts when DeepSeek is known down)
 * @returns {Promise<{ content: string, provider: 'deepseek'|'claude'|'openai' }>}
 */
export async function llmComplete(messages, { jsonMode = false, skipTo = null } = {}) {
  // 1. DeepSeek (skipped if caller already knows it's down this session)
  if (!skipTo && process.env.DEEPSEEK_API_KEY) {
    try {
      const content = await callDeepSeek(messages, jsonMode);
      return { content, provider: 'deepseek' };
    } catch (e) {
      console.warn('[LLM Failover] DeepSeek →', e.message);
    }
  }

  // 2. Claude — Anthropic
  if (skipTo !== 'openai' && process.env.ANTHROPIC_API_KEY) {
    try {
      const content = await callClaude(messages, jsonMode);
      return { content, provider: 'claude' };
    } catch (e) {
      console.warn('[LLM Failover] Claude →', e.message);
    }
  }

  // 3. OpenAI GPT-4o-mini
  if (process.env.OPENAI_API_KEY) {
    try {
      const content = await callOpenAI(messages, jsonMode);
      return { content, provider: 'openai' };
    } catch (e) {
      throw new Error('[LLM] All providers failed. Last error: ' + e.message);
    }
  }

  throw new Error('[LLM] No API key configured. Set DEEPSEEK_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.');
}
