import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';

  const stored = window.localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  const prefersDark =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  return prefersDark ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme);

  const applyThemeToDocument = useCallback((nextTheme) => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(nextTheme);
    if (window?.localStorage) {
      window.localStorage.setItem('theme', nextTheme);
    }
  }, []);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme, applyThemeToDocument]);

  const setTheme = useCallback(
    (nextTheme) => {
      setThemeState(nextTheme);
    },
    []
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};

