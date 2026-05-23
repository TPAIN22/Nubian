import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Linking } from "react-native";

export type PushPermissionStatus = "undetermined" | "granted" | "denied";

export type SoftPromptReason = "orders" | "offers" | "general";

const LAST_SHOWN_KEY = "pushPrompt:lastShownAt";
const DECLINE_COUNT_KEY = "pushPrompt:declineCount";
const PER_REASON_KEY = (reason: SoftPromptReason) => `pushPrompt:lastShown:${reason}`;

// After the user dismisses the soft prompt, don't show ANY soft prompt again for
// this long. Keeps the experience non-annoying.
const GLOBAL_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
// Per-reason cooldown — same reason won't re-fire for 30 days even if other
// reasons are eligible.
const PER_REASON_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
// After this many soft-declines we stop nagging entirely until user changes it
// in Settings (we'll still surface a banner UI, but no more modals).
const MAX_DECLINES = 3;

async function readNumber(key: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export async function getPermissionStatus(): Promise<PushPermissionStatus> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") return "granted";
    if (status === "denied") return "denied";
    return "undetermined";
  } catch {
    return "undetermined";
  }
}

export async function canShowSoftPrompt(reason: SoftPromptReason): Promise<boolean> {
  const status = await getPermissionStatus();
  if (status === "granted") return false;

  const declines = await readNumber(DECLINE_COUNT_KEY);
  if (declines >= MAX_DECLINES) return false;

  const now = Date.now();
  const lastShown = await readNumber(LAST_SHOWN_KEY);
  if (lastShown && now - lastShown < GLOBAL_COOLDOWN_MS) return false;

  const lastForReason = await readNumber(PER_REASON_KEY(reason));
  if (lastForReason && now - lastForReason < PER_REASON_COOLDOWN_MS) return false;

  return true;
}

export async function markSoftPromptShown(reason: SoftPromptReason): Promise<void> {
  const now = Date.now().toString();
  try {
    await AsyncStorage.multiSet([
      [LAST_SHOWN_KEY, now],
      [PER_REASON_KEY(reason), now],
    ]);
  } catch {
    /* non-fatal */
  }
}

export async function markSoftPromptDeclined(): Promise<void> {
  try {
    const current = await readNumber(DECLINE_COUNT_KEY);
    await AsyncStorage.setItem(DECLINE_COUNT_KEY, String(current + 1));
  } catch {
    /* non-fatal */
  }
}

export async function clearSoftPromptDeclines(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DECLINE_COUNT_KEY);
  } catch {
    /* non-fatal */
  }
}

export async function openOsSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    /* non-fatal */
  }
}
