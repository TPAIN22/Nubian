// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Enforce the single themed Text component (Cairo font + theme aware).
    // Importing `Text` straight from react-native renders in the system font
    // and bypasses RTL/typography — use "@/components/ui/text" instead.
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{
          name: "react-native",
          importNames: ["Text"],
          message: 'Use the themed Text from "@/components/ui/text" (Cairo + theme aware) instead of react-native Text.',
        }],
      }],
    },
  },
  {
    // The UI primitives legitimately wrap the platform Text.
    files: ["**/components/ui/**"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
]);
