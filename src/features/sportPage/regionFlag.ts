/**
 * `flag-icons` class code (`gb-eng`, `de`, `eu` …) for a Swarm region name, or null for regions
 * that are not a country (World, continents, tours) — those get a globe instead.
 */

/** Swarm names that are not plain English country names, or have no ISO code of their own. */
const OVERRIDES: Record<string, string | null> = {
  england: 'gb-eng',
  scotland: 'gb-sct',
  wales: 'gb-wls',
  northernireland: 'gb-nir',
  europe: 'eu',
  usa: 'us',
  unitedstates: 'us',
  korea: 'kr',
  koreasouth: 'kr',
  southkorea: 'kr',
  koreanorth: 'kp',
  northkorea: 'kp',
  turkiye: 'tr',
  turkey: 'tr',
  republicofireland: 'ie',
  ireland: 'ie',
  cotedivoire: 'ci',
  ivorycoast: 'ci',
  hongkong: 'hk',
  macau: 'mo',
  czechrepublic: 'cz',
  russia: 'ru',
  kosovo: 'xk',
  bosniaandherzegovina: 'ba',
  trinidadandtobago: 'tt',
  drcongo: 'cd',
  congodr: 'cd',
  palestine: 'ps',
  world: null,
  international: null,
  africa: null,
  asia: null,
  oceania: null,
  americas: null,
  northamerica: null,
  southamerica: null,
  centralamerica: null,
};

function normalise(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z]/g, '');
}

/** Codes `flag-icons` ships an SVG for — file names only, nothing is loaded. */
const AVAILABLE = new Set(
  Object.keys(import.meta.glob('/node_modules/flag-icons/flags/4x3/*.svg')).map((path) =>
    path.slice(path.lastIndexOf('/') + 1, -'.svg'.length)
  )
);

let byName: Map<string, string> | null = null;

/** English country name → ISO 3166 code, built once from the browser's own region names. */
function countryCodes(): Map<string, string> {
  if (byName) return byName;
  byName = new Map();
  try {
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    for (let a = 65; a <= 90; a++) {
      for (let b = 65; b <= 90; b++) {
        const code = String.fromCharCode(a, b);
        const name = names.of(code);
        // Deprecated codes reuse current names (FX → "France"); keep only codes with a flag.
        if (name && name !== code && AVAILABLE.has(code.toLowerCase())) {
          byName.set(normalise(name), code.toLowerCase());
        }
      }
    }
  } catch {
    /* Older engines without Intl.DisplayNames: overrides only, globe for the rest. */
  }
  return byName;
}

export function regionFlagCode(regionName: string): string | null {
  const key = normalise(regionName);
  if (key in OVERRIDES) return OVERRIDES[key] ?? null;
  return countryCodes().get(key) ?? null;
}
