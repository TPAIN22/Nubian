import { shouldShowOriginal, shouldShowDiscountBadge } from '@/components/ui/kit/priceDisplay';

/**
 * Display contract for the price block (Issue #9).
 *
 *   Strikethrough iff `original > final`.  Badge iff `discountPercentage > 0`.
 *
 * These are two independent decisions and must not be collapsed into one flag.
 *
 * Background: currency conversion applies psychological rounding (ENDING_9 /
 * NEAREST_10). The backend now guarantees on converted payloads that
 * `final + discountAmount === original` exactly, with `discountAmount` derived
 * from the *rounded* pair, and that `original >= final` always. When rounding
 * collapses the pair it reports `original === final` and `discountAmount === 0`
 * rather than fabricating a larger original — the displayed saving must never
 * exceed the true converted discount, because an inflated saving is a false
 * claim about money.
 *
 * The consequence for this layer: `hasDiscount` must NOT gate the
 * strikethrough. It is currency-invariant and stays `true` through the
 * collapse, so gating on it would render a struck-through price identical to
 * the price — which reads as a bug and claims a saving of zero. The badge is
 * what still tells the customer a sale is on, because `discountPercentage` is a
 * ratio and passes through conversion unmodified.
 *
 * These assert the predicates rather than a rendered tree: React Native
 * components cannot be rendered under this project's jest config at all (a bare
 * `import { View } from 'react-native'` throws inside nativewind's
 * css-interop), which is why every existing suite here is pure logic. `Price`
 * calls `shouldShowOriginal` and does nothing else with the decision.
 */

describe('shouldShowOriginal — strikethrough iff original > final', () => {
  test('shows it when the converted original really is greater', () => {
    expect(
      shouldShowOriginal({
        original: 'SAR 499',
        value: 'SAR 399',
        originalAmount: 499,
        valueAmount: 399,
      }),
    ).toBe(true);
  });

  test('SUPPRESSES it when rounding collapsed the pair, even though the strings differ in nothing', () => {
    // The collapse case. The backend reports original === final and
    // discountAmount === 0 here rather than inflating the original.
    expect(
      shouldShowOriginal({
        original: 'SAR 390',
        value: 'SAR 390',
        originalAmount: 390,
        valueAmount: 390,
      }),
    ).toBe(false);
  });

  test('the numeric comparison wins over formatted-string inequality', () => {
    // Two amounts that format differently but are not a saving. Formatting must
    // never be the thing that decides whether we claim a discount.
    expect(
      shouldShowOriginal({
        original: 'SAR 390.00',
        value: 'SAR 390',
        originalAmount: 390,
        valueAmount: 390,
      }),
    ).toBe(false);
  });

  test('the numeric comparison wins even when the strings are identical', () => {
    // Same displayed string, genuinely different amounts (sub-unit rounding in
    // the formatter). The amounts are the truth.
    expect(
      shouldShowOriginal({
        original: 'SAR 390',
        value: 'SAR 390',
        originalAmount: 390.4,
        valueAmount: 390,
      }),
    ).toBe(true);
  });

  test('never shows it when the original is somehow below the final', () => {
    expect(
      shouldShowOriginal({
        original: 'SAR 300',
        value: 'SAR 399',
        originalAmount: 300,
        valueAmount: 399,
      }),
    ).toBe(false);
  });

  test('there must be a was-price string to show at all', () => {
    for (const original of [null, undefined, '']) {
      expect(shouldShowOriginal({ original, value: 'SAR 399', originalAmount: 499, valueAmount: 399 })).toBe(
        false,
      );
    }
  });

  test('falls back to string inequality only when the amounts are unavailable', () => {
    // Legacy payloads carrying formatted strings and nothing else.
    expect(shouldShowOriginal({ original: 'SAR 499', value: 'SAR 399' })).toBe(true);
    expect(shouldShowOriginal({ original: 'SAR 399', value: 'SAR 399' })).toBe(false);
  });

  test('a partial pair of amounts falls back rather than guessing', () => {
    expect(shouldShowOriginal({ original: 'SAR 499', value: 'SAR 399', originalAmount: 499 })).toBe(true);
    expect(shouldShowOriginal({ original: 'SAR 399', value: 'SAR 399', valueAmount: 399 })).toBe(false);
    expect(shouldShowOriginal({ original: 'SAR 499', value: 'SAR 399', originalAmount: null })).toBe(true);
  });

  test('zero amounts are compared, not treated as missing', () => {
    // A free item is not a discount off itself.
    expect(shouldShowOriginal({ original: 'SAR 0', value: 'SAR 0', originalAmount: 0, valueAmount: 0 })).toBe(
      false,
    );
    expect(shouldShowOriginal({ original: 'SAR 10', value: 'SAR 0', originalAmount: 10, valueAmount: 0 })).toBe(
      true,
    );
  });
});

describe('shouldShowDiscountBadge — badge iff discountPercentage > 0', () => {
  test('renders for a real percentage', () => {
    expect(shouldShowDiscountBadge(20)).toBe(true);
    expect(shouldShowDiscountBadge(1)).toBe(true);
  });

  test('does not render for zero, negative, or absent', () => {
    expect(shouldShowDiscountBadge(0)).toBe(false);
    expect(shouldShowDiscountBadge(-5)).toBe(false);
    expect(shouldShowDiscountBadge(undefined)).toBe(false);
    expect(shouldShowDiscountBadge(null)).toBe(false);
  });

  test('does not render for NaN', () => {
    // `NaN > 0` is false, but assert it explicitly — a NaN percentage would
    // otherwise print "-NaN%".
    expect(shouldShowDiscountBadge(Number.NaN)).toBe(false);
  });
});

describe('the two decisions are independent', () => {
  test('the collapse case: badge yes, strikethrough no', () => {
    // This is the combination the whole contract exists to produce. A genuine
    // 20% sale whose converted prices round together: the customer still learns
    // a sale is on, and we do not claim a saving we cannot show.
    const collapsed = {
      original: 'SAR 390',
      value: 'SAR 390',
      originalAmount: 390,
      valueAmount: 390,
    };

    expect(shouldShowOriginal(collapsed)).toBe(false);
    expect(shouldShowDiscountBadge(20)).toBe(true);
  });

  test('the ordinary sale: badge yes, strikethrough yes', () => {
    expect(
      shouldShowOriginal({
        original: 'SAR 499',
        value: 'SAR 399',
        originalAmount: 499,
        valueAmount: 399,
      }),
    ).toBe(true);
    expect(shouldShowDiscountBadge(20)).toBe(true);
  });

  test('no discount at all: neither', () => {
    expect(
      shouldShowOriginal({
        original: 'SAR 399',
        value: 'SAR 399',
        originalAmount: 399,
        valueAmount: 399,
      }),
    ).toBe(false);
    expect(shouldShowDiscountBadge(0)).toBe(false);
  });
});
