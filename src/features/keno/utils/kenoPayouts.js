export const KENO_MIN_BET = 2;
export const KENO_MAX_BET = 30_000;

export const kenoPayouts = {
  1: { 1: 3.6 },
  2: { 1: 1, 2: 11 },
  3: { 1: 0, 2: 2.1, 3: 52 },
  4: { 1: 0, 2: 1.6, 3: 10.5, 4: 82 },
  5: { 1: 0, 2: 1, 3: 3.2, 4: 32, 5: 155 },
  6: { 1: 0, 2: 0, 3: 2.2, 4: 16, 5: 62, 6: 510 },
  7: { 1: 0, 2: 0, 3: 0, 4: 4, 5: 21, 6: 85, 7: 1020 },
  8: { 1: 0, 2: 0, 3: 0, 4: 5, 5: 16, 6: 52, 7: 210, 8: 2050 },
  9: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 10.5, 6: 26, 7: 130, 8: 1020, 9: 5200 },
  10: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 5, 6: 32, 7: 105, 8: 310, 9: 2050, 10: 10250 },
};

export function getMaxMultiplierForPicks(pickCount) {
  const row = kenoPayouts[pickCount];
  if (!row) return 0;
  return Math.max(...Object.values(row).map(Number));
}

export default kenoPayouts;




