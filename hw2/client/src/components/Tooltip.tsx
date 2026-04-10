import { useState, useRef, type ReactNode } from 'react';

interface Props {
  text: string;
  children: ReactNode;
}

export function Tooltip({ text, children }: Props) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);

  function handleMouseEnter() {
    timerRef.current = setTimeout(() => {
      if (!anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ x: rect.left, y: rect.top + rect.height / 2 });
      setVisible(true);
    }, 500);
  }

  function handleMouseLeave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }

  return (
    <>
      <span
        ref={anchorRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'contents' }}
      >
        {children}
      </span>
      {visible && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: pos.x - 16,
            top: pos.y,
            transform: 'translate(-100%, -50%)',
            maxWidth: 300,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'var(--bg-surface-strong)',
            color: 'var(--text-main)',
            border: '1px solid var(--line)',
            fontSize: 14,
            lineHeight: '1.5',
            boxShadow: 'var(--shadow-soft)',
            animation: 'fadeIn 0.15s ease',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {text}
        </div>
      )}
    </>
  );
}
