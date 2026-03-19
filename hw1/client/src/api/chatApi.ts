import type { Message, Settings } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function sendChatStream(
  messages: Message[],
  settings: Settings,
  onDelta: (delta: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: settings.model,
      messages,
      systemPrompt: settings.systemPrompt,
      temperature: settings.temperature,
      topP: settings.topP,
      maxTokens: settings.maxTokens,
    }),
  });

  if (!res.ok) {
    onError(`HTTP error ${res.status}`);
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') {
        onDone();
        return;
      }
      try {
        const parsed = JSON.parse(payload);
        if (parsed.error) {
          onError(parsed.error);
          return;
        }
        if (parsed.delta) {
          onDelta(parsed.delta);
        }
      } catch {
        // ignore malformed lines
      }
    }
  }

  onDone();
}
