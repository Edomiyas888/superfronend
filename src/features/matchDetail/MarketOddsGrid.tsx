import type { MarketEventView, MarketView } from '../../api/types';
import OddsFlashArrow from '../../components/OddsFlashArrow';
import OddSelectTick from '../../components/OddSelectTick';
import { useOddPriceFlash } from '../../hooks/useOddPriceFlash';
import { useOddSelectPulse } from '../../hooks/useOddSelectPulse';
import { selectionLabel } from './topMarkets';

export type OddPickProps = {
  isSelected: (m: MarketView, e: MarketEventView) => boolean;
  onPick: (m: MarketView, e: MarketEventView) => void;
};

/** Columns follow the selection count so 2-way markets get the full width (no empty third cell). */
function oddsGridClass(selectionCount: number): string {
  const cols = selectionCount >= 1 && selectionCount <= 3 ? selectionCount : 0;
  return cols ? `b365-md-odds-grid b365-md-odds-grid--${cols}` : 'b365-md-odds-grid';
}

function DetailOddButton({
  name,
  price,
  selected,
  onToggle,
}: {
  name: string;
  price: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const flash = useOddPriceFlash(price);
  const { pulseKey, pulsing, tickVisible } = useOddSelectPulse(selected);
  return (
    <button
      type="button"
      className={`b365-detail-odd${selected ? ' b365-detail-odd--selected' : ''}${pulsing ? ' b365-odd-pulsing' : ''}`}
      onClick={onToggle}
      aria-pressed={selected}
    >
      <OddSelectTick pulseKey={pulseKey} visible={tickVisible} />
      <span className="b365-detail-odd__label">{name}</span>
      <span className="b365-odd-price-with-flash b365-detail-odd__value">
        <OddsFlashArrow flash={flash} />
        <span className="b365-detail-odd__price">{price}</span>
      </span>
    </button>
  );
}

/** A single market's selections as a grid of labelled odds. */
export function MarketOddsGrid({ market, isSelected, onPick }: { market: MarketView } & OddPickProps) {
  return (
    <div className={oddsGridClass(market.events.length)}>
      {market.events.map((e) => (
        <DetailOddButton
          key={e.id}
          name={selectionLabel(market, e)}
          price={Number(e.price)}
          selected={isSelected(market, e)}
          onToggle={() => onPick(market, e)}
        />
      ))}
    </div>
  );
}
