import { getApiBaseUrl } from './config';

export type GuessWinMatch = {
  id: string;
  team1Name: string;
  team2Name: string;
  team1LogoUrl: string | null;
  team2LogoUrl: string | null;
  prizeText: string;
  suggestedScores: string[];
  kickoffAt: string | null;
  status: 'draft' | 'active' | 'closed';
  sortOrder: number;
  userGuess: string | null;
  displayGuessCount: number;
  createdAt?: string;
  updatedAt?: string;
};

async function parseJson<T>(res: Response): Promise<T & { error?: string }> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T & { error?: string };
  } catch {
    return { error: 'Invalid server response.' } as T & { error?: string };
  }
}

export async function fetchGuessWinMatches(
  authHeaders: Record<string, string> = {}
): Promise<GuessWinMatch[]> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/guess-win/matches`, {
    headers: authHeaders,
  });
  const data = await parseJson<{ items?: GuessWinMatch[]; error?: string }>(res);
  if (!res.ok) throw new Error(data.error ?? 'Could not load guess & win matches.');
  return data.items ?? [];
}

export async function submitGuessWinScore(
  matchId: string,
  score: string,
  authHeaders: Record<string, string>
): Promise<{ ok: boolean; score: string; displayGuessCount?: number }> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/guess-win/matches/${matchId}/guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ score }),
  });
  const data = await parseJson<{
    ok?: boolean;
    score?: string;
    displayGuessCount?: number;
    alreadySubmitted?: boolean;
    error?: string;
  }>(res);
  if (!res.ok) {
    if (res.status === 409 && data.score) {
      const err = new Error(data.error ?? 'You already submitted a guess for this match.') as Error & {
        alreadySubmitted?: boolean;
        score?: string;
        displayGuessCount?: number;
      };
      err.alreadySubmitted = true;
      err.score = data.score;
      err.displayGuessCount = data.displayGuessCount;
      throw err;
    }
    throw new Error(data.error ?? 'Could not save your guess.');
  }
  return {
    ok: Boolean(data.ok),
    score: data.score ?? score,
    displayGuessCount: data.displayGuessCount,
  };
}
