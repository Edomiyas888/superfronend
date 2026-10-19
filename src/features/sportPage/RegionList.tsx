import { useState } from 'react';
import MatchListByDate from '../../components/MatchListByDate';
import { regionFlagCode } from './regionFlag';
import type { RegionGroup } from './regionGroups';

function RegionFlag({ region }: { region: string }) {
  const code = regionFlagCode(region);
  if (code) return <span className={`fi fi-${code} b365-region__flag`} aria-hidden />;
  return (
    <span className="b365-region__flag b365-region__flag--globe" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    </span>
  );
}

function toggle(set: ReadonlySet<string>, key: string): Set<string> {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

/** Sport fixtures as country rows (flag · name · count); each opens into its competitions. */
export default function RegionList({ regions }: { regions: RegionGroup[] }) {
  const [openRegions, setOpenRegions] = useState<ReadonlySet<string>>(new Set());
  const [openCompetitions, setOpenCompetitions] = useState<ReadonlySet<string>>(new Set());

  return (
    <div className="b365-regions">
      {regions.map((region) => {
        const open = openRegions.has(region.name);
        return (
          <section key={region.name} className={`b365-region${open ? ' b365-region--open' : ''}`}>
            <button
              type="button"
              className="b365-region__head"
              aria-expanded={open}
              onClick={() => setOpenRegions((s) => toggle(s, region.name))}
            >
              <RegionFlag region={region.name} />
              <span className="b365-region__name">{region.name}</span>
              <span className="b365-region__count">{region.gameCount}</span>
              <span className={`b365-region__chev${open ? ' b365-region__chev--open' : ''}`} aria-hidden />
            </button>
            {open ? (
              <div className="b365-region__body">
                {region.competitions.map((c) => {
                  const key = `${region.name}|${c.name}`;
                  const compOpen = openCompetitions.has(key);
                  return (
                    <div key={key} className="b365-region-comp">
                      <button
                        type="button"
                        className="b365-region-comp__head"
                        aria-expanded={compOpen}
                        onClick={() => setOpenCompetitions((s) => toggle(s, key))}
                      >
                        <span className="b365-region-comp__name">{c.name}</span>
                        <span className="b365-region__count">{c.games.length}</span>
                        <span
                          className={`b365-region__chev${compOpen ? ' b365-region__chev--open' : ''}`}
                          aria-hidden
                        />
                      </button>
                      {compOpen ? (
                        <div className="b365-region-comp__games">
                          <MatchListByDate games={c.games} emptyMessage="No fixtures in this competition." />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
