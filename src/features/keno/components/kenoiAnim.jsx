import React, { useEffect, useState } from 'react';
import './keno-atlas-fonts.css';
import './keno-animation.css';
import { kenoPayouts } from '../utils/kenoPayouts';

const KenoAnimation = ({ calledNumbers = [], selfBets = [] }) => {
  const [disable20Animation, setDisable20Animation] = useState(false);
  const [showTopMessage, setShowTopMessage] = useState(false);

  useEffect(() => {
    if (calledNumbers.length === 20) {
      const timer = setTimeout(() => setDisable20Animation(true), 700);
      return () => clearTimeout(timer);
    }
    setDisable20Animation(false);
  }, [calledNumbers]);

  useEffect(() => {
    if (calledNumbers.length === 20) {
      const timer = setTimeout(() => setShowTopMessage(true), 700);
      return () => clearTimeout(timer);
    }
    setShowTopMessage(false);
  }, [calledNumbers]);

  const calculatePayout = (bet) => {
    const selected = Array.isArray(bet.selectedNumbers) ? bet.selectedNumbers : [];
    const matches = selected.filter((num) => calledNumbers.includes(Number(num))).length;
    const payout = (kenoPayouts[selected.length]?.[matches] ?? 0) * Number(bet.betAmount ?? 0);
    return Math.min(payout || 0, 250000);
  };

  const totalWinnings = selfBets.reduce((acc, bet) => acc + calculatePayout(bet), 0);
  const topMessage = totalWinnings > 0 ? `Won ${totalWinnings.toFixed(2)} ETB` : 'TRY AGAIN';

  const row1Numbers = calledNumbers.slice(0, 10);
  const row2Numbers = calledNumbers.slice(10, 20);

  const isMatchInSelfBets = (num, betsArray) =>
    betsArray?.some((bet) =>
      (bet.selectedNumbers ?? []).map(Number).includes(Number(num)),
    );

  return (
    <div className="keno-animation-wrap">
      <div id="game_animation">
        {showTopMessage && (
          <div className="top_message">
            <span>{topMessage}</span>
          </div>
        )}

        <div className="balls_counter">
          <span>{calledNumbers.length}</span>/20
        </div>

        <div className={`game_animation_row1${calledNumbers.length >= 10 ? ' down' : ''}`}>
          {row1Numbers.map((num, index) => {
            const isNew = index === calledNumbers.length - 1;
            const newBallClass =
              isNew && calledNumbers.length === 20 ? 'new-ball delay20' : isNew ? 'new-ball' : '';

            return (
              <div
                key={`r1-${index}-${num}`}
                className={`anim_ball_cont anim_ball_cont${index + 1} move ${newBallClass}`.trim()}
              >
                <div className={`anim_ball show ${isMatchInSelfBets(num, selfBets) ? 'green-text' : ''}`}>
                  <span>{num}</span>
                  <i />
                </div>
              </div>
            );
          })}
        </div>

        <div className="game_animation_row2">
          {row2Numbers.map((num, index) => {
            const globalIndex = index + 10;
            const isNew = globalIndex === calledNumbers.length - 1;
            let newBallClass = '';
            if (isNew && calledNumbers.length === 20) {
              newBallClass = disable20Animation ? 'disable-animation' : 'new-ball delay20';
            } else if (isNew) {
              newBallClass = 'new-ball';
            }

            return (
              <div
                key={`r2-${index}-${num}`}
                className={`anim_ball_cont anim_ball_cont${globalIndex + 1} move ${newBallClass}`.trim()}
              >
                <div className={`anim_ball show ${isMatchInSelfBets(num, selfBets) ? 'green-text' : ''}`}>
                  <span>{num}</span>
                  <i />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KenoAnimation;
