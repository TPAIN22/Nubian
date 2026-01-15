module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }]
    ],
    plugins: [
      // تحسين imports
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './components/app',
            '@assets': './assets',
            '@utils': './utils',
            '@store': './store',
            'tailwind.config': './tailwind.config.js'
          }
        }
      ],
      // إزالة console.log في الإنتاج
      ...(process.env.NODE_ENV === 'production' ? [[
        'transform-remove-console',
        { exclude: ['error', 'warn'] }
      ]] : []),
      // react-native-reanimated plugin MUST be last - do not move this!
      'react-native-reanimated/plugin'
    ]
  };
};