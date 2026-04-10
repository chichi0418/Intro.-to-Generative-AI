import { useState, useCallback, useRef } from 'react';
import type { Message, Settings, ContentPart, ToolStep } from '../types';
import { sendChatStream } from '../api/chatApi';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string | ContentPart[], settings: Settings) => {
    if (isStreaming) return;
    setError(null);
    setErrorCode(null);

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
          updated[updated.length - 1] = { ...last, content: (last.content as string) + delta };
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
      (err) => { setError(err.message); setErrorCode(err.code ?? null); setIsStreaming(false); abortRef.current = null; },
      controller.signal,
      (routing) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], model: routing.routedModel, routedModel: routing.routedModel };
          return updated;
        });
      },
      (toolCall) => {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          const step: ToolStep = { name: toolCall.name, args: toolCall.args, status: 'calling' };
          updated[updated.length - 1] = { ...last, toolSteps: [...(last.toolSteps ?? []), step] };
          return updated;
        });
      },
      (toolResult) => {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          const toolSteps = (last.toolSteps ?? []).map(s =>
            s.name === toolResult.name && s.status === 'calling'
              ? { ...s, result: toolResult.result, status: 'done' as const }
              : s
          );
          updated[updated.length - 1] = { ...last, toolSteps };
          return updated;
        });
      },
    );
  }, [isStreaming, messages]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const editAndResend = useCallback(async (index: number, newContent: string | ContentPart[], settings: Settings) => {
    if (isStreaming) return;
    setError(null);
    setErrorCode(null);

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
          updated[updated.length - 1] = { ...last, content: (last.content as string) + delta };
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
      (err) => { setError(err.message); setErrorCode(err.code ?? null); setIsStreaming(false); abortRef.current = null; },
      controller.signal,
      (routing) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], model: routing.routedModel, routedModel: routing.routedModel };
          return updated;
        });
      },
      (toolCall) => {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          const step: ToolStep = { name: toolCall.name, args: toolCall.args, status: 'calling' };
          updated[updated.length - 1] = { ...last, toolSteps: [...(last.toolSteps ?? []), step] };
          return updated;
        });
      },
      (toolResult) => {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          const toolSteps = (last.toolSteps ?? []).map(s =>
            s.name === toolResult.name && s.status === 'calling'
              ? { ...s, result: toolResult.result, status: 'done' as const }
              : s
          );
          updated[updated.length - 1] = { ...last, toolSteps };
          return updated;
        });
      },
    );
  }, [isStreaming, messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setErrorCode(null);
  }, []);

  return { messages, setMessages, isStreaming, error, errorCode, sendMessage, stopStreaming, editAndResend, clearMessages };
}
