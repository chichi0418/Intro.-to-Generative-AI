import { useState, useCallback, useRef } from 'react';
import type { Message, Settings } from '../types';
import { sendChatStream } from '../api/chatApi';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string, settings: Settings) => {
    if (isStreaming) return;
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;
    const startTime = Date.now();

    const userMessage: Message = { role: 'user', content };
    const assistantMessage: Message = { role: 'assistant', content: '', model: settings.model };

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
      () => {
        const duration = (Date.now() - startTime) / 1000;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], duration };
          return updated;
        });
        setIsStreaming(false);
        abortRef.current = null;
      },
      (err) => { setError(err); setIsStreaming(false); abortRef.current = null; },
      controller.signal,
    );
  }, [isStreaming, messages]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const editAndResend = useCallback(async (index: number, newContent: string, settings: Settings) => {
    if (isStreaming) return;
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;
    const startTime = Date.now();

    const priorMessages = messages.slice(0, index);
    const userMessage: Message = { role: 'user', content: newContent };
    const assistantMessage: Message = { role: 'assistant', content: '', model: settings.model };

    setMessages([...priorMessages, userMessage, assistantMessage]);
    setIsStreaming(true);

    await sendChatStream(
      [...priorMessages, userMessage],
      settings,
      (delta) => {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = { ...last, content: last.content + delta };
          return updated;
        });
      },
      () => {
        const duration = (Date.now() - startTime) / 1000;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], duration };
          return updated;
        });
        setIsStreaming(false);
        abortRef.current = null;
      },
      (err) => { setError(err); setIsStreaming(false); abortRef.current = null; },
      controller.signal,
    );
  }, [isStreaming, messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, setMessages, isStreaming, error, sendMessage, stopStreaming, editAndResend, clearMessages };
}
