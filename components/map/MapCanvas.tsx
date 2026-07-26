/**
 * The map component every screen uses.
 *
 * Resolves the registered renderer and forwards the ref, so callers get a
 * `MapCanvasHandle` without knowing (or caring) what draws underneath.
 */
import { forwardRef } from 'react';
import { ACTIVE_MAP_RENDERER, MAP_RENDERERS } from './adapters';
import type { MapCanvasHandle, MapCanvasProps } from './types';

export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(
  function MapCanvas(props, ref) {
    const Renderer = MAP_RENDERERS[ACTIVE_MAP_RENDERER];
    return <Renderer ref={ref} {...props} />;
  },
);

export default MapCanvas;
