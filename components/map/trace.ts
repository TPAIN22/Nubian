/**
 * Map/geo diagnostic tracing.
 *
 * Every log is prefixed `[map:<scope>]`, so the whole flow can be isolated in
 * Metro, Xcode or logcat with a single filter:
 *
 *   npx react-native log-android | grep "\[map:"
 *   adb logcat -s ReactNativeJS:V | grep "\[map:"
 *
 * `trace` is stripped from production builds two ways over: it early-returns on
 * `__DEV__`, and `babel-plugin-transform-remove-console` drops `console.log`
 * entirely when NODE_ENV=production.
 *
 * `traceError` uses `console.warn`, which that Babel plugin deliberately keeps —
 * a map that fails to initialise in production is something we want in a crash
 * report, not silence.
 */

const stamp = () => {
  const now = new Date();
  return `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
};

export type TraceScope =
  | 'config'      // fetching /api/geo/config
  | 'renderer'    // which adapter was selected and why
  | 'native'      // NativeMapAdapter lifecycle
  | 'webview'     // WebViewMapAdapter lifecycle
  | 'picker'      // the location-picker screen's own state machine
  | 'gps'         // device location + permissions
  | 'geocode';    // reverse geocoding / search

export const trace = (scope: TraceScope, event: string, data?: unknown) => {
  if (!__DEV__) return;
  if (data === undefined) {
    console.log(`[map:${scope}] ${stamp()} ${event}`);
  } else {
    console.log(`[map:${scope}] ${stamp()} ${event}`, data);
  }
};

/** Survives production stripping — use for genuine failures only. */
export const traceError = (scope: TraceScope, event: string, data?: unknown) => {
  if (data === undefined) {
    console.warn(`[map:${scope}] ${event}`);
  } else {
    console.warn(`[map:${scope}] ${event}`, data);
  }
};
