import React from 'react';
import './keno-atlas-fonts.css';
import './keno-animation.css';
import { t } from '../utils/translator';
import { formatKenoMoney } from '../utils/formatKenoMoney';
import { DRAW_BALL_COUNT } from '../hooks/useKenoDrawPlayback';

const ROW_SIZE = 10;

/**
 * Atlas draw stage. Ball i gets `show` when it pops up in the centre and its container gets
 * `move` one second later, when it flies to its slot; row 1 drops down when ball 11 appears.
 * Timing comes from useKenoDrawPlayback.
 */
const KenoAnimation = ({
  drawnNumbers = [],
  movedCount = 0,
  instantCount = 0,
  resultReady = false,
  myNumbers,
  hasTickets = false,
  totalWinnings = 0,
}) => {
  const renderBall = (num, index) => {
    const position = index + 1;
    const contClass = [
      'anim_ball_cont',
      `anim_ball_cont${position}`,
      position <= movedCount ? 'move' : '',
      position <= instantCount ? 'instant' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div key={position} className={contClass}>
        <div className={`anim_ball anim_ball${position} show${myNumbers.has(Number(num)) ? ' active' : ''}`}>
          <i />
          <span>{num}</span>
        </div>
      </div>
    );
  };

  const rowDown = drawnNumbers.length > ROW_SIZE;
  const counter = String(movedCount).padStart(2, '0');
  const resultClass = resultReady && hasTickets ? (totalWinnings > 0 ? ' win' : ' lost') : '';

  return (
    <div className="keno-animation-wrap">
      <div className="balls_counter">
        <span className="balls_counter_num">{counter}</span> / <span>{DRAW_BALL_COUNT}</span>
      </div>

      <div className={`game_result_popup${resultClass}`}>
        <div className="game_result_popup_win">
          <div className="game_result_popup_win_ttl">{t('YOU WIN')}</div>
          <div className="game_result_popup_win_amount">{formatKenoMoney(totalWinnings)}</div>
        </div>
        <div className="game_result_popup_lost">{t('TRY AGAIN')}</div>
      </div>

      <div id="game_animation">
        <div
          className={`game_animation_row1${rowDown ? ' down' : ''}${rowDown && instantCount >= ROW_SIZE ? ' instant' : ''}`}
        >
          {drawnNumbers.slice(0, ROW_SIZE).map((num, i) => renderBall(num, i))}
        </div>
        <div className="game_animation_row2">
          {drawnNumbers.slice(ROW_SIZE, DRAW_BALL_COUNT).map((num, i) => renderBall(num, i + ROW_SIZE))}
        </div>
      </div>
    </div>
  );
};

export default KenoAnimation;
