/**
 * Dynamic Expo config.
 *
 * Everything static still lives in `app.json`; this file only layers in values
 * that must not be committed — the native Maps SDK keys.
 *
 * These are *client* keys: they ship inside the app binary and are extractable
 * from it, so they are not secret in the way the server-side geocoding key is.
 * They must instead be **restricted in Google Cloud Console** by Android
 * package name + SHA-1 signing certificate, and by iOS bundle identifier.
 * Keeping them out of git is still worth it — it stops an unrestricted key
 * leaking from the repo, and lets each build environment use its own.
 *
 * Required env (EAS: set as secrets; local: .env):
 *   GOOGLE_MAPS_ANDROID_API_KEY
 *   GOOGLE_MAPS_IOS_API_KEY
 *
 * Without them the app still builds and runs: Android falls back to a blank
 * basemap and iOS to Apple Maps, and the picker keeps working because the pin
 * and coordinates — not the tiles — are what get saved.
 *
 * Note this is the *rendering* key. The geocoding key is server-side only
 * (`GEO_GOOGLE_API_KEY` in the backend) and never reaches the app.
 */
const appJson = require('./app.json');

module.exports = ({ config }) => {
  const base = { ...appJson.expo, ...config };

  const androidMapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY || '';
  const iosMapsKey = process.env.GOOGLE_MAPS_IOS_API_KEY || '';

  return {
    ...base,

    android: {
      ...base.android,
      config: {
        ...base.android?.config,
        // Omit the block entirely when unset — an empty string is worse than
        // absent here, because the SDK treats it as a real (invalid) key.
        ...(androidMapsKey ? { googleMaps: { apiKey: androidMapsKey } } : {}),
      },
    },

    ios: {
      ...base.ios,
      config: {
        ...base.ios?.config,
        ...(iosMapsKey ? { googleMapsApiKey: iosMapsKey } : {}),
      },
    },
  };
};
