import { env } from '../../config/env';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatJsonOptions {
  model?: string;
  temperature?: number;
  timeoutMs?: number;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export function isMetaAiEnabled(): boolean {
  return Boolean(env.ai.apiKey && env.ai.model);
}

function parseJsonContent<T>(content: string): T {
  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

async function postChatCompletionContent(
  model: string,
  messages: unknown,
  options?: ChatJsonOptions & { jsonMode?: boolean },
): Promise<string> {
  if (!env.ai.apiKey || !model) {
    throw new Error('Meta AI is not configured');
  }

  const timeoutMs = options?.timeoutMs ?? env.ai.timeoutMs;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${env.ai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.ai.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.2,
        ...(options?.jsonMode === false ? {} : { response_format: { type: 'json_object' } }),
      }),
      signal: controller.signal,
    });

    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(`Meta AI request failed (${response.status}): ${rawText.slice(0, 500)}`);
    }

    let parsed: ChatCompletionResponse;
    try {
      parsed = JSON.parse(rawText) as ChatCompletionResponse;
    } catch {
      throw new Error('Meta AI returned invalid JSON');
    }

    const content = parsed.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Meta AI returned an empty response');
    }

    return content;
  } finally {
    clearTimeout(timer);
  }
}

async function postChatCompletion<T>(
  model: string,
  messages: unknown,
  options?: ChatJsonOptions,
): Promise<T> {
  const content = await postChatCompletionContent(model, messages, options);
  return parseJsonContent<T>(content);
}

export async function chatJson<T>(messages: ChatMessage[], opts?: ChatJsonOptions): Promise<T> {
  if (!isMetaAiEnabled()) {
    throw new Error('Meta AI is not configured');
  }
  return postChatCompletion<T>(opts?.model || env.ai.model, messages, opts);
}

export async function chatText(
  system: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
): Promise<string> {
  if (!isMetaAiEnabled()) {
    throw new Error('Meta AI is not configured');
  }
  return postChatCompletionContent(
    env.ai.model,
    [{ role: 'system', content: system }, ...messages],
    { temperature: 0.3, jsonMode: false },
  );
}

export async function chatVisionJson<T>(
  prompt: string,
  imageBase64: string,
  mimeType: string,
): Promise<T> {
  if (!env.ai.apiKey || !env.ai.visionModel) {
    throw new Error('Meta AI vision is not configured');
  }

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        {
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${imageBase64}` },
        },
      ],
    },
  ];

  return postChatCompletion<T>(env.ai.visionModel, messages);
}
