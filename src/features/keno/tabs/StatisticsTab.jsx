import React from 'react';
import '../components/keno-tabs-content.css';

function formatRoundDate(timestamp) {
  if (!timestamp) return '';
  let ts = Number(timestamp);
  if (String(ts).length === 10) ts *= 1000;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const StatisticsTabContent = ({ roundsData }) => {
  const roundKeys = roundsData
    ? Object.keys(roundsData)
        .sort((a, b) => Number(b) - Number(a))
        .slice(0, 10)
    : [];

  if (roundKeys.length === 0) {
    return <div className="keno-tab-content__empty">No results available.</div>;
  }

  return (
    <div className="keno-tab-content">
      <div className="keno-tab-content__header">
        <span>Draw ID</span>
        <span>Combination</span>
      </div>
      {roundKeys.map((round) => {
        const roundInfo = roundsData[round] || {};
        const allNumbers = roundInfo.calledNumbers
          ? (Array.isArray(roundInfo.calledNumbers)
              ? roundInfo.calledNumbers
              : Object.values(roundInfo.calledNumbers))
          : [];

        return (
          <div className="keno-results-row" key={round}>
            <div className="keno-results-row__top">
              <span className="keno-results-row__id">{round}</span>
              <span className="keno-results-row__date">{formatRoundDate(roundInfo.timestamp)}</span>
            </div>
            <div className="keno-results-balls">
              {allNumbers.map((num, idx) => (
                <div className="keno-results-ball" key={`${round}-${idx}-${num}`}>
                  {num}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatisticsTabContent;
