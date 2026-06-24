/** Swarm alias for football — default In-Play sport filter. */
export const DEFAULT_INPLAY_SPORT_ALIAS = 'Soccer';

export function resolveInPlaySportAlias(param: string | null): string | undefined {
  if (param === 'all') return undefined;
  if (param == null || param === '') return DEFAULT_INPLAY_SPORT_ALIAS;
  return param;
}

export function isDefaultInPlaySport(param: string | null): boolean {
  return param == null || param === '' || param === DEFAULT_INPLAY_SPORT_ALIAS;
}
