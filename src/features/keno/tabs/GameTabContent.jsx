import React, { useMemo, useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { FixedSizeList as List } from 'react-window';
import PlayerUsername from '../components/fragments/maskPlayerName';
import FairnessLogo from '../assets/fairnesslogo.jpg';
import { kenoPayouts } from '../utils/kenoPayouts';
import { filterUnconfirmedPendingBets } from '../utils/kenoBetMatch';
import '../components/keno-ticket.css';

const maskName = (name) => {
  if (!name) return '';
  if (name.length <= 2) return name;
  return `${name.charAt(0)}${'*'.repeat(name.length - 2)}${name.charAt(name.length - 1)}`;
};

const TICKET_ROW_HEIGHT = 132;

function KenoTicketCard({
  title,
  bet,
  calledNumbers,
  calculatePayout,
  isPending = false,
}) {
  const payoutAmount = calculatePayout(bet);
  const hasWon = payoutAmount > 0;
  const matches = bet.selectedNumbers.filter((num) => calledNumbers.includes(num))?.length;
  const odd = kenoPayouts[bet.selectedNumbers?.length]?.[matches];

  return (
    <div className={`keno-ticket-card${hasWon ? ' keno-ticket-card--won' : ''}`}>
      <div className="keno-ticket-card__title">{title}</div>

      <div className="keno-ticket-card__numbers">
        {Array.from({ length: 10 }, (_, slotIndex) => {
          const number =
            bet.selectedNumbers && bet.selectedNumbers[slotIndex]
              ? bet.selectedNumbers[slotIndex]
              : undefined;
          const isMatched = number != null && calledNumbers.includes(number);

          return (
            <div
              key={slotIndex}
              className={[
                'keno-ticket-card__number',
                number != null ? 'keno-ticket-card__number--filled' : '',
                isMatched ? 'keno-ticket-card__number--matched' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {number != null ? (
                <span className="keno-ticket-card__number-text">{number}</span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="keno-ticket-card__footer">
        <div className="keno-ticket-card__footer-bet">
          Bet {bet.betAmount}
          {hasWon && odd >= 1 ? ` x${odd}` : ''}
        </div>
        <div className={`keno-ticket-card__footer-status${hasWon ? ' keno-ticket-card__footer-status--won' : ''}`}>
          {hasWon ? `Won ${payoutAmount.toFixed(2)} ETB` : 'Waiting'}
        </div>
      </div>

      {isPending ? (
        <div className="keno-ticket-card__pending">
          <CircularProgress size={18} sx={{ color: '#71cd95' }} />
        </div>
      ) : null}
    </div>
  );
}

const GameTabContent = React.memo(({
  selfBets,
  calledNumbers,
  calculatePayout,
  combinedOtherBets,
  displayedTotalPlayers,
  pendingBets = [],
  showSummary = false,
}) => {
  const topOtherBets = useMemo(() => {
    return combinedOtherBets
      .slice()
      .sort((a, b) => b.betAmount - a.betAmount)
      .slice(0, 20);
  }, [combinedOtherBets]);

  const visiblePendingBets = useMemo(
    () => filterUnconfirmedPendingBets(pendingBets, selfBets),
    [pendingBets, selfBets],
  );

  const allSelfBets = useMemo(
    () => [...visiblePendingBets, ...selfBets],
    [visiblePendingBets, selfBets],
  );

  const renderSelfBet = ({ index, style }) => {
    const bet = [...allSelfBets].reverse()[index];
    const ticketNumber = allSelfBets.length - index;

    return (
      <div style={style} key={bet.betId || bet.timestamp || index}>
        <div className="keno-ticket-card-wrap">
          <KenoTicketCard
            title={`${ticketNumber} My Ticket`}
            bet={bet}
            calledNumbers={calledNumbers}
            calculatePayout={calculatePayout}
            isPending={bet.status === 'pending'}
          />
        </div>
      </div>
    );
  };

  const renderOtherBet = ({ index, style }) => {
    const bet = topOtherBets[index];
    const playerLabel =
      bet.userId && !bet.userId.startsWith('fake_') ? (
        <PlayerUsername clientExternalKey={bet.userId} />
      ) : (
        maskName(bet.username || 'Unknown')
      );

    return (
      <div style={style} key={bet.betId || bet.userId || index}>
        <KenoTicketCard
          title={playerLabel}
          bet={bet}
          calledNumbers={calledNumbers}
          calculatePayout={calculatePayout}
        />
      </div>
    );
  };

  return (
    <div className="keno-tab-content keno-ticket-list">
      {showSummary ? (
        <div className="keno-stats-bar">
          <span>
            All <span className="keno-stats-bar__value">{displayedTotalPlayers}</span>
          </span>
          <span>
            My Tickets <span className="keno-stats-bar__value">{selfBets?.length ?? 0}</span>
          </span>
          <span>
            My Bets{' '}
            <span className="keno-stats-bar__value">
              {selfBets.reduce((sum, bet) => sum + (Number(bet.betAmount) || 0), 0)}
            </span>
          </span>
        </div>
      ) : null}

      {allSelfBets.length > 0 ? (
        <List
          height={Math.min(allSelfBets.length, 5) * TICKET_ROW_HEIGHT}
          itemCount={allSelfBets.length}
          itemSize={TICKET_ROW_HEIGHT}
          width="100%"
        >
          {renderSelfBet}
        </List>
      ) : null}

      {topOtherBets.length > 0 ? (
        <List
          height={Math.min(topOtherBets.length, 5) * TICKET_ROW_HEIGHT}
          itemCount={topOtherBets.length}
          itemSize={TICKET_ROW_HEIGHT}
          width="100%"
        >
          {renderOtherBet}
        </List>
      ) : null}

      <div className="keno-atlas-footer">
        <img src={FairnessLogo} alt="" className="keno-atlas-footer__fairness" />
        <img
          src="https://cdn-atlas-v.com/games/keno/img/logo.png"
          alt="Atlas-V Gaming"
          className="keno-atlas-footer__logo"
        />
      </div>
    </div>
  );
});

export default GameTabContent;
