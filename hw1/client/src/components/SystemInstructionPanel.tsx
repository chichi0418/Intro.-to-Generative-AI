import { useEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}

export function SystemInstructionPanel({ value, onChange, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-end animate-fadeIn"
      style={{
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="flex flex-col h-full w-[480px] animate-slideInRight"
        style={{
          background: 'rgba(27,28,32,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <span className="text-base font-medium" style={{ color: '#e3e3e3' }}>System instructions</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-sm transition-colors"
            style={{ color: '#9aa0a6' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            ✕
          </button>
        </div>

        {/* "+ Create new instruction" bar */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9aa0a6' }}
          >
            <span>+ Create new instruction</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Title + delete */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-2">
          <input
            type="text"
            placeholder="Title"
            defaultValue={value ? 'My instruction' : ''}
            className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#e3e3e3',
              caretColor: '#8ab4f8',
            }}
          />
          <button
            onClick={() => onChange('')}
            className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#9aa0a6' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            title="Clear instruction"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>

        {/* Textarea */}
        <div className="flex-1 px-4 pb-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Optional tone and style instructions for the model"
            className="w-full h-full px-3 py-2.5 text-sm rounded-lg outline-none resize-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e3e3e3',
              caretColor: '#8ab4f8',
              lineHeight: '1.6',
            }}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-xs" style={{ color: '#5f6368' }}>Instructions are saved in local storage.</p>
        </div>
      </div>
    </div>
  );
}
