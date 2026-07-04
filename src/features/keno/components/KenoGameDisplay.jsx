import React, { useState, useMemo, Suspense, useCallback, useEffect } from 'react';
import { lazy } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import NeonCountdown from './countdownTimer';
import KenoGrid from './selectNumbers';
import './keno-layout.css';
import './keno-bet-bar.css';
import './keno-tabs-content.css';
import './font.css';
import KenoAnimation from './kenoiAnim';
import { t } from '../utils/translator';
import { kenoPayouts } from '../utils/kenoPayouts';
import { filterUnconfirmedPendingBets } from '../utils/kenoBetMatch';

function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return (
    <div role="tabpanel" id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} className="keno-tab-panel-wrap">
      {children}
    </div>
  );
}

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
  const isDrawing = countdown === 0;

  useEffect(() => {
    setPendingBets((prev) => {
      const next = filterUnconfirmedPendingBets(prev, selfBets);
      return next.length === prev.length ? prev : next;
    });
  }, [selfBets]);

  const handleTabChange = useCallback((_event, newValue) => setTabIndex(newValue), []);

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
    const matches = bet.selectedNumbers.filter((num) => calledNumbers.includes(num)).length;
    const payout = kenoPayouts[bet.selectedNumbers.length]?.[matches] * bet.betAmount;
    return Math.min(payout || 0, 250000);
  }, [calledNumbers]);

  const myTotalStake = useMemo(
    () => selfBets.reduce((sum, bet) => sum + (Number(bet.betAmount) || 0), 0),
    [selfBets],
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

  const topThreeNumbers = useMemo(() => {
    const sorted = Object.entries(numberFrequencies).sort(([, a], [, b]) => b - a);
    return sorted.slice(0, 5).map(([num]) => Number(num));
  }, [numberFrequencies]);

  const coldThreeNumbers = useMemo(() => {
    const sorted = Object.entries(numberFrequencies).sort(([, a], [, b]) => a - b);
    return sorted.slice(0, 5).map(([num]) => Number(num));
  }, [numberFrequencies]);

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

      <div className={`keno-game-stage${isDrawing ? ' keno-game-stage--drawing' : ''}`}>
        <div className="keno-play-column">
          {!isDrawing ? (
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
            <KenoAnimation calledNumbers={calledNumbers} selfBets={selfBets} />
          )}
        </div>
      </div>

      <Tabs
        className="keno-nav-tabs"
        value={tabIndex}
        onChange={handleTabChange}
        variant="standard"
        slotProps={{ indicator: { style: { display: 'none' } } }}
      >
        <Tab className="keno-nav-tabs__item keno-nav-tabs__item--game" label={t('Game')} id="tab-0" />
        <Tab className="keno-nav-tabs__item keno-nav-tabs__item--history" label={t('History')} id="tab-1" />
        <Tab className="keno-nav-tabs__item keno-nav-tabs__item--results" label={t('Results')} id="tab-2" />
        <Tab className="keno-nav-tabs__item keno-nav-tabs__item--statistics" label={t('Statistics')} id="tab-3" />
      </Tabs>

      {tabIndex === 0 ? (
        <div className="keno-stats-bar">
          <span className="keno-stats-bar__item">
            All<span className="keno-stats-bar__value">{displayedTotalPlayers}</span>
          </span>
          <span className="keno-stats-bar__item">
            My tickets<span className="keno-stats-bar__value">{selfBets?.length ?? 0}</span>
          </span>
          <span className="keno-stats-bar__item">
            My bets<span className="keno-stats-bar__value">{myTotalStake}</span>
          </span>
        </div>
      ) : null}

      <Suspense fallback={<div className="keno-tab-content__empty">Loading…</div>}>
        <TabPanel value={tabIndex} index={0}>
          <GameTabContent
            showSummary={false}
            roundNo={roundNo}
            selfBets={selfBets}
            calledNumbers={calledNumbers}
            roundsData={roundsData}
            userId={userId}
            calculatePayout={calculatePayout}
            combinedOtherBets={combinedOtherBets}
            displayedTotalPlayers={displayedTotalPlayers}
            pendingBets={pendingBets}
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
