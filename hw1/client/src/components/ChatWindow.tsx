import { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { MessageBubble } from './MessageBubble';

interface Props {
  messages: Message[];
  error: string | null;
}

export function ChatWindow({ messages, error }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center" style={{ color: '#9aa0a6' }}>
          <div className="text-4xl mb-4">✦</div>
          <div className="text-lg font-medium mb-1" style={{ color: '#e3e3e3' }}>Start a conversation</div>
          <div className="text-sm">Send a message to begin</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-6">
      {messages.map((m, i) => (
        <MessageBubble key={i} message={m} />
      ))}
      {error && (
        <div className="mx-4 px-4 py-2 rounded-lg text-sm" style={{ background: '#3c2b2b', color: '#f28b82', border: '1px solid #5c3535' }}>
          Error: {error}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
