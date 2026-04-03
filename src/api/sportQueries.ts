export type GameTypeFilter = 'prematch' | 'live';

export function buildSportListRequest(
  gameType: GameTypeFilter,
  timeFilter: number | 'today' | null
) {
  const gameTypeCondition =
    gameType === 'live'
      ? { type: 1 }
      : { '@or': [{ type: { '@in': [0, 2] } }, { visible_in_prematch: 1 }] };

  const req: Record<string, unknown> = {
    source: 'betting',
    what: { sport: ['id', 'name', 'alias', 'order'], game: '@count' },
    where: { game: gameTypeCondition as Record<string, unknown> },
    /** Matches finixbet `Zergling.subscribe` — required for full sport/game payloads from Swarm. */
    subscribe: true,
  };

  if (timeFilter) {
    const whereGame = (req.where as { game: Record<string, unknown> }).game;
    whereGame.start_ts = {
      '@now': {
        '@gte': 0,
        '@lt': timeFilter === 'today' ? undefined : timeFilter * 3600,
      },
    };
  }

  return req;
}
