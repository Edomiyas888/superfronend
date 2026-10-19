import { useMemo } from 'react';
import { useSports } from '../contexts/SportsContext';
import { getDefaultQuickLeagueSlug } from '../constants/sportQuickLeagues';

/**
 * Resolve `/sport/:id?alias=…` for a Swarm sport alias, with safe fallback. `league` picks a quick
 * league chip (e.g. `champions-league`) instead of the sport's default.
 */
export function useSportLink(alias: string, period?: string, league?: string): string {
  const { sports } = useSports();

  return useMemo(() => {
    const sport = sports.find((s) => s.alias.toLowerCase() === alias.toLowerCase());
    if (!sport) return '/sports';

    const params = new URLSearchParams({ alias: sport.alias });
    const leagueSlug = league ?? getDefaultQuickLeagueSlug(sport.alias);
    if (leagueSlug) params.set('league', leagueSlug);
    if (period) params.set('period', period);
    return `/sport/${sport.id}?${params.toString()}`;
  }, [sports, alias, period, league]);
}
