import React, { useMemo } from 'react';
import '../components/keno-tabs-content.css';

const HistoryTabContent = ({ roundsData, userId, calculateHistoricalPayout }) => {
  const selfBetHistory = useMemo(() => {
    const history = [];
    if (userId && roundsData) {
      Object.keys(roundsData).forEach((roundKey) => {
        const round = roundsData[roundKey];
        if (round.bets) {
          Object.values(round.bets).forEach((bet) => {
            if (bet.userId === userId) {
              history.push({ ...bet, round: roundKey });
            }
          });
        }
      });
    }
    return history.sort((a, b) => Number(b.round) - Number(a.round)).slice(0, 10);
  }, [roundsData, userId]);

  if (selfBetHistory.length === 0) {
    return <div className="keno-tab-content__empty">No bet history available.</div>;
  }

  return (
    <div className="keno-tab-content">
      {selfBetHistory.map((bet, index) => {
        const roundData = roundsData[bet.round] || {};
        const roundCalledNumbers = roundData.calledNumbers
          ? (Array.isArray(roundData.calledNumbers)
              ? roundData.calledNumbers
              : Object.values(roundData.calledNumbers))
          : [];
        const payout = calculateHistoricalPayout(bet);
        const hasWon = payout > 0;

        return (
          <div
            className={`keno-history-row${hasWon ? ' keno-history-row--won' : ''}`}
            key={bet.betId || `${bet.round}-${index}`}
          >
            <div className="keno-history-row__title">Round {bet.round}</div>
            <div className="keno-history-row__balls">
              {Array.from({ length: 10 }, (_, i) => {
                const num = bet.selectedNumbers?.[i];
                const isMatched = num && roundCalledNumbers.includes(num);
                return (
                  <div
                    key={i}
                    className={`keno-history-row__ball${isMatched ? ' keno-history-row__ball--matched' : ''}`}
                  >
                    {num ?? ''}
                  </div>
                );
              })}
            </div>
            <div className="keno-history-row__footer">
              <div className="keno-history-row__bet">Bet {bet.betAmount}</div>
              <div className={`keno-history-row__status${hasWon ? ' keno-history-row__status--won' : ''}`}>
                {hasWon ? `Won ${payout.toFixed(2)} ETB` : 'Lost'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HistoryTabContent;
