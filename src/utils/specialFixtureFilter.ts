import type { GameView } from '../api/types';

/** Swarm virtual / simulated / stats competitions — not real team-vs-team fixtures. */
export function isSpecialOrVirtualCompetition(competitionName: string): boolean {
  const c = competitionName.trim().toLowerCase();
  if (!c) return false;
  return (
    /\bmythical\b/.test(c) ||
    /\balternative\s*\(\s*mythical/.test(c) ||
    /matchday statistics/.test(c) ||
    // Simulated feeds mirror real league names (e.g. "Betual England Premier League").
    /\b(virtual|betual|simulated|simulation|esoccer|e-?soccer|e-?football|cyber)\b/.test(c)
  );
}

/** Swarm groups simulated feeds under their own region (e.g. "Virtual Matches"). */
export function isSpecialOrVirtualRegion(regionName?: string | null): boolean {
  const r = (regionName ?? '').trim().toLowerCase();
  if (!r) return false;
  return /\b(virtual|simulated|simulation|esports|e-?sports|cyber)\b/.test(r);
}

/** Aggregate / stats team labels (e.g. "1st Teams (Goals)"). */
export function isSpecialOrVirtualTeamName(name: string): boolean {
  const n = name.trim().toLowerCase();
  return /^\d+(st|nd|rd|th)\s+teams?\s*\(/.test(n) || /\bteams?\s*\(\s*goals\s*\)/.test(n);
}

export function isSpecialOrVirtualFixture(
  g: Pick<GameView, 'team1' | 'team2' | 'competitionName'> & { regionName?: string }
): boolean {
  if (isSpecialOrVirtualCompetition(g.competitionName ?? '')) return true;
  if (isSpecialOrVirtualRegion(g.regionName)) return true;
  if (isSpecialOrVirtualTeamName(g.team1 ?? '')) return true;
  if (isSpecialOrVirtualTeamName(g.team2 ?? '')) return true;
  return false;
}
