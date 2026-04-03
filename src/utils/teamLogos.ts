/** Finix / Logiq CDN bases used across the stack (canary vs prod). */
export const TEAM_LOGO_CDN_BASES = [
  'https://admin-canary.logiqsport.com/cdn/assets/teams/b',
  'https://adminpro.logiqsport.com/cdn/assets/teams/b',
] as const;

export function teamLogoUrlCandidates(teamId: number): string[] {
  return TEAM_LOGO_CDN_BASES.map((base) => `${base}/${teamId}.png`);
}

function parsePositiveId(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.trunc(n);
}

/** Normalize Swarm `game` team id fields (snake_case / camelCase / nested `team1`). */
export function pickTeamIdFromGame(g: Record<string, unknown>, side: 1 | 2): number | undefined {
  const keys =
    side === 1
      ? (['team1_id', 'team_1_id', 'Team1_id', 'team1Id', 'home_team_id'] as const)
      : (['team2_id', 'team_2_id', 'Team2_id', 'team2Id', 'away_team_id'] as const);
  for (const k of keys) {
    const id = parsePositiveId(g[k]);
    if (id != null) return id;
  }
  const nestedKey = side === 1 ? 'team1' : 'team2';
  const nested = g[nestedKey];
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const o = nested as Record<string, unknown>;
    for (const k of ['id', 'team_id', 'teamId'] as const) {
      const id = parsePositiveId(o[k]);
      if (id != null) return id;
    }
  }
  return undefined;
}
