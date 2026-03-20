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
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
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
            color: '#ededef',
            minHeight: '52px',
            maxHeight: '200px',
            caretColor: '#8ab4f8',
          }}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1.5">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#8a8f98', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              {model}
            </span>
          </div>

          {disabled ? (
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: 'rgba(242,139,130,0.12)',
                color: '#f28b82',
                border: '1px solid rgba(242,139,130,0.25)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(242,139,130,0.22)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(242,139,130,0.12)')}
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
                background: !text.trim() ? 'rgba(255,255,255,0.05)' : '#8ab4f8',
                color: !text.trim() ? 'rgba(255,255,255,0.25)' : '#07070a',
                cursor: !text.trim() ? 'not-allowed' : 'pointer',
                border: !text.trim() ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                fontWeight: 500,
              }}
            >
              Run
              <kbd className="text-xs opacity-60">↵</kbd>
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-xs mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
        Shift+Enter for newline
      </p>
    </div>
  );
}
