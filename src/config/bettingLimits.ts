function readLimit(raw: string | undefined, fallback: number): number {
  if (raw == null || raw.trim() === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const MIN_STAKE = readLimit(import.meta.env.VITE_MIN_STAKE, 10);
export const MAX_POSSIBLE_WIN = readLimit(import.meta.env.VITE_MAX_POSSIBLE_WIN, 500_000);
export const MIN_DEPOSIT = readLimit(import.meta.env.VITE_MIN_DEPOSIT, 50);

export function formatLimit(n: number): string {
  return n.toLocaleString('en-US');
}
