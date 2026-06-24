export type BetSelectionLike = {
  marketName?: string;
  marketType?: string;
  pick?: string;
  team1?: string;
  team2?: string;
};

const MATCH_RESULT_TYPES = new Set(['P1XP2', 'P1P2']);

function resolvePickLabel(sel: BetSelectionLike): string {
  const raw = sel.pick?.trim() || 'Pick';
  const t1 = sel.team1?.trim();
  const t2 = sel.team2?.trim();

  if (raw === 'W1' && t1) return t1;
  if (raw === 'W2' && t2) return t2;
  if (raw === 'X' || raw.toLowerCase() === 'draw') return 'Draw';
  return raw;
}

function resolveMarketLabel(sel: BetSelectionLike, pick: string): string {
  const market = sel.marketName?.trim();
  if (market) return market;

  const marketType = String(sel.marketType ?? '').trim();
  if (MATCH_RESULT_TYPES.has(marketType) || /^W[12]$|^X$/i.test(pick)) {
    return 'Match Result';
  }
  return '';
}

/** Market name and pick as separate parts for styled display. */
export function formatBetSelectionParts(sel: BetSelectionLike): { market: string; pick: string } {
  const pick = resolvePickLabel(sel);
  const market = resolveMarketLabel(sel, sel.pick?.trim() || pick);
  return { market, pick };
}

/** Single-line label: "Both Teams to Score · No" */
export function formatBetSelectionText(sel: BetSelectionLike): string {
  const { market, pick } = formatBetSelectionParts(sel);
  if (market && market.toLowerCase() !== pick.toLowerCase()) {
    return `${market} · ${pick}`;
  }
  return pick;
}
