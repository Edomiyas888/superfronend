import React from 'react';
import { CircularProgress } from '@mui/material';
import { formatKenoMoney } from '../utils/formatKenoMoney';
import { t } from '../utils/translator';
import './keno-ticket.css';

export default function KenoTicketCard({
  title,
  bet,
  calledNumbers,
  calculatePayout,
  isPending = false,
  live = false,
  settled = false,
  unsettledLabel = 'Waiting',
}) {
  const payoutAmount = calculatePayout(bet);
  const hasWon = payoutAmount > 0;
  // Live round (Game tab), as in Atlas: "Waiting" until the result, then the win amount or nothing.
  let status = hasWon ? `Won ${payoutAmount.toFixed(2)} ETB` : unsettledLabel;
  if (live) status = settled ? (hasWon ? formatKenoMoney(payoutAmount) : '') : t('Waiting');

  return (
    <div className={`keno-ticket-card${live ? ' keno-ticket-card--live' : ''}${hasWon ? ' keno-ticket-card--won' : ''}`}>
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
          {t('Bet')} {bet.betAmount}
        </div>
        <div className={`keno-ticket-card__footer-status${hasWon ? ' keno-ticket-card__footer-status--won' : ''}`}>
          {status}
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
