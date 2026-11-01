import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeroBannerArt, FooterIcon } from './HeroBannerArt';
import fastKenoBannerArt from '../assets/fast-keno-banner.webp';
import fastSportsBannerArt from '../assets/fast-sports-banner.webp';
import championsLeagueBannerArt from '../assets/champions-league-banner.webp';
import premierLeagueBannerArt from '../assets/premier-league-banner.webp';
import spinBannerArt from '../assets/spin-banner.webp';
import inviteBannerArt from '../assets/invite-banner.webp';
import { useSportLink } from '../hooks/useSportLink';
import { useSpinStatus, type SpinStatus } from '../features/spin/spinApi';
import { GRAND_PRIZE, SPIN_PRICE, SPIN_TIERS, spinsLabel } from '../features/spin/spinRules';
import { useReferralSummary, type ReferralSummary } from '../features/referral/referralApi';
import { GOLDEN_SEGMENTS } from '../features/referral/goldenWheel';

const AUTO_INTERVAL_MS = 6000;

type FooterItem = {
  icon: 'live' | 'wallet' | 'payout' | 'odds' | 'groups' | 'keno' | 'numbers' | 'draws' | 'etb' | 'games' | 'risk' | 'fun';
  label: string;
};

type HeroSlide = {
  id: string;
  to: string;
  badge: string;
  title: [string, string];
  subtitle: string;
  art: 'default' | 'keno' | 'epl';
  artImage?: string;
  footer: FooterItem[];
};

const etb = (n: number) => n.toLocaleString('en-US');
const GOLDEN_TOP = Math.max(...GOLDEN_SEGMENTS.map((s) => s.amount));

/** Spin & Win and Invite friends lead the carousel, and change once the player has spins to use. */
function promoSlides(spin: SpinStatus | null | undefined, referral: ReferralSummary | undefined): HeroSlide[] {
  const ready = spin?.player?.available ?? 0;
  const price = spin?.price ?? SPIN_PRICE;
  const golden = referral?.goldenSpins ?? 0;
  return [
    {
      id: 'spin',
      to: '/spin',
      badge: ready > 0 ? `🎡 ${spinsLabel(ready)} ready` : 'Daily Spin & Win',
      title: ready > 0 ? ['Your free spins', 'are ready!'] : ['Spin & win up to', `${etb(GRAND_PRIZE)} ETB!`],
      subtitle:
        ready > 0
          ? `Spin now — win up to ${etb(GRAND_PRIZE)} ETB.`
          : `Free spins when you deposit ${etb(SPIN_TIERS[0].at)}+ ETB today, or buy one for ${price} ETB.`,
      art: 'default',
      artImage: spinBannerArt,
      footer: [
        { icon: 'fun', label: 'Free daily spins' },
        { icon: 'etb', label: `Buy for ${price} ETB` },
        { icon: 'payout', label: 'Instant prizes' },
      ],
    },
    {
      id: 'invite',
      to: '/invite',
      badge: golden > 0 ? `🎡 ${golden} Golden spin${golden === 1 ? '' : 's'} ready` : 'ጓደኛ ይጋብዙ · Invite friends',
      title: golden > 0 ? ['Spin the', 'Golden Wheel!'] : ['Invite friends,', 'get rewarded!'],
      subtitle:
        golden > 0
          ? `Win up to ${etb(GOLDEN_TOP)} ETB bonus.`
          : `${referral ? `${referral.rewardPercent}% bonus` : 'A bonus'} on your friends' deposits · 5 friends = Golden Wheel`,
      art: 'default',
      artImage: inviteBannerArt,
      footer: [
        { icon: 'groups', label: 'Invite friends' },
        { icon: 'etb', label: 'Bonus on deposits' },
        { icon: 'games', label: 'Golden Wheel' },
      ],
    },
  ];
}

function buildHeroSlides(championsLeagueLink: string): HeroSlide[] {
  return [
  {
    id: 'main',
    to: '/',
    badge: 'Your money is safe',
    title: ['Bet on Super Bet', 'Win more!'],
    subtitle: 'Football, live odds and fast keno in one place.',
    art: 'default',
    artImage: fastSportsBannerArt,
    footer: [
      { icon: 'live', label: 'Live odds' },
      { icon: 'wallet', label: 'Secure wallet' },
      { icon: 'payout', label: 'Fast payouts' },
    ],
  },
  {
    id: 'champions-league',
    to: championsLeagueLink,
    badge: 'Champions League',
    title: ['Bet the', 'Champions League'],
    subtitle: "Europe's biggest nights — every match, every market.",
    art: 'default',
    artImage: championsLeagueBannerArt,
    footer: [
      { icon: 'live', label: 'Live betting' },
      { icon: 'odds', label: 'Top odds' },
      { icon: 'groups', label: 'All 36 clubs' },
    ],
  },
  {
    id: 'premier-league',
    to: '/premier-league',
    badge: 'English Premier League',
    title: ['Bet the', 'Premier League!'],
    subtitle: 'Every matchweek fixture, every market — all in one app.',
    art: 'epl',
    artImage: premierLeagueBannerArt,
    footer: [
      { icon: 'odds', label: 'Top odds' },
      { icon: 'groups', label: 'All 20 clubs' },
      { icon: 'live', label: 'Live betting' },
    ],
  },
  {
    id: 'keno',
    to: '/keno',
    badge: 'New game',
    title: ['Fast Keno', 'Play now!'],
    subtitle: 'Pick your numbers and win every round.',
    art: 'keno',
    artImage: fastKenoBannerArt,
    footer: [
      { icon: 'numbers', label: '80 numbers' },
      { icon: 'draws', label: '20 draws' },
      { icon: 'etb', label: 'From 2 ETB' },
    ],
  },
];
}

function HeroBannerCard({ slide }: { slide: HeroSlide }) {
  return (
    <Link
      to={slide.to}
      className={[
        'b365-hero-banner',
        slide.artImage ? 'b365-hero-banner--photo' : '',
        slide.id === 'main' ? 'b365-hero-banner--sports' : '',
        slide.id === 'keno' ? 'b365-hero-banner--keno' : '',
        slide.id === 'premier-league' ? 'b365-hero-banner--epl' : '',
        slide.id === 'champions-league' ? 'b365-hero-banner--ucl' : '',
        slide.id === 'spin' ? 'b365-hero-banner--spin' : '',
        slide.id === 'invite' ? 'b365-hero-banner--invite' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`${slide.title.join(' ')} — ${slide.subtitle}`}
    >
      <div className="b365-hero-banner__body">
        <HeroBannerArt variant={slide.art} imageSrc={slide.artImage} />
        <div className="b365-hero-banner__content">
          <span className="b365-hero-banner__badge">{slide.badge}</span>
          <h2 className="b365-hero-banner__title">
            <span>{slide.title[0]}</span>
            <span>{slide.title[1]}</span>
          </h2>
          <p className="b365-hero-banner__sub">{slide.subtitle}</p>
        </div>
      </div>
      <div className="b365-hero-banner__footer">
        {slide.footer.map((item, index) => (
          <span key={item.label} className="b365-hero-banner__footer-group">
            {index > 0 ? <span className="b365-hero-banner__footer-sep" aria-hidden>·</span> : null}
            <span className="b365-hero-banner__footer-item">
              <FooterIcon type={item.icon} />
              {item.label}
            </span>
          </span>
        ))}
      </div>
    </Link>
  );
}

export default function PromoBannerCarousel() {
  const championsLeagueLink = useSportLink('Soccer', undefined, 'champions-league');
  const { data: spin } = useSpinStatus();
  const { data: referral } = useReferralSummary();
  const slides = useMemo(
    () => [...promoSlides(spin, referral), ...buildHeroSlides(championsLeagueLink)],
    [championsLeagueLink, spin, referral]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const swipeStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex((index + slides.length) % slides.length);
    },
    [slides.length]
  );

  const pauseBriefly = useCallback(() => {
    setPaused(true);
    window.setTimeout(() => setPaused(false), AUTO_INTERVAL_MS * 2);
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || paused || prefersReducedMotion.current) return;
    const id = window.setInterval(goNext, AUTO_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [slides.length, paused, goNext, activeIndex]);

  const swipeMinPx = 48;
  const swipeAxisRatio = 1.25;

  const onSwipePointerDown = (e: React.PointerEvent) => {
    if (slides.length <= 1 || e.button !== 0) return;
    swipeStartRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onSwipePointerUp = (e: React.PointerEvent) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || start.pointerId !== e.pointerId || slides.length <= 1) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < swipeMinPx || absX < absY * swipeAxisRatio) return;
    pauseBriefly();
    if (dx < 0) goNext();
    else goPrev();
  };

  const onSwipePointerCancel = (e: React.PointerEvent) => {
    if (swipeStartRef.current?.pointerId === e.pointerId) swipeStartRef.current = null;
  };

  return (
    <section
      className={`b365-hero-carousel${paused ? ' is-paused' : ''}`}
      aria-label="Promotions"
    >
      <div
        className="b365-hero-carousel__viewport"
        role="region"
        aria-roledescription="carousel"
        aria-live="polite"
        onPointerDown={onSwipePointerDown}
        onPointerUp={onSwipePointerUp}
        onPointerCancel={onSwipePointerCancel}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div
          className="b365-hero-carousel__track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="b365-hero-carousel__slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
              aria-hidden={index !== activeIndex}
            >
              <HeroBannerCard slide={slide} />
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="b365-hero-carousel__dots" role="tablist" aria-label="Promotion slides">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              className={`b365-hero-carousel__dot${index === activeIndex ? ' active' : ''}`}
              aria-label={`Show promotion ${index + 1}`}
              aria-selected={index === activeIndex}
              onClick={() => {
                pauseBriefly();
                goTo(index);
              }}
            >
              <span
                key={index === activeIndex ? `progress-${activeIndex}` : `idle-${index}`}
                className="b365-hero-carousel__dot-fill"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
