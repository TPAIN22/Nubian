import { useTheme } from '@/providers/ThemeProvider';

/**
 * Hook to get theme-aware colors
 * Use this instead of importing Colors directly from brandColors
 */
export const useColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

