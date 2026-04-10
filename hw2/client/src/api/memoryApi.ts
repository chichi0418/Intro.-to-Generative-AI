import { getClientId } from './chatApi';
import { authHeaders } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export { getClientId };

export interface Memory {
  id: string;
  clientId: string;
  content: string;
  createdAt: string;
}

export async function fetchMemories(clientId: string): Promise<Memory[]> {
  const res = await fetch(`${API_BASE}/api/memory?clientId=${encodeURIComponent(clientId)}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.memories ?? [];
}

export async function addMemory(clientId: string, content: string): Promise<Memory> {
  const res = await fetch(`${API_BASE}/api/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ clientId, content }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.memory;
}

export async function deleteMemory(id: string, clientId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/memory/${encodeURIComponent(id)}?clientId=${encodeURIComponent(clientId)}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
}
