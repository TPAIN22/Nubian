/**
 * Map renderer backed by the platform's native map SDK (`react-native-maps`).
 *
 * This is the default renderer. It handles both basemap strategies the backend
 * can ask for:
 *
 *   source.kind === 'native' — use the platform basemap (Google Maps on
 *     Android, and on iOS too when a Google Maps key is configured). Required
 *     when the geocoding provider's tiles are only licensed through its own
 *     SDK, which is also what keeps Places/Geocoding results off a competitor's
 *     basemap.
 *
 *   source.kind === 'raster' — draw the XYZ tiles the backend supplied on top
 *     of a blank base, so a tile-serving provider works here too and switching
 *     provider still needs no app change.
 *
 * Everything above this file — screens, hooks, the centre pin — is unchanged
 * from the WebView renderer. That was the point of the adapter contract.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE, UrlTile, type Region } from 'react-native-maps';
import type { GeoPoint } from '@/services/geo/types';
import type { MapCanvasHandle, MapCanvasProps } from '../types';
import { trace, traceError } from '../trace';

/**
 * How long to wait for `onMapReady` before assuming it will never arrive.
 *
 * On Android the native SDK stays silent when it cannot initialise — most often
 * a missing or wrongly-restricted Maps API key. Without this the screen waits
 * forever behind its loading veil, which reads to the user as "the map didn't
 * open".
 */
const READY_TIMEOUT_MS = 6000;

/**
 * Convert a zoom level to a latitude span, and back.
 *
 * `react-native-maps` speaks in deltas, the rest of the app speaks in slippy
 * zoom levels. 360° of longitude spans 2^zoom tiles, so a viewport covers
 * 360 / 2^zoom degrees — close enough for a picker, where the exact span only
 * has to feel right.
 */
const zoomToDelta = (zoom: number) => 360 / 2 ** zoom;
const deltaToZoom = (delta: number) => Math.log2(360 / Math.max(delta, 1e-9));

export const NativeMapAdapter = forwardRef<MapCanvasHandle, MapCanvasProps>(
  function NativeMapAdapter(
    {
      initialCenter,
      initialZoom = 16,
      source,
      isDark = false,
      interactive = true,
      onReady,
      onRegionChangeStart,
      onRegionChangeEnd,
      // Accepted for contract parity but never emitted: the native SDK has no
      // load-failure callback. A missing basemap surfaces as a blank map, and
      // the picker stays usable because the pin — not the tiles — is what gets
      // saved. The WebView renderer, which *can* detect dead tiles, does emit it.
      onError: _onError,
      testID,
    },
    ref,
  ) {
    const mapRef = useRef<MapView>(null);
    const [zoom, setZoom] = useState(initialZoom);
    const readyRef = useRef(false);

    /**
     * Ask for Google's basemap when the backend says the provider is native.
     * On Android that is the only option anyway; on iOS it requires a Google
     * Maps key and otherwise falls back to Apple Maps, which is still a valid
     * native basemap.
     */
    const provider =
      source.kind === 'native' && Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

    useEffect(() => {
      trace('native', 'mount', {
        platform: Platform.OS,
        provider: provider === PROVIDER_GOOGLE ? 'google' : 'default',
        sourceKind: source.kind,
        tileUrl: source.tileUrl,
        initialCenter,
        initialZoom,
      });

      // Report the silent-failure case rather than leaving the screen hanging.
      const timer = setTimeout(() => {
        if (readyRef.current) return;

        traceError(
          'native',
          `onMapReady did not fire within ${READY_TIMEOUT_MS}ms — the native map likely failed to initialise`,
          {
            platform: Platform.OS,
            provider: provider === PROVIDER_GOOGLE ? 'google' : 'default',
            likelyCauses: [
              'Maps SDK API key missing (GOOGLE_MAPS_ANDROID_API_KEY / GOOGLE_MAPS_IOS_API_KEY)',
              'key not restricted to this package/bundle id + SHA-1',
              'Maps SDK for Android/iOS not enabled on the key',
              'running in Expo Go (native module absent) — set EXPO_PUBLIC_MAP_RENDERER=webview',
              'build predates `expo prebuild` after react-native-maps was added',
            ],
          },
        );

        // Unblock the screen anyway. A blank basemap the user can still pan and
        // save a pin on beats an indefinite spinner.
        onReady?.();
      }, READY_TIMEOUT_MS);

      return () => clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleMapReady = useCallback(() => {
      readyRef.current = true;
      trace('native', 'onMapReady ✅');
      onReady?.();
    }, [onReady]);

    const initialRegion = useMemo<Region>(() => {
      const delta = zoomToDelta(initialZoom);
      return {
        latitude: initialCenter.lat,
        longitude: initialCenter.lng,
        latitudeDelta: delta,
        longitudeDelta: delta,
      };
    }, [initialCenter, initialZoom]);

    const animateTo = useCallback((center: GeoPoint, nextZoom: number, animate: boolean) => {
      const delta = zoomToDelta(nextZoom);
      const region: Region = {
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: delta,
        longitudeDelta: delta,
      };

      if (animate) {
        mapRef.current?.animateToRegion(region, 500);
      } else {
        // `setNativeProps` isn't supported for region on all platforms; a
        // zero-duration animation is the portable way to jump.
        mapRef.current?.animateToRegion(region, 0);
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        setCenter(center, options) {
          const nextZoom = options?.zoom ?? zoom;
          setZoom(nextZoom);
          animateTo(center, nextZoom, options?.animate ?? true);
        },
        setZoom(nextZoom) {
          setZoom(nextZoom);
          mapRef.current?.getCamera().then((camera) => {
            if (!camera?.center) return;
            animateTo({ lat: camera.center.latitude, lng: camera.center.longitude }, nextZoom, true);
          });
        },
        zoomBy(delta) {
          const nextZoom = Math.min(source.maxZoom, Math.max(1, zoom + delta));
          setZoom(nextZoom);
          mapRef.current?.getCamera().then((camera) => {
            if (!camera?.center) return;
            animateTo({ lat: camera.center.latitude, lng: camera.center.longitude }, nextZoom, true);
          });
        },
      }),
      [animateTo, zoom, source.maxZoom],
    );

    const firstRegionRef = useRef(true);

    const handleRegionChangeComplete = useCallback(
      (region: Region) => {
        const nextZoom = deltaToZoom(region.longitudeDelta);
        setZoom(nextZoom);

        if (firstRegionRef.current) {
          firstRegionRef.current = false;
          trace('native', 'first region settled — the map is live', {
            lat: region.latitude,
            lng: region.longitude,
            zoom: Number(nextZoom.toFixed(2)),
          });
        }

        // The centre of the viewport is the selected point — the pin is drawn
        // over the middle of the canvas and never moves.
        onRegionChangeEnd?.({ lat: region.latitude, lng: region.longitude }, nextZoom);
      },
      [onRegionChangeEnd],
    );

    return (
      <View style={styles.container} testID={testID}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={provider}
          initialRegion={initialRegion}
          onMapReady={handleMapReady}
          onRegionChange={onRegionChangeStart}
          onRegionChangeComplete={handleRegionChangeComplete}
          // The app draws its own pin and chrome; the SDK's controls would
          // collide with them.
          showsUserLocation={interactive}
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
          scrollEnabled={interactive}
          zoomEnabled={interactive}
          rotateEnabled={false}
          pitchEnabled={false}
          // A double-tap that zooms fights the "tap to confirm" affordance
          // sitting above the map.
          moveOnMarkerPress={false}
          userInterfaceStyle={isDark ? 'dark' : 'light'}
          maxZoomLevel={source.maxZoom}
        >
          {/* Provider supplies tiles rather than a basemap: draw them over the
              blank base so a tile-serving provider works with this renderer too. */}
          {source.kind === 'raster' && source.tileUrl ? (
            <UrlTile urlTemplate={source.tileUrl} maximumZ={source.maxZoom} zIndex={-1} />
          ) : null}
        </MapView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  map: { flex: 1 },
});

export default NativeMapAdapter;
