import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../types';
import { AVAILABLE_MODELS } from '../types';

const PROVIDER_AVATAR: Record<string, { bg: string; icon: React.ReactNode }> = {
  openai: {
    bg: 'var(--success)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
      </svg>
    ),
  },
  anthropic: {
    bg: 'var(--accent)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
        <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
      </svg>
    ),
  },
  xai: {
    bg: 'var(--text-muted)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
        <path d="M13.547 10.667 20.64 2h-1.67l-6.18 7.163L7.697 2H2.457l7.45 10.733L2.457 22h1.67l6.514-7.56L15.833 22h5.24l-7.526-11.333Zm-2.306 2.675-.755-1.074L4.77 3.26h2.585l4.846 6.916.754 1.074 6.3 8.993h-2.585l-5.429-7.901Z" />
      </svg>
    ),
  },
  google: {
    bg: 'var(--warning)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
        <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" />
      </svg>
    ),
  },
};

function CodeBlock({ children }: { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  function handleCopy() {
    const text = preRef.current?.innerText ?? '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ position: 'relative' }} className="mb-3">
      <pre
        ref={preRef}
        className="p-4 rounded-xl overflow-x-auto text-xs font-mono leading-relaxed"
        style={{
          background: 'var(--bg-soft)',
          border: '1px solid var(--line)',
          color: 'var(--code-text)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          margin: 0,
          paddingRight: 56,
        }}
      >
        {children}
      </pre>
      <button
        onClick={handleCopy}
        title="Copy code"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          padding: '3px 8px',
          borderRadius: 6,
          fontSize: 11,
          cursor: 'pointer',
          background: copied ? 'var(--success-soft)' : 'var(--line)',
          border: `1px solid ${copied ? 'var(--success-border)' : 'var(--line-strong)'}`,
          color: copied ? 'var(--success)' : 'var(--text-muted)',
          transition: 'all 0.15s',
          lineHeight: 1.4,
        }}
        onMouseEnter={e => { if (!copied) e.currentTarget.style.background = 'var(--line-strong)'; }}
        onMouseLeave={e => { if (!copied) e.currentTarget.style.background = 'var(--line)'; }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

interface Props {
  message: Message;
  onEdit?: (newContent: string) => void;
  onRegenerate?: () => void;
}

export function MessageBubble({ message, onEdit, onRegenerate }: Props) {
  const provider = AVAILABLE_MODELS.find(m => m.id === message.model)?.provider ?? 'google';
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
      el.selectionStart = el.selectionEnd = el.value.length;
    }
  }, [editing]);

  function handleCopy() {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleEditSubmit() {
    const trimmed = editText.trim();
    if (!trimmed || !onEdit) return;
    setEditing(false);
    onEdit(trimmed);
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleEditSubmit();
    }
    if (e.key === 'Escape') {
      setEditing(false);
      setEditText(message.content);
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end mb-5 px-4 group">
        <div className="max-w-[85%] sm:max-w-[70%] flex flex-col items-end gap-1.5">
          {editing ? (
            <div className="w-full" style={{ minWidth: 280 }}>
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={e => {
                  setEditText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={handleEditKeyDown}
                rows={1}
                className="w-full px-4 py-2.5 rounded-2xl text-sm leading-relaxed resize-none outline-none"
                style={{
                  background: 'var(--accent-soft)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--accent-border)',
                  caretColor: 'var(--accent)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => { setEditing(false); setEditText(message.content); }}
                  className="px-3 py-1 rounded-lg text-xs transition-colors"
                  style={{ color: 'var(--text-muted)', border: '1px solid var(--line)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-soft-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: 'var(--accent)', color: 'var(--bg-page)' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Resend
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words"
                style={{ background: 'var(--accent-soft)', color: 'var(--text-main)', border: '1px solid var(--accent-border)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              >
                {message.content}
              </div>
              {onEdit && (
                <button
                  onClick={() => { setEditText(message.content); setEditing(true); }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-soft-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-start mb-5 px-4 gap-3 group ${message.content ? 'items-start' : 'items-center'}`}>
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
        style={{ background: PROVIDER_AVATAR[provider]?.bg ?? PROVIDER_AVATAR.google.bg }}
      >
        {PROVIDER_AVATAR[provider]?.icon ?? PROVIDER_AVATAR.google.icon}
      </div>
      <div className="flex-1 min-w-0 pt-0.5" style={{ color: 'var(--text-main)' }}>
        {message.content ? (
          <div className="markdown text-sm leading-relaxed">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2" style={{ color: 'var(--text-main)' }}>{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold mt-4 mb-2" style={{ color: 'var(--text-main)' }}>{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1.5" style={{ color: 'var(--text-main)' }}>{children}</h3>,
                p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="mb-3 pl-5 space-y-1 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="mb-3 pl-5 space-y-1 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
                  inline ? (
                    <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--bg-soft-hover)', color: 'var(--code-text)', border: '1px solid var(--line)' }}>
                      {children}
                    </code>
                  ) : (
                    <code>{children}</code>
                  ),
                pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
                strong: ({ children }) => <strong className="font-semibold" style={{ color: 'var(--text-main)' }}>{children}</strong>,
                blockquote: ({ children }) => (
                  <blockquote className="pl-3 my-2 italic" style={{ borderLeft: '3px solid var(--line-strong)', color: 'var(--text-muted)' }}>
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-3" style={{ borderColor: 'var(--line)' }} />,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-faint)', animationDelay: '0ms' }} />
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-faint)', animationDelay: '150ms' }} />
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-faint)', animationDelay: '300ms' }} />
          </span>
        )}
        {message.content && (
          <div className="mt-2 flex items-center gap-1">
            <button
              onClick={handleCopy}
              title="Copy to clipboard"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs transition-all"
              style={{
                color: copied ? 'var(--success)' : 'var(--text-muted)',
                background: copied ? 'var(--success-soft)' : 'transparent',
                border: `1px solid ${copied ? 'var(--success-border)' : 'transparent'}`,
              }}
              onMouseEnter={e => { if (!copied) { e.currentTarget.style.background = 'var(--bg-soft-hover)'; e.currentTarget.style.borderColor = 'var(--line)'; } }}
              onMouseLeave={e => { if (!copied) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
            >
              {copied ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
            {message.duration != null && (
              <span className="text-xs ml-1" style={{ color: 'var(--text-faint)' }}>
                {message.duration.toFixed(1)}s
              </span>
            )}
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                title="Regenerate response"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs transition-all opacity-0 group-hover:opacity-100"
                style={{ color: 'var(--text-muted)', border: '1px solid transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-soft-hover)'; e.currentTarget.style.borderColor = 'var(--line)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
