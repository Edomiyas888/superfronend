import type { BingoCard } from './bingoApi';

export const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'] as const;
export const BINGO_STAKES = [10, 25, 50, 100] as const;

/** `42` → `N-42` */
export function ballLabel(n: number): string {
  return `${BINGO_LETTERS[Math.min(4, Math.floor((n - 1) / 15))]}-${n}`;
}

type Line = { pattern: string; cells: Array<[number, number]> };

const LINES: Line[] = (() => {
  const idx = [0, 1, 2, 3, 4];
  const lines: Line[] = [];
  idx.forEach((r) => lines.push({ pattern: `row${r + 1}`, cells: idx.map((c) => [r, c]) }));
  idx.forEach((c) => lines.push({ pattern: `col${c + 1}`, cells: idx.map((r) => [r, c]) }));
  lines.push({ pattern: 'diag1', cells: idx.map((i) => [i, i]) });
  lines.push({ pattern: 'diag2', cells: idx.map((i) => [i, 4 - i]) });
  lines.push({ pattern: 'corners', cells: [[0, 0], [0, 4], [4, 0], [4, 4]] });
  return lines;
})();

/**
 * Lines complete on `card` with `marked` numbers (0, the free centre, always counts). With
 * `lastBall`, only lines that contain it — the server only accepts a BINGO on the ball that made it.
 */
export function winningLines(card: BingoCard, marked: Set<number>, lastBall: number | null = null): Line[] {
  return LINES.filter(({ cells }) => {
    const nums = cells.map(([r, c]) => card[r]?.[c] ?? -1);
    if (!nums.every((n) => n === 0 || marked.has(n))) return false;
    return lastBall == null || nums.includes(lastBall);
  });
}

export function patternLabel(pattern: string | null | undefined): string {
  if (!pattern) return '';
  if (pattern.startsWith('row')) return `Row ${pattern.slice(3)}`;
  if (pattern.startsWith('col')) return `${BINGO_LETTERS[Number(pattern.slice(3)) - 1]} column`;
  if (pattern === 'corners') return 'Four corners';
  return 'Diagonal';
}

/** `1290.5` → `1,290.5` (no forced decimals; prizes are usually whole). */
export function formatEtb(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
