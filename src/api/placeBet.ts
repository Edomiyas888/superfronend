/**
 * Mirrors finixbet `Zergling.setbet` → `axios.post(api + 'do_betp', bet)`.
 * Request payload matches `createBetRequests` for single bets.
 */
import { getSwarmApiUrl } from './config';

export const BETSLIP_TYPE_SINGLE = 1;
const BET_SOURCE = '2';

export type BetslipLike = {
  type: number;
  events: Record<string, BetslipEventLike>;
  stake: number;
  eachWayMode?: boolean;
  betterOddSelectionMode?: boolean;
  bonusBet?: boolean;
  freeBet?: boolean;
  selectedFreeBetId?: string | number;
  selectedFreeBetAmount?: number;
};

export type BetslipEventLike = {
  eventId: number | string;
  gameId: number | string;
  marketName: string;
  marketType: string | number;
  teamone: string;
  teamtwo: string;
  region: string;
  competitionName: string;
  title: string;
  pick: string;
  price: number;
  initialPrice?: number;
  oddType?: string;
  isLive?: boolean;
  dateofmatch: number;
  singleStake?: number;
};

function buildSingleBetRequest(
  slip: BetslipLike,
  bet: BetslipEventLike
): Record<string, unknown> {
  const price = bet.oddType === 'sp' ? -1 : bet.price || bet.initialPrice || 1;
  const gameId = parseInt(String(bet.gameId), 10);
  const stake =
    Number.isFinite(Number(bet.singleStake)) && Number(bet.singleStake) > 0
      ? Number(bet.singleStake)
      : Number(slip.stake);

  const hasLive = !!bet.isLive;

  const data: Record<string, unknown> = {
    is_offer: slip.betterOddSelectionMode ? 1 : 0,
    bets: [
      {
        event_id: bet.eventId,
        marketname: bet.marketName,
        markettype: bet.marketType,
        team1: bet.teamone,
        team2: bet.teamtwo,
        region: bet.region,
        competitionName: bet.competitionName,
        score: 'no',
        datematch: bet.dateofmatch,
        game_id: gameId,
        bet: bet.pick,
        status: 'on',
        match: bet.title,
        price,
        text_info: 'no',
        current_price: '0',
        info: 'no',
        islive: hasLive,
      },
    ],
    type: slip.type,
    source: BET_SOURCE,
    mode: false,
    each_way: !!slip.eachWayMode,
    is_live: hasLive,
    use_bonus_balance: slip.bonusBet ? 1 : 0,
    amount: stake,
    odds: price,
    dateofbet: Math.floor(Date.now() / 1000),
    games: [gameId],
    username: localStorage.getItem('username') ?? '',
    possiblewin: stake * price,
    bones: 0,
    status: 'on',
    cheack: 'false',
    userphone: localStorage.getItem('phone') ?? '',
    betslip: slip,
  };

  if (slip.freeBet && slip.selectedFreeBetId) {
    data.bonus_id = slip.selectedFreeBetId;
    data.amount = slip.selectedFreeBetAmount;
  }

  return data;
}

export async function placeBetDoBetp(
  slip: BetslipLike,
  betSlipSnapshot: BetslipLike,
  pw: number,
  bones: number
): Promise<unknown> {
  const username = localStorage.getItem('username');
  const phone = localStorage.getItem('phone');
  if (!username?.trim()) {
    throw Object.assign(new Error('Not authenticated'), { code: 12 });
  }

  const ids = Object.keys(slip.events);
  if (ids.length === 0) throw new Error('No selections');

  const results: unknown[] = [];
  const apiBase = getSwarmApiUrl();

  for (const id of ids) {
    const ev = slip.events[id];
    if (!ev) continue;

    const request = buildSingleBetRequest(slip, ev);

    const amount = parseFloat(String(request.amount ?? 0));
    const bets = request.bets as { price?: number; game_id?: number; islive?: boolean }[];
    let total = 1;
    const gameid: number[] = [];
    for (const b of bets) {
      total *= Number(b.price) || 1;
      if (b.game_id !== undefined) gameid.push(b.game_id);
    }

    const timestamp = Date.now();
    const dateofissued = Math.floor(timestamp / 1000);
    let d = bones;
    const pwUse = pw;
    if (pwUse > 750000) d = 0;

    let posible = Number.isFinite(pwUse) ? pwUse : amount * total;
    if (posible > 1000000) {
      posible = 1000000;
      d = 0;
    }

    const isAllLive = bets.some((b) => b.islive === true);

    const newoj = Object.assign({}, request, { odds: total }, { dateofbet: dateofissued }, { games: gameid }, {
      username,
      possiblewin: posible,
      bones: d,
      status: 'on',
      cheack: 'false',
      mode: isAllLive,
    });

    const baseRand = Math.floor(Math.random() * 9999) + 1;
    const luckyNumber = baseRand >= 7777 ? baseRand + 1 : baseRand;

    const betPayload = {
      ...newoj,
      userphone: phone ?? '',
      betslip: betSlipSnapshot,
      coupon: luckyNumber,
      lucky_number: luckyNumber,
      luckyNo: luckyNumber,
    };

    const res = await fetch(`${apiBase}do_betp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(betPayload),
    });

    const json = (await res.json()) as { code?: number; data?: unknown; msg?: string };
    if (json.code === 0) {
      results.push(json.data);
    } else {
      const err = Object.assign(new Error(json.msg ?? 'Bet rejected'), {
        code: json.code,
        details: json.data,
      });
      throw err;
    }
  }

  return results.length === 1 ? results[0] : results;
}
