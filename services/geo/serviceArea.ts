/**
 * Client-side delivery-area test.
 *
 * This exists purely so the picker can tell a shopper "we don't deliver here"
 * while they are still panning the map, instead of after they have filled in a
 * name, a phone number and a floor. **It is not a security boundary and must
 * never be treated as one** — the backend re-tests the pin on save and again at
 * checkout (`deliveryArea.service.js`), which is what actually enforces
 * coverage.
 *
 * The test is planar ray casting, while the server uses MongoDB's spherical
 * `$geoIntersects`. For city- and state-sized polygons the two disagree only
 * within centimetres of the boundary, and the server always has the last word,
 * so the simpler algorithm is the right trade here.
 */
import i18n from '@/utils/i18n';
import type { GeoPoint, GeoServiceArea } from './types';

/**
 * Ray casting against a single closed ring.
 *
 * Counts how many ring edges a ray cast east from the point crosses; odd means
 * inside. Ring coordinates are GeoJSON [lng, lat].
 */
const isInsideRing = (point: GeoPoint, ring: number[][]): boolean => {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[i];
    const b = ring[j];
    if (!a || !b) continue;

    const [aLng, aLat] = a as [number, number];
    const [bLng, bLat] = b as [number, number];

    // Does this edge straddle the point's latitude? Comparing with `!==` on the
    // two `>` tests also handles the vertex case consistently, so a point level
    // with a shared vertex isn't counted twice.
    const straddles = aLat > point.lat !== bLat > point.lat;
    if (!straddles) continue;

    // Longitude where the edge crosses the point's latitude.
    const crossingLng = ((bLng - aLng) * (point.lat - aLat)) / (bLat - aLat) + aLng;
    if (point.lng < crossingLng) inside = !inside;
  }

  return inside;
};

/**
 * A GeoJSON polygon: ring 0 is the outer boundary, any further rings are holes
 * (a lake, or an area couriers won't enter). Inside the outer ring but inside a
 * hole means outside the polygon.
 */
const isInsidePolygon = (point: GeoPoint, polygon: number[][][]): boolean => {
  const [outer, ...holes] = polygon;
  if (!outer || !isInsideRing(point, outer)) return false;
  return !holes.some((hole) => isInsideRing(point, hole));
};

/**
 * Is this point somewhere we deliver?
 *
 * Returns true whenever coverage isn't configured or the geometry is missing —
 * "unknown" must read as "allowed" here, or a client that failed to fetch the
 * boundary would present itself as a store that serves nowhere.
 */
export const isPointInServiceArea = (
  point: GeoPoint | null | undefined,
  area: GeoServiceArea | null | undefined,
): boolean => {
  if (!point || !area?.enabled || !area.geometry) return true;

  const { coordinates } = area.geometry;
  if (!Array.isArray(coordinates) || coordinates.length === 0) return true;

  // Cheap reject first: most out-of-area pins are nowhere near the bbox, and
  // this runs on every settle of a dragged map.
  const { bbox } = area;
  if (
    bbox &&
    (point.lat < bbox.minLat ||
      point.lat > bbox.maxLat ||
      point.lng < bbox.minLng ||
      point.lng > bbox.maxLng)
  ) {
    return false;
  }

  return coordinates.some((polygon) => isInsidePolygon(point, polygon));
};

/**
 * Human-readable list of where we deliver, for the out-of-area message.
 * Returns '' when there is nothing meaningful to name.
 */
export const describeServiceArea = (area: GeoServiceArea | null | undefined): string => {
  const isArabic = i18n.locale?.startsWith('ar') ?? false;

  const preferred = isArabic ? (area?.namesAr ?? []) : (area?.names ?? []);
  // A backend that predates `namesAr` sends only `names`; fall back to it rather
  // than showing a message with no place in it.
  const names = (preferred.length ? preferred : (area?.names ?? [])).filter(Boolean);

  return names.join(isArabic ? '، ' : ', ');
};
