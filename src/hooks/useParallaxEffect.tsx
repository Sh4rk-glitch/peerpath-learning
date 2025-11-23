import { useEffect } from "react";

/**
 * Attach a parallax transform to `bgRef` based on `anchorRef`'s position in the viewport.
 * speed: multiplier for movement (0.1 = slow, 0.5 = faster)
 */
export default function useParallaxEffect(anchorRef: React.RefObject<HTMLElement | null>, bgRef: React.RefObject<HTMLElement | null>, speed = 0.12) {
  useEffect(() => {
    const anchor = anchorRef.current;
    const bg = bgRef.current;
    if (!anchor || !bg) return;

    let raf: number | null = null;

    const update = () => {
      const rect = anchor.getBoundingClientRect();
      // offset relative to viewport center
      const offset = -rect.top * speed;
      bg.style.transform = `translate3d(0, ${offset}px, 0)`;
      raf = null;
    };

    const handler = () => {
      if (raf == null) raf = requestAnimationFrame(update);
    };

    // initial update
    update();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [anchorRef, bgRef, speed]);
}
