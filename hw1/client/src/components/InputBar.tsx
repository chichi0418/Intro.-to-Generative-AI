import { useState, useRef, type KeyboardEvent } from 'react';

interface Props {
  onSend: (content: string) => void;
  onStop: () => void;
  disabled: boolean;
  model: string;
}

export function InputBar({ onSend, onStop, disabled, model }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  return (
    <div className="px-2 sm:px-4 pb-3 sm:pb-4 pt-2">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-soft)',
          border: '1px solid var(--line)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Start typing a prompt…"
          rows={1}
          className="w-full px-4 pt-4 pb-2 text-sm resize-none outline-none"
          style={{
            background: 'transparent',
            color: 'var(--text-main)',
            minHeight: '52px',
            maxHeight: '200px',
            caretColor: 'var(--accent)',
          }}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1.5">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--bg-soft-hover)', color: 'var(--text-muted)', border: '1px solid var(--line)' }}
            >
              {model}
            </span>
          </div>

          {disabled ? (
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: 'var(--danger-soft)',
                color: 'var(--danger)',
                border: '1px solid var(--danger-border)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-border)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--danger-soft)')}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: !text.trim() ? 'var(--bg-soft)' : 'var(--accent)',
                color: !text.trim() ? 'var(--text-faint)' : 'var(--bg-page)',
                cursor: !text.trim() ? 'not-allowed' : 'pointer',
                border: !text.trim() ? '1px solid var(--line)' : '1px solid transparent',
                fontWeight: 500,
              }}
            >
              Run
              <kbd className="text-xs opacity-60">↵</kbd>
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-xs mt-2" style={{ color: 'var(--text-faint)' }}>
        Shift+Enter for newline
      </p>
    </div>
  );
}
