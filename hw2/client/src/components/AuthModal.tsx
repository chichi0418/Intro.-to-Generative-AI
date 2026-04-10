import { useState } from 'react';
import { login, register } from '../api/authApi';

interface Props {
  onSuccess: (username: string) => void;
  onGuest: () => void;
}

export function AuthModal({ onSuccess, onGuest }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fn = mode === 'login' ? login : register;
      const data = await fn(username.trim(), password);
      onSuccess(data.username);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'var(--overlay)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 'min(400px, calc(100vw - 32px))',
        background: 'var(--bg-surface-strong)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        padding: 28,
        boxShadow: '0 16px 48px var(--overlay)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-main)' }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {mode === 'login' ? 'Sign in to sync your memories' : 'Your memories will follow you everywhere'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="your_username"
              autoFocus
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '8px 12px', borderRadius: 8,
                background: 'var(--bg-soft)', border: '1px solid var(--line)',
                color: 'var(--text-main)', fontSize: 14, outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '8px 12px', borderRadius: 8,
                background: 'var(--bg-soft)', border: '1px solid var(--line)',
                color: 'var(--text-main)', fontSize: 14, outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; }}
            />
          </div>

          {error && (
            <div style={{
              fontSize: 12, color: 'var(--danger)',
              padding: '8px 10px', borderRadius: 6,
              background: 'var(--danger-soft)', border: '1px solid var(--danger-border)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '9px 0', borderRadius: 8, marginTop: 4,
              background: loading ? 'var(--accent-soft)' : 'var(--accent)',
              color: loading ? 'var(--accent)' : '#fff',
              border: 'none', fontSize: 14, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Toggle mode */}
        <div style={{ marginTop: 14, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, padding: 0 }}
          >
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </div>

        {/* Guest mode */}
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <button
            onClick={onGuest}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-faint)', cursor: 'pointer',
              fontSize: 12, padding: 0, textDecoration: 'underline',
            }}
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
