/**
 * Thin HTTP client aligned with finixbet Zergling.subscribe initial fetch:
 * POST { command: 'get', params } — optional subscribe flag for backends that support it.
 * Live updates without WebSocket: use polling via useSportsSubscription hook.
 */
import { buildSportListRequest } from './sportQueries';
import type { GameTypeFilter } from './sportQueries';
import { swarmPost, unwrapData } from './http';
import { normalizeSportList } from './types';

export async function fetchSportsWithCounts(
  gameType: GameTypeFilter,
  timeFilter: number | 'today' | null = null
) {
  const params = buildSportListRequest(gameType, timeFilter);
  const res = await swarmPost({ command: 'get', params });
  const data = unwrapData(res);
  return normalizeSportList(data);
}

export async function fetchSportsSimpleList() {
  const res = await swarmPost({
    command: 'get',
    params: {
      source: 'betting',
      what: { sport: ['id', 'name', 'alias'] },
      where: {},
      subscribe: true,
    },
  });
  const data = unwrapData(res);
  return normalizeSportList(data);
}
