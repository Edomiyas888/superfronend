import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { restSearchCompetitions, restSearchGames, type CompetitionHit } from '../../api/restSports';
import { useSports } from '../../contexts/SportsContext';
import MatchListByDate from '../../components/MatchListByDate';
import { useSearchStore } from './searchStore';

/** Games and app pages, matched on the client as the player types. */
const SHORTCUTS = [
  { to: '/bingo', label: 'Super Bingo', hint: 'Game', keywords: 'bingo super bingo 75 ball card ቢንጎ' },
  { to: '/keno', label: 'Fast Keno', hint: 'Game', keywords: 'keno fast keno numbers draw ኬኖ' },
  { to: '/spin', label: 'Spin & Win', hint: 'Daily wheel', keywords: 'spin win wheel free spin prize' },
  { to: '/live', label: 'In-Play', hint: 'Live betting', keywords: 'live in-play inplay now' },
  { to: '/premier-league', label: 'Premier League', hint: 'England', keywords: 'premier league epl england' },
  { to: '/sports', label: 'All sports', hint: 'Sports', keywords: 'sports all sports football soccer' },
  { to: '/wallet?tab=deposit', label: 'Deposit', hint: 'Wallet', keywords: 'deposit telebirr add money top up wallet' },
  { to: '/wallet', label: 'Wallet', hint: 'Balance & withdraw', keywords: 'wallet balance withdraw bonus transactions' },
  { to: '/my-bets', label: 'My Bets', hint: 'Your slips', keywords: 'my bets slips tickets history' },
  { to: '/invite', label: 'Invite friends', hint: 'Referral bonus', keywords: 'invite friends referral golden wheel' },
  { to: '/profile', label: 'Profile', hint: 'Account', keywords: 'profile account login sign in phone' },
];

const QUICK = ['/bingo', '/keno', '/spin', '/live', '/premier-league', '/wallet?tab=deposit'];
const SUGGESTIONS = ['Arsenal', 'Real Madrid', 'Barcelona', 'Champions League', 'Man City'];

/** Feed searches start at this many letters; shorter terms match half the feed. */
const MIN_FEED_CHARS = 3;
const DEBOUNCE_MS = 300;

function useDebounced(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

function leagueLink(hit: CompetitionHit) {
  const params = new URLSearchParams({ alias: hit.sportAlias, league: 'all', period: 'all', q: hit.name });
  return `/sport/${hit.sportId}?${params.toString()}`;
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export default function SearchOverlay() {
  const isOpen = useSearchStore((s) => s.isOpen);
  const close = useSearchStore((s) => s.close);
  const { pathname, search } = useLocation();
  const { sports } = useSports();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const term = text.trim();
  const feedTerm = useDebounced(term.length >= MIN_FEED_CHARS ? term : '', DEBOUNCE_MS);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  // Any result opens a page; leave search behind when it does.
  useEffect(() => {
    close();
  }, [pathname, search, close]);

  const gamesQ = useQuery({
    queryKey: ['search', 'games', feedTerm.toLowerCase()],
    queryFn: () => restSearchGames(feedTerm),
    enabled: isOpen && feedTerm.length >= MIN_FEED_CHARS,
    staleTime: 30_000,
  });
  const leaguesQ = useQuery({
    queryKey: ['search', 'leagues', feedTerm.toLowerCase()],
    queryFn: () => restSearchCompetitions(feedTerm),
    enabled: isOpen && feedTerm.length >= MIN_FEED_CHARS,
    staleTime: 60_000,
  });

  const lower = term.toLowerCase();
  const shortcuts = useMemo(
    () =>
      lower
        ? SHORTCUTS.filter((s) => `${s.label} ${s.keywords}`.toLowerCase().includes(lower)).slice(0, 4)
        : [],
    [lower]
  );
  const sportHits = useMemo(
    () => (lower ? sports.filter((s) => s.name.toLowerCase().includes(lower)).slice(0, 4) : []),
    [lower, sports]
  );
  const leagues = (leaguesQ.data ?? []).slice(0, 6);
  // Live first, then by kickoff.
  const games = useMemo(
    () =>
      [...(gamesQ.data ?? [])].sort((a, b) => Number(b.isLive) - Number(a.isLive) || a.startTs - b.startTs),
    [gamesQ.data]
  );

  if (!isOpen) return null;

  const waitingForFeed = term.length >= MIN_FEED_CHARS && (feedTerm !== term || gamesQ.isPending);
  const nothingFound =
    term.length >= MIN_FEED_CHARS &&
    !waitingForFeed &&
    !gamesQ.isError &&
    !shortcuts.length &&
    !sportHits.length &&
    !leagues.length &&
    !games.length;

  return (
    <div className="b365-search" role="dialog" aria-modal="true" aria-label="Search">
      <div className="b365-search__bar">
        <label className="b365-search__field">
          <SearchIcon />
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Search teams, leagues, games…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {text ? (
            <button type="button" className="b365-search__clear" aria-label="Clear search" onClick={() => {
              setText('');
              inputRef.current?.focus();
            }}>
              ×
            </button>
          ) : null}
        </label>
        <button type="button" className="b365-search__cancel" onClick={close}>
          Cancel
        </button>
      </div>

      <div className="b365-search__body">
        {!term ? (
          <>
            <h3 className="b365-search__heading">Quick links</h3>
            <div className="b365-search__chips">
              {SHORTCUTS.filter((s) => QUICK.includes(s.to)).map((s) => (
                <Link key={s.to} to={s.to} className="b365-search__chip">
                  {s.label}
                </Link>
              ))}
            </div>
            <h3 className="b365-search__heading">Try searching</h3>
            <div className="b365-search__chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="b365-search__chip b365-search__chip--ghost" onClick={() => setText(s)}>
                  {s}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {shortcuts.length ? (
          <section>
            <h3 className="b365-search__heading">Games & pages</h3>
            <ul className="b365-search__list">
              {shortcuts.map((s) => (
                <li key={s.to}>
                  <Link to={s.to} className="b365-search__row">
                    <span className="b365-search__row-title">{s.label}</span>
                    <span className="b365-search__row-hint">{s.hint}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {sportHits.length ? (
          <section>
            <h3 className="b365-search__heading">Sports</h3>
            <ul className="b365-search__list">
              {sportHits.map((s) => (
                <li key={s.id}>
                  <Link to={`/sport/${s.id}?alias=${encodeURIComponent(s.alias)}`} className="b365-search__row">
                    <span className="b365-search__row-title">{s.name}</span>
                    {s.gameCount ? <span className="b365-search__row-hint">{s.gameCount} games</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {leagues.length ? (
          <section>
            <h3 className="b365-search__heading">Leagues</h3>
            <ul className="b365-search__list">
              {leagues.map((l) => (
                <li key={l.id}>
                  <Link to={leagueLink(l)} className="b365-search__row">
                    <span className="b365-search__row-title">{l.name}</span>
                    <span className="b365-search__row-hint">
                      {l.sportName} · {l.regionName} · {l.gameCount} {l.gameCount === 1 ? 'game' : 'games'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {term.length > 0 && term.length < MIN_FEED_CHARS ? (
          <p className="b365-search__note">Type {MIN_FEED_CHARS} letters or more to search matches.</p>
        ) : null}

        {term.length >= MIN_FEED_CHARS && (waitingForFeed || games.length || gamesQ.isError) ? (
          <section>
            <h3 className="b365-search__heading">Matches</h3>
            <MatchListByDate
              games={waitingForFeed ? undefined : games}
              isPending={waitingForFeed}
              isError={gamesQ.isError}
              error={gamesQ.error}
              emptyMessage="No matches found."
            />
          </section>
        ) : null}

        {nothingFound ? <p className="b365-search__note">Nothing found for “{term}”. Try a team or league name.</p> : null}
      </div>
    </div>
  );
}
