import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { get, post, tokenStore } from './api.js';

const SessionCtx = createContext(null);

export function SessionProvider({ children }) {
  const [state, setState] = useState({ loading: true, me: null, config: null });
  const socketRef = useRef(null);
  const listeners = useRef(new Set());

  const refresh = useCallback(async () => {
    const config = await get('/api/auth/config').catch(() => null);
    if (!tokenStore.get()) return setState({ loading: false, me: null, config });
    try {
      const me = await get('/api/auth/me');
      setState({ loading: false, me, config });
    } catch {
      tokenStore.set(null);
      setState({ loading: false, me: null, config });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // realtime connection while signed in
  useEffect(() => {
    if (!state.me) return undefined;
    const socket = io(import.meta.env.VITE_API_URL || '/', { auth: { token: tokenStore.get() }, transports: ['websocket', 'polling'] });
    socket.onAny((event, data) => listeners.current.forEach((fn) => fn(event, data)));
    socketRef.current = socket;
    return () => socket.disconnect();
  }, [state.me?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email, password) => {
    const { token } = await post('/api/auth/login', { email, password });
    tokenStore.set(token);
    await refresh();
  };
  const signup = async (body) => {
    const { token } = await post('/api/auth/signup', body);
    tokenStore.set(token);
    await refresh();
  };
  const logout = () => { tokenStore.set(null); tokenStore.setAdmin(null); setState((s) => ({ ...s, me: null })); window.location.href = '/login'; };
  const impersonate = async (token) => {
    tokenStore.setAdmin(tokenStore.get());
    tokenStore.set(token);
    window.location.href = '/app';
  };
  const stopImpersonating = () => {
    tokenStore.set(tokenStore.getAdmin());
    tokenStore.setAdmin(null);
    window.location.href = '/admin/tenants';
  };
  const subscribe = useCallback((fn) => { listeners.current.add(fn); return () => listeners.current.delete(fn); }, []);

  return (
    <SessionCtx.Provider value={{ ...state, refresh, login, signup, logout, impersonate, stopImpersonating, subscribe }}>
      {children}
    </SessionCtx.Provider>
  );
}

export const useSession = () => useContext(SessionCtx);

/** Subscribe to realtime events: useRealtime((event, data) => ...) */
export function useRealtime(handler) {
  const { subscribe } = useSession();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => subscribe((e, d) => ref.current(e, d)), [subscribe]);
}

export const can = (me, ...roles) => roles.includes(me?.user?.role);
