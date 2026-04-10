import { useEffect, useRef, useState } from 'react';
import { fetchServerKeyUsage, resetServerKeyUsage } from '../api/adminApi';
import type { ServerUsageSnapshot } from '../api/adminApi';

interface Props {
  onClose: () => void;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString();
}

export function AdminUsagePanel({ onClose }: Props) {
  const [closing, setClosing] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const [token, setToken] = useState(() => localStorage.getItem('adminApiToken') ?? '');
  const [loading, setLoading] = useState(false);
  const [resettingIp, setResettingIp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<ServerUsageSnapshot | null>(null);
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

  async function loadUsage() {
    if (!token.trim()) {
      setError('Please enter admin token');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchServerKeyUsage(token.trim());
      setSnapshot(data);
      localStorage.setItem('adminApiToken', token.trim());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

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
          width: isMobile ? '100%' : 700,
          height: isMobile ? '85vh' : '100%',
          background: 'var(--bg-surface-strong)',
          borderTop: isMobile ? '1px solid var(--line)' : 'none',
          borderLeft: isMobile ? 'none' : '1px solid var(--line)',
          borderRadius: isMobile ? '16px 16px 0 0' : 0,
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bg-soft-hover)' }}>
          <span className="text-base font-medium" style={{ color: 'var(--text-main)' }}>Admin usage dashboard</span>
          <button
            onClick={() => setClosing(true)}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b" style={{ borderColor: 'var(--bg-soft-hover)' }}>
          <div className="flex gap-2 items-center">
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="ADMIN_API_TOKEN"
              className="flex-1 rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--bg-soft)', border: '1px solid var(--line)', color: 'var(--text-main)' }}
            />
            <button
              onClick={loadUsage}
              disabled={loading}
              className="px-3 py-2 text-sm rounded-lg"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          {error && (
            <div className="text-xs mt-2" style={{ color: 'var(--danger)' }}>{error}</div>
          )}
        </div>

        <div className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          {snapshot
            ? `Storage: ${snapshot.storage} | IPs: ${snapshot.totalIps} | Limit: ${snapshot.limit} | Window: ${Math.round(snapshot.windowMs / 60000)} min | Updated: ${formatDate(snapshot.now)}`
            : 'Enter admin token and refresh to load usage data.'}
        </div>

        <div className="flex-1 overflow-auto px-4 pb-4">
          <table className="w-full text-xs" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th className="text-left p-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--bg-soft-hover)' }}>Type</th>
                <th className="text-left p-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--bg-soft-hover)' }}>Identifier</th>
                <th className="text-left p-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--bg-soft-hover)' }}>Used</th>
                <th className="text-left p-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--bg-soft-hover)' }}>Remaining</th>
                <th className="text-left p-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--bg-soft-hover)' }}>Status</th>
                <th className="text-left p-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--bg-soft-hover)' }}>Last Seen</th>
                <th className="text-left p-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--bg-soft-hover)' }}>Reset At</th>
                <th className="text-left p-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--bg-soft-hover)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {(snapshot?.records ?? []).map((r) => {
                const isUser = r.identifier.startsWith('user:');
                const isIp = r.identifierType === 'ip';
                const typeLabel = isUser ? 'user' : isIp ? 'ip' : 'guest';
                const typeStyle = isUser
                  ? { color: 'var(--accent)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }
                  : isIp
                  ? { color: 'var(--text-muted)', background: 'var(--bg-soft)', border: '1px solid var(--line)' }
                  : { color: 'var(--warning)', background: 'var(--warning-soft)', border: '1px solid var(--warning-border)' };

                const displayName = isUser
                  ? (r.username ? `@${r.username}` : r.identifier)
                  : r.identifier;
                const subText = isUser && r.username ? r.identifier : null;

                return (
                <tr key={r.key}>
                  <td className="p-2" style={{ borderBottom: '1px solid var(--bg-soft-hover)' }}>
                    <span className="px-1.5 py-0.5 rounded text-xs" style={typeStyle}>{typeLabel}</span>
                  </td>
                  <td className="p-2" style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--bg-soft-hover)' }}>
                    <div style={{ fontWeight: isUser ? 500 : 400 }}>{displayName}</div>
                    {subText && <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 1 }}>{subText}</div>}
                  </td>
                  <td className="p-2" style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--bg-soft-hover)' }}>{r.count}</td>
                  <td className="p-2" style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--bg-soft-hover)' }}>{r.remaining}</td>
                  <td className="p-2" style={{ borderBottom: '1px solid var(--bg-soft-hover)' }}>
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={r.blocked
                        ? { color: 'var(--danger)', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)' }
                        : { color: 'var(--success)', background: 'var(--success-soft)', border: '1px solid var(--success-border)' }}
                    >
                      {r.blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="p-2" style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--bg-soft-hover)' }}>{formatDate(r.lastSeenAt)}</td>
                  <td className="p-2" style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--bg-soft-hover)' }}>{formatDate(r.resetAt)}</td>
                  <td className="p-2" style={{ borderBottom: '1px solid var(--bg-soft-hover)' }}>
                    <button
                      disabled={resettingIp === r.key || loading}
                      className="px-2 py-1 rounded-md text-xs"
                      style={{ color: 'var(--accent)', border: '1px solid var(--accent-border)', background: 'var(--accent-soft)' }}
                      onClick={async () => {
                        if (!token.trim()) { setError('Please enter admin token'); return; }
                        setError(null);
                        setResettingIp(r.key);
                        try {
                          await resetServerKeyUsage(token.trim(), r.key);
                          await loadUsage();
                        } catch (err) {
                          setError((err as Error).message);
                        } finally {
                          setResettingIp(null);
                        }
                      }}
                    >
                      {resettingIp === r.key ? 'Resetting...' : 'Reset'}
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
