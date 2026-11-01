import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '../features/auth/sessionStore';
import { fetchBalance } from '../features/wallet/walletApi';
import { formatMoney } from '../features/wallet/transactionLabels';
import {
  claimBingo,
  joinBingo,
  useBingoAuthHeaders,
  useBingoCards,
  useBingoState,
  type BingoCard,
  type BingoRoom,
  type BingoState,
  type MyBingoEntry,
} from '../features/bingo/bingoApi';
import {
  BINGO_LETTERS,
  BINGO_STAKES,
  ballLabel,
  formatEtb,
  patternLabel,
  winningLines,
} from '../features/bingo/bingoRules';
import { isBingoMuted, playBallCall, setBingoMuted } from '../features/bingo/bingoSound';

const CARD_COUNT = 200;

function walletChanged(queryClient: ReturnType<typeof useQueryClient>) {
  window.dispatchEvent(new CustomEvent('superbet:wallet-changed'));
  void queryClient.invalidateQueries({ queryKey: ['wallet'] });
}

function phaseLabel(room: BingoRoom): string {
  switch (room.phase) {
    case 'open':
      return 'Open';
    case 'countdown':
      return `Starts in ${room.countdown}s`;
    case 'calling':
    case 'claiming':
      return `Live · ${room.calledNumbers.length}/75`;
    default:
      return 'Next round soon';
  }
}

/** Player count with the house PC players called out, e.g. "3 players (2 PC)". */
function playersLabel(room: BingoRoom | undefined, pcPlayers: number): string {
  const count = room?.playerCount ?? 0;
  if (count === 0 && pcPlayers > 0) return `${pcPlayers} PC players ready`;
  const pcs = room?.pcCount ?? 0;
  return `${count} player${count === 1 ? '' : 's'}${pcs ? ` (${pcs} PC)` : ''}`;
}

function SoundToggle() {
  const [muted, setMuted] = useState(isBingoMuted);
  return (
    <button
      type="button"
      className="b365-bingo__icon-btn"
      aria-pressed={!muted}
      aria-label={muted ? 'Turn number calls on' : 'Turn number calls off'}
      onClick={() => {
        setBingoMuted(!muted);
        setMuted(!muted);
      }}
    >
      {muted ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M11 5 6 9H2v6h4l5 4V5z" strokeLinejoin="round" />
          <path d="m22 9-6 6M16 9l6 6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M11 5 6 9H2v6h4l5 4V5z" strokeLinejoin="round" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

function Lobby({ state, error }: { state: BingoState | null; error: string | null }) {
  return (
    <div className="b365-bingo">
      <header className="b365-bingo__head">
        <div>
          <h1 className="b365-bingo__title">Super Bingo</h1>
          <p className="b365-bingo__sub">
            Pick a card, mark the calls, shout BINGO first. Winners share {state ? Math.round((1 - state.houseCut) * 100) : 80}% of the pot.
          </p>
        </div>
        <SoundToggle />
      </header>

      {error && !state ? <p className="b365-bingo__error">{error}</p> : null}

      <ul className="b365-bingo-rooms">
        {BINGO_STAKES.map((stake) => {
          const room = state?.rooms.find((r) => r.stake === stake);
          const mine = state?.myEntries[String(stake)];
          return (
            <li key={stake}>
              <Link to={`/bingo/${stake}`} className="b365-bingo-room">
                <span className="b365-bingo-room__stake">
                  {stake}
                  <small>ETB</small>
                </span>
                <span className="b365-bingo-room__meta">
                  <span className={`b365-bingo-room__phase is-${room?.phase ?? 'open'}`}>
                    {room ? phaseLabel(room) : '…'}
                  </span>
                  <span>
                    {playersLabel(room, state?.pcPlayers ?? 0)} · Prize {formatEtb(room?.prize ?? 0)} ETB
                  </span>
                  {mine ? <span className="b365-bingo-room__mine">Your card #{mine.cardNo}</span> : null}
                </span>
                <span className="b365-bingo-room__go" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <section className="b365-bingo-rules" aria-label="How to play">
        <h2>How it works</h2>
        <ol>
          <li>Choose a room and buy one of {CARD_COUNT} cards. The round starts 60 seconds after the first card.</li>
          <li>A ball is called every {(state?.callIntervalMs ?? 1500) / 1000} seconds. Matching numbers on your card get marked.</li>
          <li>Complete a row, column, diagonal or the four corners and press BINGO — on the ball that completes it.</li>
          <li>A BINGO that isn&apos;t one, or comes a ball late, takes your card out of the round.</li>
          <li>Players completing on the same ball split the prize. If nobody wins, everyone gets their stake back.</li>
          {state?.pcPlayers ? (
            <li>
              So you never play alone, {state.pcPlayers} computer players (marked PC) join when you buy a card. They
              play by the same rules with house money; their stakes go into the pot, and if a PC wins, its share
              stays with the house.
            </li>
          ) : (
            <li>With fewer than {state?.minPlayers ?? 2} players, everyone gets their stake back.</li>
          )}
        </ol>
      </section>
    </div>
  );
}

function CardGrid({
  card,
  called,
  marked,
  onToggle,
  highlight,
  size = 'lg',
}: {
  card: BingoCard;
  called?: Set<number>;
  marked?: Set<number>;
  onToggle?: (n: number) => void;
  highlight?: Set<string>;
  size?: 'lg' | 'sm';
}) {
  return (
    <div className={`b365-bingo-card is-${size}`} role="grid" aria-label="Bingo card">
      {BINGO_LETTERS.map((l) => (
        <span key={l} className="b365-bingo-card__letter" role="columnheader">
          {l}
        </span>
      ))}
      {card.map((row, r) =>
        row.map((n, c) => {
          const free = n === 0;
          const isMarked = free || marked?.has(n);
          const canMark = !free && !!onToggle && !!called?.has(n);
          return (
            <button
              key={`${r}-${c}`}
              type="button"
              role="gridcell"
              className={[
                'b365-bingo-card__cell',
                free ? 'is-free' : '',
                isMarked ? 'is-marked' : '',
                highlight?.has(`${r}-${c}`) ? 'is-line' : '',
              ].join(' ')}
              disabled={!canMark}
              aria-pressed={isMarked}
              aria-label={free ? 'Free' : `${ballLabel(n)}${isMarked ? ', marked' : ''}`}
              onClick={() => canMark && onToggle?.(n)}
            >
              {free ? '★' : n}
            </button>
          );
        })
      )}
    </div>
  );
}

function CalledBoard({ called, lastBall }: { called: Set<number>; lastBall: number | null }) {
  return (
    <div className="b365-bingo-board" aria-label="Called numbers">
      {BINGO_LETTERS.map((letter, col) => (
        <div key={letter} className="b365-bingo-board__row">
          <span className="b365-bingo-board__letter">{letter}</span>
          {Array.from({ length: 15 }, (_, i) => col * 15 + i + 1).map((n) => (
            <span
              key={n}
              className={`b365-bingo-board__n${called.has(n) ? ' is-called' : ''}${n === lastBall ? ' is-last' : ''}`}
            >
              {n}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function CardPicker({
  room,
  cards,
  loggedIn,
  onBuy,
  busy,
}: {
  room: BingoRoom;
  cards: BingoCard[] | undefined;
  loggedIn: boolean;
  onBuy: (cardNo: number) => void;
  busy: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const taken = useMemo(() => new Set(room.takenCards), [room.takenCards]);
  useEffect(() => {
    if (selected && taken.has(selected)) setSelected(null);
  }, [selected, taken]);
  const preview = selected && cards ? cards[selected - 1] : null;

  return (
    <section className="b365-bingo-pick" aria-label="Choose your card">
      <div className="b365-bingo-pick__preview">
        {preview ? (
          <>
            <p className="b365-bingo-pick__label">Card #{selected}</p>
            <CardGrid card={preview} size="sm" />
          </>
        ) : (
          <p className="b365-bingo-pick__hint">Tap a number to see its card.</p>
        )}
        {loggedIn ? (
          <button
            type="button"
            className="b365-bingo__btn"
            disabled={!selected || busy}
            onClick={() => selected && onBuy(selected)}
          >
            {busy ? 'Buying…' : selected ? `Buy card #${selected} · ${room.stake} ETB` : 'Pick a card'}
          </button>
        ) : (
          <Link to="/profile" className="b365-bingo__btn">
            Log in to play
          </Link>
        )}
      </div>
      <div className="b365-bingo-pick__grid" role="listbox" aria-label="Cards">
        {Array.from({ length: CARD_COUNT }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="option"
            aria-selected={selected === n}
            className={`b365-bingo-pick__n${taken.has(n) ? ' is-taken' : ''}${selected === n ? ' is-selected' : ''}`}
            disabled={taken.has(n)}
            onClick={() => setSelected(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </section>
  );
}

function ResultPanel({
  room,
  mine,
  hadCard,
}: {
  room: BingoRoom;
  mine: MyBingoEntry | undefined;
  hadCard: boolean;
}) {
  if (room.phase === 'void') {
    const why =
      room.voidReason === 'not_enough_players'
        ? 'Not enough players joined this round.'
        : 'Every ball was called and nobody claimed BINGO.';
    return (
      <div className="b365-bingo-result" role="status">
        <p className="b365-bingo-result__title">Round cancelled</p>
        <p>{why}</p>
        {hadCard ? <p className="b365-bingo-result__good">Your {room.stake} ETB stake is back in your wallet.</p> : null}
        <p className="b365-bingo-result__next">Next round in {room.resultInSec}s</p>
      </div>
    );
  }
  const won = mine?.status === 'won';
  return (
    <div className={`b365-bingo-result${won ? ' is-won' : ''}`} role="status">
      <p className="b365-bingo-result__title">{won ? `You won ${formatEtb(mine.winnings)} ETB!` : 'BINGO!'}</p>
      <ul className="b365-bingo-result__winners">
        {room.winners.map((w) => (
          <li key={w.cardNo}>
            <span>
              {w.isPc ? <span className="b365-bingo-pc">PC</span> : null}
              {w.username} · card #{w.cardNo} · {patternLabel(w.pattern)}
            </span>
            <strong>{formatEtb(w.amount)} ETB</strong>
          </li>
        ))}
      </ul>
      {mine && !won ? <p>Not this time — your card #{mine.cardNo} didn&apos;t win.</p> : null}
      <p className="b365-bingo-result__next">Next round in {room.resultInSec}s</p>
    </div>
  );
}

function Room({ stake, state, error }: { stake: number; state: BingoState | null; error: string | null }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loggedIn = Boolean(useSessionStore((s) => s.token));
  const authHeaders = useBingoAuthHeaders();
  const { data: cards } = useBingoCards();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [autoMark, setAutoMark] = useState(true);
  const [manual, setManual] = useState<{ roundNo: number | null; marked: Set<number> }>({
    roundNo: null,
    marked: new Set(),
  });

  const room = state?.rooms.find((r) => r.stake === stake);
  const mine = room && state?.myEntries[String(stake)]?.roundNo === room.roundNo ? state.myEntries[String(stake)] : undefined;
  const myCard = mine && cards ? cards[mine.cardNo - 1] : null;
  const called = useMemo(() => new Set(room?.calledNumbers ?? []), [room?.calledNumbers]);

  // Remember which round we had a card in: a refund removes the entry from the state.
  const hadCardRound = useRef<number | null>(null);
  if (mine && room) hadCardRound.current = room.roundNo;
  const hadCard = hadCardRound.current != null && hadCardRound.current === room?.roundNo;

  const marked = useMemo(() => {
    if (!myCard) return new Set<number>();
    if (autoMark) return new Set(myCard.flat().filter((n) => n && called.has(n)));
    return manual.roundNo === room?.roundNo ? manual.marked : new Set<number>();
  }, [autoMark, myCard, called, manual, room?.roundNo]);

  const live = room?.phase === 'calling' || room?.phase === 'claiming';
  const lastBall = room?.lastBall ?? null;
  const lines = useMemo(
    () => (myCard && live ? winningLines(myCard, marked, lastBall) : []),
    [myCard, live, marked, lastBall]
  );
  const highlight = useMemo(
    () => new Set(lines.flatMap((l) => l.cells.map(([r, c]) => `${r}-${c}`))),
    [lines]
  );

  // Announce each new ball while this room is open.
  const lastAnnounced = useRef<string | null>(null);
  useEffect(() => {
    if (!room || room.phase !== 'calling' || room.lastBall == null) return;
    const key = `${room.roundNo}:${room.calledNumbers.length}`;
    if (lastAnnounced.current === key) return;
    const first = lastAnnounced.current === null;
    lastAnnounced.current = key;
    if (!first) playBallCall(room.lastBall);
  }, [room]);

  // Wins and refunds land in the wallet when the round ends.
  const settledRound = useRef<number | null>(null);
  useEffect(() => {
    if (!room || !hadCard || (room.phase !== 'settled' && room.phase !== 'void')) return;
    if (settledRound.current === room.roundNo) return;
    settledRound.current = room.roundNo;
    walletChanged(queryClient);
  }, [room, hadCard, queryClient]);

  useEffect(() => setMessage(null), [room?.roundNo]);

  if (!room) {
    return (
      <div className="b365-bingo">
        <p className="b365-bingo__error">{error ?? 'Loading Super Bingo…'}</p>
      </div>
    );
  }

  const buy = async (cardNo: number) => {
    setBusy(true);
    setMessage(null);
    try {
      await joinBingo(authHeaders, stake, cardNo);
      walletChanged(queryClient);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not buy the card.');
    } finally {
      setBusy(false);
    }
  };

  const claim = async () => {
    setBusy(true);
    try {
      const res = await claimBingo(authHeaders, stake);
      setMessage(res.valid ? null : 'Not a BINGO on the last ball — your card is out of this round.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not check your BINGO.');
    } finally {
      setBusy(false);
    }
  };

  const toggleMark = (n: number) => {
    setManual((prev) => {
      const next = new Set(prev.roundNo === room.roundNo ? prev.marked : []);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return { roundNo: room.roundNo, marked: next };
    });
  };

  const joinable = room.phase === 'open' || room.phase === 'countdown';
  const recent = room.calledNumbers.slice(-6, -1).reverse();

  return (
    <div className="b365-bingo">
      <header className="b365-bingo__head">
        <button type="button" className="b365-bingo__icon-btn" onClick={() => navigate('/bingo')} aria-label="All rooms">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="b365-bingo__head-main">
          <h1 className="b365-bingo__title is-room">Super Bingo · {stake} ETB</h1>
          <p className="b365-bingo__sub">Round #{room.roundNo ?? '—'}</p>
        </div>
        <SoundToggle />
      </header>

      <div className="b365-bingo-stats">
        <div>
          <span>Players</span>
          <strong>
            {room.playerCount === 0 && state?.pcPlayers
              ? `${state.pcPlayers} PC ready`
              : `${room.playerCount}${room.pcCount ? ` (${room.pcCount} PC)` : ''}`}
          </strong>
        </div>
        <div>
          <span>Prize</span>
          <strong>{formatEtb(room.prize)} ETB</strong>
        </div>
        <div>
          <span>Status</span>
          <strong className={`is-${room.phase}`}>{phaseLabel(room)}</strong>
        </div>
      </div>

      {room.phase === 'countdown' && !state?.pcPlayers && room.playerCount < (state?.minPlayers ?? 2) ? (
        <p className="b365-bingo__note">Needs {state?.minPlayers ?? 2} players to start — otherwise every stake is refunded.</p>
      ) : null}

      {message ? (
        <p className="b365-bingo__error" role="alert">
          {message}
        </p>
      ) : null}

      {(room.phase === 'settled' || room.phase === 'void') ? (
        <ResultPanel room={room} mine={mine} hadCard={hadCard} />
      ) : null}

      {joinable && !mine ? (
        <CardPicker room={room} cards={cards} loggedIn={loggedIn} onBuy={(n) => void buy(n)} busy={busy} />
      ) : null}

      {joinable && mine && myCard ? (
        <section className="b365-bingo-play">
          <p className="b365-bingo__note">
            You&apos;re in with card #{mine.cardNo}.{' '}
            {room.phase === 'countdown' ? `Calling starts in ${room.countdown}s.` : 'Waiting for players.'}
          </p>
          <CardGrid card={myCard} />
        </section>
      ) : null}

      {live || ((room.phase === 'settled' || room.phase === 'void') && room.calledNumbers.length) ? (
        <section className="b365-bingo-play">
          <div className="b365-bingo-ball-row">
            <div className="b365-bingo-ball" aria-live="polite">
              {room.lastBall ? (
                <>
                  <span>{ballLabel(room.lastBall).split('-')[0]}</span>
                  <strong>{room.lastBall}</strong>
                </>
              ) : (
                <strong>—</strong>
              )}
            </div>
            <ul className="b365-bingo-recent" aria-label="Previous balls">
              {recent.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>

          {myCard && mine ? (
            <>
              <CardGrid
                card={myCard}
                called={called}
                marked={marked}
                onToggle={autoMark || !live ? undefined : toggleMark}
                highlight={highlight}
              />
              {live ? (
                <div className="b365-bingo-actions">
                  <label className="b365-bingo-auto">
                    <input type="checkbox" checked={autoMark} onChange={(e) => setAutoMark(e.target.checked)} />
                    Auto-mark
                  </label>
                  {mine.status === 'active' ? (
                    <button
                      type="button"
                      className={`b365-bingo__bingo${lines.length ? ' is-ready' : ''}`}
                      disabled={!lines.length || busy}
                      onClick={() => void claim()}
                    >
                      BINGO!
                    </button>
                  ) : mine.status === 'claimed' ? (
                    <p className="b365-bingo-result__good">BINGO on {patternLabel(mine.pattern)}! Checking other claims…</p>
                  ) : mine.status === 'disqualified' ? (
                    <p className="b365-bingo__error">Your card is out of this round.</p>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : live ? (
            <p className="b365-bingo__note">This round is under way. Stay to buy a card for the next one.</p>
          ) : null}

          <CalledBoard called={called} lastBall={room.lastBall} />
        </section>
      ) : null}
    </div>
  );
}

/** Full-screen top bar (Super Bingo runs outside the main layout, like Fast Keno). */
function BingoTopBar() {
  const { username, hydrate, isTelegramApp } = useSessionStore();
  const loggedIn = Boolean(username);
  const walletQ = useQuery({
    queryKey: ['wallet', 'header'],
    queryFn: () => fetchBalance(useSessionStore.getState().getAuthHeader()),
    enabled: loggedIn,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!isTelegramApp) void hydrate();
  }, [hydrate, isTelegramApp]);

  useEffect(() => {
    const onWallet = () => void walletQ.refetch();
    window.addEventListener('superbet:wallet-changed', onWallet);
    return () => window.removeEventListener('superbet:wallet-changed', onWallet);
  }, [walletQ]);

  const data = walletQ.data;
  // Same total as the main header: cash plus the cash bonus.
  const balance =
    data && data.status !== 'error' ? Number(data.balance ?? 0) + Number(data.promo?.balance ?? 0) : null;

  return (
    <header className="b365-bingo-topbar">
      <Link to="/" className="b365-bingo-topbar__home" aria-label="Back to SuperBet home">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <span className="b365-bingo-topbar__brand">Super Bingo</span>
      {loggedIn ? (
        <Link to="/wallet" className="b365-bingo-topbar__wallet">
          <span>{balance == null ? '…' : `${formatMoney(balance)} ETB`}</span>
          <strong>Deposit</strong>
        </Link>
      ) : (
        <Link to="/profile" className="b365-bingo-topbar__wallet">
          <strong>Log in</strong>
        </Link>
      )}
    </header>
  );
}

export default function BingoPage() {
  const { stake } = useParams();
  const { state, error } = useBingoState();
  const stakeNum = Number(stake);

  useEffect(() => {
    // Browsers only let audio play after a tap; prime it on the first one.
    const unlock = () => {
      const a = new Audio();
      void a.play().catch(() => {});
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('bingo-page');
    return () => document.documentElement.classList.remove('bingo-page');
  }, []);

  const inRoom = Boolean(stake && (BINGO_STAKES as readonly number[]).includes(stakeNum));
  return (
    <div className="b365-bingo-shell">
      <BingoTopBar />
      {inRoom ? (
        <Room stake={stakeNum} state={state} error={error} />
      ) : (
        <Lobby state={state} error={error} />
      )}
    </div>
  );
}
