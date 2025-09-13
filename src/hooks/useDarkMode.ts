import { useCallback, useEffect, useState } from 'react';

const DARK_MODE_COOKIE = 'dark-mode';

export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;

    const saved = document.cookie
      .split('; ')
      .find((row) => row.startsWith(DARK_MODE_COOKIE))
      ?.split('=')[1];

    if (saved) {
      return saved === 'true';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const updateDarkMode = useCallback((value: boolean) => {
    setIsDarkMode(value);

    document.cookie = `${DARK_MODE_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax`;

    if (value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    updateDarkMode(!isDarkMode);
  }, [isDarkMode, updateDarkMode]);

  useEffect(() => {
    updateDarkMode(isDarkMode);
  }, [isDarkMode, updateDarkMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const saved = document.cookie
        .split('; ')
        .find((row) => row.startsWith(DARK_MODE_COOKIE));

      if (!saved) {
        updateDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [updateDarkMode]);

  return {
    isDarkMode,
    toggleDarkMode,
    setDarkMode: updateDarkMode,
  };
};
