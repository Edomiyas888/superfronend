/** Match finixbet `P1XP2MarketTypes` for promoted / 1X2 rows */
export const P1XP2_MARKET_TYPES = ['P1XP2', 'P1P2', '1X12X2', 'MatchWinner', 'MatchResult', 'DoubleChance'];

/** Swarm `where.market.type` for sport/upcoming listings — includes two-way winner markets (MMA, tennis, etc.). */
export const MATCH_RESULT_TYPES = [
  'P1XP2',
  'P1P2',
  'MatchWinner',
  '1X12X2',
  'MatchResult',
  '1X2',
  'ThreeWayResult',
  '3WayResult',
  'FullTimeResult',
  'RegularTimeResult',
  'Result3Way',
];

/** Market types with home/away only (no draw column). */
export const TWO_WAY_RESULT_TYPES = ['P1P2', 'MatchWinner', '1X12X2'] as const;
