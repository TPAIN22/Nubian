const { withAndroidManifest, withAndroidStyles } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for Android 15 & 16 Compliance
 * - Removes orientation lock
 * - Enables edge-to-edge UI
 * - Adds large screen support
 * - Configures window insets
 */
const withAndroid15Compliance = (config) => {
  // Update AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const { manifest: manifestData } = manifest;

    if (!manifestData.application) {
      return config;
    }

    const application = manifestData.application[0];
    if (!application.activity) {
      return config;
    }

    // Remove orientation lock from all activities
    application.activity.forEach((activity) => {
      if (activity.$) {
        // Remove screenOrientation attribute
        delete activity.$['android:screenOrientation'];
        // Add resizeableActivity
        activity.$['android:resizeableActivity'] = 'true';
        // Add configChanges for orientation changes
        if (activity.$['android:configChanges']) {
          const configChanges = activity.$['android:configChanges'].split('|');
          if (!configChanges.includes('orientation')) {
            configChanges.push('orientation');
          }
          if (!configChanges.includes('screenSize')) {
            configChanges.push('screenSize');
          }
          if (!configChanges.includes('screenLayout')) {
            configChanges.push('screenLayout');
          }
          activity.$['android:configChanges'] = configChanges.join('|');
        } else {
          activity.$['android:configChanges'] = 'orientation|screenSize|screenLayout|keyboardHidden|uiMode';
        }
      }
    });

    return config;
  });

  // Update styles.xml for edge-to-edge and large screen support
  config = withAndroidStyles(config, (config) => {
    const styles = config.modResults;

    // Find or create the main theme
    if (!styles.resources || !styles.resources.style) {
      return config;
    }

    const stylesArray = Array.isArray(styles.resources.style)
      ? styles.resources.style
      : [styles.resources.style];

    stylesArray.forEach((style) => {
      if (style.$ && style.$.name && style.$.name.includes('Theme')) {
        // Add edge-to-edge and large screen attributes
        if (!style.item) {
          style.item = [];
        }

        const items = Array.isArray(style.item) ? style.item : [style.item];

        // Check if items already exist
        const hasWindowLayoutInDisplayCutout = items.some(
          (item) => item.$ && item.$.name === 'android:windowLayoutInDisplayCutoutMode'
        );
        const hasWindowTranslucentStatus = items.some(
          (item) => item.$ && item.$.name === 'android:windowTranslucentStatus'
        );
        const hasWindowDrawsSystemBarBackgrounds = items.some(
          (item) => item.$ && item.$.name === 'android:windowDrawsSystemBarBackgrounds'
        );
        const hasWindowTranslucentNavigation = items.some(
          (item) => item.$ && item.$.name === 'android:windowTranslucentNavigation'
        );

        // Add windowLayoutInDisplayCutoutMode for edge-to-edge
        if (!hasWindowLayoutInDisplayCutout) {
          items.push({
            $: {
              name: 'android:windowLayoutInDisplayCutoutMode',
            },
            _: 'shortEdges',
          });
        }

        // Add windowTranslucentStatus
        if (!hasWindowTranslucentStatus) {
          items.push({
            $: {
              name: 'android:windowTranslucentStatus',
            },
            _: 'true',
          });
        }

        // Add windowDrawsSystemBarBackgrounds
        if (!hasWindowDrawsSystemBarBackgrounds) {
          items.push({
            $: {
              name: 'android:windowDrawsSystemBarBackgrounds',
            },
            _: 'true',
          });
        }

        // Add windowTranslucentNavigation for edge-to-edge
        if (!hasWindowTranslucentNavigation) {
          items.push({
            $: {
              name: 'android:windowTranslucentNavigation',
            },
            _: 'true',
          });
        }

        style.item = items;
      }
    });

    return config;
  });

  return config;
};

module.exports = withAndroid15Compliance;
