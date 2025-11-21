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
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    return "light";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // ignore
    }

    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggle = () => {
    // briefly disable transitions to avoid flicker
    try {
      const root = document.documentElement;
      root.classList.add("disable-theme-transition");
      setTimeout(() => root.classList.remove("disable-theme-transition"), 120);
      // Add a temporary theme-wave animation class for a nicer visual
      try {
        // capture click position for nicer wave origin if available
        const x = (window as any).__lastThemeToggleX || '50%';
        const y = (window as any).__lastThemeToggleY || '50%';
        root.style.setProperty('--tw-x', typeof x === 'number' ? `${x}px` : x);
        root.style.setProperty('--tw-y', typeof y === 'number' ? `${y}px` : y);
        root.classList.add('theme-wave');
        setTimeout(() => root.classList.remove('theme-wave'), 800);
      } catch (e) {
        // ignore
      }
    } catch (e) {
      // ignore
    }

    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  return { theme, setTheme, toggle } as const;
}

export default useTheme;
