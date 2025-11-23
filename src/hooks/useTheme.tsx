import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "dark" || stored === "light") return stored;
    } catch (e) {
      // ignore
    }
    // default to system preference
    try {
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      // ignore
    }
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // ignore
    }
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  }, [theme]);

  const toggle = () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';

    // animation duration (ms) — slowed for a smoother feel
    const duration = 1400;

    try {
      if (process.env.NODE_ENV === 'development') console.debug('[useTheme] toggle ->', newTheme);
      const root = document.documentElement;

      // respect prefers-reduced-motion
      const mq = typeof window !== 'undefined' && (window as any).matchMedia && (window as any).matchMedia('(prefers-reduced-motion: reduce)');
      if (mq && mq.matches) {
        if (newTheme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
        setTheme(newTheme);
        return;
      }

      // overlay container
      const overlay = document.createElement('div');
      overlay.id = 'theme-wave-overlay';
      overlay.style.position = 'fixed';
      overlay.style.left = '0';
      overlay.style.top = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '9999';
      overlay.style.overflow = 'hidden';

      // stripe element (straight line)
      const stripe = document.createElement('div');
      stripe.setAttribute('role', 'presentation');
      stripe.style.position = 'absolute';
      stripe.style.left = '0';
      stripe.style.top = '-140%';
      stripe.style.width = '100%';
      stripe.style.height = '18vh';
      stripe.style.transform = 'translate3d(0,-140%,0)';
      stripe.style.transition = `transform ${duration}ms cubic-bezier(.22,.85,.3,1)`;
      stripe.style.willChange = 'transform';
      stripe.style.pointerEvents = 'none';

      const darkStart = '#051021';
      const darkEnd = '#081428';
      const lightStart = '#ffffff';
      const lightEnd = '#f8fafc';
      stripe.style.background = newTheme === 'dark'
        ? `linear-gradient(180deg, ${darkStart}, ${darkEnd})`
        : `linear-gradient(180deg, ${lightStart}, ${lightEnd})`;
      stripe.style.boxShadow = newTheme === 'dark'
        ? '0 12px 30px rgba(0,0,0,0.45)'
        : '0 10px 30px rgba(0,0,0,0.08)';
      stripe.style.borderBottom = newTheme === 'dark' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.06)';

      overlay.appendChild(stripe);
      document.body.appendChild(overlay);
      if (process.env.NODE_ENV === 'development') console.debug('[useTheme] overlay appended');

      // force reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      stripe.getBoundingClientRect();

      // Immediately apply theme so content behind stripe is already in target theme
      if (newTheme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
      setTheme(newTheme);

      // animate stripe down and fully off-screen
      requestAnimationFrame(() => {
        stripe.style.transform = 'translate3d(0,320%,0)';
      });

      setTimeout(() => {
        try { overlay.remove(); } catch (e) { /* ignore */ }
      }, duration + 120);
    } catch (e) {
      // fallback immediate toggle
      const root = document.documentElement;
      if (newTheme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
      setTheme(newTheme);
    }
  };

  return { theme, setTheme, toggle } as const;
}

export default useTheme;