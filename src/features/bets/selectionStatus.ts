import { restGetLiveGames, restGetMatchOdds } from '../../api/restSports';
import type { GameView } from '../../api/types';
import type { PlacedBetRow } from './betsApi';
import { liveDisplayFromMatchDetail } from '../../utils/matchLiveDisplay';
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

function infoFromLiveGame(g: GameView): GameScoreInfo {
  return {
    isLive: g.isLive,
    isStarted: true,
    startTs: g.startTs,
    homeScore: g.homeScore ?? null,
    awayScore: g.awayScore ?? null,
    liveMatchTime: g.liveMatchTime,
  };
}

function infoFromMatchDetail(detail: NonNullable<Awaited<ReturnType<typeof restGetMatchOdds>>>): GameScoreInfo {
  const liveDisplay = liveDisplayFromMatchDetail(detail);
  const now = Math.floor(Date.now() / 1000);
  const kickoffPassed = detail.startTs > 0 && now >= detail.startTs;
  const inPlay = liveDisplay.isLive || kickoffPassed;

  return {
    isLive: detail.isLive || liveDisplay.isLive,
    isStarted: inPlay,
    startTs: detail.startTs,
    homeScore: liveDisplay.homeScore ?? null,
    awayScore: liveDisplay.awayScore ?? null,
    liveMatchTime: liveDisplay.liveMatchTime,
  };
}

function mergeInfo(primary: GameScoreInfo, fallback: GameScoreInfo): GameScoreInfo {
  return {
    isLive: primary.isLive || fallback.isLive,
    isStarted: primary.isStarted || fallback.isStarted,
    startTs: primary.startTs || fallback.startTs,
    homeScore: primary.homeScore ?? fallback.homeScore,
    awayScore: primary.awayScore ?? fallback.awayScore,
    liveMatchTime: primary.liveMatchTime ?? fallback.liveMatchTime,
  };
}

async function fetchGameScores(gameIds: number[]): Promise<Map<number, GameScoreInfo>> {
  const scores = new Map<number, GameScoreInfo>();
  const unique = [...new Set(gameIds.filter(Boolean))];
  if (unique.length === 0) return scores;

  const [details, liveGames] = await Promise.all([
    Promise.all(unique.map((gameId) => restGetMatchOdds(gameId).catch(() => null))),
    restGetLiveGames().catch(() => [] as GameView[]),
  ]);

  const liveById = new Map(liveGames.map((g) => [g.id, g]));

  for (let i = 0; i < unique.length; i++) {
    const gameId = unique[i]!;
    const detail = details[i];
    const liveGame = liveById.get(gameId);

    if (liveGame?.isLive) {
      scores.set(gameId, detail ? mergeInfo(infoFromMatchDetail(detail), infoFromLiveGame(liveGame)) : infoFromLiveGame(liveGame));
      continue;
    }

    if (detail) {
      scores.set(gameId, infoFromMatchDetail(detail));
      continue;
    }

    if (liveGame) {
      scores.set(gameId, infoFromLiveGame(liveGame));
    }
  }

  return scores;
}

function isMatchInPlay(info: GameScoreInfo): boolean {
  if (info.isLive || info.isStarted) return true;
  const now = Math.floor(Date.now() / 1000);
  return info.startTs > 0 && now >= info.startTs;
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
  const persisted = selections.some((s) => s.legStatus);
  if (persisted) {
    const liveGameIds = selections
      .filter((s) => s.legStatus === 'live')
      .map((s) => Number(s.gameId))
      .filter(Boolean);
    const scoreMap =
      liveGameIds.length > 0 ? await fetchGameScores(liveGameIds) : new Map<number, GameScoreInfo>();

    return selections.map((sel) => {
      const status = (sel.legStatus ?? 'pending') as SelectionStatus;
      const gameId = Number(sel.gameId);
      const info = scoreMap.get(gameId);
      return {
        status,
        live: status === 'live' ? liveDisplayForInfo(info) : undefined,
      };
    });
  }

  if (slipStatus !== 'open') {
    if (selections.length === 1) {
      const legStatus = slipStatus === 'void' ? 'void' : slipStatus;
      return [{ status: legStatus as SelectionStatus }];
    }
    return selections.map(() => ({ status: 'pending' as SelectionStatus }));
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
