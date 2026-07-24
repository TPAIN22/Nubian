/**
 * The HTML document backing the WebView map adapter.
 *
 * Kept in its own module (rather than inline in the component) so the JS inside
 * stays readable and so the RN ↔ WebView message protocol has one obvious home.
 *
 * ## Protocol
 *
 * RN → page, via `injectJavaScript('window.__mapCommand({...})')`:
 *   { type: 'setCenter', lat, lng, zoom?, animate? }
 *   { type: 'setZoom',   zoom }
 *   { type: 'zoomBy',    delta }
 *   { type: 'setTheme',  isDark }
 *
 * page → RN, via `ReactNativeWebView.postMessage(JSON.stringify(...))`:
 *   { type: 'ready' }
 *   { type: 'moveStart' }
 *   { type: 'moveEnd', lat, lng, zoom }
 *   { type: 'error',   message }
 */

export interface MapHtmlOptions {
  center: { lat: number; lng: number };
  zoom: number;
  tileUrl: string;
  attribution: string;
  maxZoom: number;
  isDark: boolean;
  interactive: boolean;
}

/**
 * Leaflet, pinned to an exact version and loaded from a CDN.
 *
 * Pinned rather than floating: a map that silently changes behaviour under a
 * released app is not something we can debug from here.
 */
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

export const buildMapHtml = (options: MapHtmlOptions): string => {
  // Everything the page needs is injected as one JSON blob — no string
  // interpolation into executable positions, so a hostile attribution string
  // or tile URL can't become script.
  const config = JSON.stringify(options);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="${LEAFLET_CSS}" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
    body { background: #e9e5dd; overflow: hidden; }
    body.dark { background: #1a1d1f; }

    /* The pin lives in React Native, on top of this view. Leaflet's own
       controls would fight with the app's chrome, so they are all removed. */
    .leaflet-control-container .leaflet-top,
    .leaflet-control-container .leaflet-control-zoom { display: none; }

    .leaflet-control-attribution {
      font-size: 9px;
      background: rgba(255,255,255,0.7);
      padding: 1px 4px;
    }
    body.dark .leaflet-control-attribution {
      background: rgba(0,0,0,0.5);
      color: #cbd5e1;
    }
    body.dark .leaflet-control-attribution a { color: #94a3b8; }

    /* Tint raster tiles for dark mode. Not a true dark basemap — a real one
       needs a dark tile source — but it stops the map searing the user's eyes
       at night, and it costs nothing. */
    body.dark .leaflet-tile-pane {
      filter: invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.92) saturate(0.7);
    }

    #fallback {
      position: absolute; inset: 0; display: none;
      align-items: center; justify-content: center;
      font: 500 13px -apple-system, Roboto, sans-serif;
      color: #6b7280; text-align: center; padding: 24px;
    }
    body.no-tiles #fallback { display: flex; }
  </style>
</head>
<body class="${options.isDark ? 'dark' : ''}">
  <div id="map"></div>
  <div id="fallback">Map unavailable — your pin is still saved from the coordinates.</div>
  <script src="${LEAFLET_JS}"></script>
  <script>
    (function () {
      var CONFIG = ${config};

      function post(payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      window.onerror = function (message) {
        post({ type: 'error', message: String(message) });
      };

      if (typeof L === 'undefined') {
        document.body.classList.add('no-tiles');
        post({ type: 'error', message: 'map engine failed to load' });
        return;
      }

      var map = L.map('map', {
        center: [CONFIG.center.lat, CONFIG.center.lng],
        zoom: CONFIG.zoom,
        zoomControl: false,
        attributionControl: true,
        // Pinch/drag only; a double-tap that zooms fights the "tap to confirm"
        // affordance sitting above the map.
        doubleClickZoom: false,
        dragging: CONFIG.interactive,
        touchZoom: CONFIG.interactive,
        scrollWheelZoom: CONFIG.interactive,
        tap: CONFIG.interactive,
        keyboard: false,
        // Leaflet's inertia overshoots on a fixed-centre picker: the pin keeps
        // drifting after the finger lifts, so the address the user confirms is
        // not the one they aimed at.
        inertia: false
      });

      if (CONFIG.tileUrl) {
        var tiles = L.tileLayer(CONFIG.tileUrl, {
          maxZoom: CONFIG.maxZoom,
          attribution: CONFIG.attribution,
          crossOrigin: true
        });

        var tileErrors = 0;
        tiles.on('tileerror', function () {
          tileErrors += 1;
          // One dead tile at the edge of the world is normal; a wall of them
          // means the tile source is unreachable and the user deserves to know.
          if (tileErrors === 8) {
            document.body.classList.add('no-tiles');
            post({ type: 'error', message: 'tiles unavailable' });
          }
        });

        tiles.addTo(map);
      } else {
        document.body.classList.add('no-tiles');
      }

      map.on('movestart zoomstart', function () { post({ type: 'moveStart' }); });

      map.on('moveend zoomend', function () {
        var c = map.getCenter();
        post({ type: 'moveEnd', lat: c.lat, lng: c.lng, zoom: map.getZoom() });
      });

      window.__mapCommand = function (command) {
        try {
          if (command.type === 'setCenter') {
            var zoom = typeof command.zoom === 'number' ? command.zoom : map.getZoom();
            var target = [command.lat, command.lng];
            if (command.animate) {
              map.flyTo(target, zoom, { duration: 0.6 });
            } else {
              map.setView(target, zoom, { animate: false });
            }
          } else if (command.type === 'setZoom') {
            map.setZoom(command.zoom);
          } else if (command.type === 'zoomBy') {
            map.setZoom(map.getZoom() + command.delta);
          } else if (command.type === 'setTheme') {
            document.body.classList.toggle('dark', !!command.isDark);
          }
        } catch (err) {
          post({ type: 'error', message: String(err) });
        }
      };

      // Leaflet measures the container on init; inside a WebView that can
      // happen before RN has laid the view out, leaving a 0×0 map.
      setTimeout(function () { map.invalidateSize(); post({ type: 'ready' }); }, 60);
    })();
  </script>
</body>
</html>`;
};
