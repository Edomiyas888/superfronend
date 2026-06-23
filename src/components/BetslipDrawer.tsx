import { useEffect } from 'react';
import BetslipContent from './BetslipContent';
import { useBetslipDrawerStore } from '../features/betslip/betslipDrawerStore';

export default function BetslipDrawer() {
  const isOpen = useBetslipDrawerStore((s) => s.isOpen);
  const close = useBetslipDrawerStore((s) => s.close);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <>
      <div className="b365-drawer-backdrop" role="presentation" onClick={close} />
      <aside className="b365-drawer-panel" aria-label="Bet slip">
        <div className="b365-drawer-head">
          <h2 className="b365-drawer-title">Bet Slip</h2>
          <button type="button" className="b365-drawer-close" onClick={close} aria-label="Close bet slip">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="b365-drawer-body">
          <BetslipContent />
        </div>
      </aside>
    </>
  );
}
