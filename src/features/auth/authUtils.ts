export type AuthTab = 'login' | 'signup';

export function friendlyAuthError(err: unknown, fallback: string): string {
  if (err instanceof TypeError && /fetch|network/i.test(String(err.message))) {
    return `${fallback} Check that the API is running and CORS allows this site’s URL (no trailing slash).`;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}
