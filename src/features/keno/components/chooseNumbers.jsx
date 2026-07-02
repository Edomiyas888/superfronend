import React, { useMemo } from 'react';
import { kenoPayouts } from '../utils/kenoPayouts';
import Balls from '../assets/balls.png';
import './choose-numbers-card.css';
import './keno-atlas-fonts.css';

const ChooseNumbersCard = ({
  numberOfPicks = 0,
  selectedNumbers = [],
  betAmount = 0,
  possibleWin = 0,
  onHelpClick,
}) => {
  const hasSelection = numberOfPicks > 0;
  const sortedPicks = useMemo(
    () => [...selectedNumbers].sort((a, b) => a - b),
    [selectedNumbers],
  );

  const payoutRow = useMemo(() => {
    if (!numberOfPicks) return null;
    return kenoPayouts[numberOfPicks] || {};
  }, [numberOfPicks]);

  const visibleMatches = useMemo(() => {
    if (!payoutRow) return [];
    return Object.keys(payoutRow)
      .map(Number)
      .filter((match) => Number(payoutRow[match]) > 0)
      .sort((a, b) => a - b);
  }, [payoutRow]);

  const maxPay = useMemo(() => {
    if (!visibleMatches.length || !payoutRow) return 0;
    return Math.max(...visibleMatches.map((match) => Number(payoutRow[match])));
  }, [visibleMatches, payoutRow]);

  const formatPay = (pay) => {
    const n = Number(pay);
    if (!Number.isFinite(n)) return '—';
    return Number.isInteger(n) ? `x${n}` : `x${n.toFixed(1).replace(/\.0$/, '')}`;
  };

  return (
    <div className={`bet_selections${hasSelection ? ' selected' : ''}`}>
      {!hasSelection ? (
        <>
          <div className="ticket_balls_art" aria-hidden="true">
            <img src={Balls} alt="" />
          </div>
          <div className="ticket_helptext">
            <p className="ticket_helptext1">Choose 10 numbers</p>
            <p className="ticket_helptext2">From 1 to 80</p>
          </div>
        </>
      ) : (
        <>
          <div className="ticket_sel_cont">
            <div className="ticket_sel_cont_ttl">
              <span className="ticket_curr_number">{betAmount}</span>
              <span className="ticket_sel_cont_ttl_txt">Possible win</span>
              <span className="ticket_sel_cont_posible_win">{Math.round(possibleWin)}</span>
            </div>

            {visibleMatches.length > 0 ? (
              <div className="ticket_match_wrap">
                <div className="ticket_match_tbl1">
                  <div className="ticket_match_tbl_itm ticket_match_tbl_itm--label">Match</div>
                  {visibleMatches.map((match) => {
                    const pay = Number(payoutRow[match]);
                    const highlighted = pay === maxPay && pay > 0;
                    return (
                      <div
                        key={`m-${match}`}
                        className={`ticket_match_tbl_itm mtbl${highlighted ? ' selected' : ''}`}
                      >
                        {match}
                      </div>
                    );
                  })}
                </div>
                <div className="ticket_match_tbl2">
                  <div className="ticket_match_tbl_itm ticket_match_tbl_itm--label">Pays</div>
                  {visibleMatches.map((match) => {
                    const pay = Number(payoutRow[match]);
                    const highlighted = pay === maxPay && pay > 0;
                    return (
                      <div
                        key={`p-${match}`}
                        className={`ticket_match_tbl_itm ombl${highlighted ? ' selected' : ''}`}
                      >
                        {formatPay(pay)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="ticket_sel_tbl">
              {Array.from({ length: 10 }, (_, i) => {
                const num = sortedPicks[i];
                return (
                  <div
                    key={i}
                    className={`ticket_sel_tbl_itm${num != null ? ' selected' : ''}`}
                  >
                    {num ?? ''}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChooseNumbersCard;
