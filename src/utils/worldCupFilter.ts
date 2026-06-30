import { isSpecialOrVirtualCompetition } from './specialFixtureFilter';

/** Match Swarm `competition.name` for FIFA World Cup fixtures. */
export function isWorldCupCompetition(competitionName: string): boolean {
  const c = competitionName.trim().toLowerCase();
  if (!c) return false;
  if (isSpecialOrVirtualCompetition(c)) return false;
  return c.includes('world cup') || c.includes('fifa wc');
}
