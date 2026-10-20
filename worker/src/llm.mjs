// Every text-model call goes through chat(): DeepSeek on OpenRouter first, Workers AI only when it is unavailable.
export const AI_MODEL = 'deepseek/deepseek-v4.1-flash-1017';
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

export function aiConfigured(env) {
  return Boolean(env && (env.OPENROUTER_API_KEY || (env.AI && typeof env.AI.run === 'function')));
}

// Workers AI takes a bare JSON schema; OpenRouter expects {name, strict, schema}.
function openRouterFormat(format) {
  if (!format || format.type !== 'json_schema') return format;
  const spec = format.json_schema || {};
  return {type: 'json_schema', json_schema: spec.name && spec.schema ? spec : {name: 'response', strict: false, schema: spec}};
}

// When no provider accepts the schema, ask for plain JSON and spell the schema out in the instructions.
function jsonObjectRequest(body) {
  const note = '\nReturn only one JSON object that matches this JSON Schema: ' + JSON.stringify(body.response_format.json_schema.schema);
  const messages = body.messages[0]?.role === 'system'
    ? [{...body.messages[0], content: body.messages[0].content + note}, ...body.messages.slice(1)]
    : [{role: 'system', content: note.trim()}, ...body.messages];
  const {provider, ...rest} = body;
  return {...rest, messages, response_format: {type: 'json_object'}};
}

async function callOpenRouter(env, body, timeoutMs, signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, {once: true});
  try {
    const fetcher = typeof env.OPENROUTER_FETCH === 'function' ? env.OPENROUTER_FETCH : fetch;
    const response = await fetcher(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://gemerpc.github.io/readfox/',
        'X-Title': 'ReadFox'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.error) {
      const error = new Error('OpenRouter request failed');
      error.status = response.ok ? Number(data?.error?.code) || 502 : response.status;
      error.code = 'openrouter-request';
      error.detail = String(data?.error?.message || '').slice(0, 300);
      throw error;
    }
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      const error = new Error('OpenRouter returned an empty response');
      error.status = 502;
      error.code = 'openrouter-empty';
      throw error;
    }
    return {...data, model: data.model || AI_MODEL, source: 'openrouter-ai'};
  } catch (cause) {
    if (typeof cause?.code === 'string' && cause.code.startsWith('openrouter')) throw cause;
    const timedOut = cause?.name === 'AbortError';
    const error = new Error(timedOut ? (signal?.aborted ? 'request-aborted' : 'OpenRouter request timed out') : 'OpenRouter request failed');
    error.status = timedOut ? 504 : 502;
    error.code = timedOut ? 'openrouter-timeout' : 'openrouter-network';
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

async function callWorkersAI(env, request, model) {
  if (!env.AI || typeof env.AI.run !== 'function') {
    const error = new Error('No AI provider is configured');
    error.status = 503;
    error.code = 'ai-not-configured';
    throw error;
  }
  try {
    const result = await env.AI.run(model, {...request, stream: false});
    return result && typeof result === 'object'
      ? {...result, model: result.model || model, source: 'cloudflare-workers-ai'}
      : {response: result, model, source: 'cloudflare-workers-ai'};
  } catch (cause) {
    console.error('Cloudflare Workers AI request failed', cause);
    // Keep the provider's message: callers look for "429", "quota" or "daily limit" in it.
    const error = new Error(String(cause?.message || cause || 'Cloudflare Workers AI request failed'));
    error.status = Number(cause?.status || cause?.statusCode) || (/\b429\b|quota|daily limit|rate limit/i.test(error.message) ? 429 : null);
    error.code = 'workers-ai-request';
    throw error;
  }
}

/**
 * Runs a chat request written in the Workers AI shape ({messages, max_tokens, temperature, response_format, ...}).
 * Without fallbackModel an OpenRouter failure is thrown instead of retried on Workers AI.
 */
export async function chat(env, request, {fallbackModel = '', timeoutMs = 60000, signal} = {}) {
  if (env.OPENROUTER_API_KEY) {
    const {messages, temperature, top_p, repetition_penalty} = request;
    const maxTokens = request.max_tokens ?? request.max_completion_tokens;
    const body = {
      model: AI_MODEL,
      messages,
      ...(maxTokens ? {max_tokens: maxTokens} : {}),
      ...(temperature !== undefined ? {temperature} : {}),
      ...(top_p !== undefined ? {top_p} : {}),
      ...(repetition_penalty !== undefined ? {repetition_penalty} : {}),
      reasoning: {enabled: false}
    };
    const format = openRouterFormat(request.response_format);
    if (format) {
      body.response_format = format;
      // Route schema requests only to providers that enforce structured output.
      if (format.type === 'json_schema') body.provider = {require_parameters: true};
    }
    let failure;
    try {
      return await callOpenRouter(env, body, timeoutMs, signal);
    } catch (error) {
      failure = error;
    }
    if (failure.message !== 'request-aborted' && format?.type === 'json_schema' && [400, 404].includes(failure.status)) {
      try {
        return await callOpenRouter(env, jsonObjectRequest(body), timeoutMs, signal);
      } catch (error) {
        failure = error;
      }
    }
    console.warn('ReadFox OpenRouter request failed', {status: failure.status, code: failure.code, detail: failure.detail, fallback: fallbackModel || null});
    if (!fallbackModel || failure.message === 'request-aborted') throw failure;
  } else if (!fallbackModel) {
    const error = new Error('OpenRouter API key is not configured');
    error.status = 503;
    error.code = 'openrouter-key';
    throw error;
  }
  return callWorkersAI(env, request, fallbackModel);
}
