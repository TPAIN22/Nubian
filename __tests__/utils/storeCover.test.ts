import { resolveStoreCover, storeGradient } from '@/utils/storeCover';

describe('storeGradient', () => {
  it('returns the same pair for the same seed', () => {
    expect(storeGradient('507f1f77bcf86cd799439011')).toEqual(
      storeGradient('507f1f77bcf86cd799439011'),
    );
  });

  it('spreads different seeds across the palette', () => {
    const seeds = Array.from({ length: 40 }, (_, i) => `store-${i}`);
    const distinct = new Set(seeds.map((s) => storeGradient(s).join()));
    expect(distinct.size).toBeGreaterThan(1);
  });

  it('still returns a usable pair for an empty seed', () => {
    const [from, to] = storeGradient('');
    expect(from).toMatch(/^#/);
    expect(to).toMatch(/^#/);
  });
});

describe('resolveStoreCover', () => {
  it('prefers the uploaded banner', () => {
    expect(
      resolveStoreCover({ _id: 'a', banner: 'https://ik.io/b.jpg', logoUrl: 'https://ik.io/l.jpg' }),
    ).toEqual({ kind: 'image', uri: 'https://ik.io/b.jpg' });
  });

  it('falls back to a blurred logo when there is no banner', () => {
    expect(resolveStoreCover({ _id: 'a', banner: null, logoUrl: 'https://ik.io/l.jpg' })).toEqual({
      kind: 'blurred',
      uri: 'https://ik.io/l.jpg',
    });
  });

  it('treats a whitespace-only banner as missing', () => {
    expect(resolveStoreCover({ _id: 'a', banner: '   ', logoUrl: 'https://ik.io/l.jpg' }).kind).toBe(
      'blurred',
    );
  });

  it('generates a gradient when the store has no artwork at all', () => {
    const cover = resolveStoreCover({ _id: 'store-1' });
    expect(cover.kind).toBe('gradient');
    if (cover.kind === 'gradient') {
      expect(cover.colors).toEqual(storeGradient('store-1'));
    }
  });
});
