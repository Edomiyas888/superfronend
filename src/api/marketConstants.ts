/** Match finixbet `P1XP2MarketTypes` for promoted / 1X2 rows */
export const P1XP2_MARKET_TYPES = ['P1XP2', 'P1P2', '1X12X2', 'MatchWinner', 'MatchResult', 'DoubleChance'];

/** `UpcomingByDay.jsx` MATCH_RESULT_TYPES — required `where.market` so Swarm returns games with odds */
export const MATCH_RESULT_TYPES = [
  'P1XP2',
  'MatchResult',
  '1X2',
  'ThreeWayResult',
  '3WayResult',
  'FullTimeResult',
  'RegularTimeResult',
  'Result3Way',
];

/** Double chance markets (distinct from Match Result — three outcomes are 1X / 12 / X2). */
export const DOUBLE_CHANCE_MARKET_TYPES = [
  'DoubleChance',
  '1X12X2',
  'Double_Chance',
  'Double_chance',
  'DC',
];

/**
 * Markets to subscribe to for fixture lists that show both 1/X/2 and double chance columns.
 * (Match-result-only queries omit DC, so extraction always returns undefined and cells show placeholders.)
 */
export const MATCH_ROW_MARKET_TYPES = Array.from(
  new Set<string>([...MATCH_RESULT_TYPES, ...DOUBLE_CHANCE_MARKET_TYPES]),
);
