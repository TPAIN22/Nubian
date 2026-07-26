import { memo } from "react";
import { EmptyState } from "@/components/ui/kit";
import i18n from "@/utils/i18n";

/**
 * Shown when the home feed comes back with nothing at all (first run, an
 * offline cold start, or a backend hiccup).
 *
 * Now delegates to the shared `EmptyState` so the illustration, copy rhythm and
 * recovery button match every other empty surface in the app — the old bespoke
 * 160pt circle was the only one of its kind and read as a different product.
 */
export const HomeEmptyState = memo(({ onRefresh }: { colors?: any; onRefresh: () => void }) => (
  <EmptyState
    icon="bag-handle-outline"
    title={i18n.t("home_empty_title")}
    description={i18n.t("home_empty_subtitle")}
    actionLabel={i18n.t("home_empty_cta")}
    onAction={onRefresh}
  />
));
HomeEmptyState.displayName = "HomeEmptyState";
