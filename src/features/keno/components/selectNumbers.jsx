import React, { useState, useEffect, useMemo } from 'react';
import { Snackbar } from '@mui/material';
import ChooseNumbersCard from './chooseNumbers';
import './keno-bet-bar.css';
import './keno-grid.css';
import TicketCheckerDialog from './TicketCheckerDialog';
import { kenoPayouts, getMaxMultiplierForPicks } from '../utils/kenoPayouts';
import { normalizeNumbers } from '../utils/ticketCode';
import { useAuth } from '../contexts/AuthContext';
import { useSessionStore } from '@/features/auth/sessionStore';
import { placeKenoBet } from '@/features/keno/api/kenoApi';
import { filterUnconfirmedPendingBets } from '../utils/kenoBetMatch';

const TOTAL_NUMBERS = 80;
const COLUMNS = 10;

const KenoGrid = ({
  roundsData,
  topThree,
  coldThree,
  selfBets,
  pendingBets,
  setPendingBets,
  onHelpClick,
}) => {
  const { currentUser, userBalance, refreshBalance } = useAuth();
  const getAuthHeader = useSessionStore((s) => s.getAuthHeader);
  const userId = currentUser?.uid || null;
  const balance = userBalance;

  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [betAmount, setBetAmount] = useState(() => {
    const cachedBet = localStorage.getItem('betAmount');
    return cachedBet ? parseFloat(cachedBet) : '1';
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [ticketCheckOpen, setTicketCheckOpen] = useState(false);
  const [scannedTicketCode, setScannedTicketCode] = useState('');

  const visiblePendingBets = useMemo(
    () => filterUnconfirmedPendingBets(pendingBets, selfBets),
    [pendingBets, selfBets],
  );

  const ticketCount = visiblePendingBets.length + (selfBets?.length || 0);

  useEffect(() => {
    let scanBuffer = '';
    let scanTimeout = null;

    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (scanTimeout) clearTimeout(scanTimeout);
      if (e.key.length === 1) scanBuffer += e.key;
      if (e.key === 'Enter' && scanBuffer.length > 0) {
        const scannedCode = scanBuffer.trim();
        if (scannedCode.toUpperCase().startsWith('KENO:')) {
          e.preventDefault();
          setScannedTicketCode(scannedCode);
          setTicketCheckOpen(true);
        }
        scanBuffer = '';
        return;
      }
      scanTimeout = setTimeout(() => { scanBuffer = ''; }, 100);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (scanTimeout) clearTimeout(scanTimeout);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('betAmount', betAmount);
  }, [betAmount]);

  const handleBlur = () => {
    let newValue = Number(betAmount);
    if (newValue > 30000) newValue = 30000;
    if (newValue < 2 || Number.isNaN(newValue)) newValue = 2;
    setBetAmount(String(newValue));
  };

  const increaseBet = () => {
    setBetAmount(String(Math.min(Number(betAmount) + 1, 30000)));
  };

  const decreaseBet = () => {
    setBetAmount(String(Math.max(Number(betAmount) - 1, 2)));
  };

  const toggleNumber = (num) => {
    setSelectedNumbers((prev) => {
      if (prev.includes(num)) return prev.filter((n) => n !== num);
      if (prev.length >= 10) return prev;
      return [...prev, num];
    });
  };

  const placeBet = async (numbers, amount) => {
    if (!currentUser) {
      setSnackbarMessage('Please login to place a bet');
      setSnackbarOpen(true);
      return false;
    }

    const currentTicketCount = ticketCount;
    if (currentTicketCount >= 18) {
      setSnackbarMessage('You can only place up to 18 tickets');
      setSnackbarOpen(true);
      return false;
    }

    if (!numbers.length) {
      setSnackbarMessage('Please select at least one number');
      setSnackbarOpen(true);
      return false;
    }

    if (Number(amount) > balance) {
      setSnackbarMessage(`Insufficient balance. You have ${balance.toFixed(2)} ETB`);
      setSnackbarOpen(true);
      return false;
    }

    const pendingBet = {
      userId,
      betAmount: amount,
      selectedNumbers: numbers,
      status: 'pending',
      timestamp: Date.now(),
    };
    setPendingBets((prev) => [...prev, pendingBet]);

    try {
      const result = await placeKenoBet(getAuthHeader(), {
        betAmount: Number(amount),
        selectedNumbers: numbers,
      });

      setPendingBets((prev) => prev.filter((b) => b.timestamp !== pendingBet.timestamp));

      if (result.success) {
        void refreshBalance?.();
        window.dispatchEvent(new Event('superbet:wallet-changed'));
        return true;
      }

      setSnackbarMessage(result.message || 'Failed to place bet');
      setSnackbarOpen(true);
      return false;
    } catch (error) {
      setPendingBets((prev) => prev.filter((b) => b.timestamp !== pendingBet.timestamp));
      setSnackbarMessage(error?.message || 'Failed to place bet');
      setSnackbarOpen(true);
      return false;
    }
  };

  const handleBet = () => {
    if (ticketCount >= 18) return;

    const numbersToBet = [...selectedNumbers];
    const amountToBet = betAmount;

    if (!numbersToBet.length) {
      setSnackbarMessage('Please select at least one number');
      setSnackbarOpen(true);
      return;
    }

    if (!currentUser) {
      setSnackbarMessage('Please login to place a bet');
      setSnackbarOpen(true);
      return;
    }

    if (Number(amountToBet) > balance) {
      setSnackbarMessage(`Insufficient balance. You have ${balance.toFixed(2)} ETB`);
      setSnackbarOpen(true);
      return;
    }

    setSelectedNumbers([]);
    void placeBet(numbersToBet, amountToBet);
  };

  const numberOfPicks = selectedNumbers.length;
  const payoutMultiplier = getMaxMultiplierForPicks(numberOfPicks);
  const possibleWin = Math.min(Number(betAmount) * payoutMultiplier, 250000);

  const gridRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < TOTAL_NUMBERS; i += COLUMNS) {
      rows.push(Array.from({ length: COLUMNS }, (_, j) => i + j + 1));
    }
    return rows;
  }, []);

  const getCellClass = (number) => {
    const classes = ['bet_board_itm'];
    if (selectedNumbers.includes(number)) classes.push('selected');
    if (topThree.includes(number)) classes.push('hot');
    else if (coldThree.includes(number)) classes.push('cold');
    return classes.join(' ');
  };

  return (
      <>
        <ChooseNumbersCard
            numberOfPicks={numberOfPicks}
            selectedNumbers={selectedNumbers}
            betAmount={Number(betAmount) || 0}
            possibleWin={possibleWin}
            onHelpClick={onHelpClick}
          />

        <div className="keno-board-wrap">
          <div className="bet_board">
            <div className="bet_board_cont">
              {gridRows.map((row) => (
                <div className="bet_board_row" key={row[0]}>
                  {row.map((number) => (
                    <div
                      key={number}
                      className={getCellClass(number)}
                      onClick={() => toggleNumber(number)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') toggleNumber(number);
                      }}
                    >
                      {number}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="keno-bet-controls">
          <div className="keno-bet-row">
            <div className="keno-bet-row__amount-bar">
              <button type="button" className="keno-bet-row__step" onClick={decreaseBet} aria-label="Decrease bet">
                −
              </button>
              <input
                className="keno-bet-row__amount"
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                onBlur={handleBlur}
                aria-label="Bet amount"
              />
              <button type="button" className="keno-bet-row__step" onClick={increaseBet} aria-label="Increase bet">
                +
              </button>
            </div>
            <button
              type="button"
              className="keno-bet-row__quick"
              onClick={() => setBetAmount((prev) => String(Math.min(Number(prev) * 2, 20000)))}
            >
              X2
            </button>
            <button
              type="button"
              className="keno-bet-row__quick"
              onClick={() => {
                if (balance !== null) setBetAmount(String(Math.min(balance, 30000)));
              }}
              disabled={balance === null || balance < 2}
            >
              MAX
            </button>
          </div>

          <button
            type="button"
            className="keno-bet-submit"
            onClick={handleBet}
            disabled={
              selectedNumbers.length === 0 ||
              ticketCount >= 18
            }
          >
            BET
          </button>
        </div>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
      <TicketCheckerDialog
        open={ticketCheckOpen}
        onClose={() => {
          setTicketCheckOpen(false);
          setScannedTicketCode('');
        }}
        roundsData={roundsData}
        scannedCode={scannedTicketCode}
      />
    </>
  );
};

export default KenoGrid;
