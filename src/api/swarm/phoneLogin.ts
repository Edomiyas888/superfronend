/** BC phone → login username (251…). */
export function normalizeBcUsername(rawUsername: string): string {
  const u = String(rawUsername ?? '').trim();
  if (!u) return '';
  if (u.startsWith('09')) return u.replace(/^0/, '251');
  if (u.startsWith('9') && !u.startsWith('251')) return `251${u}`;
  return u;
}

/** @deprecated alias */
export const normalizeFinixLoginUsername = normalizeBcUsername;

export function loginNameCandidates(phone: string, username: string): string[] {
  const out: string[] = [];
  const add = (v: string) => {
    const s = v.trim();
    if (s && !out.includes(s)) out.push(s);
  };
  if (phone) add(normalizeBcUsername(phone));
  if (username) add(normalizeBcUsername(username));
  add(phone);
  add(username);
  return out;
}
