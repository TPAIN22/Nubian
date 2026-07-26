/**
 * The map adapter contract.
 *
 * `<MapCanvas>` renders whichever adapter is registered; screens only ever see
 * this interface. Swapping the map engine — to a native SDK, to a different
 * tile vendor, to anything — means writing one new adapter and changing one
 * line in `adapters/index.ts`. No screen changes.
 *
 * Note what is deliberately *not* here: markers, polylines, clustering. The
 * address flow needs exactly one interaction — "pan a map under a fixed centre
 * pin" — and the centre pin is drawn in React Native on top of the canvas, not
 * by the map engine. Keeping the surface this small is what makes a second
 * adapter cheap to write.
 */
import type { GeoConfig, GeoPoint } from '@/services/geo/types';

/**
 * How to render a basemap, described without committing to a rendering
 * technology.
 *
 * Screens never construct this by hand — they call `toMapSource(config)` and
 * pass the result straight through. That keeps raster-vs-vector-vs-native
 * concerns inside the map layer instead of leaking a `tileUrl` prop (a
 * raster-only idea) into screen code, where it would be meaningless to a native
 * SDK adapter.
 *
 * An adapter uses the fields it understands and ignores the rest:
 *   - a raster adapter reads `tileUrl`
 *   - a vector adapter reads `styleUrl`
 *   - a native-SDK adapter ignores both and uses the platform basemap
 */
export interface MapSource {
  /**
   * What the backend's configured provider can offer.
   *   'raster' — XYZ tile template available
   *   'vector' — vector style URL available
   *   'native' — no URL; the renderer supplies its own basemap
   *   'none'   — no basemap at all; render a coordinate-only placeholder
   */
  kind: 'raster' | 'vector' | 'native' | 'none';
  tileUrl: string | null;
  styleUrl: string | null;
  attribution: string;
  maxZoom: number;
  /** Provider key, for diagnostics only. Never branch business logic on this. */
  provider: string;
}

/**
 * Derive a renderer-neutral source from the backend's map config.
 *
 * This is the single place that decides how a provider's capabilities map onto
 * a rendering strategy, which is exactly the decision that must not be spread
 * across screens.
 */
export const toMapSource = (config: GeoConfig): MapSource => {
  // The server states the strategy; the URLs are just the payload for it.
  // Falling back to URL-sniffing keeps this working against an older backend
  // that predates the `basemap` field.
  const kind: MapSource['kind'] =
    config.basemap ??
    (config.styleUrl ? 'vector' : config.tileUrl ? 'raster' : 'none');

  return {
    kind,
    tileUrl: config.tileUrl,
    styleUrl: config.styleUrl,
    attribution: config.attribution,
    maxZoom: config.maxZoom,
    provider: config.provider,
  };
};

export interface MapCanvasHandle {
  /** Recentre the map. `animate` pans smoothly; otherwise it jumps. */
  setCenter(center: GeoPoint, options?: { zoom?: number; animate?: boolean }): void;
  /** Absolute zoom level. */
  setZoom(zoom: number): void;
  /** Nudge zoom by ±1, respecting the provider's limits. */
  zoomBy(delta: number): void;
}

export interface MapCanvasProps {
  /** Where the map starts. Later changes are ignored — drive movement via the ref. */
  initialCenter: GeoPoint;
  initialZoom?: number;

  /** Renderer-neutral basemap descriptor. Build it with `toMapSource`. */
  source: MapSource;

  /** Match the app's dark mode. */
  isDark?: boolean;

  /** Fired once the map engine is interactive. */
  onReady?: () => void;
  /** Fired when the user starts panning/zooming — used to hide the stale address. */
  onRegionChangeStart?: () => void;
  /**
   * Fired when the map settles. This is the debounce trigger for reverse
   * geocoding: the centre of the viewport is the selected location.
   */
  onRegionChangeEnd?: (center: GeoPoint, zoom: number) => void;
  /** Fired when the engine cannot load (no tiles, no network, bad config). */
  onError?: (message: string) => void;

  /** Disable interaction — used for read-only previews on address cards. */
  interactive?: boolean;
  /** Hide the attribution overlay. Only for thumbnails that show it elsewhere. */
  hideAttribution?: boolean;

  testID?: string;
}
