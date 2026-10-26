import WebApp from '@twa-dev/sdk';

let booted = false;

export function isTelegramMiniApp(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(WebApp.platform && WebApp.platform !== 'unknown');
}

export function getTelegramWebApp() {
  return WebApp;
}

export function initTelegramWebApp() {
  if (booted || !isTelegramMiniApp()) return WebApp;
  booted = true;

  WebApp.ready();
  WebApp.expand();

  if (WebApp.colorScheme === 'dark') {
    document.documentElement.classList.add('tma-dark');
  }
  document.documentElement.classList.add('tma');

  const bg = WebApp.themeParams.bg_color;
  if (bg) {
    document.documentElement.style.setProperty('--tma-bg', bg);
  }

  return WebApp;
}

export function getTelegramInitData(): string {
  return WebApp.initData?.trim() ?? '';
}

export function getTelegramStartParam(): string | null {
  const param = WebApp.initDataUnsafe?.start_param?.trim();
  return param || null;
}

export function getTelegramUserLabel(): string {
  const user = WebApp.initDataUnsafe?.user;
  if (!user) return '';
  if (user.username) return `@${user.username}`;
  const parts = [user.first_name, user.last_name].filter(Boolean);
  return parts.join(' ') || 'Telegram user';
}

/**
 * Ask Telegram for the player's own phone number. Resolves Telegram's signed response for the
 * API to verify, or null if they said no or this Telegram version can't do it.
 */
export function requestTelegramPhone(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      WebApp.requestContact((granted, result) => {
        resolve(granted && result?.status === 'sent' ? result.response : null);
      });
    } catch {
      resolve(null);
    }
  });
}

/** Invite code the bot's Open button put on the URL (`?ref=…`), if any. */
export function getInviteCodeFromUrl(): string | null {
  try {
    const code = new URLSearchParams(window.location.search).get('ref')?.trim();
    return code || null;
  } catch {
    return null;
  }
}

export function openTelegramLink(url: string) {
  try {
    WebApp.openTelegramLink(url);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function closeTelegramMiniApp() {
  try {
    WebApp.close();
  } catch {
    /* ignore */
  }
}
