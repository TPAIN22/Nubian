import i18n from "@/utils/i18n";
import type { LocationItem } from "./types";

/**
 * Backend returns `nameEn` / `nameAr` (see apps/backend/src/models/*.model.js).
 * Pick whichever matches the active language, falling back across locales and
 * the legacy `name` field so older cached records keep rendering.
 *
 * Behaviour is intentionally identical to the original inline helper that lived
 * in LocationPicker.tsx — only its home changed.
 */
export const localizedName = (item: Partial<LocationItem> | null | undefined): string => {
  if (!item) return "";
  const isAr = i18n.language === "ar";
  if (isAr) return item.nameAr || item.nameEn || item.name || "";
  return item.nameEn || item.nameAr || item.name || "";
};
