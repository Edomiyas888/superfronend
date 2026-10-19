/**
 * Popular league chips, in display order — default selection is first (English Premier League),
 * with the Champions League beside it.
 */
export const POPULAR_LEAGUE_KEYS = [
  'Premier League',
  'UEFA Champions League',
  'Bundesliga',
  'La Liga',
  'Serie A',
  'Ligue 1',
  'UEFA Europa League',
  'UEFA Europa Conference League',
  'FA Cup',
  'Primeira Liga',
  'Eredivisie',
] as const;

export type PopularLeagueKey = (typeof POPULAR_LEAGUE_KEYS)[number];
