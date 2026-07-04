import React, { useMemo, useState, useEffect } from 'react';
import PlayerUsername, { maskName } from '../components/fragments/maskPlayerName';
import FairnessLogo from '../assets/fairnesslogo.jpg';
import { filterUnconfirmedPendingBets } from '../utils/kenoBetMatch';
import { t } from '../utils/translator';
import KenoTicketCard from '../components/KenoTicketCard';
import '../components/keno-ticket.css';

const OTHERS_INITIAL_COUNT = 10;

const GameTabContent = React.memo(({
  selfBets,
  calledNumbers,
  calculatePayout,
  combinedOtherBets,
  displayedTotalPlayers,
  pendingBets = [],
  showSummary = false,
  roundNo = null,
}) => {
  const [showMoreOthers, setShowMoreOthers] = useState(false);

  useEffect(() => {
    setShowMoreOthers(false);
  }, [roundNo]);

  const sortedOtherBets = useMemo(() => {
    return combinedOtherBets
      .slice()
      .sort((a, b) => b.betAmount - a.betAmount);
  }, [combinedOtherBets]);

  const visibleOtherBets = useMemo(() => {
    if (showMoreOthers) {
      return sortedOtherBets;
    }
    return sortedOtherBets.slice(0, OTHERS_INITIAL_COUNT);
  }, [sortedOtherBets, showMoreOthers]);

  const hiddenOthersCount = Math.max(0, sortedOtherBets.length - OTHERS_INITIAL_COUNT);

  const visiblePendingBets = useMemo(
    () => filterUnconfirmedPendingBets(pendingBets, selfBets),
    [pendingBets, selfBets],
  );

  const allSelfBets = useMemo(
    () => [...visiblePendingBets, ...selfBets],
    [visiblePendingBets, selfBets],
  );

  const renderSelfBet = (bet, index) => {
    const ticketNumber = allSelfBets.length - index;

    return (
      <div className="keno-ticket-card-wrap" key={bet.betId || bet.timestamp || index}>
        <KenoTicketCard
          title={`${ticketNumber} My Ticket`}
          bet={bet}
          calledNumbers={calledNumbers}
          calculatePayout={calculatePayout}
          isPending={bet.status === 'pending'}
        />
      </div>
    );
  };

  const renderOtherBet = (bet, index) => {
    const playerLabel =
      bet.userId && !bet.userId.startsWith('fake_') ? (
        <PlayerUsername clientExternalKey={bet.userId} />
      ) : (
        maskName(bet.username || 'Unknown')
      );

    return (
      <div
        className="keno-ticket-card-wrap keno-ticket-card-wrap--enter"
        key={bet.betId || bet.userId || index}
      >
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
        <div className="keno-ticket-section">
          {[...allSelfBets].reverse().map(renderSelfBet)}
        </div>
      ) : null}

      {visibleOtherBets.length > 0 ? (
        <div className="keno-ticket-section keno-ticket-section--others">
          {visibleOtherBets.map(renderOtherBet)}
          {hiddenOthersCount > 0 && !showMoreOthers ? (
            <button
              type="button"
              className="keno-show-more-btn"
              onClick={() => setShowMoreOthers(true)}
            >
              {t('Show More')} ({hiddenOthersCount})
            </button>
          ) : null}
        </div>
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
