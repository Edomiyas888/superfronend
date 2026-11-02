import { useQuery } from '@tanstack/react-query';
import { restGetLiveGames } from '../api/restSports';

/** Games in play now; `undefined` sport means all sports. Shared by Home and In-Play. */
export function useLiveMatches(sportAlias: string | undefined) {
  return useQuery({
    queryKey: ['live-games', sportAlias ?? 'all'],
    queryFn: () => restGetLiveGames({ sportAlias }),
    refetchInterval: 20_000,
  });
}
