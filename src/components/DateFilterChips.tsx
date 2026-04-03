import { DATE_FILTER_OPTIONS, type DateFilterKey } from '../constants/dateFilters';

type Props = {
  value: DateFilterKey;
  onChange: (key: DateFilterKey) => void;
  /** Shown for screen readers only */
  ariaLabel?: string;
};

export default function DateFilterChips({
  value,
  onChange,
  ariaLabel = 'Date range',
}: Props) {
  return (
    <div className="b365-pop-leagues" role="tablist" aria-label={ariaLabel}>
      <div className="b365-pop-leagues-scroll">
        {DATE_FILTER_OPTIONS.map(({ key, label }) => {
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`b365-pop-league-chip ${active ? 'active' : ''}`}
              onClick={() => onChange(key)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
