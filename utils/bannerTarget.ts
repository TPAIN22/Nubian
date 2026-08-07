/**
 * Banner → Target (client mirror).
 *
 * Mirrors `backend/src/lib/bannerTarget.js`. The backend is the source of truth
 * for what may be *stored*; this module decides what the app is willing to
 * *act on*, which is deliberately the stricter of the two — a payload can reach
 * the app from a stale cache or a downgraded API, so nothing here trusts that
 * the server already validated it.
 *
 * Kept separate from `deepLinks.ts` so the mapping is unit-testable without
 * pulling in expo-router.
 */

export type BannerTargetType =
  | 'none'
  | 'store'
  | 'collection'
  | 'product'
  | 'category'
  | 'url';

export interface BannerTarget {
  type: BannerTargetType;
  id?: string;
  url?: string;
}

/** Shape a banner may arrive in — current nested `target`, or the legacy flat fields. */
export interface BannerLike {
  target?: {
    type?: string | null;
    id?: string | null;
    url?: string | null;
  } | null;
  /**
   * Legacy flat shape that predates `target`. It was declared on `HomeBanner`
   * and consumed by `navigateBanner`, but the API never emitted it — kept only
   * so a cached payload or a hand-rolled fixture keeps resolving.
   */
  type?: string | null;
  targetId?: string | null;
  url?: string | null;
}

export const NONE_TARGET: BannerTarget = { type: 'none' };

const TYPES_WITH_ID: BannerTargetType[] = ['store', 'collection', 'product', 'category'];

const ALL_TYPES: BannerTargetType[] = ['none', ...TYPES_WITH_ID, 'url'];

/** Target types the app has a screen for. Only `none` is not navigable. */
export const NAVIGABLE_TARGET_TYPES: BannerTargetType[] = [
  'store',
  'collection',
  'product',
  'category',
  'url',
];

const URL_MAX = 2048;

/**
 * Absolute http(s), with an authority that contains no `@`.
 *
 * A regex rather than `new URL()` on purpose: React Native's URL implementation
 * is a partial polyfill whose `protocol`/`username` handling differs between
 * engines, so parsing would be the least predictable part of a security check.
 * The `@` exclusion blocks `https://accounts.google.com@evil.example`, which
 * reads as Google to a human and resolves to the attacker.
 */
const SAFE_URL_RE = /^https?:\/\/[^\s/@]+(?:[/?#]|$)/i;

export function isSafeBannerUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > URL_MAX) return false;
  return SAFE_URL_RE.test(trimmed);
}

const asId = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const asType = (value: unknown): BannerTargetType | undefined => {
  if (typeof value !== 'string') return undefined;
  // The legacy flat shape spelled the url case 'external'.
  const normalized = value.trim() === 'external' ? 'url' : value.trim();
  return (ALL_TYPES as string[]).includes(normalized)
    ? (normalized as BannerTargetType)
    : undefined;
};

/**
 * Reduce any banner to a target the app can act on.
 *
 * Always returns a valid target — anything unrecognised, incomplete or unsafe
 * collapses to `none`, so a malformed payload produces a static banner rather
 * than a dead tap or a bad navigation. This is also what makes every banner
 * created before targets existed keep working: no `target`, no legacy fields,
 * so `none`.
 */
export function resolveBannerTarget(banner: BannerLike | null | undefined): BannerTarget {
  if (!banner || typeof banner !== 'object') return NONE_TARGET;

  // Prefer the nested target; fall back to the legacy flat fields.
  const source = banner.target && typeof banner.target === 'object' ? banner.target : banner;
  const rawId = 'id' in source ? source.id : (banner as BannerLike).targetId;

  const type = asType(source.type);
  if (!type || type === 'none') return NONE_TARGET;

  if (type === 'url') {
    const url = typeof source.url === 'string' ? source.url.trim() : '';
    return isSafeBannerUrl(url) ? { type: 'url', url } : NONE_TARGET;
  }

  const id = asId(rawId);
  return id ? { type, id } : NONE_TARGET;
}

/**
 * Does tapping this banner do anything?
 *
 * Drives both the press handler and the presentation: a banner with no
 * destination should not render a "Shop now" call to action or announce itself
 * to a screen reader as a button.
 */
export function isActionableBanner(banner: BannerLike | null | undefined): boolean {
  const target = resolveBannerTarget(banner);
  return NAVIGABLE_TARGET_TYPES.includes(target.type);
}
