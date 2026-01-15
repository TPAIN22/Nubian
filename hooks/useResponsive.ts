import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import { useWindowDimensions } from 'react-native';

/**
 * Hook to get responsive dimensions and device type information
 * Supports foldables, tablets, and various screen sizes
 */
export function useResponsive() {
  const window = useWindowDimensions();
  const [screen, setScreen] = useState(Dimensions.get('screen'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ screen }) => {
      setScreen(screen);
    });

    return () => subscription?.remove();
  }, []);

  // Determine device type based on screen dimensions
  const isTablet = Math.min(window.width, window.height) >= 600;
  const isFoldable = window.width !== window.height && 
                     (window.width >= 840 || window.height >= 840);
  const isLargeScreen = window.width >= 840 || window.height >= 840;
  const isSmallScreen = Math.max(window.width, window.height) < 600;

  // Orientation
  const isLandscape = window.width > window.height;
  const isPortrait = window.height > window.width;

  // Responsive breakpoints
  const breakpoints = {
    xs: window.width < 360,
    sm: window.width >= 360 && window.width < 600,
    md: window.width >= 600 && window.width < 840,
    lg: window.width >= 840 && window.width < 1200,
    xl: window.width >= 1200,
  };

  // Responsive values
  const getResponsiveValue = <T,>(values: {
    xs?: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
    default: T;
  }): T => {
    if (breakpoints.xl && values.xl) return values.xl;
    if (breakpoints.lg && values.lg) return values.lg;
    if (breakpoints.md && values.md) return values.md;
    if (breakpoints.sm && values.sm) return values.sm;
    if (breakpoints.xs && values.xs) return values.xs;
    return values.default;
  };

  // Column count for grid layouts
  const getColumnCount = (baseColumns: number = 2) => {
    if (isTablet || isLargeScreen) {
      return isLandscape ? baseColumns + 2 : baseColumns + 1;
    }
    return baseColumns;
  };

  // Spacing multiplier
  const spacingMultiplier = isTablet ? 1.5 : isLargeScreen ? 1.25 : 1;

  return {
    window,
    screen,
    isTablet,
    isFoldable,
    isLargeScreen,
    isSmallScreen,
    isLandscape,
    isPortrait,
    breakpoints,
    getResponsiveValue,
    getColumnCount,
    spacingMultiplier,
    platform: Platform.OS,
  };
}

/**
 * Hook for responsive font sizes
 */
export function useResponsiveFontSize(baseSize: number): number {
  const { isTablet, isLargeScreen } = useResponsive();
  
  if (isTablet) {
    return baseSize * 1.2;
  }
  if (isLargeScreen) {
    return baseSize * 1.1;
  }
  return baseSize;
}

/**
 * Hook for responsive spacing
 */
export function useResponsiveSpacing(baseSpacing: number): number {
  const { spacingMultiplier } = useResponsive();
  return baseSpacing * spacingMultiplier;
}
