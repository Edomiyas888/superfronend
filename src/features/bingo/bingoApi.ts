import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApiBaseUrl } from '../../api/config';
import { guardSession, readJsonSafe } from '../../api/sessionGuard';
import { useSessionStore } from '../auth/sessionStore';

/** 5 rows of [B, I, N, G, O]; 0 is the free centre. */
export type BingoCard = number[][];

export type BingoPhase = 'open' | 'countdown' | 'calling' | 'claiming' | 'settled' | 'void';

export type BingoRoom = {
  stake: number;
  roundNo: number | null;
  phase: BingoPhase;
  /** Seconds left before calling starts (countdown phase). */
  countdown: number;
  nextCallInMs: number;
  claimEndsInMs: number;
  /** Seconds the result stays up before the next round opens. */
  resultInSec: number;
  calledNumbers: number[];
  lastBall: number | null;
  playerCount: number;
  /** Of `playerCount`, how many are the house's PC players. */
  pcCount: number;
  takenCards: number[];
  pot: number;
  /** What the winner(s) share: the pot after the house cut. */
  prize: number;
  winners: Array<{ username: string; cardNo: number; pattern: string; amount: number; isPc?: boolean }>;
  voidReason: 'not_enough_players' | 'no_winner' | null;
};

export type BingoEntryStatus = 'pending' | 'active' | 'claimed' | 'won' | 'lost' | 'disqualified';

export type MyBingoEntry = {
  roundNo: number;
  cardNo: number;
  status: BingoEntryStatus;
  pattern: string | null;
  winnings: number;
};

export type BingoState = {
  serverTime: number;
  minPlayers: number;
  /** House PC players that join as soon as a real player buys a card (0 = off). */
  pcPlayers: number;
  houseCut: number;
  callIntervalMs: number;
  rooms: BingoRoom[];
  /** Keyed by stake; only rooms where this player has a card in the current round. */
  myEntries: Record<string, MyBingoEntry>;
};

export type BingoWallet = { balance: number; withdrawable: number; nonWithdrawable: number };

export class BingoPlayError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message);
    this.name = 'BingoPlayError';
  }
}

export async function fetchBingoCards(): Promise<BingoCard[]> {
  const res = await fetch(`${getApiBaseUrl()}/v1/bingo/cards`);
  const data = await readJsonSafe<{ cards?: BingoCard[] }>(res);
  if (!res.ok || !data?.cards) throw new Error('Could not load Super Bingo cards.');
  return data.cards;
}

export async function fetchBingoState(authHeaders: Record<string, string>): Promise<BingoState> {
  const res = await fetch(`${getApiBaseUrl()}/v1/bingo/state`, { headers: authHeaders });
  const data = await readJsonSafe<BingoState>(res);
  guardSession(res, data as { code?: string } | null);
  if (!res.ok || !data) throw new Error('Could not load Super Bingo.');
  return data;
}

async function postPlay<T>(path: string, authHeaders: Record<string, string>, body: unknown, fallback: string) {
  const res = await fetch(`${getApiBaseUrl()}/v1/bingo/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(body),
  });
  const data = await readJsonSafe<T & { message?: string; error?: string; code?: string }>(res);
  guardSession(res, data as { code?: string } | null);
  if (!res.ok || !data) {
    throw new BingoPlayError(data?.message || data?.error || fallback, data?.code);
  }
  return data;
}

/** POST `/v1/bingo/join` — buy a card in the current round of a stake room. */
export function joinBingo(authHeaders: Record<string, string>, stake: number, cardNo: number) {
  return postPlay<{ roundNo: number; cardNo: number; wallet: BingoWallet }>(
    'join',
    authHeaders,
    { stake, cardNo },
    'Could not buy the card.'
  );
}

/** POST `/v1/bingo/claim` — call BINGO; `valid: false` means the card is out of the round. */
export function claimBingo(authHeaders: Record<string, string>, stake: number) {
  return postPlay<{ valid: boolean; pattern?: string; roundNo: number }>(
    'claim',
    authHeaders,
    { stake },
    'Could not check your BINGO.'
  );
}

export function useBingoAuthHeaders() {
  const { token, getAuthHeader } = useSessionStore();
  // Stable per token so effects keyed on headers don't refire on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getAuthHeader(), [token]);
}

export function useBingoCards() {
  return useQuery({
    queryKey: ['bingo', 'cards'],
    queryFn: fetchBingoCards,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

function wsUrl() {
  return `${getApiBaseUrl().replace(/^http/i, 'ws')}/v1/bingo/ws`;
}

/**
 * Live Super Bingo state over the WebSocket, signed in with the session token so the player's own
 * cards come along. Falls back to polling the HTTP state while the socket is down.
 */
export function useBingoState() {
  const token = useSessionStore((s) => s.token);
  const authHeaders = useBingoAuthHeaders();
  const [state, setState] = useState<BingoState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const headersRef = useRef(authHeaders);
  headersRef.current = authHeaders;

  const refresh = useMemo(
    () => () =>
      fetchBingoState(headersRef.current)
        .then((s) => {
          setState(s);
          setError(null);
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load Super Bingo.')),
    []
  );

  useEffect(() => {
    let ws: WebSocket | null = null;
    let closed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const connect = () => {
      ws = new WebSocket(wsUrl());
      ws.onopen = () => {
        attempt = 0;
        setConnected(true);
        if (token) ws?.send(JSON.stringify({ type: 'auth', token }));
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as { type?: string; data?: BingoState };
          if (msg.type === 'state' && msg.data) {
            setState(msg.data);
            setError(null);
          }
        } catch {
          /* ignore malformed frames */
        }
      };
      ws.onclose = () => {
        setConnected(false);
        if (closed) return;
        attempt += 1;
        retry = setTimeout(connect, Math.min(10_000, 1000 * attempt));
      };
      ws.onerror = () => ws?.close();
    };

    void refresh();
    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      ws?.close();
    };
  }, [token, refresh]);

  useEffect(() => {
    if (connected) return;
    const id = setInterval(() => void refresh(), 2000);
    return () => clearInterval(id);
  }, [connected, refresh]);

  return { state, error, refresh };
}
