'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

/**
 * ThemeProvider — adds `.dark-mode` or `.light-mode` to document.body.
 * Resolution order: localStorage('theme') → prefers-color-scheme → dark.
 * The inline script in layout.tsx sets the class before first paint to avoid flash.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Read the class that the inline script already set
    const bodyClass = document.body.classList.contains('light-mode') ? 'light' : 'dark';
    setTheme(bodyClass);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.body.classList.remove('dark-mode', 'light-mode');
    document.body.classList.add(`${next}-mode`);
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Context ────────────────────────────────────────────────────────────────
import { createContext, useContext } from 'react';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}
