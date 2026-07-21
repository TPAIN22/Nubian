import { Surface } from "./Surface";
import { ProfileRow } from "./ProfileRow";
import type { ProfileRowItem } from "./types";

interface SettingsCardProps {
  items: ProfileRowItem[];
}

/**
 * A grouped card of settings rows with auto-managed dividers. Used for the
 * Account (preferences) and Support & Legal sections, and reused by DangerZone.
 */
export function SettingsCard({ items }: SettingsCardProps) {
  return (
    <Surface>
      {items.map((item, index) => (
        <ProfileRow
          key={item.key}
          item={item}
          isLast={index === items.length - 1}
        />
      ))}
    </Surface>
  );
}
