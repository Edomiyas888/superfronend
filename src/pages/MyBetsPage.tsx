import { Link } from 'react-router-dom';
import { useBetslipStore } from '../features/betslip/betslipStore';

/** Current selections (no server history yet). */
export default function MyBetsPage() {
  const events = useBetslipStore((s) => s.events);
  const removeSelection = useBetslipStore((s) => s.removeSelection);
  const ids = Object.keys(events);

  return (
    <div>
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>My bets</span>
      </div>

      <h1 className="b365-page-title">My bets</h1>

      {ids.length === 0 ? (
        <div className="card b365-card">
          <p className="b365-muted" style={{ margin: 0 }}>
            You have no open selections. Tap odds on a match to add picks, or open the bet slip from the floating button.
          </p>
        </div>
      ) : (
        <div className="b365-my-bets-list">
          {ids.map((id) => {
            const ev = events[id];
            if (!ev) return null;
            return (
              <div key={id} className="card b365-card b365-my-bets-row">
                <div>
                  <div style={{ fontWeight: 600 }}>{ev.title}</div>
                  <div className="b365-muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {ev.marketName} · {ev.pick} @ {ev.price}
                  </div>
                </div>
                <button type="button" className="b365-btn-ghost" onClick={() => removeSelection(id)}>
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
