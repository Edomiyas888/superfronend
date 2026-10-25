import React, { useEffect, useMemo, useRef, useState } from 'react';
import { kenoPayouts, getMaxMultiplierForPicks, KENO_MAX_WIN } from '../utils/kenoPayouts';
import { formatKenoMoney } from '../utils/formatKenoMoney';
import { t } from '../utils/translator';
import './choose-numbers-card.css';
import './keno-atlas-fonts.css';

const SLOTS = 10;
// Atlas always lays out 7 Match/Pays columns and fills them from the left.
const PAY_COLUMNS = 7;
const SWIPE_THRESHOLD_PX = 40;

const formatPay = (pay) => `x${Number(pay)}`;

/** One Atlas ticket: empty prompt, the ticket being built, or a placed (read-only) ticket. */
function TicketCard({ ticketNumber, picks, stake, placed = false, newestPlaced = false, onHelpClick }) {
  const sortedPicks = useMemo(() => [...picks].sort((a, b) => a - b), [picks]);
  const payoutRow = kenoPayouts[picks.length] || {};
  const matches = Object.keys(payoutRow)
    .map(Number)
    .filter((match) => Number(payoutRow[match]) > 0)
    .sort((a, b) => a - b);
  const topMatch = matches[matches.length - 1];
  const payColumns = Array.from({ length: PAY_COLUMNS }, (_, i) => matches[i]);
  const payCellClass = (match) =>
    match == null ? 'ticket_match_tbl_itm mtbl' : `ticket_match_tbl_itm mtbl${match === topMatch ? ' lasone' : ' selected'}`;
  const possibleWin = Math.min(Number(stake) * getMaxMultiplierForPicks(picks.length), KENO_MAX_WIN);

  const className = placed
    ? `bet_sele${newestPlaced ? ' bet_sele_first' : ''}`
    : `bet_selections${picks.length ? ' selected' : ''}`;

  return (
    <div className={className}>
      <button type="button" className="ticket_help" onClick={onHelpClick} aria-label={t('Rules')}>
        ?
      </button>
      {!placed && !picks.length ? (
        <div className="ticket_helptext">
          <div className="ticket_helptext1">{t('Choose 10 numbers')}</div>
          <div className="ticket_helptext2">{t('From 1 to 80')}</div>
        </div>
      ) : (
        <div className="ticket_sel_cont">
          <div className="ticket_sel_cont_ttl">
            <span className="ticket_curr_number">{ticketNumber}</span>
            <span className="ticket_sel_cont_ttl_txt">{t('Possible win')}</span>
            <span className="ticket_sel_cont_posible_win">{formatKenoMoney(possibleWin)}</span>
          </div>
          <div className="ticket_match_tbl1">
            <div className="ticket_match_tbl_itm">{t('Match')}</div>
            {payColumns.map((match, i) => (
              <div key={i} className={payCellClass(match)}>
                {match ?? ''}
              </div>
            ))}
          </div>
          <div className="ticket_match_tbl2">
            <div className="ticket_match_tbl_itm">{t('Pays')}</div>
            {payColumns.map((match, i) => (
              <div key={i} className={payCellClass(match)}>
                {match == null ? '' : formatPay(payoutRow[match])}
              </div>
            ))}
          </div>
          <div className="ticket_sel_tbl">
            {Array.from({ length: SLOTS }, (_, i) => (
              <div key={i} className={`ticket_sel_tbl_itm${sortedPicks[i] != null ? ' selected' : ''}`}>
                {sortedPicks[i] ?? ''}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Atlas ticket carousel: tickets placed this round sit to the left (read-only, the newest
 * peeking in at the edge) and the ticket being built is always the last slide.
 */
const ChooseNumbersCard = ({ placedTickets = [], selectedNumbers = [], betAmount = 0, onHelpClick }) => {
  const editIndex = placedTickets.length;
  const [active, setActive] = useState(editIndex);
  const dragStartX = useRef(null);

  // A new ticket was placed (or the round reset): slide to the fresh card.
  useEffect(() => {
    setActive(editIndex);
  }, [editIndex]);

  // Picking numbers always works on the fresh card.
  useEffect(() => {
    if (selectedNumbers.length) setActive(editIndex);
  }, [selectedNumbers, editIndex]);

  const onPointerDown = (e) => {
    dragStartX.current = e.clientX;
  };

  const onPointerUp = (e) => {
    if (dragStartX.current == null) return;
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (dx > SWIPE_THRESHOLD_PX) setActive((i) => Math.max(0, i - 1));
    else if (dx < -SWIPE_THRESHOLD_PX) setActive((i) => Math.min(editIndex, i + 1));
  };

  return (
    <div
      id="tickets_carousel"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        dragStartX.current = null;
      }}
    >
      <div className="keno-tickets-track" style={{ transform: `translateX(calc(${-active} * (100% + 10px)))` }}>
        {placedTickets.map((ticket, index) => (
          <div
            key={ticket.betId || ticket.timestamp || index}
            className={`keno-tickets-slide${index === active ? ' active' : ''}`}
          >
            <TicketCard
              placed
              newestPlaced={index === editIndex - 1}
              ticketNumber={index + 1}
              picks={(ticket.selectedNumbers ?? []).map(Number)}
              stake={ticket.betAmount}
              onHelpClick={onHelpClick}
            />
          </div>
        ))}
        <div className={`keno-tickets-slide${active === editIndex ? ' active' : ''}`}>
          <TicketCard
            ticketNumber={editIndex + 1}
            picks={selectedNumbers}
            stake={betAmount}
            onHelpClick={onHelpClick}
          />
        </div>
      </div>
    </div>
  );
};

export default ChooseNumbersCard;
