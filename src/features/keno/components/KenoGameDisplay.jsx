import React, { useState, useMemo, Suspense, useCallback, useEffect } from 'react';
import { lazy } from 'react';
import { Box } from '@mui/material';
import NeonCountdown from './countdownTimer';
import KenoGrid from './selectNumbers';
import './keno-layout.css';
import './keno-bet-bar.css';
import './keno-tabs-content.css';
import './font.css';
import KenoAnimation from './kenoiAnim';
import { t } from '../utils/translator';
import { kenoPayouts, KENO_MAX_WIN } from '../utils/kenoPayouts';
import { filterUnconfirmedPendingBets } from '../utils/kenoBetMatch';
import { useKenoDrawPlayback } from '../hooks/useKenoDrawPlayback';

function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return (
    <div role="tabpanel" id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} className="keno-tab-panel-wrap">
      {children}
    </div>
  );
}

const TABS = [
  { key: 'game', label: 'Game' },
  { key: 'history', label: 'History' },
  { key: 'results', label: 'Results' },
  { key: 'statistics', label: 'Statistics' },
];

const HistoryTabContent = lazy(() => import('../tabs/Historytab'));
const GameTabContent = lazy(() => import('../tabs/GameTabContent'));
const StatisticsTabContent = lazy(() => import('../tabs/StatisticsTab'));
const StatsTabContent = lazy(() => import('../tabs/NumbersFrequencyTab'));

export default function KenoGameDisplay({ game }) {
  const {
    roundNo,
    phase,
    countdown,
    calledNumbers,
    drawNumbers,
    selfBets,
    otherBets,
    fakePlayers,
    roundsData,
    displayedTotalPlayers,
    userId,
    error: kenoError,
  } = game;

  const [tabIndex, setTabIndex] = useState(0);
  const [pendingBets, setPendingBets] = useState([]);
  // `phase` is authoritative; the countdown fallback covers a server that only reports it.
  const isDrawing =
    phase === 'drawing' || (phase !== 'betting' && countdown === 0 && calledNumbers.length > 0);
  const playback = useKenoDrawPlayback(roundNo, calledNumbers, isDrawing, drawNumbers);
  const showDraw = playback.active;

  // The server opens the next round while our result popup is still up, so remember the
  // drawn round's tickets and keep showing them until playback hands back to betting.
  const [drawBets, setDrawBets] = useState({ roundNo: null, bets: [] });
  if (isDrawing && (drawBets.roundNo !== roundNo || drawBets.bets.length !== selfBets.length)) {
    setDrawBets({ roundNo, bets: selfBets });
  }
  const finishingDraw = showDraw && !isDrawing;
  const roundBets = finishingDraw
    ? (drawBets.roundNo === playback.roundNo ? drawBets.bets : [])
    : selfBets;
  const roundCalledNumbers = showDraw ? playback.numbers : calledNumbers;

  // Tickets light up in step with the balls, and wins only show once the result popup does.
  const drawnNumbers = showDraw ? playback.drawnNumbers : calledNumbers;
  const winsRevealed = !showDraw || playback.resultReady;

  useEffect(() => {
    setPendingBets((prev) => {
      const next = filterUnconfirmedPendingBets(prev, selfBets);
      return next.length === prev.length ? prev : next;
    });
  }, [selfBets]);

  // Tickets the server accepted but never echoed belong to a finished round once a new one starts.
  useEffect(() => {
    setPendingBets((prev) => {
      const next = prev.filter((bet) => bet.status === 'pending');
      return next.length === prev.length ? prev : next;
    });
  }, [roundNo]);

  const calculateHistoricalPayout = useCallback((bet) => {
    const roundData = roundsData[bet.round];
    let roundCalledNumbers = [];
    if (roundData?.calledNumbers) {
      roundCalledNumbers = Array.isArray(roundData.calledNumbers)
        ? roundData.calledNumbers
        : Object.values(roundData.calledNumbers);
    }
    const matches = bet.selectedNumbers.filter((num) => roundCalledNumbers.includes(num)).length;
    const payout = kenoPayouts[bet.selectedNumbers.length]?.[matches] * bet.betAmount;
    return Math.min(payout || 0, 250000);
  }, [roundsData]);

  const combinedOtherBets = useMemo(() => [...otherBets, ...fakePlayers], [otherBets, fakePlayers]);

  const calculatePayout = useCallback((bet) => {
    if (!winsRevealed) return 0;
    const matches = bet.selectedNumbers.filter((num) => roundCalledNumbers.includes(num)).length;
    const payout = kenoPayouts[bet.selectedNumbers.length]?.[matches] * bet.betAmount;
    return Math.min(payout || 0, KENO_MAX_WIN);
  }, [roundCalledNumbers, winsRevealed]);

  const myNumbers = useMemo(
    () => new Set(roundBets.flatMap((bet) => (bet.selectedNumbers ?? []).map(Number))),
    [roundBets],
  );

  const totalWinnings = useMemo(
    () => roundBets.reduce((sum, bet) => sum + calculatePayout(bet), 0),
    [roundBets, calculatePayout],
  );

  const myTotalStake = useMemo(
    () => roundBets.reduce((sum, bet) => sum + (Number(bet.betAmount) || 0), 0),
    [roundBets],
  );

  const numberFrequencies = useMemo(() => {
    const freq = {};
    for (let i = 1; i <= 80; i += 1) freq[i] = 0;
    const roundKeys = Object.keys(roundsData)
      .sort((a, b) => Number(b) - Number(a))
      .slice(0, 100);
    roundKeys.forEach((roundKey) => {
      const round = roundsData[roundKey];
      if (round.calledNumbers) {
        const numbers = Array.isArray(round.calledNumbers)
          ? round.calledNumbers
          : Object.values(round.calledNumbers);
        numbers.forEach((num) => {
          const n = Number(num);
          if (n >= 1 && n <= 80) freq[n] += 1;
        });
      }
    });
    return freq;
  }, [roundsData]);

  const hasFrequencyData = useMemo(
    () => Object.values(numberFrequencies).some((count) => count > 0),
    [numberFrequencies],
  );

  const topThreeNumbers = useMemo(() => {
    if (!hasFrequencyData) return [];
    const sorted = Object.entries(numberFrequencies).sort(([, a], [, b]) => b - a);
    return sorted.slice(0, 5).map(([num]) => Number(num));
  }, [numberFrequencies, hasFrequencyData]);

  const coldThreeNumbers = useMemo(() => {
    if (!hasFrequencyData) return [];
    const sorted = Object.entries(numberFrequencies).sort(([, a], [, b]) => a - b);
    return sorted.slice(0, 5).map(([num]) => Number(num));
  }, [numberFrequencies, hasFrequencyData]);

  const openRules = () => {
    window.dispatchEvent(new CustomEvent('keno:open-rules'));
  };

  return (
    <Box className="keno-game-display">
      {kenoError ? (
        <div className="keno-error-banner" role="alert">
          {kenoError}
        </div>
      ) : null}

      <div className={`keno-game-stage${showDraw ? ' keno-game-stage--drawing' : ''}`}>
        <div className="keno-play-column">
          {!showDraw ? (
            <>
              <div className="keno-timer-row">
                <NeonCountdown countdown={countdown} />
              </div>
              <KenoGrid
                roundsData={roundsData}
                topThree={topThreeNumbers}
                coldThree={coldThreeNumbers}
                selfBets={selfBets}
                pendingBets={pendingBets}
                setPendingBets={setPendingBets}
                onHelpClick={openRules}
              />
            </>
          ) : (
            <KenoAnimation
              drawnNumbers={playback.drawnNumbers}
              movedCount={playback.movedCount}
              instantCount={playback.instantCount}
              resultReady={playback.resultReady}
              myNumbers={myNumbers}
              totalWinnings={totalWinnings}
            />
          )}
        </div>
      </div>

      <div className="keno-nav-tabs tabs" role="tablist">
        {TABS.map((tab, index) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`tab-${index}`}
            aria-selected={tabIndex === index}
            className={`tab_itm keno-nav-tabs__item--${tab.key}${tabIndex === index ? ' active' : ''}`}
            onClick={() => setTabIndex(index)}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

      {tabIndex === 0 ? (
        <div className="keno-stats-bar">
          <span className="keno-stats-bar__item">
            All<span className="keno-stats-bar__value">{displayedTotalPlayers}</span>
          </span>
          <span className="keno-stats-bar__item">
            My tickets<span className="keno-stats-bar__value">{roundBets.length}</span>
          </span>
          <span className="keno-stats-bar__item">
            My bets<span className="keno-stats-bar__value">{myTotalStake}</span>
          </span>
        </div>
      ) : null}

      <Suspense fallback={null}>
        <TabPanel value={tabIndex} index={0}>
          <GameTabContent
            showSummary={false}
            roundNo={finishingDraw ? playback.roundNo : roundNo}
            selfBets={roundBets}
            calledNumbers={drawnNumbers}
            roundsData={roundsData}
            userId={userId}
            calculatePayout={calculatePayout}
            combinedOtherBets={combinedOtherBets}
            displayedTotalPlayers={displayedTotalPlayers}
            pendingBets={pendingBets}
            roundSettled={showDraw && playback.resultReady}
          />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <HistoryTabContent
            roundsData={roundsData}
            userId={userId}
            calculateHistoricalPayout={calculateHistoricalPayout}
          />
        </TabPanel>
        <TabPanel value={tabIndex} index={2}>
          <StatisticsTabContent roundsData={roundsData} roundNo={roundNo} phase={phase} />
        </TabPanel>
        <TabPanel value={tabIndex} index={3}>
          <StatsTabContent numberFrequencies={numberFrequencies} />
        </TabPanel>
      </Suspense>
    </Box>
  );
}
