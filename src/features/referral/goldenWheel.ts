import type { WheelSegment } from '../spin/spinRules';

const BONUS_DETAIL = 'Added to your bonus balance. Bet it through to unlock it as cash.';

/**
 * Golden Wheel (referral milestones), in wheel order. The server picks the prize with these
 * odds (super-bet-api src/lib/referral/referralRules.js); every prize is bonus.
 */
export const GOLDEN_SEGMENTS: WheelSegment[] = [
  { id: 'golden5000', icon: 'crown', amount: 5000, value: '5,000', kind: 'BONUS', label: '5,000 ETB bonus', detail: BONUS_DETAIL, chance: 100, tone: 'grand' },
  { id: 'golden50', icon: 'coin', amount: 50, value: '50', kind: 'BONUS', label: '50 ETB bonus', detail: BONUS_DETAIL, chance: 70_000, tone: 'base' },
  { id: 'golden250', icon: 'bag', amount: 250, value: '250', kind: 'BONUS', label: '250 ETB bonus', detail: BONUS_DETAIL, chance: 7_000, tone: 'big' },
  { id: 'golden100', icon: 'coins', amount: 100, value: '100', kind: 'BONUS', label: '100 ETB bonus', detail: BONUS_DETAIL, chance: 20_000, tone: 'alt' },
  { id: 'golden1000', icon: 'gem', amount: 1000, value: '1,000', kind: 'BONUS', label: '1,000 ETB bonus', detail: BONUS_DETAIL, chance: 2_900, tone: 'big' },
];
