import { useQuery } from '@tanstack/react-query';
import { restGetPopularSoccerMatches } from '../api/restSports';

/** Soccer prematch (all future kickoffs), excluding promoted fixtures (Finix PopularMatchesTable). */
export function usePopularMatches() {
  return useQuery({
    queryKey: ['popular-soccer-matches'],
    queryFn: () => restGetPopularSoccerMatches(),
    refetchInterval: 30_000,
    retry: 2,
  });
}
