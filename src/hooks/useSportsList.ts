import { useQuery } from '@tanstack/react-query';
import { useRestSportListOnly } from '../api/config';
import { fetchSportsSimpleList, fetchSportsWithCounts } from '../api/swarmClient';
import type { GameTypeFilter } from '../api/sportQueries';

export function useSportsList(gameType: GameTypeFilter, timeFilter: number | 'today' | null = null) {
  const restOnly = useRestSportListOnly();
  return useQuery({
    queryKey: ['sports', restOnly ? 'simple' : 'counts', gameType, timeFilter],
    queryFn: async () => {
      if (restOnly) {
        return fetchSportsSimpleList();
      }
      return fetchSportsWithCounts(gameType, timeFilter);
    },
    refetchInterval: 25_000,
    retry: 3,
  });
}
