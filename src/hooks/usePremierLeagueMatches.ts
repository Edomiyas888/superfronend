import { useQuery } from '@tanstack/react-query';
import { restGetPremierLeagueMatches } from '../api/restSports';
import type { DateFilterKey } from '../constants/dateFilters';

export function usePremierLeagueMatches(dateFilter: DateFilterKey = 'all') {
  return useQuery({
    queryKey: ['premier-league-matches', dateFilter],
    queryFn: () => restGetPremierLeagueMatches({ timeHours: dateFilter }),
    refetchInterval: 30_000,
    retry: 2,
  });
}
