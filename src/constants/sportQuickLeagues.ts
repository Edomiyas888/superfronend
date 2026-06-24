import type { PopularLeagueKey } from './popularLeagues';

export type SportQuickLeagueSlug =
  | ''
  | 'world-cup'
  | 'premier-league'
  | 'bundesliga'
  | 'la-liga'
  | 'serie-a'
  | 'ligue-1'
  | 'champions-league';

export type SportQuickLeagueFilter = {
  slug: SportQuickLeagueSlug;
  label: string;
  /** Passed to `competitionMatchesLeague` — `world-cup` is special. */
  leagueKey?: PopularLeagueKey | 'world-cup';
  featured?: boolean;
};

export const SPORT_QUICK_LEAGUE_FILTERS: SportQuickLeagueFilter[] = [
  { slug: '', label: 'All' },
  { slug: 'world-cup', label: 'World Cup 2026', leagueKey: 'world-cup', featured: true },
  { slug: 'premier-league', label: 'Premier League', leagueKey: 'Premier League' },
  { slug: 'bundesliga', label: 'Bundesliga', leagueKey: 'Bundesliga' },
  { slug: 'la-liga', label: 'La Liga', leagueKey: 'La Liga' },
  { slug: 'serie-a', label: 'Serie A', leagueKey: 'Serie A' },
  { slug: 'ligue-1', label: 'Ligue 1', leagueKey: 'Ligue 1' },
  { slug: 'champions-league', label: 'Champions League', leagueKey: 'UEFA Champions League' },
];

export function isSportQuickLeagueSlug(v: string | null | undefined): v is SportQuickLeagueSlug {
  if (v == null || v === '') return true;
  return SPORT_QUICK_LEAGUE_FILTERS.some((f) => f.slug === v);
}

export function sportQuickLeagueFromSlug(slug: string): SportQuickLeagueFilter {
  return SPORT_QUICK_LEAGUE_FILTERS.find((f) => f.slug === slug) ?? SPORT_QUICK_LEAGUE_FILTERS[0]!;
}
