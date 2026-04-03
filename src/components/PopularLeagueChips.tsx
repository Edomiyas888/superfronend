type Props = {
  leagues: readonly string[];
  value: string;
  onChange: (league: string) => void;
};

export default function PopularLeagueChips({ leagues, value, onChange }: Props) {
  return (
    <div className="b365-pop-leagues" role="tablist" aria-label="League filter">
      <div className="b365-pop-leagues-scroll">
        {leagues.map((name) => {
          const active = value === name;
          return (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={active}
              className={`b365-pop-league-chip ${active ? 'active' : ''}`}
              onClick={() => onChange(name)}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
