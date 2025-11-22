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
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
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

  const toggle = (event?: React.MouseEvent) => {
    const newTheme = theme === "dark" ? "light" : "dark";

    // Immediately apply the theme change for instant response
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    setTheme(newTheme);
  };

  return { theme, setTheme, toggle } as const;
}

export default useTheme;