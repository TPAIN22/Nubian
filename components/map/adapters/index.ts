/**
 * Map renderer registry.
 *
 * The app's map rendering technology is a **swappable implementation detail**.
 * Screens import `<MapCanvas>`; only this file knows what actually draws.
 *
 * ## Adding a native renderer
 *
 * The WebView renderer is the current default because it needs no native
 * module and renders whatever tile source the backend is configured with. When
 * a native renderer is wanted (better frame rate, offline tiles, platform
 * basemaps), the whole change is:
 *
 *   1. Add `NativeMapAdapter.tsx` here implementing `MapCanvasProps` /
 *      `MapCanvasHandle` — around 120 lines wrapping the native MapView:
 *        - `initialCenter` / `initialZoom` → initial camera
 *        - `onRegionChangeStart` / `onRegionChangeEnd` → region callbacks,
 *          reporting the **centre** of the viewport (that is the selected point)
 *        - `setCenter` / `setZoom` / `zoomBy` via `useImperativeHandle`
 *        - `source.kind === 'native'` → ignore the URLs, use the platform basemap
 *   2. Register it in `MAP_RENDERERS` below.
 *   3. Change `ACTIVE_MAP_RENDERER`.
 *
 * No screen, hook, store, or backend change. `CenterPin` already renders in
 * React Native above the canvas, so it works unchanged with any renderer.
 *
 * Nothing else in the app may import an adapter directly — that is what keeps
 * this a one-line swap.
 */
import type { ComponentType, ForwardRefExoticComponent, RefAttributes } from 'react';
import type { MapCanvasHandle, MapCanvasProps } from '../types';
import { WebViewMapAdapter } from './WebViewMapAdapter';

export type MapRendererComponent = ForwardRefExoticComponent<
  MapCanvasProps & RefAttributes<MapCanvasHandle>
> &
  ComponentType<any>;

export const MAP_RENDERERS = {
  /**
   * Draws raster tiles inside a WebView. No native module, so the tile vendor
   * is chosen by the backend at runtime and changing it needs no app release.
   */
  webview: WebViewMapAdapter as MapRendererComponent,

  // native: NativeMapAdapter,  ← see the header comment
} as const;

export type MapRendererKey = keyof typeof MAP_RENDERERS;

const DEFAULT_RENDERER: MapRendererKey = 'webview';

/**
 * Renderer selection.
 *
 * Read from `EXPO_PUBLIC_MAP_RENDERER` so a build can switch renderers (or a
 * QA build can A/B them) without a code edit, falling back to the default when
 * unset or unknown. Resolved once at module load — the renderer must not change
 * mid-session, which would remount the map and lose the user's pan.
 */
const resolveRenderer = (): MapRendererKey => {
  const configured = process.env.EXPO_PUBLIC_MAP_RENDERER;
  if (configured && configured in MAP_RENDERERS) {
    return configured as MapRendererKey;
  }
  return DEFAULT_RENDERER;
};

export const ACTIVE_MAP_RENDERER: MapRendererKey = resolveRenderer();

/**
 * Deprecated aliases kept so nothing breaks if an import lingers.
 * Prefer the `*_RENDERER` names — "adapter" is overloaded in this codebase
 * (the backend geo providers are also adapters).
 */
export const MAP_ADAPTERS = MAP_RENDERERS;
export const ACTIVE_MAP_ADAPTER = ACTIVE_MAP_RENDERER;
export type MapAdapterKey = MapRendererKey;
