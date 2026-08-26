import { useSessionStore } from '../features/auth/sessionStore';

/**
 * Terminate the local session when the server says it is no longer valid.
 *
 * Without this, a token the API has already rejected — expired, or revoked because the
 * account was blocked — keeps living in localStorage and keeps being sent. Every call
 * fails while the UI still renders a signed-in shell, which reads as "the app is broken"
 * rather than "you were signed out", and leaves a dead credential on the device.
 *
 * Side-effect only: it never changes the response or throws, so call sites keep whatever
 * error handling they already have.
 *
 * @param res     the fetch Response
 * @param payload the parsed JSON body, when the caller already has it
 */
export function guardSession(res: Response, payload?: { code?: string } | null): void {
  if (res.ok) return;

  const state = useSessionStore.getState();
  // Nothing to tear down for calls made while signed out (login, public reads).
  if (!state.token) return;

  if (res.status === 403 && payload?.code === 'ACCOUNT_BLOCKED') {
    state.markAccountBlocked();
    return;
  }
  if (res.status === 401) {
    state.clearSession();
  }
}

/** Read a response as JSON without throwing on an empty or non-JSON body. */
export async function readJsonSafe<T = Record<string, unknown>>(res: Response): Promise<T | null> {
  try {
    return (await res.clone().json()) as T;
  } catch {
    return null;
  }
}
