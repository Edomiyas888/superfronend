import React, { useState, useEffect, useMemo } from 'react';
import { Snackbar } from '@mui/material';
import ChooseNumbersCard from './chooseNumbers';
import './keno-bet-bar.css';
import './keno-grid.css';
import TicketCheckerDialog from './TicketCheckerDialog';
import { KENO_MIN_BET, KENO_MAX_BET } from '../utils/kenoPayouts';
import { normalizeNumbers } from '../utils/ticketCode';
import { useAuth } from '../contexts/AuthContext';
import { useSessionStore } from '@/features/auth/sessionStore';
import { placeKenoBet } from '@/features/keno/api/kenoApi';
import { filterUnconfirmedPendingBets } from '../utils/kenoBetMatch';
import { t } from '../utils/translator';

const TOTAL_NUMBERS = 80;
const COLUMNS = 10;
// Atlas shows "BET ACCEPTED" for half a second after the server confirms a ticket.
const ACCEPTED_FLASH_MS = 500;

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
    return cachedBet ? parseFloat(cachedBet) : String(KENO_MIN_BET);
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [ticketCheckOpen, setTicketCheckOpen] = useState(false);
  const [scannedTicketCode, setScannedTicketCode] = useState('');
  // 'idle' | 'wait' (request in flight) | 'accept' (just confirmed)
  const [betUiState, setBetUiState] = useState('idle');

  const visiblePendingBets = useMemo(
    () => filterUnconfirmedPendingBets(pendingBets, selfBets),
    [pendingBets, selfBets],
  );

  const ticketCount = visiblePendingBets.length + (selfBets?.length || 0);

  // Tickets shown in the carousel: confirmed ones plus those the server accepted but hasn't echoed yet.
  const placedTickets = useMemo(
    () =>
      [...(selfBets ?? []), ...visiblePendingBets.filter((bet) => bet.status === 'accepted')].sort(
        (a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0),
      ),
    [selfBets, visiblePendingBets],
  );

  useEffect(() => {
    if (betUiState !== 'accept') return undefined;
    const timer = setTimeout(() => setBetUiState('idle'), ACCEPTED_FLASH_MS);
    return () => clearTimeout(timer);
  }, [betUiState]);

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
    if (newValue > KENO_MAX_BET) newValue = KENO_MAX_BET;
    if (newValue < KENO_MIN_BET || Number.isNaN(newValue)) newValue = KENO_MIN_BET;
    setBetAmount(String(newValue));
  };

  const increaseBet = () => {
    setBetAmount(String(Math.min(Number(betAmount) + 1, KENO_MAX_BET)));
  };

  const decreaseBet = () => {
    setBetAmount(String(Math.max(Number(betAmount) - 1, KENO_MIN_BET)));
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

      if (result.success) {
        // Keep it as an accepted ticket until the server echoes it back in selfBets.
        setPendingBets((prev) =>
          prev.map((b) => (b.timestamp === pendingBet.timestamp ? { ...b, status: 'accepted' } : b)),
        );
        void refreshBalance?.();
        window.dispatchEvent(new Event('superbet:wallet-changed'));
        return true;
      }

      setPendingBets((prev) => prev.filter((b) => b.timestamp !== pendingBet.timestamp));
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

    if (Number(amountToBet) < KENO_MIN_BET) {
      setSnackbarMessage(`Minimum bet is ${KENO_MIN_BET} ETB`);
      setSnackbarOpen(true);
      return;
    }

    if (Number(amountToBet) > balance) {
      setSnackbarMessage(`Insufficient balance. You have ${balance.toFixed(2)} ETB`);
      setSnackbarOpen(true);
      return;
    }

    setSelectedNumbers([]);
    setBetUiState('wait');
    void placeBet(numbersToBet, amountToBet).then((ok) => setBetUiState(ok ? 'accept' : 'idle'));
  };

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
    if (topThree.includes(number)) classes.push('max');
    else if (coldThree.includes(number)) classes.push('min');
    return classes.join(' ');
  };

  return (
      <>
        <ChooseNumbersCard
          placedTickets={placedTickets}
          selectedNumbers={selectedNumbers}
          betAmount={Number(betAmount) || 0}
          onHelpClick={onHelpClick}
        />

        <div className="bet_board_cont" id="bet_board_cont">
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

        <div className="bet_input">
          <div className="bet_input_row">
            <div className="bet_input_top">
              <div className="bet_input_ui">
                <button type="button" className="bet_input_btn_m" onClick={decreaseBet} aria-label="Decrease bet">
                  <svg viewBox="0 0 40 40" aria-hidden="true">
                    <rect x="8" y="18" width="24" height="5" rx="2.5" fill="#fff" opacity="0.6" />
                  </svg>
                </button>
                <input
                  className="bet_input_bar"
                  type="number"
                  inputMode="decimal"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  onBlur={handleBlur}
                  aria-label="Bet amount"
                />
                <button type="button" className="bet_input_btn_m" onClick={increaseBet} aria-label="Increase bet">
                  <svg viewBox="0 0 40 40" aria-hidden="true">
                    <g fill="#fff" opacity="0.6">
                      <rect x="8" y="18" width="24" height="5" rx="2.5" />
                      <rect x="17.5" y="8.5" width="5" height="24" rx="2.5" />
                    </g>
                  </svg>
                </button>
              </div>
              <button
                type="button"
                className="bet_input_btn double_bet"
                onClick={() => setBetAmount((prev) => String(Math.min(Number(prev) * 2, KENO_MAX_BET)))}
              >
                <span>X2</span>
              </button>
              <button
                type="button"
                className="bet_input_btn"
                onClick={() => {
                  if (balance !== null) setBetAmount(String(Math.min(balance, KENO_MAX_BET)));
                }}
                disabled={balance === null || balance < KENO_MIN_BET}
              >
                <span>MAX</span>
              </button>
            </div>
          </div>
          <div className="bet_input_row">
            <button
              type="button"
              className={[
                'bet_set_btn',
                selectedNumbers.length > 0 && ticketCount < 18 ? 'active' : '',
                betUiState !== 'idle' ? betUiState : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={handleBet}
              disabled={betUiState !== 'idle' || selectedNumbers.length === 0 || ticketCount >= 18}
            >
              <span className="bet_set_btn_txt">{t('BET')}</span>
              <span className="bet_set_btn_wait">{t('WAIT...')}</span>
              <span className="bet_set_btn_accept">
                <svg width="20" height="15" viewBox="0 0 35 25.871" aria-hidden="true">
                  <path d="M1.768 11.089l9.352 9.352L29.797 1.768" fill="none" stroke="#fff" strokeWidth="5" />
                </svg>
                {t('BET ACCEPTED')}
              </span>
            </button>
          </div>
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
