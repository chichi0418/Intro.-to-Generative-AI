import { useState } from 'react';
import type { ToolStep } from '../types';

interface Props {
  steps: ToolStep[];
}

export function ToolStepsDisplay({ steps }: Props) {
  const [open, setOpen] = useState(false);
  if (!steps || steps.length === 0) return null;

  const allDone = steps.every(s => s.status !== 'calling');
  const hasError = steps.some(s => s.status === 'error');

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all"
        style={{
          color: hasError ? 'var(--danger)' : 'var(--text-muted)',
          background: 'var(--bg-soft)',
          border: `1px solid ${hasError ? 'var(--danger-border)' : 'var(--line)'}`,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-soft-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-soft)')}
      >
        {!allDone ? (
          <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : hasError ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        )}
        {steps.length} tool call{steps.length > 1 ? 's' : ''}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {steps.map((step, i) => (
            <div
              key={i}
              className="rounded-xl p-3 text-xs font-mono"
              style={{
                background: 'var(--bg-soft)',
                border: `1px solid ${step.status === 'error' ? 'var(--danger-border)' : 'var(--line)'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                {step.status === 'calling' && (
                  <svg className="animate-spin flex-shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent)' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                )}
                {step.status === 'done' && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: 'var(--success)', flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {step.status === 'error' && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--danger)', flexShrink: 0 }}>
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
                <span style={{ color: 'var(--accent)' }}>{step.name}</span>
                <span className="ml-auto" style={{ color: 'var(--text-faint)', fontFamily: 'sans-serif', fontSize: 10 }}>
                  {step.status === 'calling' ? 'running…' : step.status}
                </span>
              </div>
              {Object.keys(step.args).length > 0 && (
                <div className="mb-1.5">
                  <span style={{ color: 'var(--text-faint)' }}>args </span>
                  <span style={{ color: 'var(--text-muted)' }}>{JSON.stringify(step.args)}</span>
                </div>
              )}
              {step.result != null && (
                <div>
                  <span style={{ color: 'var(--text-faint)' }}>result </span>
                  <span style={{ color: 'var(--text-main)' }}>
                    {typeof step.result === 'object'
                      ? JSON.stringify(step.result, null, 2).slice(0, 400)
                      : String(step.result)}
                  </span>
                </div>
              )}
              {step.error && (
                <div style={{ color: 'var(--danger)' }}>error: {step.error}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
