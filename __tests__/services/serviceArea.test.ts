/**
 * Client-side delivery-area gate.
 *
 * This only powers the picker's early "we don't deliver here" feedback — the
 * backend re-tests every pin on save and at checkout — so the cases that matter
 * most here are the *fail-open* ones. A bug that wrongly reports "outside"
 * locks shoppers out of saving any address at all, which is far worse than a
 * bug that lets one through to a server that will reject it anyway.
 */
import { describeServiceArea, isPointInServiceArea } from '@/services/geo/serviceArea';
import type { GeoServiceArea } from '@/services/geo/types';
import i18n from '@/utils/i18n';

/** Coordinates are GeoJSON [lng, lat] — the order this module has to get right. */
const square = (
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
): number[][] => [
  [minLng, minLat],
  [maxLng, minLat],
  [maxLng, maxLat],
  [minLng, maxLat],
  [minLng, minLat],
];

const areaOf = (
  coordinates: number[][][][],
  overrides: Partial<GeoServiceArea> = {},
): GeoServiceArea => ({
  enabled: true,
  names: ['Test Zone'],
  namesAr: ['منطقة'],
  geometry: { type: 'MultiPolygon', coordinates },
  bbox: null,
  ...overrides,
});

/** A rough envelope of Khartoum State, for checking real-world lat/lng wiring. */
const khartoumish = areaOf([[square(31.7, 15.17, 34.4, 16.62)]], {
  names: ['Khartoum State'],
  namesAr: ['ولاية الخرطوم'],
  bbox: { minLat: 15.17, minLng: 31.7, maxLat: 16.62, maxLng: 34.4 },
});

describe('isPointInServiceArea', () => {
  describe('fails open when coverage is unknown', () => {
    it('allows everywhere when no area is supplied', () => {
      expect(isPointInServiceArea({ lat: 19.61, lng: 37.21 }, null)).toBe(true);
      expect(isPointInServiceArea({ lat: 19.61, lng: 37.21 }, undefined)).toBe(true);
    });

    it('allows everywhere when coverage is disabled', () => {
      const disabled = areaOf([[square(31.7, 15.17, 34.4, 16.62)]], { enabled: false });
      expect(isPointInServiceArea({ lat: 19.61, lng: 37.21 }, disabled)).toBe(true);
    });

    it('allows everywhere when the geometry is missing or empty', () => {
      expect(
        isPointInServiceArea({ lat: 19.61, lng: 37.21 }, areaOf([], { geometry: null })),
      ).toBe(true);
      expect(isPointInServiceArea({ lat: 19.61, lng: 37.21 }, areaOf([]))).toBe(true);
    });

    it('allows when there is no pin yet', () => {
      expect(isPointInServiceArea(null, khartoumish)).toBe(true);
    });
  });

  describe('real coordinates', () => {
    it.each([
      ['Khartoum centre', 15.5007, 32.5599],
      ['Omdurman', 15.6445, 32.4777],
      ['Khartoum North (Bahri)', 15.6394, 32.5322],
    ])('covers %s', (_name, lat, lng) => {
      expect(isPointInServiceArea({ lat, lng }, khartoumish)).toBe(true);
    });

    it.each([
      ['Wad Madani', 14.4012, 33.5199],
      ['Port Sudan', 19.6158, 37.2164],
      ['El Obeid', 13.1842, 30.2167],
    ])('excludes %s', (_name, lat, lng) => {
      expect(isPointInServiceArea({ lat, lng }, khartoumish)).toBe(false);
    });

    it('does not confuse a swapped lat/lng for a covered point', () => {
      // 32.55°N 15.50°E is in the Mediterranean, not Khartoum. If the module
      // ever reads coordinates as [lat, lng] this is the test that catches it.
      expect(isPointInServiceArea({ lat: 32.5599, lng: 15.5007 }, khartoumish)).toBe(false);
    });
  });

  describe('geometry handling', () => {
    it('excludes points inside a hole', () => {
      const withHole = areaOf([
        [square(0, 0, 10, 10), square(4, 4, 6, 6)],
      ]);

      expect(isPointInServiceArea({ lat: 2, lng: 2 }, withHole)).toBe(true);
      expect(isPointInServiceArea({ lat: 5, lng: 5 }, withHole)).toBe(false);
    });

    it('covers a point in any polygon of a multi-polygon', () => {
      const twoIslands = areaOf([[square(0, 0, 2, 2)], [square(10, 10, 12, 12)]]);

      expect(isPointInServiceArea({ lat: 1, lng: 1 }, twoIslands)).toBe(true);
      expect(isPointInServiceArea({ lat: 11, lng: 11 }, twoIslands)).toBe(true);
      expect(isPointInServiceArea({ lat: 5, lng: 5 }, twoIslands)).toBe(false);
    });

    it('rejects via the bbox fast path without consulting the rings', () => {
      const boxed = areaOf([[square(0, 0, 10, 10)]], {
        bbox: { minLat: 0, minLng: 0, maxLat: 10, maxLng: 10 },
      });

      expect(isPointInServiceArea({ lat: 50, lng: 50 }, boxed)).toBe(false);
      expect(isPointInServiceArea({ lat: 5, lng: 5 }, boxed)).toBe(true);
    });
  });
});

describe('describeServiceArea', () => {
  const original = i18n.locale;
  afterEach(() => {
    i18n.locale = original;
  });

  it('returns the English names by default', () => {
    i18n.locale = 'en';
    expect(describeServiceArea(khartoumish)).toBe('Khartoum State');
  });

  it('returns the Arabic names for an Arabic locale', () => {
    i18n.locale = 'ar';
    expect(describeServiceArea(khartoumish)).toBe('ولاية الخرطوم');
  });

  it('falls back to the English names when a backend sends no Arabic ones', () => {
    i18n.locale = 'ar';
    const legacy = areaOf([[square(0, 0, 1, 1)]], { names: ['Khartoum State'], namesAr: [] });
    expect(describeServiceArea(legacy)).toBe('Khartoum State');
  });

  it('joins multiple zones with a locale-appropriate separator', () => {
    const two = areaOf([[square(0, 0, 1, 1)]], {
      names: ['Khartoum State', 'Gezira'],
      namesAr: ['ولاية الخرطوم', 'الجزيرة'],
    });

    i18n.locale = 'en';
    expect(describeServiceArea(two)).toBe('Khartoum State, Gezira');

    i18n.locale = 'ar';
    expect(describeServiceArea(two)).toBe('ولاية الخرطوم، الجزيرة');
  });

  it('returns an empty string when there is nothing to name', () => {
    expect(describeServiceArea(null)).toBe('');
    expect(describeServiceArea(areaOf([], { names: [], namesAr: [] }))).toBe('');
  });
});
