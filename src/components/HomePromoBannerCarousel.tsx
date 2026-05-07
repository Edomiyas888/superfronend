import { useCallback, useEffect, useState } from 'react';
import howBannersImg from '../assets/image.png';
import typesOfAdsImg from '../assets/image copy.png';

export type HomePromoSlide = {
  id: string;
  src: string;
  alt: string;
  /** Optional — wrap slide in a link */
  href?: string;
};

/** Add new slides here as assets are added. */
export const HOME_PROMO_SLIDES: HomePromoSlide[] = [
  {
    id: 'how-banners',
    src: howBannersImg,
    alt: 'How banners make you money',
  },
  {
    id: 'types-of-ads',
    src: typesOfAdsImg,
    alt: 'Types of advertisements that still work in 2025',
  },
];

const AUTO_MS = 6500;

export default function HomePromoBannerCarousel() {
  const slides = HOME_PROMO_SLIDES;
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (count <= 1) return;
    const id = window.setInterval(() => go(1), AUTO_MS);
    return () => window.clearInterval(id);
  }, [count, go]);

  if (count === 0) return null;

  const slide = slides[index];
  if (!slide) return null;

  const img = (
    <img
      src={slide.src}
      alt={slide.alt}
      className="b365-home-promo-carousel-img"
      loading="lazy"
      decoding="async"
    />
  );

  return (
    <section className="b365-home-promo-carousel" aria-roledescription="carousel" aria-label="Promotions">
      <div className="b365-home-promo-carousel-viewport">
        {count > 1 && (
          <button
            type="button"
            className="b365-home-promo-carousel-nav b365-home-promo-carousel-nav--prev"
            aria-label="Previous promotion"
            onClick={() => go(-1)}
          >
            ‹
          </button>
        )}
        <div className="b365-home-promo-carousel-slide" aria-live="polite">
          {slide.href ? (
            <a href={slide.href} className="b365-home-promo-carousel-link">
              {img}
            </a>
          ) : (
            img
          )}
        </div>
        {count > 1 && (
          <button
            type="button"
            className="b365-home-promo-carousel-nav b365-home-promo-carousel-nav--next"
            aria-label="Next promotion"
            onClick={() => go(1)}
          >
            ›
          </button>
        )}
      </div>
      {count > 1 && (
        <div className="b365-home-promo-carousel-dots" role="tablist" aria-label="Promotion slides">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show promotion ${i + 1} of ${count}`}
              className={`b365-home-promo-carousel-dot ${i === index ? 'active' : ''}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
