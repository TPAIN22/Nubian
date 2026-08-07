/**
 * Banner tap → destination.
 *
 * Covers the dispatch layer only; the target parsing rules live in
 * `bannerTarget.test.ts`. Together they pin the behaviour the admin UI promises:
 * every target type reaches the right screen, and `none` reaches nothing.
 */

// Mocks are created *inside* the factories: jest.mock is hoisted above the
// module body, so a factory closing over a `const` declared here would read it
// while it is still in the temporal dead zone. The handles are pulled back off
// the mocked modules below instead.

// Overrides the shared mock in jest.setup.js, which exposes only the `useRouter`
// hook — deepLinks uses the imperative `router` singleton.
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

jest.mock('react-native', () => ({
  Linking: { openURL: jest.fn(() => Promise.resolve(true)) },
}));

jest.mock('@/store/useProductCacheStore', () => ({
  __esModule: true,
  default: { getState: () => ({ setInitialProduct: jest.fn() }) },
}));

import { router } from 'expo-router';
import { Linking } from 'react-native';
import { navigateBanner } from '@/utils/deepLinks';

const mockPush = router.push as unknown as jest.Mock;
const mockOpenURL = Linking.openURL as unknown as jest.Mock;

const OID = '507f1f77bcf86cd799439011';

/** The pathname deepLinks pushed on the most recent call. */
const lastPathname = () => mockPush.mock.calls.at(-1)?.[0]?.pathname;
/** The params deepLinks pushed on the most recent call. */
const lastParams = () => mockPush.mock.calls.at(-1)?.[0]?.params;

beforeEach(() => {
  mockPush.mockClear();
  mockOpenURL.mockClear();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('navigateBanner', () => {
  it('navigates a store target to the store screen', () => {
    expect(navigateBanner({ target: { type: 'store', id: OID } })).toBe(true);
    expect(lastPathname()).toBe('/(screens)/store/[id]');
    expect(lastParams()).toMatchObject({ id: OID });
  });

  it('navigates a product target to the product details screen', () => {
    expect(navigateBanner({ target: { type: 'product', id: OID } })).toBe(true);
    expect(lastPathname()).toBe('/(screens)/details/[details]');
    expect(lastParams()).toMatchObject({ details: OID });
  });

  it('navigates a category target to the category screen', () => {
    expect(navigateBanner({ target: { type: 'category', id: OID } })).toBe(true);
    expect(lastPathname()).toBe('/categories/[id]');
    expect(lastParams()).toMatchObject({ id: OID });
  });

  it('opens a url target through the OS handler', () => {
    expect(navigateBanner({ target: { type: 'url', url: 'https://example.com/sale' } })).toBe(true);
    expect(mockOpenURL).toHaveBeenCalledWith('https://example.com/sale');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does nothing for a none target', () => {
    expect(navigateBanner({ target: { type: 'none' } })).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockOpenURL).not.toHaveBeenCalled();
  });

  it('does nothing for a banner with no target at all', () => {
    expect(navigateBanner({ _id: 'b1', image: 'https://x/y.png' } as any)).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockOpenURL).not.toHaveBeenCalled();
  });

  it('navigates a collection target to the collection screen', () => {
    expect(navigateBanner({ target: { type: 'collection', id: OID } })).toBe(true);
    expect(lastPathname()).toBe('/(screens)/collection/[id]');
    expect(lastParams()).toMatchObject({ id: OID });
  });

  it('sends a collection to its own route, not the category route', () => {
    // `/(screens)/[id]` is the Category screen; routing collections through it
    // would make a bare id ambiguous between the two entities.
    navigateBanner({ target: { type: 'collection', id: OID } });
    expect(lastPathname()).not.toBe('/(screens)/[id]');
    navigateBanner({ target: { type: 'category', id: OID } });
    expect(lastPathname()).toBe('/categories/[id]');
  });

  it('does not navigate a collection target with no id', () => {
    expect(navigateBanner({ target: { type: 'collection' } })).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('refuses an unsafe url instead of handing it to the OS', () => {
    expect(navigateBanner({ target: { type: 'url', url: 'javascript:alert(1)' } })).toBe(false);
    expect(mockOpenURL).not.toHaveBeenCalled();
  });

  it('does not guess a destination for a target with a missing id', () => {
    // The previous implementation fell through to the product screen for any
    // bare id, sending taps to a 404 whenever the type was absent.
    expect(navigateBanner({ target: { type: 'store' } })).toBe(false);
    expect(navigateBanner({ targetId: OID } as any)).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('still routes the legacy flat banner shape', () => {
    expect(navigateBanner({ type: 'category', targetId: OID } as any)).toBe(true);
    expect(lastPathname()).toBe('/categories/[id]');
  });
});
