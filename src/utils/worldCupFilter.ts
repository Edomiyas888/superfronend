/** Swarm special markets under World Cup naming that are not real fixtures. */
function isExcludedWorldCupSpecial(competitionName: string): boolean {
  const c = competitionName.trim().toLowerCase();
  return /\bmythical\b/.test(c) || /\balternative\s*\(\s*mythical/.test(c);
}

/** Match Swarm `competition.name` for FIFA World Cup fixtures. */
export function isWorldCupCompetition(competitionName: string): boolean {
  const c = competitionName.trim().toLowerCase();
  if (!c) return false;
  if (isExcludedWorldCupSpecial(c)) return false;
  return c.includes('world cup') || c.includes('fifa wc');
}
