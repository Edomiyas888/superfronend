import { getApiBaseUrl } from '../../api/config';
import { readJsonSafe } from '../../api/sessionGuard';

export type HappyHourEvent = {
  id: string;
  /** `deposit`: bonus on each deposit. `keno`: deposit, play Fast Keno, get part of the losses back. */
  kind: 'deposit' | 'keno';
  startsAt: string;
  endsAt: string;
  /** Deposit: 100 = deposit doubled. Keno: cashback percent. */
  bonusPercent: number;
  /** Largest bonus per deposit (keno: cashback per player) in ETB; 0 = no cap. */
  maxBonus: number;
  live: boolean;
};

/** Bonus play-through: bet `multiplier` × the bonus on bets with total odds above `minOdds`. */
export type HappyHourRules = { multiplier: number; minOdds: number };

/** A signed-in player's Keno Happy Hour so far (cash tickets in the window). */
export type KenoCashbackProgress = {
  deposited: number;
  depositPending: boolean;
  staked: number;
  won: number;
  cashback: number;
};

export type HappyHourInfo = { event: HappyHourEvent; rules: HappyHourRules; me: KenoCashbackProgress | null };

/**
 * GET `/v1/promo/happy-hour` — the live or next Happy Hour an admin started. Resolves `null`
 * when there is none (or the request fails), so the card simply stays hidden. Signed in during
 * a live Keno Happy Hour, `me` is the player's cashback so far.
 */
export async function fetchHappyHour(authHeaders: Record<string, string> = {}): Promise<HappyHourInfo | null> {
  try {
    const url = `${getApiBaseUrl()}/v1/promo/happy-hour`;
    let res = await fetch(url, { headers: authHeaders });
    // An expired session should not hide the event: ask again as a guest.
    if (res.status === 401 && Object.keys(authHeaders).length) res = await fetch(url);
    if (!res.ok) return null;
    const data = await readJsonSafe<{ event?: HappyHourEvent | null; rules?: HappyHourRules; me?: KenoCashbackProgress }>(res);
    if (!data?.event || !data.rules) return null;
    return { event: { ...data.event, kind: data.event.kind ?? 'deposit' }, rules: data.rules, me: data.me ?? null };
  } catch {
    return null;
  }
}
