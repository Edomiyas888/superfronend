import { useQuery } from '@tanstack/react-query';
import { restGetPopularSoccerMatches } from '../api/restSports';

/** Soccer prematch (all future kickoffs) plus in-play, for the league-filtered Popular list. */
export function usePopularMatches() {
  return useQuery({
    queryKey: ['popular-soccer-matches'],
    queryFn: () => restGetPopularSoccerMatches(),
    refetchInterval: 30_000,
    retry: 2,
  });
}
