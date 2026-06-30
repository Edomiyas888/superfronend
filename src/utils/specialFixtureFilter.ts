import type { GameView } from '../api/types';

/** Swarm virtual / stats competitions — not real team-vs-team fixtures. */
export function isSpecialOrVirtualCompetition(competitionName: string): boolean {
  const c = competitionName.trim().toLowerCase();
  if (!c) return false;
  return (
    /\bmythical\b/.test(c) ||
    /\balternative\s*\(\s*mythical/.test(c) ||
    /matchday statistics/.test(c)
  );
}

/** Aggregate / stats team labels (e.g. "1st Teams (Goals)"). */
export function isSpecialOrVirtualTeamName(name: string): boolean {
  const n = name.trim().toLowerCase();
  return /^\d+(st|nd|rd|th)\s+teams?\s*\(/.test(n) || /\bteams?\s*\(\s*goals\s*\)/.test(n);
}

export function isSpecialOrVirtualFixture(g: Pick<GameView, 'team1' | 'team2' | 'competitionName'>): boolean {
  if (isSpecialOrVirtualCompetition(g.competitionName ?? '')) return true;
  if (isSpecialOrVirtualTeamName(g.team1 ?? '')) return true;
  if (isSpecialOrVirtualTeamName(g.team2 ?? '')) return true;
  return false;
}
