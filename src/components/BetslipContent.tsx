import { useBetslipStore } from '../features/betslip/betslipStore';

/** Shared betslip body — desktop rail + mobile drawer. */
export default function BetslipContent() {
  const events = useBetslipStore((s) => s.events);
  const stake = useBetslipStore((s) => s.stake);
  const setStake = useBetslipStore((s) => s.setStake);
  const removeSelection = useBetslipStore((s) => s.removeSelection);
  const clear = useBetslipStore((s) => s.clear);
  const placeBet = useBetslipStore((s) => s.placeBet);
  const placeStatus = useBetslipStore((s) => s.placeStatus);
  const placeMessage = useBetslipStore((s) => s.placeMessage);

  const ids = Object.keys(events);
  const hasSelections = ids.length > 0;

  const possibleWin = ids.reduce((acc, id) => {
    const ev = events[id];
    if (!ev) return acc;
    const s = Number.isFinite(Number(ev.singleStake)) && Number(ev.singleStake) > 0 ? Number(ev.singleStake) : stake;
    return acc + s * (ev.price || 1);
  }, 0);

  return (
    <>
      <div className="b365-betslip-tabs">
        <span className="b365-betslip-tab active">Bet Slip</span>
        <span className="b365-betslip-tab muted">My Bets</span>
      </div>

      {!hasSelections ? (
        <p className="b365-betslip-empty">Click odds to add selections to your bet slip.</p>
      ) : (
        <>
          {ids.map((id) => {
            const ev = events[id];
            if (!ev) return null;
            return (
              <div key={id} className="b365-betslip-selection">
                <div className="b365-betslip-pick-title">{ev.title}</div>
                <div className="b365-betslip-pick-meta">
                  {ev.marketName} · {ev.pick} @ {ev.price}
                </div>
                <button type="button" className="b365-btn-ghost" onClick={() => removeSelection(id)}>
                  Remove
                </button>
              </div>
            );
          })}
          <label className="b365-field-label">
            Stake
            <input
              type="number"
              min={0}
              step={0.01}
              className="b365-input"
              value={stake}
              onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
            />
          </label>
          <p className="b365-betslip-return">Est. return: {possibleWin.toFixed(2)}</p>
          <div className="b365-betslip-actions">
            <button
              type="button"
              className="b365-btn-primary"
              disabled={placeStatus === 'loading'}
              onClick={() => void placeBet(possibleWin, 0)}
            >
              {placeStatus === 'loading' ? 'Placing…' : 'Place bet'}
            </button>
            <button type="button" className="b365-btn-secondary" onClick={() => clear()}>
              Clear
            </button>
          </div>
          {placeMessage && (
            <p className={placeStatus === 'error' ? 'b365-error' : 'b365-muted'}>{placeMessage}</p>
          )}
        </>
      )}
    </>
  );
}
