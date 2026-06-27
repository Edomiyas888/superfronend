import { useEffect, useRef, useState } from 'react';
import { formatOdds } from '../utils/formatOdds';

type Props = {
  marketName: string;
  pick: string;
  price: number;
  initialPrice: number;
  priceChanged?: boolean;
  suspended?: boolean;
};

/**
 * Per-selection odds row — fixed layout, directional flash on tick updates only.
 */
export default function BetslipSelectionOdds({
  marketName,
  pick,
  price,
  initialPrice,
  priceChanged,
  suspended,
}: Props) {
  const prevPriceRef = useRef(price);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const prev = prevPriceRef.current;
    if (Math.abs(price - prev) <= 0.001) return;
    const dir = price > prev ? 'up' : 'down';
    prevPriceRef.current = price;
    setFlash(dir);
    const t = window.setTimeout(() => setFlash(null), 1400);
    return () => window.clearTimeout(t);
  }, [price]);

  const pendingChange = Boolean(priceChanged) && Math.abs(price - initialPrice) > 0.001;
  const trend = pendingChange ? (price > initialPrice ? 'up' : 'down') : null;
  const activeDir = flash ?? trend;

  return (
    <div className="b365-betslip-odds">
      <span className="b365-betslip-odds-label">
        {marketName} · {pick}
      </span>
      <div
        className={[
          'b365-betslip-odds-value-wrap',
          activeDir ? `b365-betslip-odds-value-wrap--${activeDir}` : '',
          flash ? 'b365-betslip-odds-value-wrap--flash' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {activeDir === 'up' ? (
          <span className="b365-betslip-odds-arrow b365-betslip-odds-arrow--up" aria-hidden>
            ▲
          </span>
        ) : null}
        {activeDir === 'down' ? (
          <span className="b365-betslip-odds-arrow b365-betslip-odds-arrow--down" aria-hidden>
            ▼
          </span>
        ) : null}
        <span className="b365-betslip-odds-value">{formatOdds(price)}</span>
      </div>
      <div
        className={`b365-betslip-odds-prev${pendingChange ? ' b365-betslip-odds-prev--visible' : ''}`}
        aria-hidden={!pendingChange}
      >
        {pendingChange ? `Was ${formatOdds(initialPrice)}` : '\u00a0'}
      </div>
      {suspended ? <span className="b365-betslip-odds-suspended">Suspended</span> : null}
    </div>
  );
}
