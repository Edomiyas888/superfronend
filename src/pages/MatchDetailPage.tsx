import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { restGetMatchOdds } from '../api/restSports';
import { useBetslipStore, keyFor } from '../features/betslip/betslipStore';
import TeamLogo from '../components/TeamLogo';
import LiveMatchAnimation from '../components/LiveMatchAnimation';
import OddsFlashArrow from '../components/OddsFlashArrow';
import { useOddPriceFlash } from '../hooks/useOddPriceFlash';
import type { BetslipEventLike } from '../api/placeBet';
import {
  MARKET_FILTER_LABELS,
  MARKET_FILTER_ORDER,
  marketCategory,
  type MarketCategoryId,
} from '../features/matchDetail/marketCategory';

function DetailOddButton({
  name,
  price,
  selected,
  onToggle,
}: {
  name: string;
  price: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const flash = useOddPriceFlash(price);
  return (
    <button type="button" className={`b365-detail-odd ${selected ? 'b365-detail-odd--selected' : ''}`} onClick={onToggle}>
      <span className="b365-detail-odd__label">{name}</span>
      <span className="b365-odd-price-with-flash b365-detail-odd__value">
        <OddsFlashArrow flash={flash} />
        <span className="b365-detail-odd__price">{price}</span>
      </span>
    </button>
  );
}

export default function MatchDetailPage() {
  const { gameId } = useParams();
  const id = gameId ? parseInt(gameId, 10) : NaN;
  const addSelection = useBetslipStore((s) => s.addSelection);
  const removeSelection = useBetslipStore((s) => s.removeSelection);
  const removeSelectionsForGameMarket = useBetslipStore((s) => s.removeSelectionsForGameMarket);
  const events = useBetslipStore((s) => s.events);

  const [filter, setFilter] = useState<MarketCategoryId>('all');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const q = useQuery({
    queryKey: ['match-odds', id],
    queryFn: () => restGetMatchOdds(id),
    enabled: Number.isFinite(id),
    refetchInterval: 15_000,
  });

  const detail = q.data;

  const categoriesPresent = useMemo(() => {
    if (!detail) return new Set<MarketCategoryId>();
    const s = new Set<MarketCategoryId>();
    detail.markets.forEach((m) => s.add(marketCategory(m)));
    return s;
  }, [detail]);

  const filterChips = useMemo(() => {
    return MARKET_FILTER_ORDER.filter((c) => c === 'all' || categoriesPresent.has(c));
  }, [categoriesPresent]);

  const filteredMarkets = useMemo(() => {
    if (!detail) return [];
    if (filter === 'all') return detail.markets;
    return detail.markets.filter((m) => marketCategory(m) === filter);
  }, [detail, filter]);

  useEffect(() => {
    setExpanded({});
  }, [filter]);

  const isMarketOpen = useCallback(
    (marketId: number, index: number) => {
      if (expanded[marketId] !== undefined) return expanded[marketId];
      return index === 0;
    },
    [expanded]
  );

  const toggleOdd = (marketId: number, eventId: number, name: string, price: number, marketName: string) => {
    if (!detail) return;
    const k = keyFor(detail.gameId, marketId, eventId);
    const existing = events[k];
    if (existing) {
      removeSelection(k);
      return;
    }
    removeSelectionsForGameMarket(detail.gameId, marketId);
    const ev: BetslipEventLike = {
      eventId,
      gameId: detail.gameId,
      marketName,
      marketType: marketName,
      teamone: detail.team1,
      teamtwo: detail.team2,
      region: detail.regionName,
      competitionName: detail.competitionName,
      title: `${detail.team1} vs ${detail.team2}`,
      pick: name,
      price,
      isLive: detail.isLive,
      dateofmatch: Math.floor(detail.startTs),
    };
    addSelection(k, ev);
  };

  const toggleAccordion = (marketId: number, index: number) => {
    setExpanded((p) => {
      const cur = p[marketId];
      const wasOpen = cur !== undefined ? cur : index === 0;
      return { ...p, [marketId]: !wasOpen };
    });
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

          <section className="b365-md-markets" aria-label="Betting markets">
            <div className="b365-md-toolbar">
              <h2 className="b365-md-toolbar__title">Markets</h2>
              <p className="b365-md-toolbar__hint">Filter by market type, then expand a section</p>
            </div>

            <div className="b365-md-filters" role="tablist" aria-label="Market categories">
              {filterChips.map((cid) => (
                <button
                  key={cid}
                  type="button"
                  role="tab"
                  aria-selected={filter === cid}
                  className={`b365-md-filter-chip ${filter === cid ? 'b365-md-filter-chip--active' : ''}`}
                  onClick={() => setFilter(cid)}
                >
                  {cid === 'all' ? 'All' : MARKET_FILTER_LABELS[cid]}
                </button>
              ))}
            </div>

            {filteredMarkets.length === 0 ? (
              <p className="b365-md-empty b365-muted">No markets in this category.</p>
            ) : (
              <div className="b365-md-acc-list">
                {filteredMarkets.map((m, i) => {
                  const open = isMarketOpen(m.id, i);
                  return (
                    <section key={m.id} className="b365-md-acc">
                      <button
                        type="button"
                        className="b365-md-acc__summary"
                        aria-expanded={open}
                        id={`b365-md-acc-h-${m.id}`}
                        onClick={() => toggleAccordion(m.id, i)}
                      >
                        <span className="b365-md-acc__title">{m.name}</span>
                        <span className="b365-md-acc__meta">
                          {m.events.length} {m.events.length === 1 ? 'selection' : 'selections'}
                        </span>
                        <span className={`b365-md-acc__chev ${open ? 'b365-md-acc__chev--open' : ''}`} aria-hidden />
                      </button>
                      <div
                        className="b365-md-acc__body"
                        id={`b365-md-acc-p-${m.id}`}
                        role="region"
                        aria-labelledby={`b365-md-acc-h-${m.id}`}
                        hidden={!open}
                      >
                        <div className="b365-md-odds-grid">
                          {m.events.map((e) => {
                            const k = keyFor(detail.gameId, m.id, e.id);
                            const sel = !!events[k];
                            const price = Number(e.price);
                            return (
                              <DetailOddButton
                                key={e.id}
                                name={e.name}
                                price={price}
                                selected={sel}
                                onToggle={() => toggleOdd(m.id, e.id, e.name, price, m.name)}
                              />
                            );
                          })}
                        </div>
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
