/**
 * Popular league chips, in display order. The home page opens on the Champions League when it has
 * fixtures in the window, otherwise on the Premier League (see `SportsHomePage`).
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
