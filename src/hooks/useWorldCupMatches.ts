import { useQuery } from '@tanstack/react-query';
import { restGetWorldCupMatches } from '../api/restSports';
import type { DateFilterKey } from '../constants/dateFilters';

export function useWorldCupMatches(dateFilter: DateFilterKey = 'all') {
  return useQuery({
    queryKey: ['world-cup-matches', dateFilter],
    queryFn: () => restGetWorldCupMatches({ timeHours: dateFilter }),
    refetchInterval: 30_000,
    retry: 2,
  });
}
