import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { NormalizedSport } from '../api/types';
import type { GameTypeFilter } from '../api/sportQueries';
import { useSportsList } from '../hooks/useSportsList';

/**
 * Same role as finixbet `SportsContext.jsx` + `useSports()`:
 * - holds prematch/live + optional time filter
 * - loads sports via Swarm (`useSportsList` → `fetchSportsWithCounts` / `subscribe: true` on the wire)
 * - exposes `refresh()` like finix `unsubscribe().then(subscribe)`
 *
 * `SportNew.jsx` only calls `useSports()`; the real fetch lives in the provider.
 */
export type SportsContextValue = {
  sports: NormalizedSport[];
  loading: boolean;
  error: Error | null;
  gameType: GameTypeFilter;
  setGameType: (t: GameTypeFilter) => void;
  timeFilter: number | 'today' | null;
  setTimeFilter: (t: number | 'today' | null) => void;
  refresh: () => Promise<void>;
};

const SportsContext = createContext<SportsContextValue | null>(null);

const CACHE_KEY = 'superbetSportsCache';

export function SportsProvider({ children }: { children: ReactNode }) {
  const [gameType, setGameType] = useState<GameTypeFilter>('prematch');
  const [timeFilter, setTimeFilter] = useState<number | 'today' | null>(null);
  const queryClient = useQueryClient();

  const q = useSportsList(gameType, timeFilter);

  useEffect(() => {
    if (q.data?.length) {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(q.data));
      } catch {
        /* noop */
      }
    }
  }, [q.data]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['sports'] });
  }, [queryClient]);

  const err =
    q.error instanceof Error ? q.error : q.error ? new Error(String(q.error)) : null;

  const value = useMemo<SportsContextValue>(
    () => ({
      sports: q.data ?? [],
      loading: q.isPending,
      error: err,
      gameType,
      setGameType,
      timeFilter,
      setTimeFilter,
      refresh,
    }),
    [q.data, q.isPending, err, gameType, timeFilter, refresh]
  );

  return <SportsContext.Provider value={value}>{children}</SportsContext.Provider>;
}

export function useSports(): SportsContextValue {
  const ctx = useContext(SportsContext);
  if (!ctx) {
    throw new Error('useSports must be used within SportsProvider');
  }
  return ctx;
}
