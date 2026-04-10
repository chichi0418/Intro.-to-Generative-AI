import { useState, useRef, type KeyboardEvent } from 'react';
import type { ContentPart, ImagePart } from '../types';

interface Props {
  onSend: (content: string | ContentPart[]) => void;
  onStop: () => void;
  disabled: boolean;
  model: string;
  supportsVision?: boolean;
}

export function InputBar({ onSend, onStop, disabled, model, supportsVision = false }: Props) {
  const [text, setText] = useState('');
  const [pendingImages, setPendingImages] = useState<ImagePart[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    const trimmed = text.trim();
    if ((!trimmed && pendingImages.length === 0) || disabled) return;

    if (pendingImages.length > 0) {
      const parts: ContentPart[] = [
        ...pendingImages,
        ...(trimmed ? [{ type: 'text' as const, text: trimmed }] : []),
      ];
      onSend(parts);
    } else {
      onSend(trimmed);
    }

    setText('');
    setPendingImages([]);
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // Max 3 images, 4MB each
    const remaining = 3 - pendingImages.length;
    const toProcess = files.slice(0, remaining);

    for (const file of toProcess) {
      if (file.size > 4 * 1024 * 1024) {
        alert(`${file.name} exceeds the 4MB limit.`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        // Strip the "data:image/...;base64," prefix
        const [header, data] = dataUrl.split(',');
        const mediaType = header.match(/data:([^;]+)/)?.[1] as ImagePart['mediaType'] ?? 'image/jpeg';
        setPendingImages(prev => [...prev, { type: 'image', mediaType, data }]);
      };
      reader.readAsDataURL(file);
    }

    // Reset input so same file can be selected again
    e.target.value = '';
  }

  function removeImage(index: number) {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  }

  const canSend = (text.trim().length > 0 || pendingImages.length > 0) && !disabled;

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
        {/* Image previews */}
        {pendingImages.length > 0 && (
          <div className="flex items-center gap-2 px-3 pt-3 pb-1 flex-wrap">
            {pendingImages.map((img, i) => (
              <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={`data:${img.mediaType};base64,${img.data}`}
                  alt="upload preview"
                  style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }}
                />
                <button
                  onClick={() => removeImage(i)}
                  style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 16, height: 16,
                    borderRadius: '50%',
                    background: 'var(--danger)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            {pendingImages.length < 3 && (
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                {3 - pendingImages.length} more allowed
              </span>
            )}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={pendingImages.length > 0 ? 'Ask about the image…' : 'Start typing a prompt…'}
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

            {supportsVision && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={pendingImages.length >= 3}
                  title="Attach image"
                  className="flex items-center justify-center w-7 h-7 rounded-full transition-all"
                  style={{
                    color: pendingImages.length > 0 ? 'var(--accent)' : 'var(--text-muted)',
                    background: pendingImages.length > 0 ? 'var(--accent-soft)' : 'transparent',
                    border: pendingImages.length > 0 ? '1px solid var(--accent-border)' : '1px solid transparent',
                    cursor: pendingImages.length >= 3 ? 'not-allowed' : 'pointer',
                    opacity: pendingImages.length >= 3 ? 0.4 : 1,
                  }}
                  onMouseEnter={e => { if (pendingImages.length < 3) e.currentTarget.style.background = 'var(--bg-soft-hover)'; }}
                  onMouseLeave={e => { if (pendingImages.length === 0) e.currentTarget.style.background = 'transparent'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </button>
              </>
            )}
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
              disabled={!canSend}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: !canSend ? 'var(--bg-soft)' : 'var(--accent)',
                color: !canSend ? 'var(--text-faint)' : 'var(--bg-page)',
                cursor: !canSend ? 'not-allowed' : 'pointer',
                border: !canSend ? '1px solid var(--line)' : '1px solid transparent',
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
