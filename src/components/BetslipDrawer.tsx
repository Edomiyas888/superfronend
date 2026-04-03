import { useState } from 'react';
import BetslipContent from './BetslipContent';
import { useBetslipStore } from '../features/betslip/betslipStore';
import '../App.css';

export default function BetslipDrawer() {
  const [expanded, setExpanded] = useState(false);
  const count = useBetslipStore((s) => Object.keys(s.events).length);

  return (
    <>
      <button type="button" className="betslip-fab" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
        Bet Slip{count > 0 ? ` (${count})` : ''}
      </button>
      {expanded && (
        <>
          <div className="drawer-backdrop" role="presentation" onClick={() => setExpanded(false)} />
          <aside className="drawer-panel b365-drawer-panel">
            <div className="drawer-head b365-drawer-head">
              <strong>Bet Slip</strong>
              <button type="button" className="b365-btn-ghost" onClick={() => setExpanded(false)}>
                Close
              </button>
            </div>
            <BetslipContent />
          </aside>
        </>
      )}
    </>
  );
}
