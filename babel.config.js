module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }]
    ],
    plugins: [
      // إزالة console.log في الإنتاج
      process.env.NODE_ENV === 'production' && [
        'transform-remove-console',
        { exclude: ['error', 'warn'] }
      ],
      // تحسين imports
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './app/components',
            '@assets': './assets',
            '@utils': './utils',
            '@store': './store',
            'tailwind.config': './tailwind.config.js'
          }
        }
      ],
      // تحسين React Native
      'react-native-reanimated/plugin'
    ].filter(Boolean)
  };
};