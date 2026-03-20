// IMPORTANT: Always use relative /api path.
// Vercel proxies /api/* → Railway server-side.
// This means the user's device NEVER talks to Railway directly —
// so ISP blocks (Jio, BSNL etc.) on Railway's domain have zero effect.
//
// For local dev: the proxy in package.json handles it ("proxy": "http://localhost:8000")
// For production: vercel.json rewrites handle it

const BASE = '/api';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = j.error || j.detail || msg; } catch {}
    throw new Error(msg);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res;
}

export const api = {
  health:        ()         => req('/health/'),
  analytics:     ()         => req('/analytics/'),
  users:         ()         => req('/users/'),
  deleteUser:    (id)       => req(`/users/${id}/delete/`, { method: 'DELETE' }),
  addPhotos:     (id, form) => req(`/users/${id}/photos/`, { method: 'POST', body: form }),
  register:      (form)     => req('/register/',  { method: 'POST', body: form }),
  scan:          (form)     => req('/scan/',       { method: 'POST', body: form }),
  logs:          (p={})     => req('/logs/?' + new URLSearchParams(p).toString()),
  sessions:      (p={})     => req('/sessions/?' + new URLSearchParams(p).toString()),
  exportCSV:     (date)     => req(`/export/?date=${date}`),
  resetPresence: ()         => req('/reset-presence/', { method: 'POST' }),
  aiInsight: (mode, prompt='') =>
    req('/ai-insight/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, prompt }),
    }),
};
