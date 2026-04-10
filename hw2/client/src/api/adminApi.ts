const API_BASE = import.meta.env.VITE_API_URL ?? '';

export interface UsageRecord {
  key: string;
  identifierType: 'client' | 'ip' | 'unknown';
  identifier: string;
  username?: string | null;   // present when identifier is a logged-in user
  count: number;
  remaining: number;
  windowStart: number;
  resetAt: number;
  lastSeenAt: number;
  blocked: boolean;
}

export interface ServerUsageSnapshot {
  storage: 'memory' | 'supabase-postgres';
  now: number;
  limit: number;
  windowMs: number;
  totalIps: number;
  records: UsageRecord[];
}

export async function fetchServerKeyUsage(token: string): Promise<ServerUsageSnapshot> {
  const res = await fetch(`${API_BASE}/api/admin/usage`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return body as ServerUsageSnapshot;
}

export async function resetServerKeyUsage(token: string, key: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/usage/reset`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
}
