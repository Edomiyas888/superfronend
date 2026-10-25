import React, { useEffect, useState } from 'react';
import './keno-atlas-fonts.css';
import './keno-animation.css';

const TICK_MS = 250;

const pad = (n) => String(n).padStart(2, '0');

/**
 * Atlas countdown ("00 : 12"). The server sends `countdown` every second or so (less often
 * when we fall back to polling), so we count down locally from the last value we received.
 */
const NeonCountdown = ({ countdown = 0 }) => {
  const [remaining, setRemaining] = useState(Math.max(0, Math.floor(countdown)));

  useEffect(() => {
    const endsAt = Date.now() + Math.max(0, countdown) * 1000;
    const update = () => setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, TICK_MS);
    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <div className="game_timer" aria-live="polite">
      {pad(Math.floor(remaining / 60))} : <span className="game_timer_sec">{pad(remaining % 60)}</span>
    </div>
  );
};

export default NeonCountdown;
