type FetchWithRetryOptions = {
  retries?: number;
  delayMs?: number;
  timeoutMs?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('load failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('networkerror') ||
    msg.includes('timed out') ||
    msg.includes('timeout')
  );
}

export function mapFetchErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const msg = error.message.toLowerCase();
  if (
    msg.includes('load failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror')
  ) {
    return 'Could not reach Super Bet server. Wait a few seconds and try again.';
  }
  if (msg.includes('timed out') || msg.includes('timeout')) {
    return 'Super Bet server is waking up. Please try again.';
  }
  return error.message || fallback;
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: FetchWithRetryOptions = {},
): Promise<Response> {
  const retries = options.retries ?? 2;
  const delayMs = options.delayMs ?? 1200;
  const timeoutMs = options.timeoutMs ?? 25_000;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      return res;
    } catch (error) {
      window.clearTimeout(timeoutId);
      lastError = error;
      if (attempt >= retries || !isRetryableFetchError(error)) {
        throw error;
      }
      await sleep(delayMs * (attempt + 1));
    }
  }

  throw lastError;
}

/** Wake Render free-tier API before auth-sensitive requests. */
export async function pingApiHealth(baseUrl: string) {
  try {
    await fetchWithRetry(
      `${baseUrl.replace(/\/$/, '')}/health`,
      { method: 'GET' },
      { retries: 1, delayMs: 800, timeoutMs: 20_000 },
    );
  } catch {
    // Best-effort — auth retry handles remaining failures.
  }
}
