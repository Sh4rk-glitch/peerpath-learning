import React, { useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";

/**
 * Full-screen hero with a circular clip animation driven by scroll.
 * Starts fully covered and reveals content as the user scrolls down.
 */
const HeroClip: React.FC = () => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    let lastY = window.scrollY;

    const calc = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const vh = window.innerHeight;
      const progress = Math.min(Math.max(scrollY / vh, 0), 1);

      // compute a radius that goes from big (cover) to small (reveal)
      const cx = window.innerWidth / 2;
      const cy = vh / 2;
      // furthest corner
      const dx = Math.max(cx, window.innerWidth - cx);
      const dy = Math.max(cy, vh - cy);
      const maxR = Math.sqrt(dx * dx + dy * dy);

      // ease the progress for a nicer curve
      const eased = 1 - Math.pow(1 - progress, 2);
      const radius = Math.max(0, maxR * (1 - eased));

      overlay.style.clipPath = `circle(${radius}px at 50% 50%)`;
      overlay.style.setProperty("-webkit-clip-path", `circle(${radius}px at 50% 50%)`);

      // parallax decorative shapes
      const left = document.getElementById("hero-shape-left");
      const right = document.getElementById("hero-shape-right");
      if (left) left.style.transform = `translate3d(${(progress * -18).toFixed(2)}px, ${(progress * 8).toFixed(2)}px, 0) rotate(${(progress * 6).toFixed(2)}deg)`;
      if (right) right.style.transform = `translate3d(${(progress * 22).toFixed(2)}px, ${(-progress * 6).toFixed(2)}px, 0) rotate(${(-progress * 4).toFixed(2)}deg)`;

      lastY = scrollY;
      rafRef.current = null;
    };

    const handle = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(calc);
    };

    // initialize
    calc();
    window.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);

    // run one more time after a short delay to ensure shapes and clip are correct
    const tidy = setTimeout(() => { if (!rafRef.current) calc(); }, 120);

    return () => {
      clearTimeout(tidy);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
  }, []);

  useEffect(() => {
    // ensure initial visibility correct on mount
    const handlePrefers = () => {
      const root = document.documentElement;
      // no-op but keeps linter happy for now (we may add dynamic adjustments later)
      return root;
    };
    handlePrefers();
  }, []);

  return (
    <header className="relative h-screen min-h-[640px] flex items-center justify-center overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
        <div className="text-center">
          <div className="mx-auto mb-6 w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center shadow-lg">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-foreground">PeerPath</h1>
          <p className="mt-4 text-lg text-muted-foreground">Scroll down to reveal</p>
        </div>
      </div>

      {/* Overlay that will be clipped away as user scrolls. Placed behind title so text remains visible. */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-[color:rgba(255,255,255,0.96)] dark:bg-[color:rgba(6,10,15,0.92)] z-10 transition-clip-path will-change-clip-path"
        style={{ clipPath: "circle(9999px at 50% 50%)", WebkitClipPath: "circle(9999px at 50% 50%)" }}
      />

      {/* Decorative subtle shapes that will parallax on scroll */}
      <div id="hero-shape-left" className="absolute left-8 top-24 opacity-60 pointer-events-none z-0">
        <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="80" cy="80" r="74" stroke="rgba(6,10,15,0.06)" strokeWidth="10" />
        </svg>
      </div>

      <div id="hero-shape-right" className="absolute right-8 bottom-20 opacity-40 pointer-events-none z-0">
        <svg width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 60 C40 10 140 10 220 60 L220 220 L0 220 Z" fill="rgba(29,78,216,0.03)" />
        </svg>
      </div>
    </header>
  );
};

export default HeroClip;
