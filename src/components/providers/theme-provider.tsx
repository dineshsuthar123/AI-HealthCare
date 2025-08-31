"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const effective = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  if (effective === "dark") root.classList.add("dark"); else root.classList.remove("dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // init from storage
  const saved = (typeof window !== 'undefined' && localStorage.getItem("theme")) as Theme | null;
  const initial = saved ?? "light";
    setThemeState(initial);
    // set initial resolved
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  setResolvedTheme(initial === "system" ? (prefersDark ? "dark" : "light") : initial);
    applyTheme(initial);

    // listen for system changes when on system theme
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
  if ((saved ?? "light") === "system") {
        const isDark = mql.matches;
        setResolvedTheme(isDark ? "dark" : "light");
        applyTheme("system");
      }
    };
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setResolvedTheme(t === "system" ? (prefersDark ? "dark" : "light") : t);
    applyTheme(t);
  };

  const value = useMemo(() => ({ theme, setTheme, resolvedTheme }), [theme, resolvedTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
