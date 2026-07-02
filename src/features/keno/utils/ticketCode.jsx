export function normalizeNumbers(input) {
  if (!input) return [];
  const arr = Array.isArray(input) ? input : Object.values(input);
  return arr
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n));
}

export function buildTicketCode(bet) {
  if (!bet?.roundNo || !bet?.betId) return null;
  return `KENO:${String(bet.roundNo)}:${String(bet.betId)}`;
}

export function parseTicketCode(codeRaw) {
  const code = String(codeRaw || '').trim();
  if (!code) return null;

  // Remove whitespace/newlines (common with scanners that append CR/LF).
  const cleaned = code.replace(/\s+/g, "");
  
  // Try to split by colon first (standard format: KENO:ROUND:BETID)
  let parts = cleaned.split(':');
  
  // If only 2 parts after splitting by colon, try pipe separator
  if (parts.length < 3) {
    parts = cleaned.split('|');
  }
  
  // Filter out empty parts but keep the structure
  // parts[0] should be KENO, parts[1] should be roundNo, parts[2] should be betId
  if (parts.length >= 3 && parts[0].toUpperCase() === 'KENO') {
    // Join parts[2] onwards with ':' to handle betIds that contain colons
    const betId = parts.slice(2).join(':');
    return { roundNo: parts[1], betId: betId };
  }
  
  return null;
}

export function calculateTicketPayout({ bet, calledNumbers, kenoPayouts, maxPayout = 250000 }) {
  const selected = normalizeNumbers(bet?.selectedNumbers);
  const called = normalizeNumbers(calledNumbers);
  const calledSet = new Set(called);
  const matches = selected.filter((n) => calledSet.has(n)).length;

  const picks = selected.length;
  const multiplier = (kenoPayouts?.[picks]?.[matches] ?? 0) || 0;
  const betAmount = Number(bet?.betAmount || 0);
  const payout = Math.min(Math.max(0, multiplier * betAmount) || 0, maxPayout);

  return { matches, picks, multiplier, payout };
}


