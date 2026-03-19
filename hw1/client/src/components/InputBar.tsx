import { useState, useRef, type KeyboardEvent } from 'react';

interface Props {
  onSend: (content: string) => void;
  disabled: boolean;
  model: string;
}

export function InputBar({ onSend, disabled, model }: Props) {
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
    <div className="px-4 pb-4 pt-2">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#2d2e33', border: '1px solid #3c3f4a' }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Start typing a prompt…"
          disabled={disabled}
          rows={1}
          className="w-full px-4 pt-4 pb-2 text-sm resize-none outline-none"
          style={{
            background: 'transparent',
            color: '#e3e3e3',
            minHeight: '52px',
            maxHeight: '200px',
            caretColor: '#8ab4f8',
          }}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1.5">
            <span
              className="px-2.5 py-1 rounded-full text-xs"
              style={{ background: '#3c3f4a', color: '#9aa0a6' }}
            >
              {model}
            </span>
          </div>

          <button
            onClick={handleSend}
            disabled={disabled || !text.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: disabled || !text.trim() ? '#3c3f4a' : '#8ab4f8',
              color: disabled || !text.trim() ? '#5f6368' : '#1b1c20',
              cursor: disabled || !text.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {disabled ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Running
              </>
            ) : (
              <>
                Run
                <kbd className="text-xs opacity-60">↵</kbd>
              </>
            )}
          </button>
        </div>
      </div>

      <p className="text-center text-xs mt-2" style={{ color: '#5f6368' }}>
        Shift+Enter for newline
      </p>
    </div>
  );
}
