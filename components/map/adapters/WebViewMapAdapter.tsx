/**
 * Map adapter backed by a WebView.
 *
 * Chosen as the default because it is the only option that is genuinely
 * provider-agnostic: it renders any XYZ raster tile source, so switching tile
 * vendors is a backend config change with no app release and no native rebuild.
 * `react-native-webview` is already a dependency, so this adds no native module.
 *
 * A native-SDK adapter can be added later for smoother rendering — it only has
 * to satisfy `MapCanvasProps` / `MapCanvasHandle`. Nothing above this file
 * knows a WebView is involved.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { GeoPoint } from '@/services/geo/types';
import type { MapCanvasHandle, MapCanvasProps } from '../types';
import { trace, traceError } from '../trace';
import { buildMapHtml } from './webviewMapHtml';

export const WebViewMapAdapter = forwardRef<MapCanvasHandle, MapCanvasProps>(
  function WebViewMapAdapter(
    {
      initialCenter,
      initialZoom = 16,
      source,
      isDark = false,
      interactive = true,
      hideAttribution = false,
      onReady,
      onRegionChangeStart,
      onRegionChangeEnd,
      onError,
      testID,
    },
    ref,
  ) {
    const webRef = useRef<WebView>(null);

    /**
     * Built once. Re-rendering the document would reset the user's pan
     * mid-gesture, so every later change (centre, zoom, theme) is sent as a
     * command instead — see `useImperativeHandle` below.
     */
    const html = useMemo(() => {
      // This renderer draws raster tiles. A 'vector' or 'native' source has no
      // tileUrl, and the document falls back to its coordinate-only placeholder
      // rather than rendering a blank grid.
      const tileUrl = source.kind === 'raster' ? (source.tileUrl ?? '') : '';

      trace('webview', 'building document', {
        sourceKind: source.kind,
        tileUrl: tileUrl || '(none — placeholder will render)',
        initialCenter,
        initialZoom,
      });

      return buildMapHtml({
        center: initialCenter,
        zoom: initialZoom,
        tileUrl,
        attribution: hideAttribution ? '' : source.attribution,
        maxZoom: source.maxZoom,
        isDark,
        interactive,
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const send = useCallback((command: Record<string, unknown>) => {
      webRef.current?.injectJavaScript(
        `window.__mapCommand && window.__mapCommand(${JSON.stringify(command)}); true;`,
      );
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        setCenter(center: GeoPoint, options) {
          send({
            type: 'setCenter',
            lat: center.lat,
            lng: center.lng,
            zoom: options?.zoom,
            animate: options?.animate ?? true,
          });
        },
        setZoom(zoom: number) {
          send({ type: 'setZoom', zoom });
        },
        zoomBy(delta: number) {
          send({ type: 'zoomBy', delta });
        },
      }),
      [send],
    );

    // Keep the map's theme in step with the app's without rebuilding the
    // document (which would throw away the user's current pan).
    useEffect(() => {
      send({ type: 'setTheme', isDark });
    }, [isDark, send]);

    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        let payload: any;
        try {
          payload = JSON.parse(event.nativeEvent.data);
        } catch {
          return;
        }

        switch (payload?.type) {
          case 'ready':
            trace('webview', 'map ready ✅');
            onReady?.();
            break;
          case 'moveStart':
            onRegionChangeStart?.();
            break;
          case 'moveEnd':
            if (typeof payload.lat === 'number' && typeof payload.lng === 'number') {
              onRegionChangeEnd?.({ lat: payload.lat, lng: payload.lng }, payload.zoom);
            }
            break;
          case 'error':
            traceError('webview', 'page reported an error', { message: payload.message });
            onError?.(String(payload.message ?? 'map error'));
            break;
          default:
            break;
        }
      },
      [onReady, onRegionChangeStart, onRegionChangeEnd, onError],
    );

    return (
      <View style={styles.container} testID={testID}>
        <WebView
          ref={webRef}
          source={{ html }}
          originWhitelist={['*']}
          style={styles.web}
          // Transparent so the themed background shows through while tiles load,
          // instead of a white flash on a dark screen.
          containerStyle={styles.web}
          javaScriptEnabled
          domStorageEnabled
          // The map is the whole point of the screen; RN must not steal the pan.
          nestedScrollEnabled={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onMessage={handleMessage}
          onError={() => onError?.('map failed to load')}
          onHttpError={() => onError?.('map failed to load')}
          androidLayerType="hardware"
          // The document contains no links or forms, so there is nothing to
          // navigate to. Deliberately no `onShouldStartLoadWithRequest` guard:
          // it fires for the initial in-memory document too (whose URL differs
          // per platform), and getting that predicate subtly wrong blocks the
          // map from ever loading. It would not gate the tile/script
          // subresources anyway — those aren't navigations.
          setSupportMultipleWindows={false}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  web: { flex: 1, backgroundColor: 'transparent' },
});

export default WebViewMapAdapter;
