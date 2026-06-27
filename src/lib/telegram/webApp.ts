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
