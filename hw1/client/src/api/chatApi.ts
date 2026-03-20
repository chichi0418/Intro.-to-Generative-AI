import type { Message, Settings } from '../types';
import { PRESET_INSTRUCTIONS } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function sendChatStream(
  messages: Message[],
  settings: Settings,
  onDelta: (delta: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      }),
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') { onDone(); return; }
    onError(String(err));
    return;
  }

  if (!res.ok) {
    onError(`HTTP error ${res.status}`);
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
          if (parsed.error) { onError(parsed.error); return; }
          if (parsed.delta) onDelta(parsed.delta);
        } catch {
          // ignore malformed lines
        }
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') { onDone(); return; }
    onError(String(err));
    return;
  }

  onDone();
}
