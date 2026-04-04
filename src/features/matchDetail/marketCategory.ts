import type { MarketView } from '../../api/types';

/** UI filter buckets for match detail markets (keyword-based on market name / display key). */
export type MarketCategoryId =
  | 'all'
  | 'match'
  | 'goals'
  | 'corners'
  | 'cards'
  | 'halves'
  | 'players'
  | 'handicap'
  | 'other';

export const MARKET_FILTER_ORDER: MarketCategoryId[] = [
  'all',
  'match',
  'goals',
  'corners',
  'cards',
  'halves',
  'players',
  'handicap',
  'other',
];

export const MARKET_FILTER_LABELS: Record<Exclude<MarketCategoryId, 'all'>, string> = {
  match: 'Match',
  goals: 'Goals',
  corners: 'Corners',
  cards: 'Cards',
  halves: 'Halves / periods',
  players: 'Players',
  handicap: 'Handicap',
  other: 'Other',
};

/**
 * Best-effort category from API market name (and optional display_key).
 * Order of checks matters (e.g. "first half" before generic "goal").
 */
export function marketCategory(m: MarketView): Exclude<MarketCategoryId, 'all'> {
  const n = `${m.name} ${m.displayKey ?? ''}`.toLowerCase();

  if (/\bcorner|corners\b/.test(n)) return 'corners';
  if (/booking|bookings|card\b|cards\b|yellow|red card|sending off/.test(n)) return 'cards';
  if (/1st half|2nd half|first half|second half|half time|halftime|period \d|quarter|set \d|inning/.test(n))
    return 'halves';
  if (/\bhandicap\b|asian h|spread\b|hcap\b|\bah\b/.test(n)) return 'handicap';
  if (/scorer|goalscorer|any time|anytime|player to score|to score|player props/.test(n)) return 'players';
  if (
    /\bgoal\b|goals\b|over|under|o\/u|btts|both teams|total goal|team goal|exact goal|multi goal|clean sheet/.test(n)
  )
    return 'goals';
  if (
    /match result|1x2|double chance|dnb|draw no bet|winner|to win the match|match odds|full time result|outright/.test(n)
  )
    return 'match';

  return 'other';
}
