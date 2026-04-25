/**
 * Backend API client.
 * - Reads/writes the session token from sessionStorage so refresh keeps you logged in
 *   for the duration of the tab (cleared when window closes).
 * - Surfaces structured errors with .code so callers can branch on session expiry.
 */

const TOKEN_KEY = 'hisaab.token';

export const tokenStore = {
  get()  { return sessionStorage.getItem(TOKEN_KEY); },
  set(t) { sessionStorage.setItem(TOKEN_KEY, t); },
  clear(){ sessionStorage.removeItem(TOKEN_KEY); }
};

async function request(path, opts = {}) {
  const token = tokenStore.get();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {})
  };
  const res = await fetch(path, { ...opts, headers });
  let body = null;
  try { body = await res.json(); } catch {}

  if (!res.ok) {
    const err = new Error(body?.error || `Request failed: ${res.status}`);
    err.code = body?.code;
    err.status = res.status;
    throw err;
  }
  return body;
}

export const api = {
  login: (userId, password) => request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ userId, password })
  }),

  logout: () => request('/api/auth/logout', { method: 'POST' }),

  me: () => request('/api/auth/me'),

  bootstrap: () => request('/api/chat/bootstrap'),

  chat: ({ text, optionValue }) => request('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ text, optionValue })
  })
};
