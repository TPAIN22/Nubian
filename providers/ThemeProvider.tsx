import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
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
  const systemColorScheme = useColorScheme();
  const { themeMode, setThemeMode } = useThemeStore();
  
  // Initialize effective theme based on user preference and system setting
  const effectiveTheme = useMemo<ThemeMode>(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  // Memoize theme object to prevent unnecessary re-renders
  const theme = useMemo(() => getTheme(effectiveTheme), [effectiveTheme]);
  const isDark = useMemo(() => effectiveTheme === 'dark', [effectiveTheme]);

  // Memoize context value to prevent unnecessary re-renders
  const value: ThemeContextType = useMemo(
    () => ({
      theme,
      themeMode,
      setThemeMode,
      isDark,
    }),
    [theme, themeMode, setThemeMode, isDark]
  );

  return (
    <ThemeContext.Provider value={value}>
      <GluestackUIProvider mode={effectiveTheme}>
        {children}
      </GluestackUIProvider>
    </ThemeContext.Provider>
  );
};

