import { isWorldCupCompetition } from './worldCupFilter';

function norm(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** English top flight only — not Ethiopian/Russian/etc. "Premier League". */
function matchesEnglishPremierLeague(competitionName: string): boolean {
  const c = norm(competitionName);
  if (!c.includes('premier league') && c !== 'epl') return false;

  const blocked =
    /^(?!english\b)(?!england\b)[\w.]+\s+premier league/.test(c) ||
    /\b(ethiopian|russian|ghanaian|irish|welsh|scottish|kuwaiti|bahraini|maltese|lebanese|jordanian|bangladesh|israeli|azerbaijan|belarus|ukrainian|kazakh|nigerian|south african|zambian|ugandan|tanzanian|kenyan|botswana|namibia|premier league 2|u21|u23|women|womens|feminine|reserve|youth|development|championship)\b/.test(
      c
    );

  if (blocked) return false;

  return (
    c === 'premier league' ||
    c === 'english premier league' ||
    c === 'epl' ||
    (c.includes('england') && c.includes('premier league')) ||
    (c.includes('english') && c.includes('premier league'))
  );
}

/** German top flight only — not 2. Bundesliga or Austrian Bundesliga. */
function matchesGermanBundesliga(competitionName: string): boolean {
  const c = norm(competitionName);
  if (!c.includes('bundesliga')) return false;

  if (
    /\b(2\.?\s*bundesliga|2nd bundesliga|3\.?\s*liga|austria|austrian|swiss|switzerland|regionalliga|relegation)\b/.test(
      c
    )
  ) {
    return false;
  }

  return (
    c === 'bundesliga' ||
    c === '1. bundesliga' ||
    c === 'german bundesliga' ||
    (c.includes('germany') && c.includes('bundesliga'))
  );
}

/** Spanish top flight only. */
function matchesSpanishLaLiga(competitionName: string): boolean {
  const c = norm(competitionName).replace('laliga', 'la liga');
  if (!c.includes('la liga') && !c.includes('primera division') && !c.includes('primera división')) {
    return false;
  }

  if (/\b(u19|u21|u23|women|womens|feminine|segunda|second|2nd|reserve|youth)\b/.test(c)) {
    return false;
  }

  if (c.includes('la liga')) {
    return (
      c === 'la liga' ||
      c.startsWith('la liga ') ||
      c.includes('spain') ||
      c.includes('spanish') ||
      c.includes('ea sports')
    );
  }

  // Primera División without "la liga" — require Spain context
  return c.includes('spain') || c.includes('spanish') || c.includes('espana') || c.includes('españa');
}

/** Italian Serie A only. */
function matchesItalianSerieA(competitionName: string): boolean {
  const c = norm(competitionName);
  if (!c.includes('serie a')) return false;
  if (/\b(brazil|brasil|brazilian|ecuador|bra\s*serie|b\s*serie|women|womens|u19|u20|youth)\b/.test(c)) {
    return false;
  }
  return c === 'serie a' || c.includes('italy') || c.includes('italian') || c.startsWith('serie a ');
}

/** French Ligue 1 only. */
function matchesFrenchLigue1(competitionName: string): boolean {
  const c = norm(competitionName);
  if (!c.includes('ligue 1') && !c.includes('ligue1')) return false;
  if (/\b(ligue 2|ligue2|women|womens|u19|youth|senegal|ivory|maroc|tunisia|algeria|congo)\b/.test(c)) {
    return false;
  }
  return c.includes('france') || c.includes('french') || c === 'ligue 1' || c.startsWith('ligue 1 ');
}

/** Portuguese Primeira Liga only. */
function matchesPortuguesePrimeiraLiga(competitionName: string): boolean {
  const c = norm(competitionName);
  if (!c.includes('primeira liga')) return false;
  if (/\b(brazil|brasil|women|womens|u23|youth|segunda)\b/.test(c)) return false;
  return c.includes('portugal') || c.includes('portuguese') || c === 'primeira liga';
}

/** Dutch Eredivisie only. */
function matchesDutchEredivisie(competitionName: string): boolean {
  const c = norm(competitionName);
  if (!c.includes('eredivisie')) return false;
  if (/\b(women|womens|youth|u19|u21|eerste divisie|2nd)\b/.test(c)) return false;
  return c.includes('netherlands') || c.includes('dutch') || c.includes('holland') || c === 'eredivisie';
}

function defaultSubstringMatch(competitionName: string, league: string): boolean {
  const c = norm(competitionName);
  const l = norm(league);
  if (c === l) return true;
  return c.includes(l);
}

const LEAGUE_MATCHERS: Record<string, (competitionName: string) => boolean> = {
  'World Cup': isWorldCupCompetition,
  'Premier League': matchesEnglishPremierLeague,
  Bundesliga: matchesGermanBundesliga,
  'La Liga': matchesSpanishLaLiga,
  'Serie A': matchesItalianSerieA,
  'Ligue 1': matchesFrenchLigue1,
  'UEFA Champions League': (c) => defaultSubstringMatch(c, 'UEFA Champions League'),
  'UEFA Europa League': (c) => defaultSubstringMatch(c, 'UEFA Europa League'),
  'UEFA Europa Conference League': (c) => defaultSubstringMatch(c, 'UEFA Europa Conference League'),
  'FA Cup': (c) => defaultSubstringMatch(c, 'FA Cup'),
  'Primeira Liga': matchesPortuguesePrimeiraLiga,
  Eredivisie: matchesDutchEredivisie,
};

/** Match Swarm `competition.name` to a Popular-leagues filter chip. */
export function competitionMatchesLeague(competitionName: string, league: string): boolean {
  const key = league.trim();
  if (!key) return true;
  const matcher = LEAGUE_MATCHERS[key];
  if (matcher) return matcher(competitionName);
  return defaultSubstringMatch(competitionName, key);
}
