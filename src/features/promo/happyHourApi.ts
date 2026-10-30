import { getApiBaseUrl } from '../../api/config';
import { readJsonSafe } from '../../api/sessionGuard';

export type HappyHourEvent = {
  id: string;
  startsAt: string;
  endsAt: string;
  /** 100 = deposit doubled. */
  bonusPercent: number;
  /** Largest bonus per deposit in ETB; 0 = no cap. */
  maxBonus: number;
  live: boolean;
};

/** Bonus play-through: bet `multiplier` × the bonus on bets with total odds above `minOdds`. */
export type HappyHourRules = { multiplier: number; minOdds: number };

export type HappyHourInfo = { event: HappyHourEvent; rules: HappyHourRules };

/**
 * GET `/v1/promo/happy-hour` — the live or next Happy Hour an admin started. Resolves `null`
 * when there is none (or the request fails), so the card simply stays hidden.
 */
export async function fetchHappyHour(): Promise<HappyHourInfo | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/v1/promo/happy-hour`);
    if (!res.ok) return null;
    const data = await readJsonSafe<{ event?: HappyHourEvent | null; rules?: HappyHourRules }>(res);
    if (!data?.event || !data.rules) return null;
    return { event: data.event, rules: data.rules };
  } catch {
    return null;
  }
}
