import { useEffect, useRef, useState } from 'react';
import type { Message } from '../types';
import { MessageBubble } from './MessageBubble';

interface Props {
  messages: Message[];
  error: string | null;
  onEditMessage: (index: number, newContent: string) => void;
  onRegenerate: (index: number) => void;
  onRetry: () => void;
  leftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
}

function TableOfContents({ messages, scrollRef }: {
  messages: Message[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const userMessages = messages
    .map((m, i) => ({ content: m.content, index: i }))
    .filter(m => messages[m.index].role === 'user');

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (userMessages.length === 0) return null;

  function scrollTo(index: number) {
    const el = document.getElementById(`msg-${index}`);
    if (el && scrollRef.current) {
      const container = scrollRef.current;
      const offsetTop = el.offsetTop - 24;
      container.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
    setOpen(false);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* TOC popup */}
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 'calc(100% + 8px)',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 30,
            width: 280,
            maxHeight: 360,
            overflowY: 'auto',
            background: 'var(--bg-surface-strong)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            boxShadow: '0 8px 32px var(--overlay)',
            padding: '6px 4px',
          }}
        >
          <div
            className="px-3 pb-2 text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--text-faint)', borderBottom: '1px solid var(--bg-soft-hover)', marginBottom: 4 }}
          >
            Questions
          </div>
          {userMessages.map((m, n) => (
            <button
              key={m.index}
              onClick={() => scrollTo(m.index)}
              className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-start gap-2"
              style={{ color: 'var(--text-muted)', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--text-main)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <span
                className="shrink-0 mt-0.5 font-mono"
                style={{ color: 'var(--accent-border)', fontSize: 10, minWidth: 16 }}
              >
                {n + 1}.
              </span>
              <span className="leading-relaxed" style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {m.content}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Icon button */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Table of contents"
        style={{
          width: 30,
          height: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          background: open ? 'var(--accent-soft)' : 'var(--bg-soft)',
          border: `1px solid ${open ? 'var(--accent-border)' : 'var(--line)'}`,
          color: open ? 'var(--accent)' : 'var(--text-muted)',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.background = 'var(--line)';
            e.currentTarget.style.color = 'var(--text-main)';
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.background = 'var(--bg-soft)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="15" y2="12" />
          <line x1="3" y1="18" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export function ChatWindow({
  messages,
  error,
  onEditMessage,
  onRegenerate,
  onRetry,
  leftSidebarOpen,
  onToggleLeftSidebar,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-hidden" style={{ position: 'relative' }}>
      {/* Left-side button stack */}
      <div style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        zIndex: 20,
      }}>
        <button
          onClick={onToggleLeftSidebar}
          title={leftSidebarOpen ? 'Collapse history' : 'Open history'}
          style={{
            width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8,
            background: 'var(--bg-soft)',
            border: '1px solid var(--line)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--line)'; e.currentTarget.style.color = 'var(--text-main)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-soft)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          {leftSidebarOpen ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 19l-7-7 7-7" /><path d="M19 19l-7-7 7-7" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 5l7 7-7 7" /><path d="M5 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Right-side button stack */}
      <div style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        <TableOfContents messages={messages} scrollRef={scrollRef} />
      </div>

      <div ref={scrollRef} className="h-full overflow-y-auto py-6">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center" style={{ color: 'var(--text-faint)' }}>
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-5" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="text-base font-semibold mb-1" style={{ color: 'var(--text-main)' }}>Start a conversation</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Send a message to begin</div>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div id={`msg-${i}`} key={i}>
            <MessageBubble
              message={m}
              onEdit={m.role === 'user' ? (newContent) => onEditMessage(i, newContent) : undefined}
              onRegenerate={m.role === 'assistant' && m.content ? () => onRegenerate(i) : undefined}
            />
          </div>
        ))}
        {error && (
          <div className="mx-4 mb-3 px-4 py-3 rounded-lg text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid var(--danger-border)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <div className="mb-2">Error: {error}</div>
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-border)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--danger-soft)'; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Retry
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
