import { useEffect, useRef, useState } from 'react';
import type { Settings } from '../types';

type Provider = keyof Settings['apiKeys'];

const PROVIDER_LABEL: Record<Provider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google AI Studio',
  xai: 'xAI',
};

interface Props {
  apiKeys: Settings['apiKeys'];
  currentProvider: Provider | null;
  onChange: (apiKeys: Settings['apiKeys']) => void;
  onClose: () => void;
}

function ApiKeyField({
  label,
  placeholder,
  value,
  onChange,
  active,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  active: boolean;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
        {active && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ color: 'var(--accent)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}
          >
            current model
          </span>
        )}
      </div>
      <input
        type="password"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg px-2.5 py-2 text-xs"
        style={{
          background: 'var(--bg-soft)',
          border: '1px solid var(--line)',
          color: 'var(--text-main)',
          outline: 'none',
        }}
      />
    </label>
  );
}

export function ApiKeyPanel({ apiKeys, currentProvider, onChange, onClose }: Props) {
  const [closing, setClosing] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setClosing(true);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const panelClass = isMobile
    ? (closing ? 'animate-slideOutDown' : 'animate-slideInUp')
    : (closing ? 'animate-slideOutRight' : 'animate-slideInRight');

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 animate-fadeIn"
      style={{
        background: 'var(--overlay)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'stretch',
        justifyContent: isMobile ? 'center' : 'flex-end',
      }}
      onClick={e => { if (e.target === overlayRef.current) setClosing(true); }}
    >
      <div
        className={`flex flex-col shadow-2xl ${panelClass}`}
        onAnimationEnd={() => { if (closing) onClose(); }}
        style={{
          width: isMobile ? '100%' : 384,
          height: isMobile ? '78vh' : '100%',
          background: 'var(--bg-surface-strong)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: isMobile ? '1px solid var(--line)' : 'none',
          borderLeft: isMobile ? 'none' : '1px solid var(--line)',
          borderRadius: isMobile ? '16px 16px 0 0' : 0,
        }}
      >
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1">
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line-strong)' }} />
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bg-soft-hover)' }}>
          <span className="text-base font-medium" style={{ color: 'var(--text-main)' }}>API keys</span>
          <button
            onClick={() => setClosing(true)}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--line)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--bg-soft-hover)' }}>
          Leave blank to use server `.env` key.
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <ApiKeyField
            label={PROVIDER_LABEL.openai}
            placeholder="sk-..."
            value={apiKeys.openai}
            active={currentProvider === 'openai'}
            onChange={value => onChange({ ...apiKeys, openai: value })}
          />
          <ApiKeyField
            label={PROVIDER_LABEL.anthropic}
            placeholder="sk-ant-..."
            value={apiKeys.anthropic}
            active={currentProvider === 'anthropic'}
            onChange={value => onChange({ ...apiKeys, anthropic: value })}
          />
          <ApiKeyField
            label={PROVIDER_LABEL.google}
            placeholder="AIza..."
            value={apiKeys.google}
            active={currentProvider === 'google'}
            onChange={value => onChange({ ...apiKeys, google: value })}
          />
          <ApiKeyField
            label={PROVIDER_LABEL.xai}
            placeholder="xai-..."
            value={apiKeys.xai}
            active={currentProvider === 'xai'}
            onChange={value => onChange({ ...apiKeys, xai: value })}
          />
        </div>
      </div>
    </div>
  );
}
