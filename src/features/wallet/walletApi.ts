import { getApiBaseUrl } from '../../api/config';

export type WalletInfo = {
  balance: number | null;
  currency: string;
  /** `live` when the balance was loaded from the API; `error` on network or HTTP failure. */
  status: 'live' | 'error';
};

export type TelebirrDepositInfo = {
  provider: 'telebirr';
  currency: string;
  recipientName: string;
  recipientPhone: string;
  instructions: string[];
};

export type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  actor: string;
  note: string;
  createdAt: string;
};

export type WalletTransactionsPage = {
  items: WalletTransaction[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type TelebirrDepositResult = {
  balance: number;
  currency: string;
  deposited: number;
  telebirrRef: string;
  verified: {
    amount: number;
    recipient: string;
    paidAt: string;
    transactionType?: string;
    payerName?: string;
    payerPhone?: string;
  };
};

type BalanceJson = { balance?: number; currency?: string; error?: string };
type TxJson = { balance?: number; currency?: string; withdrawn?: number; error?: string };
type TelebirrInfoJson = Partial<TelebirrDepositInfo> & { error?: string };
type TelebirrDepositJson = Partial<TelebirrDepositResult> & { error?: string };

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
 * GET `/v1/wallet/deposit/telebirr/info` — Telebirr payee details for the deposit UI.
 */
export async function fetchTelebirrDepositInfo(
  authHeaders: Record<string, string>
): Promise<TelebirrDepositInfo> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/wallet/deposit/telebirr/info`, { headers: authHeaders });
  const data = (await parseJson<TelebirrInfoJson>(res)) ?? {};
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Could not load Telebirr deposit info.');
  }
  return {
    provider: 'telebirr',
    currency: typeof data.currency === 'string' ? data.currency : 'ETB',
    recipientName: typeof data.recipientName === 'string' ? data.recipientName : 'edoimas Tariku',
    recipientPhone: typeof data.recipientPhone === 'string' ? data.recipientPhone : '0935616694',
    instructions: Array.isArray(data.instructions)
      ? data.instructions.filter((s): s is string => typeof s === 'string')
      : [],
  };
}

/**
 * POST `/v1/wallet/deposit/telebirr` — multipart proof + amount.
 */
export async function depositTelebirr(
  authHeaders: Record<string, string>,
  params: { amount: number; reference?: string; screenshot?: File }
): Promise<TelebirrDepositResult> {
  const base = getApiBaseUrl();
  const form = new FormData();
  form.append('amount', String(params.amount));
  if (params.reference?.trim()) {
    form.append('reference', params.reference.trim());
  }
  if (params.screenshot) {
    form.append('screenshot', params.screenshot);
  }

  const headers: Record<string, string> = {};
  if (authHeaders.Authorization) {
    headers.Authorization = authHeaders.Authorization;
  }

  const res = await fetch(`${base}/v1/wallet/deposit/telebirr`, {
    method: 'POST',
    headers,
    body: form,
  });
  const data = (await parseJson<TelebirrDepositJson>(res)) ?? {};
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Telebirr deposit failed.');
  }

  return {
    balance: typeof data.balance === 'number' ? data.balance : 0,
    currency: typeof data.currency === 'string' ? data.currency : 'ETB',
    deposited: typeof data.deposited === 'number' ? data.deposited : params.amount,
    telebirrRef: typeof data.telebirrRef === 'string' ? data.telebirrRef : '',
    verified: {
      amount: typeof data.verified?.amount === 'number' ? data.verified.amount : params.amount,
      recipient: typeof data.verified?.recipient === 'string' ? data.verified.recipient : '',
      paidAt: typeof data.verified?.paidAt === 'string' ? data.verified.paidAt : '',
      transactionType:
        typeof data.verified?.transactionType === 'string' ? data.verified.transactionType : undefined,
      payerName: typeof data.verified?.payerName === 'string' ? data.verified.payerName : undefined,
      payerPhone: typeof data.verified?.payerPhone === 'string' ? data.verified.payerPhone : undefined,
    },
  };
}

/**
 * GET `/v1/wallet/transactions` — paginated ledger for the signed-in user.
 */
export async function fetchWalletTransactions(
  authHeaders: Record<string, string>,
  params: { page?: number; limit?: number; type?: 'deposit' | 'withdraw' } = {}
): Promise<WalletTransactionsPage> {
  const base = getApiBaseUrl();
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.type) qs.set('type', params.type);

  const res = await fetch(`${base}/v1/wallet/transactions?${qs.toString()}`, {
    headers: authHeaders,
  });
  const data = (await parseJson<Partial<WalletTransactionsPage> & { error?: string }>(res)) ?? {};
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Could not load transactions.');
  }

  return {
    items: Array.isArray(data.items) ? (data.items as WalletTransaction[]) : [],
    page: typeof data.page === 'number' ? data.page : 1,
    limit: typeof data.limit === 'number' ? data.limit : 20,
    total: typeof data.total === 'number' ? data.total : 0,
    totalPages: typeof data.totalPages === 'number' ? data.totalPages : 1,
    hasNext: Boolean(data.hasNext),
    hasPrev: Boolean(data.hasPrev),
  };
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
