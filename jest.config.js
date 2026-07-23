module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  // Coverage is enforced only on modules that have a dedicated test suite.
  // Add a source file here when its tests land so the 70% threshold below
  // applies meaningfully instead of being diluted by untested screens.
  collectCoverageFrom: [
    'components/cart/cartErrors.ts',
    'components/cart/cartFeedback.ts',
    'domain/pricing/pricing.engine.ts',
    'store/addressStore.ts',
    'store/orderStore.ts',
    'utils/apiError.ts',
    'utils/computePricing.ts',
    'utils/performance.ts',
    'utils/phoneValidator.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  clearMocks: true,
  restoreMocks: true,
}; 