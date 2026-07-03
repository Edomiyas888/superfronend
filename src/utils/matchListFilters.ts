import type { GameView } from '../api/types';
import { competitionMatchesLeague } from './competitionFilter';
import { isWorldCupCompetition } from './worldCupFilter';

export type MatchListFilterState = {
  region: string;
  competition: string;
  search: string;
  /** Slug from `SPORT_QUICK_LEAGUE_FILTERS` — e.g. `world-cup`, `premier-league`. */
  quickLeague: string;
};

export function extractRegions(games: GameView[] | undefined): string[] {
  if (!games?.length) return [];
  const set = new Set<string>();
  for (const g of games) {
    const name = g.regionName?.trim();
    if (name) set.add(name);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function extractCompetitions(games: GameView[] | undefined, region: string): string[] {
  if (!games?.length) return [];
  const set = new Set<string>();
  for (const g of games) {
    if (region && g.regionName !== region) continue;
    const name = g.competitionName?.trim();
    if (name) set.add(name);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function matchesQuickLeague(g: GameView, quickLeague: string): boolean {
  if (!quickLeague) return true;
  if (quickLeague === 'world-cup') return isWorldCupCompetition(g.competitionName);
  return competitionMatchesLeague(g.competitionName, quickLeague);
}

export function filterGames(games: GameView[] | undefined, filters: MatchListFilterState): GameView[] {
  if (!games?.length) return [];
  const region = filters.region.trim();
  const competition = filters.competition.trim();
  const search = filters.search.trim().toLowerCase();
  const quickLeague = filters.quickLeague.trim();

  return games.filter((g) => {
    if (!matchesQuickLeague(g, quickLeague)) return false;
    if (region && g.regionName !== region) return false;
    if (competition && g.competitionName !== competition) return false;
    if (search) {
      const hay = `${g.team1} ${g.team2} ${g.competitionName} ${g.regionName}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}

export function countActiveFilters(filters: MatchListFilterState, defaultQuickLeague = ''): number {
  let n = 0;
  const quick = filters.quickLeague.trim();
  if (quick && quick !== defaultQuickLeague) n += 1;
  if (filters.region.trim()) n += 1;
  if (filters.competition.trim()) n += 1;
  if (filters.search.trim()) n += 1;
  return n;
}
