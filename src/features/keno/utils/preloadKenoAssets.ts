import fastKenoLogo from '../assets/fastloader.png';

const KENO_BG_URL = 'https://cdn-atlas-v.com/games/keno/img/bg.jpg';
const PRELOAD_TIMEOUT_MS = 6000;

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

function preloadFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.ready) {
    return Promise.resolve();
  }
  return document.fonts.ready.then(() => undefined).catch(() => undefined);
}

/** Warm up Keno visuals so the game column renders at the correct size on first paint. */
export async function preloadKenoAssets(): Promise<void> {
  const work = Promise.all([preloadImage(fastKenoLogo), preloadImage(KENO_BG_URL), preloadFonts()]);
  const timeout = new Promise<void>((resolve) => {
    window.setTimeout(resolve, PRELOAD_TIMEOUT_MS);
  });
  await Promise.race([work, timeout]);
}
