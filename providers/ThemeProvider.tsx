import React, { createContext, useContext, useMemo } from 'react';
import { Theme, ThemeMode, getTheme } from '@/theme';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode | 'system';
  setThemeMode: (mode: ThemeMode | 'system') => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Dark mode has been removed from the app: the UI is always rendered in the
  // light theme regardless of the system color scheme or any stored preference.
  const effectiveTheme: ThemeMode = 'light';

  // Memoize theme object to prevent unnecessary re-renders
  const theme = useMemo(() => getTheme(effectiveTheme), [effectiveTheme]);
  const isDark = false;

  // setThemeMode is kept as a no-op so existing callers don't break.
  const setThemeMode = React.useCallback((_mode: ThemeMode | 'system') => {}, []);

  // Memoize context value to prevent unnecessary re-renders
  const value: ThemeContextType = useMemo(
    () => ({
      theme,
      themeMode: 'light',
      setThemeMode,
      isDark,
    }),
    [theme, setThemeMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <GluestackUIProvider mode={effectiveTheme}>
        {children}
      </GluestackUIProvider>
    </ThemeContext.Provider>
  );
};

