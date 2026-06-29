import { useQuery } from '@tanstack/react-query';
import { fetchGuessWinMatches } from '../api/guessWinApi';
import { useSessionStore } from '../features/auth/sessionStore';

export function useGuessWinMatches() {
  const getAuthHeader = useSessionStore((s) => s.getAuthHeader);
  const token = useSessionStore((s) => s.token);

  return useQuery({
    queryKey: ['guess-win-matches', token ?? 'guest'],
    queryFn: () => fetchGuessWinMatches(getAuthHeader()),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
