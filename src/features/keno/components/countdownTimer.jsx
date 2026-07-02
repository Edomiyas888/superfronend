import React, { useState, useEffect, useRef } from 'react';
import './keno-atlas-fonts.css';
import './keno-animation.css';

/** Countdown display — Atlas DS-Digital timer styling (00 : 00). */
const NeonCountdown = ({ countdown = 0 }) => {
  const [parts, setParts] = useState({ mins: '00', secs: '00' });
  const animationRef = useRef(null);

  const formatTime = (sec) => {
    if (sec === null || sec < 0) return { mins: '00', secs: '00' };
    const total = Math.floor(sec);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return {
      mins: String(mins).padStart(2, '0'),
      secs: String(secs).padStart(2, '0'),
    };
  };

  useEffect(() => {
    setParts(formatTime(countdown));

    let currentTime = countdown;
    let lastTimestamp = Date.now();

    const updateCountdown = () => {
      const now = Date.now();
      const elapsed = (now - lastTimestamp) / 1000;
      lastTimestamp = now;
      if (elapsed >= 1) {
        currentTime = Math.max(0, currentTime - Math.floor(elapsed));
        setParts(formatTime(currentTime));
      }
      animationRef.current = requestAnimationFrame(updateCountdown);
    };

    animationRef.current = requestAnimationFrame(updateCountdown);
    return () => cancelAnimationFrame(animationRef.current);
  }, [countdown]);

  return (
    <div className="game_timer" aria-live="polite">
      <span className="game_timer_min">{parts.mins}</span>
      <span className="game_timer_sep"> : </span>
      <span className="game_timer_sec">{parts.secs}</span>
    </div>
  );
};

export default NeonCountdown;
