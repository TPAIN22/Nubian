/**
 * Home rail → collections.
 *
 * Two things this pins down, both of which used to be wrong in a way that is
 * invisible until an admin complains:
 *   · a collection with no cover image must still reach the rail (the old
 *     mock rail always had art, and the sibling category filter drops
 *     image-less rows — copying that rule here would silently hide a
 *     collection the admin just published), and
 *   · a tapped card must reach the Collection screen, not the Category screen.
 */

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

// `home.service` imports the real axios client transitively, which drags in
// Expo's winter runtime and needs a TextEncoder jsdom doesn't have. Nothing
// under test issues a request, so the client is stubbed at the module boundary
// — the same targeted-leaf-mock approach `client.interceptor.test.ts` uses for
// baseUrl and tokenManager.
jest.mock('@/services/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('react-native', () => ({
  Linking: { openURL: jest.fn(() => Promise.resolve(true)) },
}));

jest.mock('@/store/useProductCacheStore', () => ({
  __esModule: true,
  default: { getState: () => ({ setInitialProduct: jest.fn() }) },
}));

import { router } from 'expo-router';
import { HomeService } from '@/services/home.service';
import { navigateToCollection } from '@/utils/deepLinks';
import type { HomeCollection } from '@/api/home.api';

const mockPush = router.push as unknown as jest.Mock;
const OID = '507f1f77bcf86cd799439011';

const collection = (over: Partial<HomeCollection> = {}): HomeCollection => ({
  _id: OID,
  name: 'Ramadan Favorites',
  image: 'https://ik.imagekit.io/nubian/ramadan.png',
  productCount: 3,
  ...over,
});

describe('HomeService.filterActiveCollections', () => {
  it('keeps a well-formed collection', () => {
    expect(HomeService.filterActiveCollections([collection()])).toHaveLength(1);
  });

  it('keeps a collection with no cover image', () => {
    // The card falls back to a tinted tile; dropping the row here would make a
    // published collection vanish with nothing to explain why.
    const rows = HomeService.filterActiveCollections([collection({ image: null })]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.image).toBeNull();
  });

  it('keeps a collection whose products are all unavailable', () => {
    // The API still serves it and its screen has a real empty state.
    expect(HomeService.filterActiveCollections([collection({ productCount: 0 })])).toHaveLength(1);
  });

  it('drops rows that cannot be rendered or tapped', () => {
    const rows = HomeService.filterActiveCollections([
      collection(),
      collection({ _id: '' }),
      collection({ name: '   ' }),
      null as unknown as HomeCollection,
    ]);
    expect(rows).toHaveLength(1);
  });

  it('preserves the admin-curated order', () => {
    const rows = HomeService.filterActiveCollections([
      collection({ _id: 'c', name: 'C' }),
      collection({ _id: 'a', name: 'A' }),
      collection({ _id: 'b', name: 'B' }),
    ]);
    expect(rows.map((r) => r.name)).toEqual(['C', 'A', 'B']);
  });

  it('survives a payload from a backend that has no collections field', () => {
    expect(HomeService.filterActiveCollections(undefined as never)).toEqual([]);
  });
});

describe('quick collection card navigation', () => {
  beforeEach(() => mockPush.mockClear());

  it('opens the Collection screen, not the Category screen', () => {
    navigateToCollection(OID);
    expect(mockPush.mock.calls.at(-1)?.[0]?.pathname).toBe('/(screens)/collection/[id]');
    expect(mockPush.mock.calls.at(-1)?.[0]?.params).toMatchObject({ id: OID });
  });
});
