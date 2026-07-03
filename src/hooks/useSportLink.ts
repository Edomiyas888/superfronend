import { useMemo } from 'react';
import { useSports } from '../contexts/SportsContext';
import { getDefaultQuickLeagueSlug } from '../constants/sportQuickLeagues';

/** Resolve `/sport/:id?alias=…` for a Swarm sport alias, with safe fallback. */
export function useSportLink(alias: string, period?: string): string {
  const { sports } = useSports();

  return useMemo(() => {
    const sport = sports.find((s) => s.alias.toLowerCase() === alias.toLowerCase());
    if (!sport) return '/sports';

    const params = new URLSearchParams({ alias: sport.alias });
    const defaultLeague = getDefaultQuickLeagueSlug(sport.alias);
    if (defaultLeague) params.set('league', defaultLeague);
    if (period) params.set('period', period);
    return `/sport/${sport.id}?${params.toString()}`;
  }, [sports, alias, period]);
}
