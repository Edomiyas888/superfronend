import React, { useMemo, useState } from 'react';
import '../components/keno-tabs-content.css';

const StatsTabContent = ({ numberFrequencies }) => {
  const [sortByFrequency, setSortByFrequency] = useState(false);

  const rows = useMemo(() => {
    const items = Array.from({ length: 80 }, (_, index) => {
      const num = index + 1;
      return {
        num,
        freq: numberFrequencies[num] || 0,
      };
    });

    if (sortByFrequency) {
      return items.sort((a, b) => b.freq - a.freq || a.num - b.num);
    }

    return items;
  }, [numberFrequencies, sortByFrequency]);

  const maxFreq = useMemo(
    () => Math.max(0, ...rows.map((row) => row.freq)),
    [rows],
  );

  return (
    <div className="keno-tab-content keno-tab-content--statistics">
      <div className="keno-stats-toolbar">
        <span className="keno-stats-toolbar__label">Last 100 rounds</span>
        <button
          type="button"
          className="keno-stats-toolbar__sort"
          onClick={() => setSortByFrequency((prev) => !prev)}
        >
          Sort
          <span className="keno-stats-toolbar__sort-icon" aria-hidden="true" />
        </button>
      </div>

      {rows.map((row) => {
        const progressPercent = maxFreq ? (row.freq / maxFreq) * 100 : 0;

        return (
          <div className="keno-stats-row" key={row.num}>
            <span className="keno-stats-row__num-badge">{row.num}</span>
            <div className="keno-stats-row__bar-wrap">
              <div className="keno-stats-row__bar" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="keno-stats-row__val">{row.freq}</span>
          </div>
        );
      })}
    </div>
  );
};

export default StatsTabContent;
