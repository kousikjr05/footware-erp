const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? '' : 'https://footware-erp.onrender.com');
const BASE = `${API_URL}/api`;

async function request(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
  login: (u, p) => request('POST', '/auth/login', { username: u, password: p }),
};
