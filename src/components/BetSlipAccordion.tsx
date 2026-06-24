import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { PlacedBetRow } from '../features/bets/betsApi';
import {
  resolveSelectionStatuses,
  selectionStatusClass,
  slipStatusClass,
  statusLabel,
  type SelectionStatus,
} from '../features/bets/selectionStatus';
import BetslipLiveLine from './BetslipLiveLine';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function slipStatusLabel(s: PlacedBetRow['settlementStatus']) {
  if (s === 'won') return 'Won';
  if (s === 'lost') return 'Lost';
  if (s === 'void') return 'Void';
  return 'Open';
}

function selectionStatusText(status: SelectionStatus) {
  return statusLabel(status);
}

type Props = {
  bet: PlacedBetRow;
  defaultOpen?: boolean;
};

export default function BetSlipAccordion({ bet, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const selections = bet.selections ?? [];
  const legCount = selections.length;

  const statusQ = useQuery({
    queryKey: ['bet-leg-status', bet.id, bet.settlementStatus],
    queryFn: () => resolveSelectionStatuses(selections, bet.settlementStatus),
    enabled: legCount > 0 && (open || bet.settlementStatus === 'open'),
    staleTime: 10_000,
    refetchInterval: bet.settlementStatus === 'open' ? 10_000 : false,
  });

  const legResolves = statusQ.data;

  const preview = selections[0];
  const previewTitle = preview?.matchTitle || 'Selection';
  const previewPick = preview?.pick ?? '';
  const previewOdds = preview?.odds ?? '';

  return (
    <section className={`b365-my-bets-acc ${open ? 'b365-my-bets-acc--open' : ''}`}>
      <button
        type="button"
        className="b365-my-bets-acc__summary"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="b365-my-bets-acc__summary-main">
          <div className="b365-my-bets-acc__title-row">
            <span className="b365-my-bets-acc__title">Bet Slip {bet.coupon}</span>
            <span className={`b365-my-bets-status ${slipStatusClass(bet.settlementStatus)}`}>
              {slipStatusLabel(bet.settlementStatus)}
            </span>
          </div>

          <div className="b365-my-bets-acc__metrics">
            <span className="b365-my-bets-acc__metric">
              <span className="b365-my-bets-acc__metric-label">Stake</span>
              <span className="b365-my-bets-acc__metric-value">{bet.stake.toFixed(2)}</span>
            </span>
            <span className="b365-my-bets-acc__metric-divider" aria-hidden />
            <span className="b365-my-bets-acc__metric">
              <span className="b365-my-bets-acc__metric-label">Possible win</span>
              <span className="b365-my-bets-acc__metric-value b365-my-bets-acc__metric-value--win">
                {bet.possibleWin.toFixed(2)}
              </span>
            </span>
            {bet.settlementStatus === 'won' && bet.winAmount > 0 ? (
              <>
                <span className="b365-my-bets-acc__metric-divider" aria-hidden />
                <span className="b365-my-bets-acc__metric">
                  <span className="b365-my-bets-acc__metric-label">Paid</span>
                  <span className="b365-my-bets-acc__metric-value b365-my-bets-acc__metric-value--paid">
                    {bet.winAmount.toFixed(2)}
                  </span>
                </span>
              </>
            ) : null}
          </div>

          {!open && preview ? (
            <div className="b365-my-bets-acc__preview">
              <span className="b365-my-bets-acc__preview-match">{previewTitle}</span>
              {legResolves?.[0]?.live?.isLive ? (
                <BetslipLiveLine
                  live={legResolves[0].live}
                  className="b365-betslip-live-line b365-my-bets-acc__preview-live"
                />
              ) : null}
              <span className="b365-my-bets-acc__preview-pick">
                {previewPick} @ {previewOdds}
              </span>
              {legCount > 1 ? (
                <span className="b365-my-bets-acc__preview-more">+{legCount - 1} more</span>
              ) : null}
            </div>
          ) : null}

          <time className="b365-my-bets-acc__date" dateTime={bet.createdAt}>
            {formatDate(bet.createdAt)}
          </time>
        </div>

        <span className="b365-my-bets-acc__side">
          {legCount > 0 ? (
            <span className="b365-my-bets-acc__legs-badge">
              {legCount} {legCount === 1 ? 'leg' : 'legs'}
            </span>
          ) : null}
          <span className={`b365-my-bets-acc__chev ${open ? 'b365-my-bets-acc__chev--open' : ''}`} aria-hidden />
        </span>
      </button>

      {open ? (
        <div className="b365-my-bets-acc__body">
          <div className="b365-my-bets-acc__body-head">
            <span>Selections</span>
            {statusQ.isFetching ? <span className="b365-my-bets-acc__refreshing">Updating…</span> : null}
          </div>

          {legCount === 0 ? (
            <p className="b365-muted b365-my-bets-acc__empty">No selection details stored for this slip.</p>
          ) : (
            <ul className="b365-my-bets-legs">
              {selections.map((sel, i) => {
                const resolve = legResolves?.[i];
                const legStatus: SelectionStatus =
                  resolve?.status ??
                  (bet.settlementStatus === 'void'
                    ? 'void'
                    : bet.settlementStatus === 'won'
                      ? 'won'
                      : 'pending');
                return (
                  <li key={`${sel.gameId}-${sel.eventId}-${i}`} className="b365-my-bets-leg">
                    <div className="b365-my-bets-leg__main">
                      <span className="b365-my-bets-leg__match">{sel.matchTitle || 'Match'}</span>
                      {resolve?.live?.isLive ? (
                        <BetslipLiveLine live={resolve.live} className="b365-betslip-live-line b365-my-bets-leg__live" />
                      ) : null}
                      <span className="b365-my-bets-leg__market">{sel.pick || 'Pick'}</span>
                    </div>
                    <div className="b365-my-bets-leg__meta">
                      <span className="b365-my-bets-leg__odds">{Number(sel.odds).toFixed(2)}</span>
                      <span className={`b365-my-bets-leg-status ${selectionStatusClass(legStatus)}`}>
                        {selectionStatusText(legStatus)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {legCount > 1 ? (
            <div className="b365-my-bets-acc__combo">
              <span>Combined odds</span>
              <strong>
                {selections.reduce((acc, s) => acc * (Number(s.odds) || 1), 1).toFixed(2)}
              </strong>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
