import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ChooseNumbersCard from './chooseNumbers';
import './keno-bet-bar.css';
import './keno-grid.css';
import TicketCheckerDialog from './TicketCheckerDialog';
import KenoWarningPopup from './KenoWarningPopup';
import { KENO_MIN_BET, KENO_MAX_BET, KENO_MAX_TICKETS } from '../utils/kenoPayouts';
import { normalizeNumbers } from '../utils/ticketCode';
import { useAuth } from '../contexts/AuthContext';
import { useSessionStore } from '@/features/auth/sessionStore';
import { placeKenoBet } from '@/features/keno/api/kenoApi';
import { fetchBalance } from '@/features/wallet/walletApi';
import { filterUnconfirmedPendingBets } from '../utils/kenoBetMatch';
import { t } from '../utils/translator';

const TOTAL_NUMBERS = 80;
const COLUMNS = 10;
// Atlas shows "BET ACCEPTED" for half a second after the server confirms a ticket.
const ACCEPTED_FLASH_MS = 500;

function insufficientBalanceMessage(balance) {
  return Number(balance) < KENO_MIN_BET
    ? t('Insufficient funds.')
    : t('Your bet is more than your balance.');
}

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
  const [warning, setWarning] = useState(null);
  const [ticketCheckOpen, setTicketCheckOpen] = useState(false);
  const [scannedTicketCode, setScannedTicketCode] = useState('');
  // 'idle' | 'wait' (request in flight) | 'accept' (just confirmed)
  const [betUiState, setBetUiState] = useState('idle');

  // Free tickets (Spin & Win prize) ride on the shared wallet query.
  const walletQ = useQuery({
    queryKey: ['wallet', 'header'],
    queryFn: () => fetchBalance(getAuthHeader()),
    enabled: Boolean(currentUser),
    staleTime: 30_000,
  });
  const freeTickets = walletQ.data?.kenoFreeTickets ?? null;
  const [useFreeTicket, setUseFreeTicket] = useState(true);
  const freeOn = Boolean(freeTickets) && useFreeTicket;

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

  const placeBet = async (numbers, amount, freeTicket = false) => {
    if (!currentUser) {
      setWarning(t('Please login to place a bet'));
      return false;
    }

    const currentTicketCount = ticketCount;
    if (currentTicketCount >= KENO_MAX_TICKETS) {
      setWarning(`${t('You can only place up to')} ${KENO_MAX_TICKETS} ${t('tickets')}`);
      return false;
    }

    if (!numbers.length) return false;

    if (!freeTicket && Number(amount) > balance) {
      setWarning(insufficientBalanceMessage(balance));
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
        freeTicket,
      });

      if (result.success) {
        // Keep it as an accepted ticket until the server echoes it back in selfBets.
        setPendingBets((prev) =>
          prev.map((b) => (b.timestamp === pendingBet.timestamp ? { ...b, status: 'accepted' } : b)),
        );
        void refreshBalance?.();
        if (freeTicket) void walletQ.refetch();
        window.dispatchEvent(new Event('superbet:wallet-changed'));
        return true;
      }

      setPendingBets((prev) => prev.filter((b) => b.timestamp !== pendingBet.timestamp));
      setWarning(result.message || 'Failed to place bet');
      return false;
    } catch (error) {
      setPendingBets((prev) => prev.filter((b) => b.timestamp !== pendingBet.timestamp));
      setWarning(error?.message || 'Failed to place bet');
      return false;
    }
  };

  const handleBet = () => {
    if (ticketCount >= KENO_MAX_TICKETS) return;

    const numbersToBet = [...selectedNumbers];
    const amountToBet = freeOn ? freeTickets.stake : betAmount;

    if (!numbersToBet.length) return;

    if (!currentUser) {
      setWarning(t('Please login to place a bet'));
      return;
    }

    if (!freeOn && Number(amountToBet) < KENO_MIN_BET) {
      setWarning(t('Please enter at least minimum amount.'));
      return;
    }

    if (!freeOn && Number(amountToBet) > balance) {
      setWarning(insufficientBalanceMessage(balance));
      return;
    }

    setSelectedNumbers([]);
    setBetUiState('wait');
    void placeBet(numbersToBet, amountToBet, freeOn).then((ok) => setBetUiState(ok ? 'accept' : 'idle'));
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
          betAmount={freeOn ? freeTickets.stake : Number(betAmount) || 0}
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
          {freeTickets ? (
            <button
              type="button"
              className={`keno-free-ticket${freeOn ? ' is-on' : ''}`}
              aria-pressed={freeOn}
              onClick={() => setUseFreeTicket((v) => !v)}
            >
              <span className="keno-free-ticket__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"
                    fill="currentColor"
                  />
                  <path d="M14 6v12" stroke="#0a0a0b" strokeWidth="1.4" strokeDasharray="2 2" />
                </svg>
              </span>
              <span className="keno-free-ticket__text">
                <b>Free ticket</b> · {freeTickets.count} left · {freeTickets.stake} ETB each
              </span>
              <span className="keno-free-ticket__switch" aria-hidden="true" />
            </button>
          ) : null}
          <div className={`bet_input_row${freeOn ? ' is-free' : ''}`}>
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
                  value={freeOn ? freeTickets.stake : betAmount}
                  disabled={freeOn}
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
                selectedNumbers.length > 0 && ticketCount < KENO_MAX_TICKETS ? 'active' : '',
                betUiState !== 'idle' ? betUiState : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={handleBet}
              disabled={betUiState !== 'idle' || selectedNumbers.length === 0 || ticketCount >= KENO_MAX_TICKETS}
            >
              <span className="bet_set_btn_txt">{freeOn ? t('BET FREE') : t('BET')}</span>
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

      <KenoWarningPopup message={warning} onClose={() => setWarning(null)} />
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
