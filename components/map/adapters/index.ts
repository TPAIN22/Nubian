/**
 * Map renderer registry.
 *
 * The app's map rendering technology is a **swappable implementation detail**.
 * Screens import `<MapCanvas>`; only this file knows what actually draws.
 *
 * ## The two renderers
 *
 * `native` (default) — `react-native-maps`. Uses the platform basemap when the
 *   backend reports `basemap: 'native'`, and draws the backend's XYZ tiles when
 *   it reports `'raster'`. Best frame rate, and the only compliant way to show
 *   a provider whose tiles are licensed solely through its own SDK.
 *
 * `webview` — Leaflet in a WebView. No native module, so it works in Expo Go
 *   and on web, and renders any XYZ tile source. Kept as the fallback and as
 *   the escape hatch if the native module ever misbehaves in a build.
 *
 * Both satisfy the same `MapCanvasProps` / `MapCanvasHandle` contract, so
 * switching is a one-line change here with no screen, hook, store or backend
 * change. `CenterPin` renders in React Native above the canvas, so it is
 * unaffected either way.
 *
 * Nothing else in the app may import a renderer directly — that is what keeps
 * this a one-line swap.
 */
import { Platform } from 'react-native';
import type { ComponentType, ForwardRefExoticComponent, RefAttributes } from 'react';
import type { MapCanvasHandle, MapCanvasProps } from '../types';
import { trace, traceError } from '../trace';
import { NativeMapAdapter } from './NativeMapAdapter';
import { WebViewMapAdapter } from './WebViewMapAdapter';

export type MapRendererComponent = ForwardRefExoticComponent<
  MapCanvasProps & RefAttributes<MapCanvasHandle>
> &
  ComponentType<any>;

export const MAP_RENDERERS = {
  /** Native platform map SDK. Handles both native and raster basemaps. */
  native: NativeMapAdapter as MapRendererComponent,

  /**
   * Leaflet in a WebView. No native module, so it works in Expo Go and on web,
   * and renders any XYZ tile source.
   */
  webview: WebViewMapAdapter as MapRendererComponent,
} as const;

export type MapRendererKey = keyof typeof MAP_RENDERERS;

/**
 * Renderer selection.
 *
 * `react-native-maps` has no web implementation, so web always gets the WebView
 * renderer. Everywhere else defaults to native, overridable per build via
 * `EXPO_PUBLIC_MAP_RENDERER` (useful for Expo Go, where the native module is
 * unavailable, and for isolating a native-module problem without a code change).
 *
 * Resolved once at module load — the renderer must not change mid-session,
 * which would remount the map and lose the user's pan.
 */
const resolveRenderer = (): MapRendererKey => {
  const configured = process.env.EXPO_PUBLIC_MAP_RENDERER;

  if (configured && configured in MAP_RENDERERS) {
    trace('renderer', `selected "${configured}" from EXPO_PUBLIC_MAP_RENDERER`);
    return configured as MapRendererKey;
  }

  if (configured) {
    traceError(
      'renderer',
      `EXPO_PUBLIC_MAP_RENDERER="${configured}" is not a known renderer; falling back`,
      { known: Object.keys(MAP_RENDERERS) },
    );
  }

  const resolved: MapRendererKey = Platform.OS === 'web' ? 'webview' : 'native';

  trace('renderer', `selected "${resolved}"`, {
    platform: Platform.OS,
    // `native` needs the react-native-maps native module, which is absent in
    // Expo Go and in any build made before it was added. That is the single
    // most common reason the map renders blank.
    nativeModuleLinked: resolved === 'native' ? isNativeMapLinked() : 'n/a',
  });

  return resolved;
};

/**
 * Whether the native map module is actually present in this binary.
 *
 * Importing `react-native-maps` succeeds even in Expo Go — it fails later, at
 * render, when the native view is requested. Probing here turns a confusing
 * blank screen into an explicit log line.
 */
function isNativeMapLinked(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maps = require('react-native-maps');
    return Boolean(maps?.default);
  } catch {
    return false;
  }
}

export const ACTIVE_MAP_RENDERER: MapRendererKey = resolveRenderer();

/**
 * Deprecated aliases kept so nothing breaks if an import lingers.
 * Prefer the `*_RENDERER` names — "adapter" is overloaded in this codebase
 * (the backend geo providers are also adapters).
 */
export const MAP_ADAPTERS = MAP_RENDERERS;
export const ACTIVE_MAP_ADAPTER = ACTIVE_MAP_RENDERER;
export type MapAdapterKey = MapRendererKey;
