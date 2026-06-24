import { swarmPost, unwrapData } from '../../api/http';
import type { PlacedBetRow } from './betsApi';
import { gameIsLiveInFeed } from '../../utils/liveGameDisplay';
import { liveDisplayFromSwarmGame } from '../../utils/matchLiveDisplay';
import type { LiveGameDisplay } from '../../utils/matchLiveDisplay';

export type SelectionStatus = 'won' | 'lost' | 'live' | 'pending' | 'void';

export type SelectionResolve = {
  status: SelectionStatus;
  live?: LiveGameDisplay;
};

type GameScoreInfo = {
  isLive: boolean;
  isStarted: boolean;
  startTs: number;
  homeScore: number | null;
  awayScore: number | null;
  liveMatchTime?: string;
};

function statusLabel(status: SelectionStatus): string {
  if (status === 'won') return 'Won';
  if (status === 'lost') return 'Lost';
  if (status === 'live') return 'Live';
  if (status === 'void') return 'Void';
  return 'Pending';
}

export { statusLabel };

function isMatchInPlay(info: GameScoreInfo): boolean {
  if (info.isLive || info.isStarted) return true;
  const now = Math.floor(Date.now() / 1000);
  return info.startTs > 0 && now >= info.startTs;
}

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
            game: ['id', 'is_live', 'is_started', 'type', 'start_ts', 'text_info', 'info'],
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
      let isStarted = false;
      let startTs = 0;
      let homeScore: number | null = null;
      let awayScore: number | null = null;
      let liveMatchTime: string | undefined;
      let matchedGame: Record<string, unknown> | null = null;

      const walk = (node: Record<string, unknown>) => {
        if (!node || typeof node !== 'object') return;
        if (node.game && typeof node.game === 'object') {
          for (const g of Object.values(node.game as Record<string, Record<string, unknown>>)) {
            if (Number(g.id) !== gameId) continue;
            matchedGame = g;
            isLive = gameIsLiveInFeed(g);
            isStarted = Boolean(g.is_started);
            startTs = Number(g.start_ts) || 0;
            const markets = (g.market ?? {}) as Record<string, Record<string, unknown>>;
            for (const mk of Object.values(markets)) {
              const hs = Number(mk.home_score);
              const as = Number(mk.away_score);
              if (Number.isFinite(hs) && Number.isFinite(as)) {
                homeScore = hs;
                awayScore = as;
                break;
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

      if (matchedGame && isLive) {
        const liveDisplay = liveDisplayFromSwarmGame(matchedGame, true);
        if (homeScore == null && liveDisplay.homeScore != null) homeScore = liveDisplay.homeScore;
        if (awayScore == null && liveDisplay.awayScore != null) awayScore = liveDisplay.awayScore;
        liveMatchTime = liveDisplay.liveMatchTime;
      }

      scores.set(gameId, { isLive, isStarted, startTs, homeScore, awayScore, liveMatchTime });
    } catch {
      /* ignore per-game fetch errors */
    }
  }

  return scores;
}

function evaluateSelection(
  _sel: PlacedBetRow['selections'][number],
  info: GameScoreInfo | undefined,
  slipStatus: PlacedBetRow['settlementStatus']
): SelectionStatus {
  if (slipStatus === 'void') return 'void';
  if (slipStatus === 'won') return 'won';
  if (slipStatus === 'lost') return 'lost';

  if (!info) return 'pending';

  if (isMatchInPlay(info)) return 'live';

  return 'pending';
}

function liveDisplayForInfo(info: GameScoreInfo | undefined): LiveGameDisplay | undefined {
  if (!info || !isMatchInPlay(info)) return undefined;
  return {
    isLive: true,
    homeScore: info.homeScore ?? undefined,
    awayScore: info.awayScore ?? undefined,
    liveMatchTime: info.liveMatchTime,
  };
}

export async function resolveSelectionStatuses(
  selections: PlacedBetRow['selections'],
  slipStatus: PlacedBetRow['settlementStatus']
): Promise<SelectionResolve[]> {
  if (slipStatus === 'void') return selections.map(() => ({ status: 'void' }));
  if (slipStatus === 'won') return selections.map(() => ({ status: 'won' }));
  if (slipStatus === 'lost') {
    return selections.map(() => ({ status: 'lost' }));
  }

  const gameIds = selections.map((s) => Number(s.gameId)).filter(Boolean);
  const scoreMap = await fetchGameScores(gameIds);

  return selections.map((sel) => {
    const gameId = Number(sel.gameId);
    const info = scoreMap.get(gameId);
    return {
      status: evaluateSelection(sel, info, slipStatus),
      live: liveDisplayForInfo(info),
    };
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
