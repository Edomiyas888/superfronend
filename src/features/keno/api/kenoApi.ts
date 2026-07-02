import { getApiBaseUrl } from '@/api/config';

export type KenoPublicState = {
  roundNo: number;
  phase: 'betting' | 'drawing' | 'settled';
  countdown: number;
  calledNumbers: number[];
  simulatedCount: number;
  realPlayers: number;
  displayedTotalPlayers: number;
  allBets: Array<{
    betId: string;
    roundNo: number;
    userId: string;
    username?: string;
    betAmount: number;
    selectedNumbers: number[];
    timestamp: number;
  }>;
  myBets: KenoPublicState['allBets'];
  roundsHistory: Record<
    string,
    {
      roundNo: number;
      calledNumbers: number[];
      numbers: number[];
      timestamp: number;
      bets: Record<string, unknown>;
    }
  >;
};

export type PlaceKenoBetPayload = {
  betAmount: number;
  selectedNumbers: number[];
};

export type PlaceKenoBetResult = {
  success: boolean;
  betId?: string;
  roundNo?: number;
  kenoBetId?: string;
  newBalance?: number;
  message?: string;
  wallet?: {
    balance: number;
    withdrawable: number;
    nonWithdrawable: number;
  };
};

export async function fetchKenoState(
  authHeaders?: Record<string, string>
): Promise<KenoPublicState> {
  const res = await fetch(`${getApiBaseUrl()}/v1/keno/state`, {
    headers: { ...authHeaders },
  });
  if (!res.ok) {
    throw new Error('Could not load Keno game state.');
  }
  return res.json() as Promise<KenoPublicState>;
}

export async function placeKenoBet(
  authHeaders: Record<string, string>,
  payload: PlaceKenoBetPayload
): Promise<PlaceKenoBetResult> {
  const res = await fetch(`${getApiBaseUrl()}/v1/keno/bets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as PlaceKenoBetResult & { error?: string; message?: string };
  if (!res.ok) {
    return {
      success: false,
      message: data.message ?? data.error ?? 'Could not place bet.',
    };
  }
  return data;
}

export async function checkKenoTicket(code: string) {
  const res = await fetch(
    `${getApiBaseUrl()}/v1/keno/tickets/check?code=${encodeURIComponent(code)}`
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? 'Ticket not found.');
  }
  return data;
}

export async function fetchKenoMonthlyLeaderboard(limit = 100) {
  const res = await fetch(`${getApiBaseUrl()}/v1/keno/leaderboard/monthly?limit=${limit}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? 'Could not load leaderboard.');
  }
  return data.data as Array<{ rank: number; userId: string; username: string; points: number }>;
}

export async function fetchKenoWeeklyLeaderboard(limit = 100) {
  const res = await fetch(`${getApiBaseUrl()}/v1/keno/leaderboard/weekly?limit=${limit}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? 'Could not load leaderboard.');
  }
  return data.data as Array<{ rank: number; userId: string; username: string; points: number }>;
}
