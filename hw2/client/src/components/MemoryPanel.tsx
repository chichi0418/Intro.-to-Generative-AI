import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchMemories, addMemory, deleteMemory } from '../api/memoryApi';
import type { Memory } from '../api/memoryApi';

interface Props {
  clientId: string;
  onClose: () => void;
}

export function MemoryPanel({ clientId, onClose }: Props) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newContent, setNewContent] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchMemories(clientId)
      .then(setMemories)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [clientId]);

  async function handleAdd() {
    if (!newContent.trim()) return;
    setAdding(true);
    try {
      const mem = await addMemory(clientId, newContent.trim());
      setMemories(prev => [mem, ...prev]);
      setNewContent('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMemory(id, clientId);
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--overlay)', backdropFilter: 'blur(1px)' }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 61,
          width: 'min(480px, calc(100vw - 32px))',
          maxHeight: '80vh',
          background: 'var(--bg-surface-strong)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--bg-soft-hover)' }}>
          <div className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--accent)' }}>
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
            </svg>
            <span className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>Long-term Memory</span>
            {memories.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                {memories.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-soft-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid var(--danger-border)' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
          ) : memories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-faint)' }}>
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No memories stored yet</p>
              <p className="text-xs text-center" style={{ color: 'var(--text-faint)' }}>
                Memories are automatically extracted from your conversations
              </p>
            </div>
          ) : (
            memories.map(mem => (
              <div
                key={mem.id}
                className="flex items-start gap-2 group px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--bg-soft)', border: '1px solid var(--line)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="flex-1 text-sm leading-relaxed" style={{ color: 'var(--text-main)' }}>{mem.content}</span>
                <button
                  onClick={() => handleDelete(mem.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 w-5 h-5 flex items-center justify-center rounded"
                  style={{ color: 'var(--text-faint)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-soft)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent'; }}
                  title="Delete memory"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add memory */}
        <div className="p-4" style={{ borderTop: '1px solid var(--bg-soft-hover)' }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="Add a memory manually…"
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--bg-soft)',
                color: 'var(--text-main)',
                border: '1px solid var(--line)',
                caretColor: 'var(--accent)',
              }}
            />
            <button
              onClick={handleAdd}
              disabled={!newContent.trim() || adding}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: !newContent.trim() || adding ? 'var(--bg-soft)' : 'var(--accent)',
                color: !newContent.trim() || adding ? 'var(--text-faint)' : 'var(--bg-page)',
                cursor: !newContent.trim() || adding ? 'not-allowed' : 'pointer',
                border: '1px solid transparent',
              }}
            >
              {adding ? '…' : 'Add'}
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>
            Memories are injected into every conversation as context.
          </p>
        </div>
      </div>
    </>,
    document.body
  );
}
