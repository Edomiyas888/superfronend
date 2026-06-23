export const BETSLIP_TYPE_SINGLE = 1;

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
  marketId: number;
  marketName: string;
  /** Swarm market.type (e.g. P1XP2) — not display name */
  marketType: string | number;
  eventType?: string;
  teamone: string;
  teamtwo: string;
  region: string;
  competitionName: string;
  title: string;
  pick: string;
  price: number;
  initialPrice?: number;
  priceChanged?: boolean;
  suspended?: boolean;
  oddType?: string;
  isLive?: boolean;
  dateofmatch: number;
  singleStake?: number;
};

export type OddsCorrectionChange = {
  selectionKey?: string;
  eventId?: number;
  marketId?: number;
  oldPrice: number;
  newPrice: number;
};

export type PlaceBetResult = {
  ok: boolean;
  placed?: {
    coupon: number | string;
    stake: number;
    possibleWin: number;
    slipId: string;
    balance: number;
  }[];
  balance?: number;
  message?: string;
  correction?: boolean;
  changes?: OddsCorrectionChange[];
  error?: string;
  msg?: string;
  code?: number;
};
