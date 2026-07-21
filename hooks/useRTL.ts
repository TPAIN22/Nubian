import { I18nManager } from "react-native";
import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

/**
 * Centralized RTL helpers. `I18nManager.isRTL` is constant for an app session,
 * so this reads it once and returns direction-aware values — use these instead
 * of scattering `I18nManager.isRTL` checks and manual `left/right` flips.
 *
 * Prefer logical style props (`marginStart/End`, `paddingStart/End`, `start/end`)
 * over `left/right` for directional layout — those auto-flip and don't need this.
 * Use this hook mainly for things RN can't auto-flip: directional ICONS
 * (chevrons, arrows) and explicit `flexDirection` / `writingDirection`.
 */
export function useRTL() {
  const isRTL = I18nManager.isRTL;

  return {
    isRTL,
    /** "next"/forward affordance — points left in RTL, right in LTR. */
    chevronForward: (isRTL ? "chevron-back" : "chevron-forward") as IoniconName,
    /** "previous"/back affordance — mirror of chevronForward. */
    chevronBack: (isRTL ? "chevron-forward" : "chevron-back") as IoniconName,
    /** Back-navigation arrow, direction-aware. */
    arrowBack: (isRTL ? "arrow-forward" : "arrow-back") as IoniconName,
    /** For Text `writingDirection` / style. */
    writingDirection: (isRTL ? "rtl" : "ltr") as "rtl" | "ltr",
    /** For a horizontal row that should mirror in RTL. */
    rowDirection: (isRTL ? "row-reverse" : "row") as "row" | "row-reverse",
    /** Convenience text alignment matching reading direction. */
    textAlign: (isRTL ? "right" : "left") as "right" | "left",
  } as const;
}
