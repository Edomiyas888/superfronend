import { useEffect, useRef } from 'react';

const COLORS = ['#ffd23f', '#c8ff00', '#ffffff', '#ff5a5f', '#2fd394', '#fff3b0'];
const DURATION_MS = 3200;

type Piece = { x: number; y: number; vx: number; vy: number; r: number; vr: number; w: number; h: number; c: string };

/** One burst of confetti over the whole screen; skipped for reduced motion. */
export default function Confetti({ pieces = 140 }: { pieces?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext('2d');
    if (!canvas || !g || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    g.scale(dpr, dpr);

    const parts: Piece[] = Array.from({ length: pieces }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const speed = 7 + Math.random() * 9;
      return {
        x: width / 2,
        y: height * 0.42,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        w: 5 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        c: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#ffd23f',
      };
    });

    const start = performance.now();
    let raf = 0;
    const draw = (now: number) => {
      const elapsed = now - start;
      g.clearRect(0, 0, width, height);
      g.globalAlpha = Math.max(0, 1 - Math.max(0, elapsed - DURATION_MS * 0.6) / (DURATION_MS * 0.4));
      for (const p of parts) {
        p.vy += 0.28;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.r);
        g.fillStyle = p.c;
        g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
        g.restore();
      }
      if (elapsed < DURATION_MS) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [pieces]);

  return <canvas ref={canvasRef} className="b365-spin-confetti" aria-hidden />;
}
