import { useQuery } from '@tanstack/react-query';
import { restGetPromotedMatches } from '../api/restSports';

/** Promoted Soccer fixtures only (Swarm `sport.alias` + `game.promoted` + P1/X/P2). */
export function useMatchOfTheDay() {
  return useQuery({
    queryKey: ['match-of-the-day', 'promoted', 'soccer'],
    queryFn: () => restGetPromotedMatches({ sportAlias: 'Soccer' }),
    refetchInterval: 45_000,
    retry: 2,
  });
}
