# Fix for react-native-reanimated useWorkletCallback Error

## Problem
The error `useWorkletCallback is not a function` occurs because `react-native-reanimated` native modules need to be rebuilt in your development build.

## Solution

### Option 1: Rebuild Development Build (Recommended)

Since you're using Expo with a development build, you need to rebuild the native app:

**For Android:**
```bash
npx expo run:android
```

**For iOS:**
```bash
npx expo run:ios
```

### Option 2: Clear Cache and Restart (Quick Fix - May Work)

1. Stop the current Metro bundler (Ctrl+C)
2. Clear all caches:
```bash
# Clear Metro cache
npx expo start --clear

# Clear watchman (if installed)
watchman watch-del-all

# Clear node modules and reinstall (if needed)
rm -rf node_modules
npm install
```

3. Restart the bundler:
```bash
npx expo start --clear
```

### Option 3: Verify Configuration

Make sure your `babel.config.js` has the reanimated plugin **last**:
```javascript
plugins: [
  // ... other plugins
  'react-native-reanimated/plugin' // MUST be last
]
```

And your `app/_layout.tsx` imports reanimated at the **very top**:
```typescript
import 'react-native-reanimated'; // Must be first import
```

## Why This Happens

`react-native-reanimated` requires native code compilation. When you install it or update it, the native modules need to be rebuilt. In Expo development builds, this requires running `expo run:android` or `expo run:ios`.

## Current Setup Status

✅ Reanimated is imported correctly in `app/_layout.tsx`
✅ Babel plugin is configured correctly
✅ Dependencies are installed

⚠️ Native modules need to be rebuilt

## Next Steps

1. Stop the current Metro bundler
2. Run `npx expo run:android` (or `npx expo run:ios` for iOS)
3. Wait for the build to complete
4. The app should launch automatically with the fixed native modules
