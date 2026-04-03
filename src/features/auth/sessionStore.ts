import { create } from 'zustand';
import { getApiBaseUrl } from '../../api/config';

const TOKEN_KEY = 'superbet_token';

type SessionState = {
  token: string | null;
  username: string | null;
  phone: string | null;
  clearSession: () => void;
  hydrate: () => Promise<void>;
  register: (username: string, phone: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  getAuthHeader: () => Record<string, string>;
};

async function parseAuthResponse(res: Response): Promise<{
  error?: string;
  token?: string;
  user?: { id: string; username: string; phone: string };
}> {
  const text = await res.text();
  try {
    return JSON.parse(text) as {
      error?: string;
      token?: string;
      user?: { id: string; username: string; phone: string };
    };
  } catch {
    return {};
  }
}

export const useSessionStore = create<SessionState>((set, get) => ({
  token: null,
  username: null,
  phone: null,

  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('username');
    localStorage.removeItem('phone');
    set({ token: null, username: null, phone: null });
  },

  hydrate: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      localStorage.removeItem('username');
      localStorage.removeItem('phone');
      set({ token: null, username: null, phone: null });
      return;
    }

    const cachedUser = localStorage.getItem('username');
    const cachedPhone = localStorage.getItem('phone');
    set({ token, username: cachedUser, phone: cachedPhone });

    try {
      const res = await fetch(`${getApiBaseUrl()}/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        get().clearSession();
        return;
      }
      const data = await parseAuthResponse(res);
      if (!data.user) {
        get().clearSession();
        return;
      }
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('phone', data.user.phone || '');
      set({
        token,
        username: data.user.username,
        phone: data.user.phone || null,
      });
    } catch {
      get().clearSession();
    }
  },

  register: async (username, phone, password) => {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.trim(),
        phone: phone.trim(),
        password,
      }),
    });
    const data = await parseAuthResponse(res);
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }
    if (!data.token || !data.user) {
      throw new Error('Invalid server response.');
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem('username', data.user.username);
    localStorage.setItem('phone', data.user.phone || '');
    set({
      token: data.token,
      username: data.user.username,
      phone: data.user.phone || null,
    });
  },

  login: async (username, password) => {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password }),
    });
    const data = await parseAuthResponse(res);
    if (!res.ok) {
      throw new Error(data.error || 'Invalid username or password.');
    }
    if (!data.token || !data.user) {
      throw new Error('Invalid server response.');
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem('username', data.user.username);
    localStorage.setItem('phone', data.user.phone || '');
    set({
      token: data.token,
      username: data.user.username,
      phone: data.user.phone || null,
    });
  },

  getAuthHeader: (): Record<string, string> => {
    const t = get().token ?? localStorage.getItem(TOKEN_KEY);
    return t ? { Authorization: `Bearer ${t}` } : {};
  },
}));
