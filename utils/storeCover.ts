/**
 * Cover artwork fallback for stores.
 *
 * `banner` is optional on a Merchant and always will be — an admin creating a
 * store on a seller's behalf has no artwork, and requiring one would block
 * onboarding for a decoration. But an empty hero makes a real storefront look
 * abandoned, so every store gets a cover, in three tiers:
 *
 *   1. `banner`  — what the merchant uploaded.
 *   2. `logoUrl` — the mark, blown up and blurred into a colour field, so the
 *      cover still carries the store's own brand colours.
 *   3. neither   — a deterministic gradient keyed off the store id.
 *
 * Tier 3 is deterministic rather than random so a store keeps the same colours
 * across launches and across screens; a cover that reshuffles on every render
 * reads as a loading bug.
 */

export type StoreCover =
  | { kind: 'image'; uri: string }
  | { kind: 'blurred'; uri: string }
  | { kind: 'gradient'; colors: readonly [string, string] };

/**
 * Saturated pairs only: a white storefront glyph and the bottom scrim both sit
 * on top of these, and a pastel would leave neither legible.
 */
const GRADIENTS: readonly (readonly [string, string])[] = [
  ['#1E3A8A', '#3B82F6'], // indigo
  ['#065F46', '#10B981'], // emerald
  ['#7C2D12', '#F97316'], // amber
  ['#581C87', '#A855F7'], // violet
  ['#9F1239', '#FB7185'], // rose
  ['#0F766E', '#2DD4BF'], // teal
];

/** FNV-1a. Small, stable, and no dependency — this only has to spread ids. */
const hash = (seed: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

/** The gradient a store falls back to. Same input, same colours, always. */
export const storeGradient = (seed: string): readonly [string, string] => {
  const pair = GRADIENTS[hash(seed || '') % GRADIENTS.length];
  // `noUncheckedIndexedAccess` — the modulo guarantees a hit, but the compiler
  // cannot know that.
  return pair ?? (GRADIENTS[0] as readonly [string, string]);
};

/** Resolve what to render behind a store hero. */
export const resolveStoreCover = (store: {
  _id?: string;
  banner?: string | null;
  logoUrl?: string | null;
}): StoreCover => {
  const banner = store.banner?.trim();
  if (banner) return { kind: 'image', uri: banner };

  const logo = store.logoUrl?.trim();
  if (logo) return { kind: 'blurred', uri: logo };

  return { kind: 'gradient', colors: storeGradient(store._id ?? '') };
};
