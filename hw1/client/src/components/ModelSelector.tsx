import { useState, useEffect, useRef } from 'react';
import type { ModelInfo } from '../types';
import { AVAILABLE_MODELS } from '../types';

const PROVIDER_TABS = ['All', 'OpenAI', 'Anthropic', 'Google', 'xAI'] as const;

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === 'openai') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  );
  if (provider === 'anthropic') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
    </svg>
  );
  if (provider === 'xai') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.547 10.667 20.64 2h-1.67l-6.18 7.163L7.697 2H2.457l7.45 10.733L2.457 22h1.67l6.514-7.56L15.833 22h5.24l-7.526-11.333Zm-2.306 2.675-.755-1.074L4.77 3.26h2.585l4.846 6.916.754 1.074 6.3 8.993h-2.585l-5.429-7.901Z" />
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" />
    </svg>
  );
}

const BADGE_STYLE: Record<string, React.CSSProperties> = {
  Free: { background: '#1e3a2f', color: '#34a853', border: '1px solid #2d5e48' },
  New:  { background: '#1a2e4a', color: '#8ab4f8', border: '1px solid #2a4870' },
  Paid: { background: '#2e2a1a', color: '#fbbc04', border: '1px solid #4a421a' },
};

interface Props {
  currentModel: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function ModelSelector({ currentModel, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<typeof PROVIDER_TABS[number]>('All');
  const [closing, setClosing] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const overlayRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') triggerClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = AVAILABLE_MODELS.filter((m: ModelInfo) => {
    const matchTab = tab === 'All' || m.provider === tab.toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !q || m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  function triggerClose() { setClosing(true); }
  function handleSelect(id: string) { onSelect(id); triggerClose(); }

  // Mobile: bottom sheet slide up/down
  // Desktop: right-side slide in/out
  const panelClass = isMobile
    ? (closing ? 'animate-slideOutDown' : 'animate-slideInUp')
    : (closing ? 'animate-slideOutRight' : 'animate-slideInRight');

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 animate-fadeIn"
      style={{
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'stretch',
        justifyContent: isMobile ? 'center' : 'flex-end',
      }}
      onClick={e => { if (e.target === overlayRef.current) triggerClose(); }}
    >
      <div
        className={`flex flex-col shadow-2xl ${panelClass}`}
        onAnimationEnd={() => { if (closing) onClose(); }}
        style={{
          width: isMobile ? '100%' : 384,
          height: isMobile ? '85vh' : '100%',
          background: 'rgba(8,8,12,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: isMobile ? '1px solid rgba(255,255,255,0.08)' : 'none',
          borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: isMobile ? '16px 16px 0 0' : 0,
        }}
      >
        {/* Drag handle (mobile only) */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1">
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <span className="text-base font-medium" style={{ color: '#ededef' }}>Model selection</span>
          <button
            onClick={triggerClose}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
            style={{ color: '#8a8f98' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for a model"
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: '#ededef', caretColor: '#8ab4f8' }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 py-2 border-b overflow-x-auto" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {PROVIDER_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
              style={
                tab === t
                  ? { background: 'rgba(138,180,248,0.9)', color: '#07070a' }
                  : { color: '#8a8f98', border: '1px solid rgba(255,255,255,0.1)' }
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* Model list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-10 text-sm" style={{ color: '#8a8f98' }}>No models found</div>
          )}
          {filtered.map((m: ModelInfo) => {
            const isSelected = m.id === currentModel;
            const isDisabled = !!m.disabled;
            return (
              <button
                key={m.id}
                onClick={() => !isDisabled && handleSelect(m.id)}
                disabled={isDisabled}
                className="w-full text-left px-4 py-3 rounded-xl transition-all"
                style={{
                  background: isDisabled ? 'rgba(255,255,255,0.02)' : isSelected ? 'rgba(138,180,248,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isDisabled ? 'rgba(255,255,255,0.04)' : isSelected ? 'rgba(138,180,248,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.45 : 1,
                }}
                onMouseEnter={e => { if (!isSelected && !isDisabled) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                onMouseLeave={e => { if (!isSelected && !isDisabled) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <div className="flex items-start gap-2 mb-1">
                  <span style={{ color: '#9aa0a6', display: 'inline-flex', alignItems: 'center', flexShrink: 0, marginTop: 2 }}>
                    <ProviderIcon provider={m.provider} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: isDisabled ? '#5a5f68' : '#ededef' }}>{m.label}</span>
                      {m.badge && m.badge.map(b => (
                        <span key={b} className="text-xs px-1.5 py-0.5 rounded" style={BADGE_STYLE[b]}>{b}</span>
                      ))}
                      {isDisabled && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#5a5f68', border: '1px solid rgba(255,255,255,0.08)' }}>
                          Coming soon
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: '#5a5f68' }}>{m.id}</div>
                  </div>
                  {isSelected && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8ab4f8" strokeWidth="2.5" className="flex-shrink-0 mt-0.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: isDisabled ? '#3a3f48' : '#8a8f98' }}>{m.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
