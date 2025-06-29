import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
  Link: 'Link',
  Stack: {
    Screen: 'Screen',
  },
}));

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetModal: 'BottomSheetModal',
  BottomSheetModalProvider: 'BottomSheetModalProvider',
  BottomSheetView: 'BottomSheetView',
  BottomSheetScrollView: 'BottomSheetScrollView',
  BottomSheetBackdrop: 'BottomSheetBackdrop',
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationHandler: jest.fn(),
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
  brand: 'test',
  manufacturer: 'test',
  modelName: 'test',
  modelId: 'test',
  designName: 'test',
  productName: 'test',
  deviceYearClass: 2020,
  totalMemory: 4096,
  supportedCpuArchitectures: ['arm64'],
  osName: 'iOS',
  osVersion: '15.0',
  osBuildId: 'test',
  osInternalBuildId: 'test',
  deviceName: 'test',
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiUrl: 'https://test-api.com',
    },
  },
  Constants: {
    manifest: {
      extra: {
        apiUrl: 'https://test-api.com',
      },
    },
  },
}));

// Mock i18n
jest.mock('@/utils/i18n', () => ({
  t: jest.fn((key) => key),
  locale: 'en',
  setLocale: jest.fn(),
}));

// Global test setup
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock fetch
global.fetch = jest.fn();

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn().mockReturnValue({
    width: 375,
    height: 812,
    scale: 3,
    fontScale: 1,
  }),
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
})); 