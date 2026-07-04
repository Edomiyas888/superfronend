import React, { useMemo } from 'react';
import KenoTicketCard from '../components/KenoTicketCard';
import '../components/keno-ticket.css';
import '../components/keno-tabs-content.css';

function getRoundCalledNumbers(roundData) {
  if (!roundData?.calledNumbers) return [];
  return Array.isArray(roundData.calledNumbers)
    ? roundData.calledNumbers
    : Object.values(roundData.calledNumbers);
}

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
    <div className="keno-tab-content keno-ticket-list">
      <div className="keno-ticket-section">
        {selfBetHistory.map((bet, index) => {
          const roundData = roundsData[bet.round] || {};
          const roundCalledNumbers = getRoundCalledNumbers(roundData);
          const ticketNumber = selfBetHistory.length - index;

          return (
            <div className="keno-ticket-card-wrap" key={bet.betId || `${bet.round}-${index}`}>
              <KenoTicketCard
                title={`${ticketNumber} My Ticket`}
                bet={bet}
                calledNumbers={roundCalledNumbers}
                calculatePayout={calculateHistoricalPayout}
                unsettledLabel="Lost"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryTabContent;
