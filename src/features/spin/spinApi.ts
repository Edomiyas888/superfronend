import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApiBaseUrl } from '../../api/config';
import { guardSession, readJsonSafe } from '../../api/sessionGuard';
import { useSessionStore } from '../auth/sessionStore';
import { findSegment, type SpinPrizeId } from './spinRules';

export type SpinEvent = {
  startsAt: string;
  endsAt: string;
  /** Unused spins can be used until then. */
  claimUntil: string;
};

export type SpinStatus = {
  event: SpinEvent;
  /** Null for guests — the event is public, spins are not. */
  player: {
    /** Spins earned and not used yet. */
    available: number;
    earned: number;
    /** Approved deposits submitted during the event hour. */
    deposited: number;
    /** Deposits submitted during the hour and still waiting for review. */
    pending: number;
  } | null;
};

export type SpinResult = {
  prizeId: SpinPrizeId;
  status: SpinStatus;
};

export const SPIN_STATUS_KEY = ['promo', 'spins'] as const;

export type SpinPhase = 'upcoming' | 'live' | 'claim';

export function spinPhase(event: SpinEvent, now: number): SpinPhase {
  if (now < Date.parse(event.startsAt)) return 'upcoming';
  if (now < Date.parse(event.endsAt)) return 'live';
  return 'claim';
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function toStatus(data: Record<string, unknown> | null | undefined): SpinStatus | null {
  const ev = data?.event as Record<string, unknown> | undefined;
  if (!ev || typeof ev.startsAt !== 'string' || typeof ev.endsAt !== 'string' || typeof ev.claimUntil !== 'string') {
    return null;
  }
  return {
    event: { startsAt: ev.startsAt, endsAt: ev.endsAt, claimUntil: ev.claimUntil },
    player:
      data && 'available' in data
        ? {
            available: num(data.available),
            earned: num(data.earned),
            deposited: num(data.deposited),
            pending: num(data.pending),
          }
        : null,
  };
}

/**
 * GET `/v1/promo/spins` (auth optional). Resolves `null` when no event is running (or the
 * API does not have it yet), so every spin surface simply stays hidden.
 */
export async function fetchSpinStatus(authHeaders: Record<string, string>): Promise<SpinStatus | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/v1/promo/spins`, { headers: authHeaders });
    const data = await readJsonSafe(res);
    guardSession(res, data);
    if (!res.ok) return null;
    return toStatus(data);
  } catch {
    return null;
  }
}

/** POST `/v1/promo/spins/spin` — the server picks the prize and credits it before answering. */
export async function spinWheel(authHeaders: Record<string, string>): Promise<SpinResult> {
  const res = await fetch(`${getApiBaseUrl()}/v1/promo/spins/spin`, {
    method: 'POST',
    headers: authHeaders,
  });
  const data = await readJsonSafe<{ prizeId?: string; status?: Record<string, unknown>; error?: string }>(res);
  guardSession(res, data as { code?: string } | null);
  if (!res.ok || !data) {
    throw new Error(data?.error || 'Could not spin. Please try again.');
  }
  const segment = data.prizeId ? findSegment(data.prizeId) : undefined;
  const status = toStatus(data.status);
  if (!segment || !status) throw new Error('Could not spin. Please try again.');
  return { prizeId: segment.id, status };
}

export function useSpinAuthHeaders() {
  const { token, getAuthHeader } = useSessionStore();
  // Stable per token so queries keyed on headers don't refire on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getAuthHeader(), [token]);
}

export function useSpinStatusKey() {
  const username = useSessionStore((s) => s.username);
  return [...SPIN_STATUS_KEY, username ?? 'guest'] as const;
}

export function useSpinStatus() {
  const authHeaders = useSpinAuthHeaders();
  const queryKey = useSpinStatusKey();
  return useQuery({
    queryKey,
    queryFn: () => fetchSpinStatus(authHeaders),
    staleTime: 30_000,
    // Pending deposits get approved by hand; pick the new spins up without a reload.
    refetchInterval: 60_000,
  });
}

/** Current time, re-rendering every second while `active`. */
export function useNowTick(active = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}
