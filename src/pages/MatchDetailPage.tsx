import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { restGetMatchOdds } from '../api/restSports';
import { useBetslipStore, keyFor } from '../features/betslip/betslipStore';
import TeamLogo from '../components/TeamLogo';
import LiveMatchAnimation from '../components/LiveMatchAnimation';
import type { BetslipEventLike } from '../api/placeBet';
import type { MarketEventView, MarketView } from '../api/types';
import { MarketOddsGrid } from '../features/matchDetail/MarketOddsGrid';
import { groupLineFamilies } from '../features/matchDetail/lineFamilies';
import { ALL_TAB, marketTab, marketTabs } from '../features/matchDetail/marketTabs';
import {
  marketDisplayName,
  marketMatchesSearch,
  pickTopMarkets,
  selectionLabel,
  sortMarketsByImportance,
} from '../features/matchDetail/topMarkets';

export default function MatchDetailPage() {
  const { gameId } = useParams();
  const id = gameId ? parseInt(gameId, 10) : NaN;
  const addSelection = useBetslipStore((s) => s.addSelection);
  const removeSelection = useBetslipStore((s) => s.removeSelection);
  const removeSelectionsForGame = useBetslipStore((s) => s.removeSelectionsForGame);
  const selectionError = useBetslipStore((s) => s.selectionError);
  const clearSelectionError = useBetslipStore((s) => s.clearSelectionError);
  const events = useBetslipStore((s) => s.events);

  const [filter, setFilter] = useState<string>(ALL_TAB);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const q = useQuery({
    queryKey: ['match-odds', id],
    queryFn: () => restGetMatchOdds(id),
    enabled: Number.isFinite(id),
    refetchInterval: 15_000,
  });

  const detail = q.data;

  /** Tabs with the number of cards (a market with all its lines counts once) under each. */
  const filterChips = useMemo(() => {
    if (!detail) return [];
    const count = (list: typeof detail.markets) => groupLineFamilies(sortMarketsByImportance(list)).length;
    return [
      { tab: ALL_TAB, count: count(detail.markets) },
      ...marketTabs(detail.markets).map((tab) => ({
        tab,
        count: count(detail.markets.filter((m) => marketTab(m) === tab)),
      })),
    ];
  }, [detail]);

  // A refetch can drop the tab the user is on (live markets close); fall back to All.
  const activeFilter = filterChips.some((c) => c.tab === filter) ? filter : ALL_TAB;

  const topMarkets = useMemo(() => (detail ? pickTopMarkets(detail.markets) : []), [detail]);

  const topMarketIds = useMemo(() => new Set(topMarkets.map((m) => m.id)), [topMarkets]);

  const searchTerm = search.trim().toLowerCase();
  const searching = searchTerm.length > 0;

  /** Markets list as cards — every line of one bet (Total Goals 0.5 … 5.5) stacked in one. */
  const marketCards = useMemo(() => {
    if (!detail) return [];
    let list =
      activeFilter === ALL_TAB ? detail.markets : detail.markets.filter((m) => marketTab(m) === activeFilter);
    if (searching) {
      // Search spans every market, including the ones promoted into Top Markets.
      list = list.filter((m) => marketMatchesSearch(m, searchTerm));
    } else if (activeFilter === ALL_TAB) {
      list = list.filter((m) => !topMarketIds.has(m.id));
    }
    return groupLineFamilies(sortMarketsByImportance(list));
  }, [detail, activeFilter, topMarketIds, searching, searchTerm]);

  useEffect(() => {
    setExpanded({});
  }, [activeFilter, searchTerm]);

  const isCardOpen = useCallback(
    (key: string, index: number) => {
      if (expanded[key] !== undefined) return expanded[key];
      // A search result is only useful with its selections showing.
      return searching || index === 0;
    },
    [expanded, searching]
  );

  const isSelected = useCallback(
    (m: MarketView, e: MarketEventView) => (detail ? !!events[keyFor(detail.gameId, m.id, e.id)] : false),
    [detail, events]
  );

  const toggleOdd = (m: MarketView, e: MarketEventView) => {
    if (!detail) return;
    const k = keyFor(detail.gameId, m.id, e.id);
    const existing = events[k];
    if (existing) {
      removeSelection(k);
      return;
    }
    removeSelectionsForGame(detail.gameId);
    const swarmType = m.type != null && String(m.type).trim() ? String(m.type) : 'P1XP2';
    const price = Number(e.price);
    const ev: BetslipEventLike = {
      eventId: e.id,
      gameId: detail.gameId,
      marketId: m.id,
      marketName: marketDisplayName(m),
      marketType: swarmType,
      eventType: e.type ? String(e.type) : undefined,
      teamone: detail.team1,
      teamtwo: detail.team2,
      region: detail.regionName,
      competitionName: detail.competitionName,
      title: `${detail.team1} vs ${detail.team2}`,
      pick: selectionLabel(m, e),
      price,
      initialPrice: price,
      isLive: detail.isLive,
      dateofmatch: Math.floor(detail.startTs),
    };
    addSelection(k, ev);
  };

  useEffect(() => {
    if (!selectionError) return;
    const t = window.setTimeout(() => clearSelectionError(), 5000);
    return () => window.clearTimeout(t);
  }, [selectionError, clearSelectionError]);

  const toggleAccordion = (key: string, index: number) => {
    setExpanded((p) => ({ ...p, [key]: !isCardOpen(key, index) }));
  };

  return (
    <div className="b365-md-page">
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>Match</span>
      </div>

      {q.isLoading && <p className="b365-muted">Loading markets…</p>}
      {q.isError && <p className="b365-error">{q.error instanceof Error ? q.error.message : 'Error'}</p>}

      {detail && (
        <>
          <div className="b365-event-hero">
            <div className="b365-event-hero-teams">
              <div className="b365-event-hero-side">
                <TeamLogo
                  teamId={detail.team1Id}
                  name={detail.team1}
                  className="b365-event-hero-logo"
                  fallbackClassName="b365-event-hero-logo-fallback"
                />
                <span className="b365-event-hero-name">{detail.team1}</span>
              </div>
              <span className="b365-event-hero-vs">v</span>
              <div className="b365-event-hero-side">
                <TeamLogo
                  teamId={detail.team2Id}
                  name={detail.team2}
                  className="b365-event-hero-logo"
                  fallbackClassName="b365-event-hero-logo-fallback"
                />
                <span className="b365-event-hero-name">{detail.team2}</span>
              </div>
            </div>
            <p className="b365-event-meta">
              {detail.competitionName} · {detail.sportName} · {detail.isLive ? 'In-Play' : 'Pre-Match'} ·{' '}
              {new Date(detail.startTs * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          {detail.isLive ? (
            <LiveMatchAnimation
              sportAlias={detail.sportAlias}
              team1={detail.team1}
              team2={detail.team2}
              live={detail.live}
              homeScore={detail.markets.find((m) => m.homeScore != null && m.awayScore != null)?.homeScore}
              awayScore={detail.markets.find((m) => m.homeScore != null && m.awayScore != null)?.awayScore}
            />
          ) : null}

          {topMarkets.length > 0 && !searching ? (
            <section className="b365-md-top-markets" aria-label="Top markets">
              <h2 className="b365-md-top-markets__title">Top Markets</h2>
              <div className="b365-md-top-markets__list">
                {topMarkets.map((m) => (
                  <div key={m.id} className="b365-md-top-market">
                    <h3 className="b365-md-top-market__name">{marketDisplayName(m)}</h3>
                    <MarketOddsGrid market={m} isSelected={isSelected} onPick={toggleOdd} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="b365-md-markets" aria-label="Betting markets">
            <div className="b365-md-toolbar">
              <h2 className="b365-md-toolbar__title">Markets</h2>
              <p className="b365-md-toolbar__hint">
                {searching
                  ? `${marketCards.length} market${marketCards.length === 1 ? '' : 's'} matching “${search.trim()}”`
                  : 'Search or pick a tab, then expand a market'}
              </p>
            </div>

            <div className="b365-md-search">
              <svg className="b365-md-search__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
                <path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                className="b365-input b365-md-search__input"
                placeholder="Search markets or selections…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  // A global search is the useful default — narrowing again is one tap away.
                  if (e.target.value.trim()) setFilter(ALL_TAB);
                }}
                aria-label="Search betting markets"
              />
              {searching ? (
                <button
                  type="button"
                  className="b365-md-search__clear"
                  onClick={() => setSearch('')}
                  aria-label="Clear market search"
                >
                  ×
                </button>
              ) : null}
            </div>

            <div className="b365-md-filters" role="tablist" aria-label="Market categories">
              {filterChips.map(({ tab, count }) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === tab}
                  className={`b365-md-filter-chip ${activeFilter === tab ? 'b365-md-filter-chip--active' : ''}`}
                  onClick={() => setFilter(tab)}
                >
                  {tab}
                  <span className="b365-md-filter-chip__count">{count}</span>
                </button>
              ))}
            </div>

            {selectionError ? (
              <p className="b365-error b365-md-selection-error" role="alert">
                {selectionError}
              </p>
            ) : null}

            {marketCards.length === 0 ? (
              <p className="b365-md-empty b365-muted">
                {searching
                  ? `No markets match “${search.trim()}”.`
                  : 'No markets in this category.'}
              </p>
            ) : (
              <div className="b365-md-acc-list">
                {marketCards.map((card, i) => {
                  const open = isCardOpen(card.key, i);
                  const first = card.markets[0];
                  const lines = card.markets.length;
                  const selections = first?.events.length ?? 0;
                  const picked = card.markets.some((m) => m.events.some((e) => isSelected(m, e)));
                  const domId = first?.id ?? i;
                  return (
                    <section key={card.key} className={`b365-md-acc${picked ? ' b365-md-acc--picked' : ''}`}>
                      <button
                        type="button"
                        className="b365-md-acc__summary"
                        aria-expanded={open}
                        id={`b365-md-acc-h-${domId}`}
                        onClick={() => toggleAccordion(card.key, i)}
                      >
                        <span className="b365-md-acc__title">{card.title}</span>
                        <span className="b365-md-acc__meta">
                          {lines > 1
                            ? `${lines} lines`
                            : `${selections} ${selections === 1 ? 'selection' : 'selections'}`}
                        </span>
                        <span className={`b365-md-acc__chev ${open ? 'b365-md-acc__chev--open' : ''}`} aria-hidden />
                      </button>
                      <div
                        className="b365-md-acc__body"
                        id={`b365-md-acc-p-${domId}`}
                        role="region"
                        aria-labelledby={`b365-md-acc-h-${domId}`}
                        hidden={!open}
                      >
                        {open ? (
                          // Every line as its own row of the usual buttons: "Over 2.5 | 1.77", "Under 2.5 | 1.98".
                          <div className={lines > 1 ? 'b365-md-line-rows' : undefined}>
                            {card.markets.map((m) => (
                              <MarketOddsGrid key={m.id} market={m} isSelected={isSelected} onPick={toggleOdd} />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {!q.isLoading && !detail && <p className="b365-muted">Match not found.</p>}
    </div>
  );
}
