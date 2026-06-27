import BetslipLiveLine from './BetslipLiveLine';
import BetslipSelectionOdds from './BetslipSelectionOdds';
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
  const showLive = event.isLive || liveInfo?.isLive;

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
        <div className="b365-betslip-pick-title">{event.title}</div>
        {pendingChange ? (
          <span className="b365-betslip-selection-badge">Updated</span>
        ) : null}
      </div>
      {showLive ? <BetslipLiveLine live={liveInfo} /> : null}
      <BetslipSelectionOdds
        marketName={event.marketName}
        pick={event.pick}
        price={event.price}
        initialPrice={initial}
        priceChanged={event.priceChanged}
        suspended={event.suspended}
      />
      <button type="button" className="b365-btn-ghost" onClick={() => onRemove(selectionKey)}>
        Remove
      </button>
    </div>
  );
}
