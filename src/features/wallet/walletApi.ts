import { getApiBaseUrl } from '../../api/config';

export type WalletInfo = {
  balance: number | null;
  withdrawable: number | null;
  nonWithdrawable: number | null;
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
  betSlipId?: string | null;
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

export type TelebirrDepositSubmitResult = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  amount: number;
  proofType: 'ref' | 'screenshot';
  telebirrRef: string | null;
  currency: string;
  message: string;
};

export type DepositRequestRow = {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  proofType: 'ref' | 'screenshot';
  telebirrRef: string | null;
  rejectReason: string;
  createdAt: string;
  updatedAt: string;
};

export type DepositRequestsPage = {
  items: DepositRequestRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

/** @deprecated Use TelebirrDepositSubmitResult — kept for reference during migration */
export type TelebirrDepositResult = TelebirrDepositSubmitResult;

type BalanceJson = {
  balance?: number;
  withdrawable?: number;
  nonWithdrawable?: number;
  currency?: string;
  error?: string;
};
type TxJson = {
  balance?: number;
  currency?: string;
  withdrawn?: number;
  message?: string;
  status?: string;
  error?: string;
};
type TelebirrInfoJson = Partial<TelebirrDepositInfo> & { error?: string };
type TelebirrDepositJson = Partial<TelebirrDepositSubmitResult> & { error?: string };
type DepositRequestsJson = Partial<DepositRequestsPage> & { error?: string };

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
    return { balance: null, withdrawable: null, nonWithdrawable: null, currency: 'ETB', status: 'error' };
  }
  const base = getApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${base}/v1/wallet/balance`, { headers: authHeaders });
  } catch {
    return { balance: null, withdrawable: null, nonWithdrawable: null, currency: 'ETB', status: 'error' };
  }
  const data = (await parseJson<BalanceJson>(res)) ?? {};
  if (!res.ok) {
    return {
      balance: null,
      withdrawable: null,
      nonWithdrawable: null,
      currency: typeof data.currency === 'string' ? data.currency : 'ETB',
      status: 'error',
    };
  }
  const balance = typeof data.balance === 'number' && Number.isFinite(data.balance) ? data.balance : 0;
  const withdrawable =
    typeof data.withdrawable === 'number' && Number.isFinite(data.withdrawable)
      ? data.withdrawable
      : balance;
  const nonWithdrawable =
    typeof data.nonWithdrawable === 'number' && Number.isFinite(data.nonWithdrawable)
      ? data.nonWithdrawable
      : 0;
  const currency = typeof data.currency === 'string' ? data.currency : 'ETB';
  return { balance, withdrawable, nonWithdrawable, currency, status: 'live' };
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
 * POST `/v1/wallet/deposit/telebirr` — multipart screenshot + amount (pending review).
 */
export async function submitTelebirrDepositScreenshot(
  authHeaders: Record<string, string>,
  params: { amount: number; screenshot: File; ref?: string }
): Promise<TelebirrDepositSubmitResult> {
  const base = getApiBaseUrl();
  const form = new FormData();
  form.append('amount', String(params.amount));
  form.append('screenshot', params.screenshot);
  if (params.ref?.trim()) form.append('ref', params.ref.trim());

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
    throw new Error(typeof data.error === 'string' ? data.error : 'Telebirr deposit submission failed.');
  }

  return {
    id: typeof data.id === 'string' ? data.id : '',
    status: data.status === 'approved' || data.status === 'rejected' ? data.status : 'pending',
    amount: typeof data.amount === 'number' ? data.amount : params.amount,
    proofType: 'screenshot',
    telebirrRef: typeof data.telebirrRef === 'string' ? data.telebirrRef : null,
    currency: typeof data.currency === 'string' ? data.currency : 'ETB',
    message: typeof data.message === 'string' ? data.message : 'Deposit submitted for review.',
  };
}

/**
 * POST `/v1/wallet/deposit/telebirr/ref` — JSON ref + amount (pending review).
 */
export async function submitTelebirrDepositRef(
  authHeaders: Record<string, string>,
  params: { amount: number; ref: string }
): Promise<TelebirrDepositSubmitResult> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/wallet/deposit/telebirr/ref`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ amount: params.amount, ref: params.ref }),
  });
  const data = (await parseJson<TelebirrDepositJson>(res)) ?? {};
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Telebirr deposit submission failed.');
  }

  return {
    id: typeof data.id === 'string' ? data.id : '',
    status: data.status === 'approved' || data.status === 'rejected' ? data.status : 'pending',
    amount: typeof data.amount === 'number' ? data.amount : params.amount,
    proofType: 'ref',
    telebirrRef: typeof data.telebirrRef === 'string' ? data.telebirrRef : null,
    currency: typeof data.currency === 'string' ? data.currency : 'ETB',
    message: typeof data.message === 'string' ? data.message : 'Deposit submitted for review.',
  };
}

/** @deprecated Use submitTelebirrDepositScreenshot */
export async function depositTelebirr(
  authHeaders: Record<string, string>,
  params: { amount: number; screenshot: File }
): Promise<TelebirrDepositSubmitResult> {
  return submitTelebirrDepositScreenshot(authHeaders, params);
}

/**
 * GET `/v1/wallet/deposit/requests` — user's deposit request history.
 */
export async function fetchDepositRequests(
  authHeaders: Record<string, string>,
  params: { page?: number; limit?: number; status?: 'pending' | 'approved' | 'rejected' } = {}
): Promise<DepositRequestsPage> {
  const base = getApiBaseUrl();
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.status) qs.set('status', params.status);

  const res = await fetch(`${base}/v1/wallet/deposit/requests?${qs.toString()}`, {
    headers: authHeaders,
  });
  const data = (await parseJson<DepositRequestsJson>(res)) ?? {};
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Could not load deposit requests.');
  }

  return {
    items: Array.isArray(data.items) ? (data.items as DepositRequestRow[]) : [],
    page: typeof data.page === 'number' ? data.page : 1,
    limit: typeof data.limit === 'number' ? data.limit : 10,
    total: typeof data.total === 'number' ? data.total : 0,
    totalPages: typeof data.totalPages === 'number' ? data.totalPages : 1,
    hasNext: Boolean(data.hasNext),
    hasPrev: Boolean(data.hasPrev),
  };
}

/**
 * GET `/v1/wallet/transactions` — paginated ledger for the signed-in user.
 */
export async function fetchWalletTransactions(
  authHeaders: Record<string, string>,
  params: { page?: number; limit?: number; type?: 'deposit' | 'withdraw' | 'bets' } = {}
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
 * POST `/v1/wallet/withdraw` — body `{ amount, telebirrPhone? }`.
 */
export async function withdrawWallet(
  authHeaders: Record<string, string>,
  params: { amount: number; telebirrPhone?: string }
): Promise<{
  balance: number;
  currency: string;
  status: string;
  message: string;
}> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/wallet/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({
      amount: params.amount,
      telebirrPhone: params.telebirrPhone?.trim() || undefined,
    }),
  });
  const data = (await parseJson<TxJson>(res)) ?? {};
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Withdraw failed.');
  }
  const balance = typeof data.balance === 'number' ? data.balance : 0;
  const currency = typeof data.currency === 'string' ? data.currency : 'ETB';
  const status = typeof data.status === 'string' ? data.status : 'pending';
  const message =
    typeof data.message === 'string'
      ? data.message
      : 'Withdrawal submitted for review. Your balance has been reserved until approved.';
  return { balance, currency, status, message };
}
