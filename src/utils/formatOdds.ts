/** Stable odds display — tabular-friendly, trims trailing zeros. */
export function formatOdds(price: number): string {
  if (!Number.isFinite(price)) return '—';
  const rounded = Math.round(price * 100) / 100;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2);
}
