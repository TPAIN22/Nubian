const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// إزالة lightningcss
config.transformer = {
  ...config.transformer,
  minifierPath: 'metro-minify-terser', // بديل lightningcss
};

module.exports = config;
