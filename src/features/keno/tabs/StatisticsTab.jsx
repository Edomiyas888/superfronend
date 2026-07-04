import React, { useMemo } from 'react';
import '../components/keno-tabs-content.css';

function formatDrawId(roundNo) {
  return String(883182000 + Number(roundNo));
}

function formatDrawTime(timestamp) {
  if (!timestamp) return '';
  let ts = Number(timestamp);
  if (String(ts).length === 10) ts *= 1000;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function normalizeCalledNumbers(roundInfo) {
  if (!roundInfo?.calledNumbers) return [];
  return Array.isArray(roundInfo.calledNumbers)
    ? roundInfo.calledNumbers
    : Object.values(roundInfo.calledNumbers);
}

const StatisticsTabContent = ({
  roundsData,
  roundNo = null,
  phase = 'betting',
}) => {
  const rows = useMemo(() => {
    const settledKeys = roundsData
      ? Object.keys(roundsData)
          .sort((a, b) => Number(b) - Number(a))
          .slice(0, 15)
      : [];

    const list = [];

    if (roundNo != null && phase !== 'settled') {
      list.push({
        key: `live-${roundNo}`,
        roundNo,
        timestamp: Date.now(),
        numbers: [],
        isWaiting: true,
      });
    }

    for (const roundKey of settledKeys) {
      if (roundNo != null && String(roundKey) === String(roundNo) && phase !== 'settled') {
        continue;
      }
      const roundInfo = roundsData[roundKey] || {};
      const numbers = normalizeCalledNumbers(roundInfo);
      list.push({
        key: roundKey,
        roundNo: roundInfo.roundNo ?? roundKey,
        timestamp: roundInfo.timestamp,
        numbers,
        isWaiting: numbers.length < 20,
      });
    }

    return list;
  }, [roundsData, roundNo, phase]);

  if (rows.length === 0) {
    return <div className="keno-tab-content__empty">No results available.</div>;
  }

  return (
    <div className="keno-tab-content keno-tab-content--results">
      <div className="keno-tab-content__header">
        <span>Draw ID</span>
        <span>Combination</span>
      </div>
      {rows.map((row) => (
        <div className="keno-results-row" key={row.key}>
          <div className="keno-results-row__meta">
            <span className="keno-results-row__shield" aria-hidden="true" />
            <div className="keno-results-row__info">
              <span className="keno-results-row__id">{formatDrawId(row.roundNo)}</span>
              <span className="keno-results-row__time">{formatDrawTime(row.timestamp)}</span>
            </div>
          </div>
          <div className="keno-results-row__combo">
            {row.isWaiting ? (
              <div className="keno-results-row__wait">WAIT</div>
            ) : (
              <div className="keno-results-grid">
                {row.numbers.map((num, idx) => (
                  <div className="keno-results-ball" key={`${row.key}-${idx}-${num}`}>
                    {num}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatisticsTabContent;
