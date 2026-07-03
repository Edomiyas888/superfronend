import type { PopularLeagueKey } from './popularLeagues';

export type SoccerQuickLeagueSlug =
  | ''
  | 'world-cup'
  | 'premier-league'
  | 'bundesliga'
  | 'la-liga'
  | 'serie-a'
  | 'ligue-1'
  | 'champions-league';

export type MmaQuickLeagueSlug = '' | 'ufc' | 'bellator' | 'pfl';

export type SportQuickLeagueSlug = SoccerQuickLeagueSlug | MmaQuickLeagueSlug;

export type SportQuickLeagueFilter = {
  slug: SportQuickLeagueSlug;
  label: string;
  /** Passed to `competitionMatchesLeague` — `world-cup` is special. */
  leagueKey?: PopularLeagueKey | 'world-cup' | 'UFC' | 'Bellator' | 'PFL';
  featured?: boolean;
};

export const SOCCER_QUICK_LEAGUE_FILTERS: SportQuickLeagueFilter[] = [
  { slug: '', label: 'All' },
  { slug: 'world-cup', label: 'World Cup 2026', leagueKey: 'world-cup', featured: true },
  { slug: 'premier-league', label: 'Premier League', leagueKey: 'Premier League' },
  { slug: 'bundesliga', label: 'Bundesliga', leagueKey: 'Bundesliga' },
  { slug: 'la-liga', label: 'La Liga', leagueKey: 'La Liga' },
  { slug: 'serie-a', label: 'Serie A', leagueKey: 'Serie A' },
  { slug: 'ligue-1', label: 'Ligue 1', leagueKey: 'Ligue 1' },
  { slug: 'champions-league', label: 'Champions League', leagueKey: 'UEFA Champions League' },
];

export const MMA_QUICK_LEAGUE_FILTERS: SportQuickLeagueFilter[] = [
  { slug: 'ufc', label: 'UFC', leagueKey: 'UFC', featured: true },
  { slug: '', label: 'All MMA' },
  { slug: 'bellator', label: 'Bellator', leagueKey: 'Bellator' },
  { slug: 'pfl', label: 'PFL', leagueKey: 'PFL' },
];

/** @deprecated Use `getSportQuickLeagueFilters` — soccer filters only. */
export const SPORT_QUICK_LEAGUE_FILTERS = SOCCER_QUICK_LEAGUE_FILTERS;

function normAlias(alias?: string | null): string {
  return alias?.trim().toLowerCase() ?? '';
}

export function isMmaSportAlias(alias?: string | null): boolean {
  const a = normAlias(alias);
  return a === 'mma' || a === 'mixed martial arts';
}

export function getSportQuickLeagueFilters(sportAlias?: string | null): SportQuickLeagueFilter[] {
  return isMmaSportAlias(sportAlias) ? MMA_QUICK_LEAGUE_FILTERS : SOCCER_QUICK_LEAGUE_FILTERS;
}

/** Default quick-league chip when opening a sport page with no `league` query param. */
export function getDefaultQuickLeagueSlug(sportAlias?: string | null): SportQuickLeagueSlug {
  return isMmaSportAlias(sportAlias) ? 'ufc' : '';
}

export function isSportQuickLeagueSlug(
  v: string | null | undefined,
  sportAlias?: string | null
): v is SportQuickLeagueSlug {
  if (v == null || v === '') return true;
  return getSportQuickLeagueFilters(sportAlias).some((f) => f.slug === v);
}

export function sportQuickLeagueFromSlug(
  slug: string,
  sportAlias?: string | null
): SportQuickLeagueFilter {
  const filters = getSportQuickLeagueFilters(sportAlias);
  return filters.find((f) => f.slug === slug) ?? filters[0]!;
}

function leagueParamFromSlug(slug: SportQuickLeagueSlug): string {
  return slug === '' ? 'all' : slug;
}

export function resolveQuickLeagueSlug(
  leagueParam: string | null | undefined,
  sportAlias?: string | null
): SportQuickLeagueSlug {
  const trimmed = leagueParam?.trim() ?? '';
  const fallback = getDefaultQuickLeagueSlug(sportAlias);
  if (!trimmed) return fallback;
  if (trimmed === 'all') return '';
  if (isSportQuickLeagueSlug(trimmed, sportAlias)) return trimmed;
  return fallback;
}

/** Map chip slug to URL `league` query value. */
export function quickLeagueToParam(slug: SportQuickLeagueSlug): string {
  return leagueParamFromSlug(slug);
}

/** Build sport page query string, including MMA default league. */
export function sportPageSearchParams(
  alias: string,
  extra?: Record<string, string | undefined>
): string {
  const params = new URLSearchParams({ alias });
  const defaultLeague = getDefaultQuickLeagueSlug(alias);
  if (defaultLeague) params.set('league', defaultLeague);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) params.set(key, value);
    }
  }
  return params.toString();
}
