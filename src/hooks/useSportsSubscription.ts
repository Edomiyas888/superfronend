import { useEffect, useState } from 'react';
import { useRestSportListOnly } from '../api/config';
import { fetchSportsSimpleList, fetchSportsWithCounts } from '../api/swarmClient';
import type { GameTypeFilter } from '../api/sportQueries';
import type { NormalizedSport } from '../api/types';

const POLL_MS = 25_000;

/**
 * Mirrors finixbet SportsContext: refresh sport list on interval (no WebSocket in this client).
 */
export function useSportsSubscription(gameType: GameTypeFilter, timeFilter: number | 'today' | null = null) {
  const restOnly = useRestSportListOnly();
  const [sports, setSports] = useState<NormalizedSport[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = sessionStorage.getItem('superbet_sports_cache');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as NormalizedSport[]) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => sports.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const next = restOnly
          ? await fetchSportsSimpleList()
          : await fetchSportsWithCounts(gameType, timeFilter);
        if (!cancelled) {
          setSports(next);
          try {
            sessionStorage.setItem('superbet_sports_cache', JSON.stringify(next));
          } catch {
            /* ignore */
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load sports');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    const id = window.setInterval(() => {
      void load();
    }, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [gameType, timeFilter, restOnly]);

  return { sports, loading, error };
}
