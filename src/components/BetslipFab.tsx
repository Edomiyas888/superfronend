import { useBetslipStore } from '../features/betslip/betslipStore';
import { useBetslipDrawerStore } from '../features/betslip/betslipDrawerStore';

export default function BetslipFab() {
  const betslipCount = useBetslipStore((s) => Object.keys(s.events).length);
  const openBetslipDrawer = useBetslipDrawerStore((s) => s.open);

  return (
    <button
      type="button"
      className="b365-betslip-fab"
      aria-label={betslipCount > 0 ? `Bet slip, ${betslipCount} selections` : 'Bet slip'}
      onClick={openBetslipDrawer}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
      {betslipCount > 0 && (
        <span className="b365-betslip-fab-badge" aria-hidden="true">
          {betslipCount}
        </span>
      )}
    </button>
  );
}
