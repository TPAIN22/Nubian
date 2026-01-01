// Dark theme colors
export const darkColors = {
  primary: '#c9a04d',      // Lighter gold for dark mode
  primaryDark: '#8b6f2a',  // Adjusted darker gold
  secondary: '#00a855',    // Brighter green
  accent: '#4ab8c0',       // Brighter teal
  background: '#111e22',   // Dark background (brand color)
  secondaryBackground: '#0d1518',
  surface: '#1a2a2f',      // Dark surface
  cardBackground: '#1f2e33', // Dark card background

  text: {
    primary: '#00a855',     // Brighter green for dark mode
    secondary: '#E5E7EB',   // Light text
    accent: '#c9a04d',      // Gold accent
    white: '#FFFFFF',
    black: '#000000',
    dark: '#9CA3AF',        // Light gray for dark mode
    darkGray: '#6B7280',
    gray: '#D1D5DB',        // Light gray
    mediumGray: '#9CA3AF',
    lightGray: '#6B7280',
    veryLightGray: '#9CA3AF',
  },

  gray: {
    '50': '#1F2937',
    '100': '#374151',
    '200': '#4B5563',
    '300': '#6B7280',
    '400': '#9CA3AF',
    '500': '#D1D5DB',
    '600': '#E5E7EB',
    '700': '#F3F4F6',
    '800': '#F9FAFB',
    '900': '#FFFFFF',
  },

  bottons: {
    btnPrimary: '#c9a04d',
    btnSecondary: '#8b6f2a',
  },

  success: '#22C55E',
  error: '#EF4444',
  warning: '#F97316',
  danger: '#e74c3c',

  border: '#2a3a3f',       // Dark border
  borderLight: '#1f2e33',  // Darker border
  borderMedium: '#2a3a3f',
  borderDark: '#1a2a2f',

  // Common UI colors
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
  overlayDark: 'rgba(0,0,0,0.8)',
  overlayLight: 'rgba(0,0,0,0.3)',
  
  // Specific brand colors
  gold: '#FFD700',
  teal: '#4ab8c0',
  darkBackground: '#111e22', // Brand color
  
  // Status colors
  info: '#4A90E2',
  purple: '#9013FE',
  orange: '#FF6B35',
  cyan: '#50E3C2',
  lime: '#B7E350',
  yellow: '#F5A623',
};

export type DarkColors = typeof darkColors;

