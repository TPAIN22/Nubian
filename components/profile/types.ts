import type React from "react";
import type Ionicons from "@expo/vector-icons/Ionicons";

export type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

/** A single tappable settings/menu row. */
export interface ProfileRowItem {
  /** Stable key for list rendering. */
  key: string;
  title: string;
  icon: IoniconName;
  onPress?: () => void;
  /** Right-aligned value text (e.g. current language / currency). */
  trailingText?: string;
  /** Custom right slot (e.g. a Switch). Takes precedence over trailingText. */
  rightSlot?: React.ReactNode;
  /** Visual emphasis — `danger` tints the row red for destructive actions. */
  tone?: "default" | "danger";
}

/** A compact fast-access tile in the quick-actions grid. */
export interface QuickActionItem {
  key: string;
  title: string;
  icon: IoniconName;
  onPress: () => void;
}

/** A headline stat card (count + label) that deep-links somewhere. */
export interface StatItem {
  key: string;
  label: string;
  value: number;
  icon: IoniconName;
  onPress?: () => void;
}
