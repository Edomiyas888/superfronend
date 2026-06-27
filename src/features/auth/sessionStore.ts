import { create } from 'zustand';
import { getApiBaseUrl } from '../../api/config';
import { isTelegramMiniApp } from '../../lib/telegram/webApp';

const TOKEN_KEY = 'superbet_token';

type SessionState = {
  token: string | null;
  username: string | null;
  phone: string | null;
  telegramUserId: number | null;
  telegramUsername: string | null;
  isTelegramApp: boolean;
  clearSession: () => void;
  hydrate: () => Promise<void>;
  register: (username: string, phone: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  loginWithTelegram: (initData: string) => Promise<{ startParam: string | null; isNew: boolean }>;
  loginWithFirebase: (
    idToken: string,
    opts?: { username?: string; password?: string }
  ) => Promise<{ needsRegistration: true; phone: string } | { needsRegistration: false }>;
  phoneVerify: (
    fpnvToken: string,
    opts?: { username?: string; password?: string }
  ) => Promise<{ needsRegistration: true; phone: string } | { needsRegistration: false }>;
  getAuthHeader: () => Record<string, string>;
};

async function parseAuthResponse(res: Response): Promise<{
  error?: string;
  token?: string;
  user?: {
    id: string;
    username: string;
    phone: string;
    telegramUserId?: number | null;
    telegramUsername?: string;
  };
  startParam?: string | null;
  isNew?: boolean;
}> {
  const text = await res.text();
  try {
    return JSON.parse(text) as {
      error?: string;
      token?: string;
      user?: {
        id: string;
        username: string;
        phone: string;
        telegramUserId?: number | null;
        telegramUsername?: string;
      };
      startParam?: string | null;
      isNew?: boolean;
    };
  } catch {
    return {};
  }
}

export const useSessionStore = create<SessionState>((set, get) => ({
  token: null,
  username: null,
  phone: null,
  telegramUserId: null,
  telegramUsername: null,
  isTelegramApp: isTelegramMiniApp(),

  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('username');
    localStorage.removeItem('phone');
    set({
      token: null,
      username: null,
      phone: null,
      telegramUserId: null,
      telegramUsername: null,
    });
  },

  hydrate: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      localStorage.removeItem('username');
      localStorage.removeItem('phone');
      set({ token: null, username: null, phone: null, telegramUserId: null, telegramUsername: null });
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
        telegramUserId: data.user.telegramUserId ?? null,
        telegramUsername: data.user.telegramUsername ?? null,
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
      telegramUserId: data.user.telegramUserId ?? null,
      telegramUsername: data.user.telegramUsername ?? null,
    });
  },

  loginWithTelegram: async (initData) => {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/v1/auth/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: initData.trim() }),
    });
    const data = await parseAuthResponse(res);
    if (!res.ok) {
      throw new Error(data.error || 'Telegram sign-in failed.');
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
      telegramUserId: data.user.telegramUserId ?? null,
      telegramUsername: data.user.telegramUsername ?? null,
    });
    return {
      startParam: data.startParam ?? null,
      isNew: Boolean(data.isNew),
    };
  },

  loginWithFirebase: async (idToken, opts) => {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/v1/auth/firebase-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: idToken.trim(),
        username: opts?.username?.trim(),
        password: opts?.password,
      }),
    });
    const data = (await parseAuthResponse(res)) as {
      error?: string;
      token?: string;
      user?: { id: string; username: string; phone: string };
      needsRegistration?: boolean;
      phone?: string;
    };
    if (!res.ok) {
      throw new Error(data.error || 'Phone sign-in failed.');
    }
    if (data.needsRegistration) {
      return { needsRegistration: true, phone: data.phone || '' };
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
    return { needsRegistration: false };
  },

  phoneVerify: async (fpnvToken, opts) => {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/v1/auth/phone-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fpnvToken: fpnvToken.trim(),
        username: opts?.username?.trim(),
        password: opts?.password,
      }),
    });
    const data = (await parseAuthResponse(res)) as {
      error?: string;
      token?: string;
      user?: { id: string; username: string; phone: string };
      needsRegistration?: boolean;
      phone?: string;
    };
    if (!res.ok) {
      throw new Error(data.error || 'Phone verification failed.');
    }
    if (data.needsRegistration) {
      return { needsRegistration: true, phone: data.phone || '' };
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
    return { needsRegistration: false };
  },

  getAuthHeader: (): Record<string, string> => {
    const t = get().token ?? localStorage.getItem(TOKEN_KEY);
    return t ? { Authorization: `Bearer ${t}` } : {};
  },
}));
