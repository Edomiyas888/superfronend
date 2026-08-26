import { isSpecialOrVirtualCompetition, isSpecialOrVirtualRegion } from './specialFixtureFilter';

/** Swarm region / competition names for the English top flight. */
export const EPL_REGION_NAME = 'England';
export const EPL_COMPETITION_NAME = 'Premier League';

function norm(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Swarm reuses the bare name "Premier League" for Russia, Ukraine, Egypt, Israel, Bahrain,
 * Kuwait, South Africa, Tanzania and the Faroe Islands, so the region has to disambiguate it.
 */
function isEnglandRegion(regionName: string): boolean {
  const r = norm(regionName);
  return r === 'england' || r === 'english';
}

/** Feeder / non-fixture competitions whose names also contain "premier league". */
function isNonTopFlightVariant(c: string): boolean {
  return (
    /\boutright\b/.test(c) ||
    /\bcup\b/.test(c) ||
    /matchday statistics/.test(c) ||
    /\bpremier league (2|ii)\b/.test(c) ||
    /\b(u\d{2}|youth|reserves?|development|women|womens|feminine|academy|international)\b/.test(c) ||
    /\b(northern|southern|isthmian|combined counties|non.?league)\b/.test(c)
  );
}

/**
 * Match Swarm `competition.name` (+ `region.name`) for English Premier League fixtures.
 *
 * A known region must be `England` — several countries ship the exact name "Premier League",
 * and the simulated feed ships "Betual England Premier League" under region "Virtual Matches",
 * so the competition name alone is never enough. Only a *missing* region falls back to the name.
 */
export function isPremierLeagueCompetition(
  competitionName: string,
  regionName?: string | null
): boolean {
  const c = norm(competitionName);
  if (!c) return false;
  if (isSpecialOrVirtualCompetition(c)) return false;
  if (isSpecialOrVirtualRegion(regionName)) return false;
  if (!c.includes('premier league') && c !== 'epl') return false;
  if (isNonTopFlightVariant(c)) return false;

  const region = (regionName ?? '').trim();
  if (region) return isEnglandRegion(region);

  // No region in this feed shape — fall back to a name that says England itself.
  return c === 'epl' || c.includes('england') || c.includes('english');
}
