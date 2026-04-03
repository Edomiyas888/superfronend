/** Match Swarm `competition.name` to a Top Leagues key (substring, case-insensitive). */
export function competitionMatchesLeague(competitionName: string, league: string): boolean {
  const c = competitionName.trim().toLowerCase();
  const l = league.trim().toLowerCase();
  if (!l) return true;
  if (c === l) return true;
  return c.includes(l);
}
