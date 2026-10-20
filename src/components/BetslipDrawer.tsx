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
      <aside className="b365-drawer-panel b365-drawer-panel--slip" aria-label="Bet slip">
        <BetslipContent onClose={close} />
      </aside>
    </>
  );
}
