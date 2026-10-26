/**
 * Spin & Win: a live deposit event. Deposits submitted during the event hour earn wheel
 * spins by their total (approved later still counts), never per deposit — splitting 1,000
 * into ten 100s still earns 3 spins, not 10.
 *
 * The server picks every prize and must use exactly these tiers and odds (super-bet-api
 * src/lib/spin/spinRules.js); the app only animates the wheel to the prize it was given
 * and publishes the table below.
 */

export const SPIN_TIERS = [
  { at: 100, spins: 1 },
  { at: 500, spins: 2 },
  { at: 1000, spins: 3 },
] as const;

export const MAX_SPINS_PER_EVENT = 3;

/** Chances below are out of this many spins. */
export const ODDS_BASE = 100_000;

export const GRAND_PRIZE = 50_000;

export type SpinPrizeId =
  | 'cash50000'
  | 'bonus10'
  | 'bonus250'
  | 'bonus20'
  | 'bonus1000'
  | 'bonus15'
  | 'bonus50'
  | 'bonus100'
  | 'keno5';

export type SpinIcon = 'coin' | 'coins' | 'bag' | 'gem' | 'crown' | 'ball';

export type WheelSegment = {
  id: SpinPrizeId;
  icon: SpinIcon;
  /** Big text on the wheel slice. */
  value: string;
  /** Small text under it. */
  kind: string;
  label: string;
  detail: string;
  /** Out of ODDS_BASE. */
  chance: number;
  tone: 'grand' | 'big' | 'base' | 'alt' | 'keno';
  /** ETB, or tickets for the Keno prize. */
  amount: number;
};

const BONUS_DETAIL = 'Added to your bonus balance. Bet it through to unlock it as cash.';

function bonus(amount: number, chance: number, tone: WheelSegment['tone'], icon: SpinIcon): WheelSegment {
  return {
    id: `bonus${amount}` as SpinPrizeId,
    icon,
    amount,
    value: amount.toLocaleString('en-US'),
    kind: 'BONUS',
    label: `${amount.toLocaleString('en-US')} ETB bonus`,
    detail: BONUS_DETAIL,
    chance,
    tone,
  };
}

/** Wheel order, clockwise from the pointer. Slices are equal in size, not in chance. */
export const WHEEL_SEGMENTS: WheelSegment[] = [
  {
    id: 'cash50000',
    icon: 'crown',
    amount: GRAND_PRIZE,
    value: '50,000',
    kind: 'CASH',
    label: `${GRAND_PRIZE.toLocaleString('en-US')} ETB cash`,
    detail: 'Added to your cash balance.',
    chance: 1,
    tone: 'grand',
  },
  bonus(10, 44_000, 'base', 'coin'),
  bonus(250, 800, 'big', 'bag'),
  bonus(20, 15_000, 'alt', 'coins'),
  {
    id: 'keno5',
    icon: 'ball',
    amount: 5,
    value: '5×',
    kind: 'KENO',
    label: '5 free Keno tickets',
    detail: 'Five 2 ETB Fast Keno tickets. Pick your numbers and turn on “Free ticket” in Fast Keno.',
    chance: 10_000,
    tone: 'keno',
  },
  bonus(1000, 199, 'big', 'gem'),
  bonus(15, 20_000, 'base', 'coin'),
  bonus(50, 6_000, 'alt', 'coins'),
  bonus(100, 4_000, 'big', 'bag'),
];

export function findSegment(id: string): WheelSegment | undefined {
  return WHEEL_SEGMENTS.find((s) => s.id === id);
}

/** Spins an event deposit total earns. */
export function spinsForTotal(total: number): number {
  let spins = 0;
  for (const tier of SPIN_TIERS) {
    if (total >= tier.at) spins = tier.spins;
  }
  return spins;
}

/** The next tier above `total`, or null once the maximum is reached. */
export function nextTier(total: number): { at: number; spins: number; remaining: number } | null {
  const tier = SPIN_TIERS.find((t) => total < t.at);
  return tier ? { at: tier.at, spins: tier.spins, remaining: tier.at - total } : null;
}

export function spinsLabel(n: number) {
  return `${n} spin${n === 1 ? '' : 's'}`;
}

const SLICE = 360 / WHEEL_SEGMENTS.length;

/**
 * Wheel rotation that brings slice `index` under the pointer, at least five full turns past
 * `from`. `jitter` (-1…1) moves the stop inside the slice so it doesn't always land dead centre.
 */
export function rotationFor(index: number, from: number, jitter: number) {
  const target = ((360 - index * SLICE) % 360) + jitter * SLICE * 0.32;
  return from - (from % 360) + 360 * 6 + target;
}

/** Whole-birr amounts for spin copy, rounded up so "deposit X more" always reaches the tier. */
export function formatWhole(n: number): string {
  return Math.ceil(n).toLocaleString('en-US');
}

/** Event times as players read them: East Africa time, 24-hour. */
export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    timeZone: 'Africa/Addis_Ababa',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Event day as players read it, e.g. "Tue 27 Oct" (East Africa time). */
export function formatEventDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    timeZone: 'Africa/Addis_Ababa',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
