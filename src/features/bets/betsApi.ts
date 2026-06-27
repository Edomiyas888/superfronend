import { getApiBaseUrl } from '../../api/config';
import type { BetslipLike, OddsCorrectionChange, PlaceBetResult } from '../../api/placeBet';

type PaginatedSlips = {
  items: PlacedBetRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PlacedBetRow = {
  id: string;
  coupon: string;
  stake: number;
  possibleWin: number;
  status: string;
  settlementStatus: 'open' | 'won' | 'lost' | 'void';
  winAmount: number;
  settledAt: string | null;
  selections: {
    gameId?: number;
    eventId?: number;
    marketId?: number;
    marketName?: string;
    marketType?: string;
    team1?: string;
    team2?: string;
    pick?: string;
    odds?: number;
    matchTitle?: string;
    legStatus?: 'won' | 'lost' | 'live' | 'pending' | 'void';
  }[];
  createdAt: string;
};

async function parseJson<T>(res: Response): Promise<T & { error?: string; message?: string }> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T & { error?: string; message?: string };
  } catch {
    return {} as T & { error?: string; message?: string };
  }
}

export async function placeBetSlip(
  slip: BetslipLike,
  authHeaders: Record<string, string>,
  opts?: { acceptCorrection?: boolean; bones?: number }
): Promise<PlaceBetResult> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/bets/place`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({
      slip,
      acceptCorrection: opts?.acceptCorrection ?? false,
      bones: opts?.bones ?? 0,
    }),
  });
  const data = await parseJson<PlaceBetResult>(res);
  if (!res.ok) {
    return {
      ok: false,
      error: data.error ?? data.message ?? 'Could not place bet.',
      msg: data.msg,
      code: data.code,
      correction: data.correction,
      changes: data.changes,
    };
  }
  return { ...data, ok: true };
}

export async function correctBetSlip(
  slip: BetslipLike,
  authHeaders: Record<string, string>
): Promise<{ correction: boolean; changes: OddsCorrectionChange[] }> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/bets/correct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ slip }),
  });
  const data = await parseJson<{ correction?: boolean; changes?: OddsCorrectionChange[]; error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error ?? 'Could not refresh odds.');
  }
  return {
    correction: Boolean(data.correction),
    changes: data.changes ?? [],
  };
}

export async function fetchMyBets(
  authHeaders: Record<string, string>,
  params?: { page?: number; limit?: number; settlementStatus?: string }
): Promise<PaginatedSlips> {
  const base = getApiBaseUrl();
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.settlementStatus) q.set('settlementStatus', params.settlementStatus);
  const qs = q.toString();
  const res = await fetch(`${base}/v1/bets/mine${qs ? `?${qs}` : ''}`, {
    headers: authHeaders,
  });
  const data = await parseJson<PaginatedSlips & { error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error ?? 'Could not load bets.');
  }
  return data;
}
