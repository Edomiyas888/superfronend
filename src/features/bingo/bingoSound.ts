const MUTE_KEY = 'superbet_bingo_muted';

export function isBingoMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setBingoMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* private mode: the toggle just won't stick */
  }
}

let current: HTMLAudioElement | null = null;

/** Announce a called ball (`/bingo/calls/<n>.mp3`). Browsers may block it until the first tap. */
export function playBallCall(n: number) {
  if (isBingoMuted() || !Number.isInteger(n) || n < 1 || n > 75) return;
  current?.pause();
  current = new Audio(`/bingo/calls/${n}.mp3`);
  void current.play().catch(() => {});
}
