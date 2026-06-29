const DEFAULT_PRIZE_AMOUNT = '50,000';

export function extractPrizeAmount(prizeText: string): string {
  const match = prizeText.match(/(\d[\d,]*)/);
  if (!match) return DEFAULT_PRIZE_AMOUNT;
  const raw = match[1].replace(/,/g, '');
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PRIZE_AMOUNT;
  return n.toLocaleString('en-US');
}

export function formatWinPrizeLabel(prizeText: string): string {
  return `Win ${extractPrizeAmount(prizeText)} ETB`;
}
