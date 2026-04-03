/** Same order as finixbet `TopLeagues` — default selection is first (Premier League). */
export const POPULAR_LEAGUE_KEYS = [
  'Premier League',
  'Bundesliga',
  'La Liga',
  'Serie A',
  'Ligue 1',
  'UEFA Champions League',
  'UEFA Europa League',
  'UEFA Europa Conference League',
  'FA Cup',
  'Primeira Liga',
  'Eredivisie',
] as const;

export type PopularLeagueKey = (typeof POPULAR_LEAGUE_KEYS)[number];
