import { getApiBaseUrl } from '../../api/config';

export type WalletInfo = {
  balance: number | null;
  currency: string;
  /** `live` when the balance was loaded from the API; `error` on network or HTTP failure. */
  status: 'live' | 'error';
};

type BalanceJson = { balance?: number; currency?: string; error?: string };
type TxJson = { balance?: number; currency?: string; deposited?: number; withdrawn?: number; error?: string };

async function parseJson<T extends Record<string, unknown>>(res: Response): Promise<T | null> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * GET `/v1/wallet/balance` — requires `Authorization: Bearer …`.
 */
export async function fetchBalance(authHeaders: Record<string, string>): Promise<WalletInfo> {
  if (!authHeaders.Authorization) {
    return { balance: null, currency: 'ETB', status: 'error' };
  }
  const base = getApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${base}/v1/wallet/balance`, { headers: authHeaders });
  } catch {
    return { balance: null, currency: 'ETB', status: 'error' };
  }
  const data = (await parseJson<BalanceJson>(res)) ?? {};
  if (!res.ok) {
    return { balance: null, currency: typeof data.currency === 'string' ? data.currency : 'ETB', status: 'error' };
  }
  const balance = typeof data.balance === 'number' && Number.isFinite(data.balance) ? data.balance : 0;
  const currency = typeof data.currency === 'string' ? data.currency : 'ETB';
  return { balance, currency, status: 'live' };
}

/**
 * POST `/v1/wallet/deposit` — body `{ amount }`.
 */
export async function depositWallet(authHeaders: Record<string, string>, amount: number): Promise<{
  balance: number;
  currency: string;
  deposited: number;
}> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/wallet/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ amount }),
  });
  const data = (await parseJson<TxJson>(res)) ?? {};
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Deposit failed.');
  }
  const balance = typeof data.balance === 'number' ? data.balance : 0;
  const currency = typeof data.currency === 'string' ? data.currency : 'ETB';
  const deposited = typeof data.deposited === 'number' ? data.deposited : amount;
  return { balance, currency, deposited };
}

/**
 * POST `/v1/wallet/withdraw` — body `{ amount }`.
 */
export async function withdrawWallet(authHeaders: Record<string, string>, amount: number): Promise<{
  balance: number;
  currency: string;
  withdrawn: number;
}> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/wallet/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ amount }),
  });
  const data = (await parseJson<TxJson>(res)) ?? {};
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Withdraw failed.');
  }
  const balance = typeof data.balance === 'number' ? data.balance : 0;
  const currency = typeof data.currency === 'string' ? data.currency : 'ETB';
  const withdrawn = typeof data.withdrawn === 'number' ? data.withdrawn : amount;
  return { balance, currency, withdrawn };
}
