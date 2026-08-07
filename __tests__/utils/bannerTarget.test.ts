import {
  isActionableBanner,
  isSafeBannerUrl,
  resolveBannerTarget,
  NONE_TARGET,
} from '@/utils/bannerTarget';

const OID = '507f1f77bcf86cd799439011';

describe('resolveBannerTarget', () => {
  describe('nested target (current API shape)', () => {
    it.each([
      ['store', { type: 'store', id: OID }],
      ['product', { type: 'product', id: OID }],
      ['category', { type: 'category', id: OID }],
      ['collection', { type: 'collection', id: OID }],
    ])('resolves a %s target', (_label, target) => {
      expect(resolveBannerTarget({ target })).toEqual(target);
    });

    it('resolves a url target', () => {
      expect(resolveBannerTarget({ target: { type: 'url', url: 'https://example.com/sale' } })).toEqual({
        type: 'url',
        url: 'https://example.com/sale',
      });
    });

    it('resolves an explicit none target', () => {
      expect(resolveBannerTarget({ target: { type: 'none' } })).toEqual(NONE_TARGET);
    });

    it('trims whitespace around an id', () => {
      expect(resolveBannerTarget({ target: { type: 'store', id: `  ${OID} ` } })).toEqual({
        type: 'store',
        id: OID,
      });
    });
  });

  describe('backward compatibility', () => {
    it('treats a banner with no target as none', () => {
      expect(resolveBannerTarget({ _id: 'b1', image: 'https://x/y.png' } as any)).toEqual(NONE_TARGET);
    });

    it('treats null/undefined banners as none', () => {
      expect(resolveBannerTarget(null)).toEqual(NONE_TARGET);
      expect(resolveBannerTarget(undefined)).toEqual(NONE_TARGET);
    });

    it('treats an explicitly null target as none', () => {
      expect(resolveBannerTarget({ target: null })).toEqual(NONE_TARGET);
    });

    it('still reads the legacy flat shape', () => {
      expect(resolveBannerTarget({ type: 'product', targetId: OID })).toEqual({
        type: 'product',
        id: OID,
      });
    });

    it("maps the legacy 'external' type onto url", () => {
      expect(resolveBannerTarget({ type: 'external', url: 'https://example.com' })).toEqual({
        type: 'url',
        url: 'https://example.com',
      });
    });
  });

  describe('malformed input degrades to none rather than a bad navigation', () => {
    it.each([
      ['entity target with no id', { target: { type: 'store' } }],
      ['entity target with an empty id', { target: { type: 'product', id: '   ' } }],
      ['url target with no url', { target: { type: 'url' } }],
      ['unknown type', { target: { type: 'brand', id: OID } }],
      ['non-object target', { target: 'store' as any }],
    ])('%s', (_label, banner) => {
      expect(resolveBannerTarget(banner as any)).toEqual(NONE_TARGET);
    });

    it('drops a url target whose URL is unsafe', () => {
      expect(resolveBannerTarget({ target: { type: 'url', url: 'javascript:alert(1)' } })).toEqual(
        NONE_TARGET,
      );
    });
  });
});

describe('isSafeBannerUrl', () => {
  it('accepts absolute http(s) URLs', () => {
    expect(isSafeBannerUrl('https://nubian-sd.com/campaign?utm=app')).toBe(true);
    expect(isSafeBannerUrl('http://nubian-sd.com')).toBe(true);
    expect(isSafeBannerUrl('https://nubian-sd.com:8443/x')).toBe(true);
  });

  it('rejects executable and non-web schemes', () => {
    expect(isSafeBannerUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeBannerUrl('data:text/html;base64,PHNjcmlwdD4=')).toBe(false);
    expect(isSafeBannerUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeBannerUrl('sdnubian://product/123')).toBe(false);
  });

  it('rejects relative URLs', () => {
    expect(isSafeBannerUrl('/campaign')).toBe(false);
    expect(isSafeBannerUrl('example.com')).toBe(false);
  });

  it('rejects URLs with embedded credentials', () => {
    expect(isSafeBannerUrl('https://accounts.google.com@evil.example/')).toBe(false);
    expect(isSafeBannerUrl('https://user:pass@example.com/')).toBe(false);
  });

  it('rejects an over-long URL', () => {
    expect(isSafeBannerUrl(`https://example.com/${'a'.repeat(2100)}`)).toBe(false);
  });

  it('rejects non-strings', () => {
    expect(isSafeBannerUrl(undefined)).toBe(false);
    expect(isSafeBannerUrl(42)).toBe(false);
  });
});

describe('isActionableBanner', () => {
  it('is true for targets that have a screen', () => {
    expect(isActionableBanner({ target: { type: 'store', id: OID } })).toBe(true);
    expect(isActionableBanner({ target: { type: 'product', id: OID } })).toBe(true);
    expect(isActionableBanner({ target: { type: 'category', id: OID } })).toBe(true);
    expect(isActionableBanner({ target: { type: 'collection', id: OID } })).toBe(true);
    expect(isActionableBanner({ target: { type: 'url', url: 'https://example.com' } })).toBe(true);
  });

  it('is false for none and for a missing target', () => {
    expect(isActionableBanner({ target: { type: 'none' } })).toBe(false);
    expect(isActionableBanner({})).toBe(false);
  });

  it('is false for a collection target with no id', () => {
    // The id is what the collection route needs; without it the tap would push
    // a screen that can only render its own error state.
    expect(isActionableBanner({ target: { type: 'collection' } })).toBe(false);
  });
});
