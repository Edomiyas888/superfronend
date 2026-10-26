import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApiBaseUrl } from '../../api/config';
import { guardSession, readJsonSafe } from '../../api/sessionGuard';
import { useSessionStore } from '../auth/sessionStore';

export type ReferralFriend = {
  id: string;
  name: string;
  status: 'joined' | 'rewarded' | 'held' | 'rejected';
  joinedAt: string;
  phoneVerified: boolean;
  /** Approved deposits so far, capped at the 100 ETB that counts. */
  deposited: number;
  reward: number;
};

export type ReferralMilestone = { level: number; bonus: number; goldenSpins: number; reached: boolean };

export type ReferralSummary = {
  phoneVerified: boolean;
  code: string | null;
  link: string | null;
  rewardPerFriend: number;
  earned: number;
  counts: { joined: number; rewarded: number; waiting: number; held: number };
  milestones: ReferralMilestone[];
  goldenSpins: number;
  friends: ReferralFriend[];
};

export type LeaderboardRow = { rank: number; player: string; friends: number };

export const REFERRAL_KEY = ['referrals', 'me'] as const;
export const QUALIFY_DEPOSIT = 100;

async function getJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, init);
  const data = await readJsonSafe<T & { error?: string; code?: string }>(res);
  guardSession(res, data);
  if (!res.ok || !data) throw new Error(data?.error || 'Something went wrong. Please try again.');
  return data;
}

export function useAuthHeaders() {
  const { token, getAuthHeader } = useSessionStore();
  // Stable per token so queries keyed on headers don't refire on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getAuthHeader(), [token]);
}

export function useReferralSummary() {
  const username = useSessionStore((s) => s.username);
  const headers = useAuthHeaders();
  return useQuery({
    queryKey: [...REFERRAL_KEY, username ?? 'guest'],
    queryFn: () => getJson<ReferralSummary>('/v1/referrals/me', { headers }),
    enabled: Boolean(username),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useReferralLeaderboard() {
  return useQuery({
    queryKey: ['referrals', 'leaderboard'],
    queryFn: () => getJson<{ items: LeaderboardRow[] }>('/v1/referrals/leaderboard').then((d) => d.items),
    staleTime: 60_000,
  });
}

/** `phoneVerified` / `referred` from /v1/auth/me — drives the phone prompt. */
export function useAccountFlags() {
  const username = useSessionStore((s) => s.username);
  const headers = useAuthHeaders();
  return useQuery({
    queryKey: ['auth', 'me', username ?? 'guest'],
    queryFn: () =>
      getJson<{ user: { phoneVerified?: boolean; referred?: boolean } }>('/v1/auth/me', { headers }).then((d) => ({
        phoneVerified: Boolean(d.user.phoneVerified),
        referred: Boolean(d.user.referred),
      })),
    enabled: Boolean(username),
    staleTime: 60_000,
  });
}

/** Send Telegram's signed phone share to the API. */
export function verifyTelegramPhone(headers: Record<string, string>, response: string) {
  return getJson<{ phone: string; phoneVerified: boolean }>('/v1/auth/telegram-phone', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ response }),
  });
}

export function spinGoldenWheel(headers: Record<string, string>) {
  return getJson<{ prizeId: string; goldenSpins: number }>('/v1/referrals/golden-spin', { method: 'POST', headers });
}
