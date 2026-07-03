import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeroBannerArt, FooterIcon } from './HeroBannerArt';
import fastKenoBannerArt from '../assets/fast-keno-banner.png';
import fastSportsBannerArt from '../assets/fast-sports-banner.png';

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
  art: 'default' | 'keno' | 'wc';
  artImage?: string;
  footer: FooterItem[];
};

const HERO_SLIDES: HeroSlide[] = [
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
    id: 'world-cup',
    to: '/world-cup-2026',
    badge: 'World Cup 2026',
    title: ['Bet the', 'World Cup!'],
    subtitle: 'Every match, every market — all in one app.',
    art: 'wc',
    footer: [
      { icon: 'odds', label: 'Top odds' },
      { icon: 'groups', label: 'All groups' },
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

function HeroBannerCard({ slide }: { slide: HeroSlide }) {
  return (
    <Link
      to={slide.to}
      className={[
        'b365-hero-banner',
        slide.artImage ? 'b365-hero-banner--photo' : '',
        slide.id === 'main' ? 'b365-hero-banner--sports' : '',
        slide.id === 'keno' ? 'b365-hero-banner--keno' : '',
        slide.id === 'world-cup' ? 'b365-hero-banner--wc' : '',
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
  const slides = HERO_SLIDES;
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
