export interface LoginResponse {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string; isPrimaryAdmin: boolean };
  tenant: { id: string; name: string; document: string };
}

export interface Center { id: string; name: string; active: boolean }
export const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api/v1' : '/api/v1')).replace(/\/$/, '');
const TOKEN_KEY = 'cafe_access_token';
const SESSION_KEY = 'cafe_session';
const CENTER_KEY = 'cafe_center_id';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Não foi possível autenticar. Verifique suas credenciais.');
  }

  localStorage.setItem(TOKEN_KEY, payload.accessToken);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user: payload.user, tenant: payload.tenant }));
  return payload as LoginResponse;
}

export function hasSession(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(CENTER_KEY);
}

export function getStoredSession(): Pick<LoginResponse, 'user' | 'tenant'> | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}

export function getSelectedCenterId(): string { return localStorage.getItem(CENTER_KEY) || ''; }
export function selectCenter(id: string): void { localStorage.setItem(CENTER_KEY, id); }

export async function apiFetch<T>(path: string, init: RequestInit = {}, centerId = getSelectedCenterId()): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${localStorage.getItem(TOKEN_KEY) || ''}`);
  if (centerId) headers.set('X-Center-ID', centerId);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message || 'Falha na requisição.');
  return payload as T;
}
