/** Sidebar / Swarm often use `Soccer`; some locales use “Football”. */
export function isSoccerFootballSport(alias: string, name: string): boolean {
  const a = alias.trim().toLowerCase();
  const n = name.trim().toLowerCase();
  return (
    a === 'soccer' ||
    a === 'football' ||
    a === 'futbol' ||
    a === 'fussball' ||
    n.includes('soccer') ||
    n === 'football' ||
    (n.includes('football') && !n.includes('american'))
  );
}
