import { useCallback, useEffect, useRef, useState } from 'react';

const AUTO_INTERVAL_MS = 5500;

const PROMO_BANNERS = [
  {
    src: '/world-cup-2026-banner.png',
    alt: 'FIFA World Cup 2026 — Bet on Super Bet',
  },
  {
    src: '/match-day-banner.png',
    alt: 'Match Day — Bet on Super Bet',
  },
] as const;

export default function PromoBannerCarousel() {
  const slides = PROMO_BANNERS;
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
      className={`b365-promo-carousel${paused ? ' is-paused' : ''}`}
      aria-label="Promotions"
    >
      <div
        className="b365-promo-carousel__viewport"
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
          className="b365-promo-carousel__track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.src}
              className="b365-promo-carousel__slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
              aria-hidden={index !== activeIndex}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                className="b365-promo-carousel__img"
                width={1200}
                height={400}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              className="b365-promo-carousel__nav b365-promo-carousel__nav--prev"
              aria-label="Previous promotion"
              onClick={() => {
                pauseBriefly();
                goPrev();
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className="b365-promo-carousel__nav b365-promo-carousel__nav--next"
              aria-label="Next promotion"
              onClick={() => {
                pauseBriefly();
                goNext();
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="b365-promo-carousel__footer">
          <div className="b365-promo-carousel__dots" role="tablist" aria-label="Promotion slides">
            {slides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                role="tab"
                className={`b365-promo-carousel__dot${index === activeIndex ? ' active' : ''}`}
                aria-label={`Show promotion ${index + 1}`}
                aria-selected={index === activeIndex}
                onClick={() => {
                  pauseBriefly();
                  goTo(index);
                }}
              >
                <span
                  key={index === activeIndex ? `progress-${activeIndex}` : `idle-${index}`}
                  className="b365-promo-carousel__dot-fill"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
