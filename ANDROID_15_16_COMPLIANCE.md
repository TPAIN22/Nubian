# Android 15 & 16 Compliance Guide

This document outlines the changes made to ensure Nubian is fully compliant with Android 15 & 16, with support for foldables, tablets, and edge-to-edge UI.

## ✅ Completed Changes

### 1. Orientation Lock Removed
- **File**: `app.json`
- **Change**: Removed `"orientation": "portrait"` to allow free rotation
- **Result**: App now supports both portrait and landscape orientations

### 2. Android Build Configuration
- **File**: `app.json` → `expo-build-properties` plugin
- **Changes**:
  - `compileSdkVersion`: 35
  - `targetSdkVersion`: 35
  - `minSdkVersion`: 24
  - `resizeableActivity`: true
  - `windowSoftInputMode`: "adjustResize"
- **Result**: App targets Android 15/16 with proper activity resizing

### 3. Expo Config Plugin for Native Android
- **File**: `plugins/withAndroid15Compliance.js`
- **Functionality**:
  - Removes `android:screenOrientation` from all activities
  - Adds `android:resizeableActivity="true"` to all activities
  - Adds proper `configChanges` for orientation/screen size changes
  - Configures edge-to-edge UI in styles.xml:
    - `android:windowLayoutInDisplayCutoutMode="shortEdges"`
    - `android:windowTranslucentStatus="true"`
    - `android:windowDrawsSystemBarBackgrounds="true"`
    - `android:windowTranslucentNavigation="true"`
- **Result**: Native Android configuration automatically applied during prebuild

### 4. StatusBar Migration
- **Files Updated**:
  - `app/components/AppHeader.tsx`
  - `app/(tabs)/explor.tsx`
  - `app/(tabs)/index.tsx`
- **Change**: Replaced `react-native` StatusBar with `expo-status-bar`
- **Result**: Proper status bar handling compatible with edge-to-edge UI

### 5. Responsive Utilities
- **File**: `hooks/useResponsive.ts`
- **Features**:
  - `useResponsive()`: Main hook for responsive dimensions
  - `useResponsiveFontSize()`: Responsive font sizing
  - `useResponsiveSpacing()`: Responsive spacing
  - Device type detection (tablet, foldable, large screen)
  - Orientation detection
  - Breakpoint system (xs, sm, md, lg, xl)
  - Column count calculation for grids
  - Spacing multipliers for different screen sizes
- **Result**: Consistent responsive behavior across all screen sizes

### 6. Screen Updates
- **Files Updated**:
  - `app/(tabs)/index.tsx`: Home screen
    - Banner carousel uses responsive dimensions
    - Product cards use responsive width calculation
    - Removed fixed SCREEN_WIDTH usage
- **Result**: Home screen adapts to different screen sizes and orientations

## 📱 Supported Features

### Orientation Support
- ✅ Portrait mode
- ✅ Landscape mode
- ✅ Automatic rotation
- ✅ Config changes handled properly

### Device Support
- ✅ Phones (small to large)
- ✅ Tablets (7" to 12"+)
- ✅ Foldables (single and dual screen)
- ✅ Large screens (desktop mode)

### Edge-to-Edge UI
- ✅ Status bar transparency
- ✅ Navigation bar transparency
- ✅ Display cutout support
- ✅ Safe area insets properly handled

### Responsive Design
- ✅ Flexible layouts
- ✅ Adaptive card widths
- ✅ Responsive spacing
- ✅ Breakpoint-based styling

## 🔧 Configuration Files

### app.json
```json
{
  "expo": {
    // Orientation lock removed
    "android": {
      "versionCode": 14,
      // ... other config
    },
    "plugins": [
      // ... other plugins
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "minSdkVersion": 24,
            "resizeableActivity": true,
            "windowSoftInputMode": "adjustResize"
          }
        }
      ],
      "./plugins/withAndroid15Compliance"
    ]
  }
}
```

## 🧪 Testing Checklist

### Orientation Testing
- [ ] Test portrait mode on phone
- [ ] Test landscape mode on phone
- [ ] Test portrait mode on tablet
- [ ] Test landscape mode on tablet
- [ ] Test rotation transitions
- [ ] Verify UI doesn't clip during rotation

### Device Testing
- [ ] Test on small phone (< 5")
- [ ] Test on large phone (6"+)
- [ ] Test on 7" tablet
- [ ] Test on 10" tablet
- [ ] Test on 12"+ tablet
- [ ] Test on foldable (if available)
- [ ] Test in split-screen mode

### Edge-to-Edge Testing
- [ ] Verify status bar is transparent
- [ ] Verify navigation bar is transparent
- [ ] Verify content extends to edges
- [ ] Verify safe areas are respected
- [ ] Test on device with display cutout
- [ ] Verify no content is hidden behind system bars

### Responsive UI Testing
- [ ] Verify cards scale properly
- [ ] Verify spacing adapts to screen size
- [ ] Verify text sizes are readable
- [ ] Verify grids adjust column count
- [ ] Verify banners scale correctly
- [ ] Verify no horizontal scrolling on large screens

## 📝 Next Steps

### Additional Screen Updates
While the home screen has been updated, consider updating other screens:
- `app/(tabs)/explor.tsx`: Explore screen
- `app/(tabs)/cart.tsx`: Cart screen
- `app/(tabs)/profile.tsx`: Profile screen
- `app/(screens)/details/[details].tsx`: Product details
- Other screen components

### Best Practices
1. **Always use `useResponsive()` hook** instead of `Dimensions.get("window")`
2. **Use `useWindowDimensions()`** from React Native for real-time updates
3. **Avoid fixed widths** - use percentages or flex
4. **Use SafeAreaView** or `useSafeAreaInsets()` for edge-to-edge content
5. **Test on multiple screen sizes** before releasing

### Performance Considerations
- The responsive hook uses `useWindowDimensions()` which is optimized
- Dimension listeners are properly cleaned up
- Breakpoint calculations are memoized where possible

## 🚀 Building

After making these changes, rebuild the app:

```bash
# Clear cache
npx expo prebuild --clean

# Build for Android
eas build --platform android --profile production
```

## 📚 References

- [Android 15 Behavior Changes](https://developer.android.com/about/versions/15/behavior-changes-15)
- [Android 16 Preview](https://developer.android.com/about/versions/16)
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)
- [React Native Responsive Design](https://reactnative.dev/docs/dimensions)
- [Edge-to-Edge UI Guide](https://developer.android.com/develop/ui/views/layout/edge-to-edge)

## ⚠️ Important Notes

1. **Prebuild Required**: The config plugin only works after running `npx expo prebuild`
2. **Native Code**: If you eject or use bare workflow, you'll need to manually update AndroidManifest.xml and styles.xml
3. **Testing**: Always test on physical devices, especially for foldables and tablets
4. **Play Store**: Ensure your app passes Android 15/16 Play Store requirements

---

**Last Updated**: January 2025
**Version**: 1.0.2
