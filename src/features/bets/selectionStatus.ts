import { swarmPost, unwrapData } from '../../api/http';
import type { PlacedBetRow } from './betsApi';

export type SelectionStatus = 'won' | 'lost' | 'live' | 'pending' | 'void';

type GameScoreInfo = {
  isLive: boolean;
  startTs: number;
  homeScore: number | null;
  awayScore: number | null;
};

const P1XP2_TYPES = new Set([
  'P1XP2',
  'P1P2',
  '1X12X2',
  'MatchWinner',
  'MatchResult',
  'Match Result',
  '1X2',
  'ThreeWayResult',
]);

function normalizePick(pick: string | undefined): 'home' | 'draw' | 'away' | null {
  const p = String(pick ?? '').trim().toUpperCase();
  if (p === '1' || p === 'W1' || p === 'P1' || p === 'HOME') return 'home';
  if (p === 'X' || p === 'D' || p === 'DRAW') return 'draw';
  if (p === '2' || p === 'W2' || p === 'P2' || p === 'AWAY') return 'away';
  return null;
}

function outcomeFromScore(homeScore: number, awayScore: number): 'home' | 'draw' | 'away' | null {
  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return null;
  if (homeScore > awayScore) return 'home';
  if (homeScore < awayScore) return 'away';
  return 'draw';
}

function statusLabel(status: SelectionStatus): string {
  if (status === 'won') return 'Won';
  if (status === 'lost') return 'Lost';
  if (status === 'live') return 'Live';
  if (status === 'void') return 'Void';
  return 'Pending';
}

export { statusLabel };

async function fetchGameScores(gameIds: number[]): Promise<Map<number, GameScoreInfo>> {
  const scores = new Map<number, GameScoreInfo>();
  const unique = [...new Set(gameIds.filter(Boolean))];

  for (const gameId of unique) {
    try {
      const result = await swarmPost({
        command: 'get',
        params: {
          source: 'betting',
          what: {
            game: ['id', 'is_live', 'start_ts', 'is_started'],
            market: ['id', 'type', 'home_score', 'away_score', 'name'],
          },
          where: { game: { id: gameId } },
          subscribe: false,
        },
      });

      const data = unwrapData(result) as Record<string, unknown> | undefined;
      const sport = data?.sport;
      if (!sport || typeof sport !== 'object') continue;

      let isLive = false;
      let startTs = 0;
      let homeScore: number | null = null;
      let awayScore: number | null = null;

      const walk = (node: Record<string, unknown>) => {
        if (!node || typeof node !== 'object') return;
        if (node.game && typeof node.game === 'object') {
          for (const g of Object.values(node.game as Record<string, Record<string, unknown>>)) {
            if (Number(g.id) !== gameId) continue;
            isLive = Boolean(g.is_live);
            startTs = Number(g.start_ts) || 0;
            const markets = (g.market ?? {}) as Record<string, Record<string, unknown>>;
            for (const mk of Object.values(markets)) {
              const mt = String(mk.type ?? mk.name ?? '');
              if (!P1XP2_TYPES.has(mt) && !mt.toLowerCase().includes('match result')) continue;
              const hs = Number(mk.home_score);
              const as = Number(mk.away_score);
              if (Number.isFinite(hs) && Number.isFinite(as)) {
                homeScore = hs;
                awayScore = as;
              }
            }
          }
        }
        if (node.region) {
          for (const reg of Object.values(node.region as Record<string, Record<string, unknown>>)) walk(reg);
        }
        if (node.competition) {
          for (const comp of Object.values(node.competition as Record<string, Record<string, unknown>>)) walk(comp);
        }
      };

      for (const sp of Object.values(sport as Record<string, Record<string, unknown>>)) walk(sp);
      scores.set(gameId, { isLive, startTs, homeScore, awayScore });
    } catch {
      /* ignore per-game fetch errors */
    }
  }

  return scores;
}

function evaluateSelection(
  sel: PlacedBetRow['selections'][number],
  info: GameScoreInfo | undefined,
  slipStatus: PlacedBetRow['settlementStatus']
): SelectionStatus {
  if (slipStatus === 'void') return 'void';
  if (slipStatus === 'won') return 'won';

  if (!info) return slipStatus === 'lost' ? 'lost' : 'pending';

  const { isLive, startTs, homeScore, awayScore } = info;
  if (isLive) return 'live';

  const now = Math.floor(Date.now() / 1000);
  const hasScores = homeScore !== null && awayScore !== null;

  if (!hasScores) {
    if (startTs > 0 && now < startTs) return 'pending';
    if (startTs > 0 && now >= startTs) return 'live';
    return 'pending';
  }

  const actual = outcomeFromScore(homeScore!, awayScore!);
  const picked = normalizePick(sel.pick);
  if (!actual || !picked) return 'pending';
  return actual === picked ? 'won' : 'lost';
}

export async function resolveSelectionStatuses(
  selections: PlacedBetRow['selections'],
  slipStatus: PlacedBetRow['settlementStatus']
): Promise<SelectionStatus[]> {
  if (slipStatus === 'void') return selections.map(() => 'void');
  if (slipStatus === 'won') return selections.map(() => 'won');

  const gameIds = selections.map((s) => Number(s.gameId)).filter(Boolean);
  const scoreMap = await fetchGameScores(gameIds);

  return selections.map((sel) => {
    const gameId = Number(sel.gameId);
    return evaluateSelection(sel, scoreMap.get(gameId), slipStatus);
  });
}

export function slipStatusClass(status: PlacedBetRow['settlementStatus']): string {
  if (status === 'won') return 'b365-my-bets-status--won';
  if (status === 'lost') return 'b365-my-bets-status--lost';
  if (status === 'void') return 'b365-my-bets-status--void';
  return 'b365-my-bets-status--open';
}

export function selectionStatusClass(status: SelectionStatus): string {
  if (status === 'won') return 'b365-my-bets-leg-status--won';
  if (status === 'lost') return 'b365-my-bets-leg-status--lost';
  if (status === 'live') return 'b365-my-bets-leg-status--live';
  if (status === 'void') return 'b365-my-bets-leg-status--void';
  return 'b365-my-bets-leg-status--pending';
}
