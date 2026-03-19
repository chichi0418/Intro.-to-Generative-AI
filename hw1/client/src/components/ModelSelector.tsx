import { useState, useEffect, useRef } from 'react';
import type { ModelInfo } from '../types';
import { AVAILABLE_MODELS } from '../types';

const PROVIDER_TABS = ['All', 'OpenAI', 'Anthropic', 'Google'] as const;

const PROVIDER_ICONS: Record<string, string> = {
  openai: '⬡',
  anthropic: '◆',
  google: '✦',
};

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
  const overlayRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
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

  function handleSelect(id: string) {
    onSelect(id);
    onClose();
  }

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
        className="flex flex-col h-full w-96 shadow-2xl animate-slideInRight"
        style={{
          background: 'rgba(27,28,32,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#2e3035' }}>
          <span className="text-base font-medium" style={{ color: '#e3e3e3' }}>Model selection</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
            style={{ color: '#9aa0a6' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2d2e33')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b" style={{ borderColor: '#2e3035' }}>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-full"
            style={{ background: '#2d2e33', border: '1px solid #3c3f4a' }}
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
              style={{ color: '#e3e3e3', caretColor: '#8ab4f8' }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 py-2 border-b overflow-x-auto" style={{ borderColor: '#2e3035' }}>
          {PROVIDER_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
              style={
                tab === t
                  ? { background: '#c2e7ff', color: '#1b1c20' }
                  : { color: '#9aa0a6', border: '1px solid #3c3f4a' }
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* Model list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-10 text-sm" style={{ color: '#9aa0a6' }}>
              No models found
            </div>
          )}
          {filtered.map((m: ModelInfo) => {
            const isSelected = m.id === currentModel;
            return (
              <button
                key={m.id}
                onClick={() => handleSelect(m.id)}
                className="w-full text-left px-4 py-3 rounded-xl transition-all"
                style={{
                  background: isSelected ? '#1a3a5c' : '#2d2e33',
                  border: `1px solid ${isSelected ? '#4a90d9' : '#3c3f4a'}`,
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#55585f'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#3c3f4a'; }}
              >
                <div className="flex items-start gap-2 mb-1">
                  <span style={{ color: '#9aa0a6', fontSize: 14 }}>{PROVIDER_ICONS[m.provider]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: '#e3e3e3' }}>{m.label}</span>
                      {m.badge && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={BADGE_STYLE[m.badge]}>
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: '#9aa0a6' }}>{m.id}</div>
                  </div>
                  {isSelected && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8ab4f8" strokeWidth="2.5" className="flex-shrink-0 mt-0.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#9aa0a6' }}>{m.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
