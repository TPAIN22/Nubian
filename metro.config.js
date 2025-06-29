const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname);

// حل مشكلة store.clear
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// تعطيل الكاش المؤقت لحل المشكلة
config.cacheStores = [];

// إعدادات إضافية لحل مشاكل التوافق
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// تحسين تحميل الصور
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

// تحسين minifier
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
    toplevel: true,
  },
  compress: {
    drop_console: process.env.NODE_ENV === 'production',
    drop_debugger: process.env.NODE_ENV === 'production',
    pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log'] : [],
  },
};

// تجاهل ملفات معينة من الباندل
config.resolver.blockList = [
  /.*\/node_modules\/.*\/node_modules\/react-native\/.*/,
  /.*\/__tests__\/.*/,
  /.*\/\.(test|spec)\.(js|jsx|ts|tsx)$/,
];

// تحسين resolver
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// تحسين transformer
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = withNativeWind(config, { input: './app/global.css' });