/**
 * Constants for Product Details Screen
 * Centralizes magic numbers and configuration values
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PRODUCT_DETAILS_CONFIG = {
  // Layout ratios
  CARD_WIDTH_RATIO: 0.45,
  IMAGE_HEIGHT_RATIO: 1.1,
  
  // Image prefetching
  PREFETCH_IMAGE_COUNT: 2,
  PREFETCH_START_INDEX: 1,
  
  // FlatList optimization
  PAGINATION_THRESHOLD: 50,
  FLATLIST_WINDOW_SIZE: 5,
  MAX_RENDER_PER_BATCH: 3,
  INITIAL_NUM_TO_RENDER: 1,
  
  // Calculated values
  SCREEN_WIDTH,
  CARD_WIDTH: SCREEN_WIDTH * 0.45,
  IMAGE_HEIGHT: SCREEN_WIDTH * 1.1,
} as const;

export const CURRENCY = 'SDG' as const;

export const COLORS = {
  LOADING_INDICATOR: '#f0b745',
  TEXT_DARK: '#1a1a1a',
  ERROR_RED: '#ff4444',
  MODAL_BACKGROUND: 'rgba(0,0,0,0.95)',
  IMAGE_LOADER_OVERLAY: 'rgba(255,255,255,0.6)',
} as const;
