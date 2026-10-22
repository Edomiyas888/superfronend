import type { BetslipEventLike } from '../../api/placeBet';
import type { FreeBetInfo, FreeBetRules } from '../wallet/walletApi';

export type FreeBetSlipCheck = {
  legs: number;
  legsOk: boolean;
  totalOdds: number;
  totalOddsOk: boolean;
  /** Selections priced under the per-leg minimum. */
  lowOddsTitles: string[];
  hasLive: boolean;
  ok: boolean;
};

/**
 * Mirror of the server's free bet rules so the slip can show a live checklist.
 * The server re-checks everything against live prices — this is guidance only.
 */
export function checkFreeBetSlip(
  events: Record<string, BetslipEventLike>,
  rules: FreeBetRules,
  liveGameIds: Set<string>
): FreeBetSlipCheck {
  const list = Object.values(events);
  const totalOdds = list.reduce((acc, ev) => acc * (ev.price || 1), 1);
  const lowOddsTitles = list
    .filter((ev) => !(ev.price >= rules.minLegOdds))
    .map((ev) => ev.title || `${ev.teamone} v ${ev.teamtwo}`);
  const hasLive = list.some((ev) => ev.isLive || liveGameIds.has(String(ev.gameId)));
  const legsOk = list.length >= rules.minLegs;
  const totalOddsOk = totalOdds >= rules.minTotalOdds;
  return {
    legs: list.length,
    legsOk,
    totalOdds,
    totalOddsOk,
    lowOddsTitles,
    hasLive,
    ok: legsOk && totalOddsOk && lowOddsTitles.length === 0 && !hasLive,
  };
}

/** What a free bet pays: stake not returned, then capped. */
export function freeBetNetWin(amount: number, totalOdds: number, maxWin: number): number {
  const net = Math.max(0, amount * totalOdds - amount);
  return maxWin > 0 ? Math.min(net, maxWin) : net;
}

export function isFreeBetUsable(freeBet: FreeBetInfo | null | undefined): boolean {
  return Boolean(freeBet && freeBet.status === 'active' && new Date(freeBet.expiresAt).getTime() > Date.now());
}

/** "3 days" / "5 hours" until the free bet expires. */
export function formatTimeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (!(ms > 0)) return 'expired';
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 48) return `${Math.floor(hours / 24)} days`;
  if (hours >= 1) return `${hours} hour${hours === 1 ? '' : 's'}`;
  return 'less than an hour';
}
