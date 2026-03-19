import { useState, useCallback } from 'react';
import type { Message, Settings } from '../types';
import { sendChatStream } from '../api/chatApi';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, settings: Settings) => {
    if (isStreaming) return;
    setError(null);

    const userMessage: Message = { role: 'user', content };
    const assistantMessage: Message = { role: 'assistant', content: '' };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);

    await sendChatStream(
      [...messages, userMessage],
      settings,
      (delta) => {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = { ...last, content: last.content + delta };
          return updated;
        });
      },
      () => setIsStreaming(false),
      (err) => {
        setError(err);
        setIsStreaming(false);
      },
    );
  }, [isStreaming, messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isStreaming, error, sendMessage, clearMessages };
}
