import React from 'react';
import '../components/keno-tabs-content.css';

const StatsTabContent = ({ numberFrequencies }) => {
  const freqValues = Object.values(numberFrequencies);
  const maxFreq = freqValues.length > 0 ? Math.max(...freqValues) : 0;

  return (
    <div className="keno-tab-content">
      <div className="keno-tab-content__header">
        <span>Last 100 rounds</span>
        <span>Sort</span>
      </div>
      <div className="keno-stats-table-header">
        <span className="keno-stats-table-header__num">#</span>
        <span className="keno-stats-table-header__bar" />
        <span className="keno-stats-table-header__val">Cnt</span>
      </div>
      {Array.from({ length: 80 }, (_, i) => i + 1).map((num) => {
        const freq = numberFrequencies[num] || 0;
        const progressPercent = maxFreq ? (freq / maxFreq) * 100 : 0;

        return (
          <div className="keno-stats-row" key={num}>
            <div className="keno-stats-row__num">
              <span className="keno-stats-row__num-badge">{num}</span>
            </div>
            <div className="keno-stats-row__bar-wrap">
              <div className="keno-stats-row__bar" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="keno-stats-row__val">{freq}</div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsTabContent;
