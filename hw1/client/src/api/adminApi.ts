const API_BASE = import.meta.env.VITE_API_URL ?? '';

export interface UsageRecord {
  ip: string;
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
