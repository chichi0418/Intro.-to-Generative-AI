const API_BASE = import.meta.env.VITE_API_URL ?? '';
const TOKEN_KEY = 'authToken';
const USERNAME_KEY = 'authUsername';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function saveAuth(token: string, username: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function postAuth(path: string, body: { username: string; password: string }) {
  const res = await fetch(`${API_BASE}/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as { token: string; username: string };
}

export async function register(username: string, password: string) {
  const data = await postAuth('register', { username, password });
  saveAuth(data.token, data.username);
  return data;
}

export async function login(username: string, password: string) {
  const data = await postAuth('login', { username, password });
  saveAuth(data.token, data.username);
  return data;
}

export function logout() {
  clearAuth();
}
