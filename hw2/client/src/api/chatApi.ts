import type { Message, Settings } from '../types';
import { PRESET_INSTRUCTIONS } from '../types';
import { authHeaders } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const CLIENT_ID_KEY = 'chatClientId';

export function getClientId() {
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;
  const created = `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(CLIENT_ID_KEY, created);
  return created;
}

export interface ChatApiError {
  message: string;
  code?: string;
}

export async function sendChatStream(
  messages: Message[],
  settings: Settings,
  onDelta: (delta: string) => void,
  onDone: () => void,
  onError: (err: ChatApiError) => void,
  signal?: AbortSignal,
  onRouting?: (meta: { routedModel: string; reason: string }) => void,
  onToolCall?: (call: { name: string; args: Record<string, unknown> }) => void,
  onToolResult?: (result: { name: string; result: unknown }) => void,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      signal,
      body: JSON.stringify({
        model: settings.model,
        messages,
        systemPrompt: (
          settings.systemInstructions?.find(i => i.id === settings.activeSystemInstructionId) ??
          PRESET_INSTRUCTIONS.find(i => i.id === settings.activeSystemInstructionId)
        )?.content ?? '',
        temperature: settings.temperature,
        topP: settings.topP,
        maxTokens: settings.maxTokens,
        apiKeys: settings.apiKeys,
        clientId: getClientId(),
        autoRoute: settings.autoRoute,
        enableTools: settings.enableTools,
      }),
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') { onDone(); return; }
    onError({ message: String(err) });
    return;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    onError({
      message: body.error ?? `HTTP error ${res.status}`,
      code: body.code,
    });
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') { onDone(); return; }
        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) { onError({ message: parsed.error, code: parsed.code }); return; }
          if (parsed.routing) { onRouting?.(parsed.routing); continue; }
          if (parsed.toolCall) { onToolCall?.(parsed.toolCall); continue; }
          if (parsed.toolResult) { onToolResult?.(parsed.toolResult); continue; }
          if (parsed.delta) onDelta(parsed.delta);
        } catch {
          // ignore malformed lines
        }
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') { onDone(); return; }
    onError({ message: String(err) });
    return;
  }

  onDone();
}
