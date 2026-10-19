import type { GameView } from '../../api/types';

export type CompetitionGroup = {
  name: string;
  games: GameView[];
};

export type RegionGroup = {
  name: string;
  gameCount: number;
  competitions: CompetitionGroup[];
};

/** Regions pinned to the top of the sport page, in this order; the rest follow Swarm's order. */
const PINNED_REGIONS = [
  'England',
  'Germany',
  'Spain',
  'Italy',
  'France',
  'World',
  'Europe',
  'Portugal',
  'Netherlands',
];

const UNKNOWN_ORDER = Number.MAX_SAFE_INTEGER;

function pinnedIndex(region: string): number {
  const i = PINNED_REGIONS.findIndex((r) => r.toLowerCase() === region.trim().toLowerCase());
  return i === -1 ? PINNED_REGIONS.length : i;
}

/** Fold a sport's fixtures into regions → competitions, each in the operator's order. */
export function groupGamesByRegion(games: GameView[]): RegionGroup[] {
  const regions = new Map<
    string,
    { order: number; competitions: Map<string, { order: number; games: GameView[] }> }
  >();

  for (const g of games) {
    const regionName = g.regionName.trim() || 'Other';
    const competitionName = g.competitionName.trim() || 'Other';
    let region = regions.get(regionName);
    if (!region) {
      region = { order: g.regionOrder ?? UNKNOWN_ORDER, competitions: new Map() };
      regions.set(regionName, region);
    }
    let competition = region.competitions.get(competitionName);
    if (!competition) {
      competition = { order: g.competitionOrder ?? UNKNOWN_ORDER, games: [] };
      region.competitions.set(competitionName, competition);
    }
    competition.games.push(g);
  }

  return [...regions.entries()]
    .sort(
      ([a, ra], [b, rb]) =>
        pinnedIndex(a) - pinnedIndex(b) || ra.order - rb.order || a.localeCompare(b)
    )
    .map(([name, region]) => {
      const competitions = [...region.competitions.entries()]
        .sort(([a, ca], [b, cb]) => ca.order - cb.order || a.localeCompare(b))
        .map(([competitionName, c]) => ({
          name: competitionName,
          games: [...c.games].sort((x, y) => x.startTs - y.startTs),
        }));
      return {
        name,
        gameCount: competitions.reduce((n, c) => n + c.games.length, 0),
        competitions,
      };
    });
}
