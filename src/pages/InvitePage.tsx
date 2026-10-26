import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSessionStore } from '../features/auth/sessionStore';
import SpinSprite from '../features/spin/SpinSprite';
import GoldenWheelSection from '../features/referral/GoldenWheelSection';
import PhoneVerifyCard from '../features/referral/PhoneVerifyCard';
import {
  QUALIFY_DEPOSIT,
  useReferralLeaderboard,
  useReferralSummary,
  type ReferralFriend,
} from '../features/referral/referralApi';
import { openTelegramLink } from '../lib/telegram/webApp';
import giftImage from '../assets/home-gift.webp';

const SHARE_TEXT =
  '🎁 Super Bet ላይ ይቀላቀሉኝ! ⚽ ስፖርት፣ 🎰 ፋስት ኬኖ እና 🎡 ስፒን ኤንድ ዊን — በዚህ ሊንክ ይግቡ 👇';

function friendStatus(f: ReferralFriend): { label: string; tone: 'done' | 'wait' | 'bad' } {
  if (f.status === 'rewarded') return { label: `+${f.reward} ብር ✓`, tone: 'done' };
  if (f.status === 'held') return { label: 'በግምገማ ላይ · Review', tone: 'wait' };
  if (f.status === 'rejected') return { label: 'ብቁ አይደለም · Not eligible', tone: 'bad' };
  if (!f.phoneVerified) return { label: 'ስልክ ይቀረዋል · Needs phone', tone: 'wait' };
  return { label: `${Math.floor(f.deposited)}/${QUALIFY_DEPOSIT} ብር`, tone: 'wait' };
}

function GoldenFive({ rewarded }: { rewarded: number }) {
  const done = Math.min(rewarded, 5);
  return (
    <div className="b365-gold5">
      <p className="b365-gold5__head">🏆 ወርቃማ 5 · Golden 5</p>
      <div className="b365-gold5__dots" aria-label={`${done} of 5 friends deposited`}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < done ? 'is-on' : ''}>
            {i < done ? '✓' : i + 1}
          </span>
        ))}
      </div>
      <p className="b365-gold5__next">
        {rewarded >= 5
          ? '👑 ሱፐር ወኪል ነዎት! ለእያንዳንዱ አዲስ ጓደኛ 15 ብር'
          : `${5 - done} ተጨማሪ ጓደኞች ብቻ — ወርቃማውን ጎማ ይክፈቱ! 🎡`}
      </p>
    </div>
  );
}

export default function InvitePage() {
  const username = useSessionStore((s) => s.username);
  const summaryQ = useReferralSummary();
  const boardQ = useReferralLeaderboard();
  const [copied, setCopied] = useState(false);

  if (!username) {
    return (
      <div className="b365-invite">
        <h1 className="b365-spin__title">ጓደኛ ይጋብዙ</h1>
        <p className="b365-spin__muted">ለመጋበዝ ይግቡ · Log in to invite friends.</p>
        <Link to="/profile" className="b365-spin__btn">
          Log in
        </Link>
      </div>
    );
  }

  const s = summaryQ.data;
  const share = () => {
    if (!s?.link) return;
    openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(s.link)}&text=${encodeURIComponent(SHARE_TEXT)}`);
  };
  const copy = async () => {
    if (!s?.link) return;
    try {
      await navigator.clipboard.writeText(s.link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="b365-invite">
      <SpinSprite />

      <header className="b365-invite__hero">
        <img src={giftImage} alt="" className="b365-invite__gift" />
        <div>
          <h1 className="b365-spin__title">ጓደኛ ይጋብዙ፣ ይሸለሙ</h1>
          <p className="b365-invite__lead">
            ጓደኛዎ ስልኩን አረጋግጦ <b>100 ብር</b> ሲያስገባ <b>{s?.rewardPerFriend ?? 10} ብር ቦነስ</b> ያገኛሉ!
          </p>
          <p className="b365-spin__muted b365-invite__en">
            Get a {s?.rewardPerFriend ?? 10} ETB bonus for every friend who verifies their phone and deposits 100 ETB.
          </p>
        </div>
      </header>

      {summaryQ.isPending ? <p className="b365-spin__muted">Loading…</p> : null}
      {summaryQ.error ? <p className="b365-wallet-form__error">{(summaryQ.error as Error).message}</p> : null}

      {s && !s.phoneVerified ? (
        <PhoneVerifyCard
          title="መጀመሪያ ስልክዎን ያረጋግጡ"
          sub="Verify your phone to get your personal invite link."
        />
      ) : null}

      {s?.link ? (
        <section className="b365-invite__link" aria-label="Your invite link">
          <p className="b365-invite__label">የእርስዎ ሊንክ · Your link</p>
          <div className="b365-invite__linkbox">
            <code>{s.link.replace(/^https:\/\//, '')}</code>
            <button type="button" onClick={() => void copy()}>
              {copied ? 'ተቀድቷል ✓' : 'ቅዳ · Copy'}
            </button>
          </div>
          <button type="button" className="b365-spin__btn is-ready" onClick={share}>
            📤 በቴሌግራም ያጋሩ · Share
          </button>
        </section>
      ) : null}

      {s ? (
        <>
          <div className="b365-invite__stats">
            <div>
              <b>{s.counts.joined}</b>
              <span>ተቀላቅለዋል · Joined</span>
            </div>
            <div>
              <b>{s.counts.rewarded}</b>
              <span>አስገብተዋል · Deposited</span>
            </div>
            <div>
              <b>{s.earned.toLocaleString('en-US')} ብር</b>
              <span>ቦነስ · Earned</span>
            </div>
          </div>

          <GoldenFive rewarded={s.counts.rewarded} />

          {s.goldenSpins > 0 ? <GoldenWheelSection key={s.goldenSpins} spins={s.goldenSpins} /> : null}

          <section className="b365-invite__ladder" aria-label="Rewards">
            <h2>🎁 ሽልማቶች · Rewards</h2>
            <ol>
              <li className={s.counts.rewarded >= 1 ? 'is-done' : ''}>
                <span className="b365-invite__lvl">1</span>
                <span>
                  ለእያንዳንዱ ጓደኛ <b>{s.rewardPerFriend} ብር</b> ቦነስ
                </span>
              </li>
              {s.milestones.map((m) => (
                <li key={m.level} className={m.reached ? 'is-done' : ''}>
                  <span className="b365-invite__lvl">{m.level}</span>
                  <span>
                    <b>{m.bonus.toLocaleString('en-US')} ብር</b> ቦነስ
                    {m.goldenSpins ? ` + ${m.goldenSpins} ወርቃማ ስፒን 🎡` : ''}
                    {m.level === 5 ? ' + 👑 ሱፐር ወኪል (15 ብር/ጓደኛ)' : ''}
                  </span>
                  {m.reached ? <span className="b365-invite__tick">✓</span> : null}
                </li>
              ))}
            </ol>
          </section>

          <section className="b365-invite__friends" aria-label="Your friends">
            <h2>👥 ጓደኞችዎ · Your friends</h2>
            {s.friends.length === 0 ? (
              <p className="b365-spin__muted">እስካሁን ጓደኛ የለም — ሊንክዎን ያጋሩ! · No friends yet — share your link.</p>
            ) : (
              <ul>
                {s.friends.map((f) => {
                  const st = friendStatus(f);
                  return (
                    <li key={f.id}>
                      <span className="b365-invite__fname">{f.name}</span>
                      <span className={`b365-invite__chip is-${st.tone}`}>{st.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : null}

      {boardQ.data?.length ? (
        <section className="b365-invite__board" aria-label="Top inviters this month">
          <h2>🏆 የወሩ ምርጥ ጋባዦች · Top inviters</h2>
          <ol>
            {boardQ.data.map((r) => (
              <li key={r.rank}>
                <span className="b365-invite__rank">{r.rank}</span>
                <span>{r.player}</span>
                <b>{r.friends} ጓደኞች</b>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <details className="b365-freebet-card__rules b365-spin__rules">
        <summary>ደንቦች · Rules</summary>
        <ul>
          <li>A friend counts when they open Super Bet from your link, verify their phone, and deposit 100 ETB in total within 30 days</li>
          <li>Every reward is bonus balance: bet it through at total odds above 2 to unlock it as cash</li>
          <li>Friends using your own phone or Telegram account don&apos;t count</li>
          <li>More than 20 friends in one day are reviewed before they pay</li>
          <li>Golden Wheel prizes are 50–5,000 ETB bonus</li>
        </ul>
      </details>
    </div>
  );
}
