import { useQuery } from '@tanstack/react-query';
import { restGetUpcomingMatches } from '../api/restSports';

/** Finix `UpcomingByDay` default: Soccer, next 12h, prematch types + Match Result markets */
export function useUpcomingMatches(
  sportAlias = 'Soccer',
  timeHours: string | number = '12',
  enabled = true
) {
  return useQuery({
    queryKey: ['upcoming-matches', sportAlias, timeHours],
    queryFn: () => restGetUpcomingMatches({ sportAlias, timeHours }),
    enabled,
    refetchInterval: 30_000,
    retry: 2,
  });
}
