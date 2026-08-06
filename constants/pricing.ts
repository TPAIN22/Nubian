/**
 * Platform pricing configuration.
 *
 * `EXPO_PUBLIC_NUBIAN_MARKUP` is the single knob for the app's copy of Nubian's
 * default margin — the percentage added on top of a merchant's price. Set it in
 * `.env.local` (or as an EAS secret) and rebuild; no code edit anywhere else.
 *
 * The backend owns the real number (`NUBIAN_MARKUP`, see
 * apps/backend/src/lib/pricing.config.js) and every enriched payload already
 * carries the final prices — the app trusts those and never recomputes them.
 * This value is only reached when a legacy/cached payload arrives without an
 * enriched pricing block and we have to derive a price locally. Keep it in sync
 * with the backend and with the dashboard's NEXT_PUBLIC_NUBIAN_MARKUP.
 *
 * `EXPO_PUBLIC_` is required: Expo inlines only that prefix into the bundle at
 * build time, from a literal `process.env.X` reference.
 */

/** Used when EXPO_PUBLIC_NUBIAN_MARKUP is unset or unusable. */
export const NUBIAN_MARKUP_FALLBACK = 30;

/** Bounds mirror the backend's `nubianMarkup` schema constraints. */
export const NUBIAN_MARKUP_MIN = 0;
export const NUBIAN_MARKUP_MAX = 200;

function resolveDefaultMarkup(): number {
  const raw = process.env.EXPO_PUBLIC_NUBIAN_MARKUP;
  if (raw === undefined || raw.trim() === "") return NUBIAN_MARKUP_FALLBACK;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < NUBIAN_MARKUP_MIN || parsed > NUBIAN_MARKUP_MAX) {
    console.warn(
      `[pricing] EXPO_PUBLIC_NUBIAN_MARKUP="${raw}" is not a number between ` +
        `${NUBIAN_MARKUP_MIN} and ${NUBIAN_MARKUP_MAX} — using ${NUBIAN_MARKUP_FALLBACK}%.`,
    );
    return NUBIAN_MARKUP_FALLBACK;
  }
  return parsed;
}

/** Default Nubian margin, in percent. */
export const DEFAULT_NUBIAN_MARKUP = resolveDefaultMarkup();
