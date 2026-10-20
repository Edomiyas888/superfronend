import BetslipSelectionOdds from './BetslipSelectionOdds';
import { SportIcon } from './SportIcon';
import type { BetslipEventLike } from '../api/placeBet';
import type { LiveGameDisplay } from '../utils/matchLiveDisplay';

type Props = {
  selectionKey: string;
  event: BetslipEventLike;
  liveInfo?: LiveGameDisplay | null;
  onRemove: (key: string) => void;
};

export default function BetslipSelectionCard({ selectionKey, event, liveInfo, onRemove }: Props) {
  const initial = event.initialPrice ?? event.price;
  const pendingChange =
    Boolean(event.priceChanged) && Math.abs(event.price - initial) > 0.001;
  const showLive = Boolean(event.isLive || liveInfo?.isLive);
  const hasScore = liveInfo?.homeScore != null && liveInfo?.awayScore != null;

  return (
    <div
      className={[
        'b365-betslip-selection',
        event.suspended ? 'b365-betslip-selection--suspended' : '',
        pendingChange ? 'b365-betslip-selection--updated' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="b365-betslip-selection-head">
        <SportIcon
          alias={event.sportAlias ?? ''}
          name={event.sportName ?? ''}
          className="b365-betslip-selection-sport"
        />
        <div className="b365-betslip-pick-title">
          <span className="b365-betslip-team">{event.teamone}</span>
          {hasScore ? (
            <span className="b365-betslip-score">
              {liveInfo?.homeScore} : {liveInfo?.awayScore}
            </span>
          ) : (
            <span className="b365-betslip-vs">v</span>
          )}
          <span className="b365-betslip-team">{event.teamtwo}</span>
        </div>
        <div className="b365-betslip-selection-side">
          {pendingChange ? <span className="b365-betslip-selection-badge">Updated</span> : null}
          {showLive ? <span className="b365-betslip-live-badge">Live</span> : null}
          <button
            type="button"
            className="b365-betslip-remove"
            onClick={() => onRemove(selectionKey)}
            aria-label={`Remove ${event.teamone} v ${event.teamtwo}`}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      <BetslipSelectionOdds
        marketName={event.marketName}
        pick={event.pick}
        price={event.price}
        initialPrice={initial}
        priceChanged={event.priceChanged}
        suspended={event.suspended}
      />
    </div>
  );
}
