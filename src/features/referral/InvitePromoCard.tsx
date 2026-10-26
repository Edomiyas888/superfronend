import { Link } from 'react-router-dom';
import giftImage from '../../assets/home-gift.webp';
import PhoneVerifyCard from './PhoneVerifyCard';
import { useAccountFlags, useReferralSummary } from './referralApi';

/**
 * Home banner: Golden spins to use, otherwise the invite pitch with Golden 5 progress. Invited
 * players with no verified phone are asked for it first — their inviter is only paid after.
 */
export default function InvitePromoCard() {
  const { data: flags } = useAccountFlags();
  const { data: s } = useReferralSummary();
  if (!s) return null;

  if (flags?.referred && !flags.phoneVerified) {
    return (
      <PhoneVerifyCard
        title="ስልክ ቁጥርዎን ያረጋግጡ"
        sub="ለጓደኛዎ ሽልማት እና ለመለያዎ ደህንነት · Verify your phone to activate your invite."
      />
    );
  }

  const rewarded = Math.min(s.counts.rewarded, 5);
  return (
    <section className={`b365-invite-card${s.goldenSpins > 0 ? ' is-ready' : ''}`} aria-label="Invite friends">
      <img src={giftImage} alt="" className="b365-invite-card__gift" draggable={false} />
      <div className="b365-invite-card__text">
        {s.goldenSpins > 0 ? (
          <>
            <p className="b365-invite-card__title">🎡 {s.goldenSpins} ወርቃማ ስፒን አለዎት!</p>
            <p className="b365-invite-card__sub">እስከ 5,000 ብር ቦነስ · Spin the Golden Wheel</p>
          </>
        ) : (
          <>
            <p className="b365-invite-card__title">ጓደኛ ይጋብዙ፣ ይሸለሙ 🎁</p>
            <p className="b365-invite-card__sub">
              ለእያንዳንዱ ጓደኛ {s.rewardPerFriend} ብር · 5 ጓደኞች = ወርቃማ ጎማ 🎡
            </p>
            <span className="b365-invite-card__dots" aria-label={`${rewarded} of 5`}>
              {Array.from({ length: 5 }, (_, i) => (
                <i key={i} className={i < rewarded ? 'is-on' : ''} />
              ))}
            </span>
          </>
        )}
      </div>
      <Link to="/invite" className="b365-invite-card__cta">
        {s.goldenSpins > 0 ? 'Spin' : 'ጋብዝ'}
      </Link>
    </section>
  );
}
