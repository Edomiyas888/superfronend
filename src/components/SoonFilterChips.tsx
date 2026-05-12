import { SOON_FILTER_OPTIONS, type SoonFilterKey } from '../constants/upcomingSoon';

type Props = {
  value: SoonFilterKey;
  onChange: (key: SoonFilterKey) => void;
  ariaLabel?: string;
};

export default function SoonFilterChips({
  value,
  onChange,
  ariaLabel = 'Kickoff time window',
}: Props) {
  return (
    <div className="b365-pop-leagues" role="tablist" aria-label={ariaLabel}>
      <div className="b365-pop-leagues-scroll">
        {SOON_FILTER_OPTIONS.map(({ key, label }) => {
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
