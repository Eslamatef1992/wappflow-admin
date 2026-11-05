import { useCallback, useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL || '';

export const tokenStore = {
  get: () => localStorage.getItem('wappflow_token'),
  set: (t) => (t ? localStorage.setItem('wappflow_token', t) : localStorage.removeItem('wappflow_token')),
  getAdmin: () => localStorage.getItem('wappflow_admin_token'),
  setAdmin: (t) => (t ? localStorage.setItem('wappflow_admin_token', t) : localStorage.removeItem('wappflow_admin_token')),
};

export class ApiError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details; }
}

export async function api(path, { method = 'GET', body, form, raw } = {}) {
  const token = tokenStore.get();
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: form || (body !== undefined ? JSON.stringify(body) : undefined),
  });
  if (raw) return res;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) { tokenStore.set(null); window.location.href = '/login'; }
    throw new ApiError(res.status, data.error || `Request failed (${res.status})`, data.details);
  }
  return data;
}

export const get = (p) => api(p);
export const post = (p, body = {}) => api(p, { method: 'POST', body });
export const put = (p, body) => api(p, { method: 'PUT', body });
export const patch = (p, body) => api(p, { method: 'PATCH', body });
export const del = (p, body) => api(p, { method: 'DELETE', body });

/** Load data and get a reload function. */
export function useApi(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const load = useCallback(async () => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true }));
    try {
      setState({ data: await get(path), error: null, loading: false });
    } catch (e) {
      setState({ data: null, error: e, loading: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load, setData: (fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })) };
}

export async function download(path, filename) {
  const res = await api(path, { raw: true });
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
