import { getApiBaseUrl } from '../api/config';

/** Rewrite hosted logo paths to the configured API origin (fixes localhost/wrong-host URLs). */
export function resolveGuessWinLogoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const hosted = /\/v1\/guess-win\/matches\/[^/]+\/logo\/team[12](?:\?|$)/.test(url);
  if (!hosted) return url;
  try {
    const path = new URL(url).pathname;
    return `${getApiBaseUrl()}${path}`;
  } catch {
    if (url.startsWith('/')) return `${getApiBaseUrl()}${url}`;
    return url;
  }
}
