import { SettingsCard } from "./SettingsCard";
import type { ProfileRowItem } from "./types";

/**
 * Visually isolated card for destructive actions (log out / delete account).
 * Rows are forced to the `danger` tone so they read red in both themes.
 */
export function DangerZone({ items }: { items: ProfileRowItem[] }) {
  const dangerItems = items.map((item) => ({ ...item, tone: "danger" as const }));
  return <SettingsCard items={dangerItems} />;
}
