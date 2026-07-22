import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import { useColors } from "@/hooks/useColors";
import i18n from "@/utils/i18n";
import {
  getPermissionStatus,
  markSoftPromptDeclined,
  markSoftPromptShown,
  openOsSettings,
  type PushPermissionStatus,
  type SoftPromptReason,
} from "@/utils/pushPermission";

type Copy = { title: string; body: string; icon: keyof typeof Ionicons.glyphMap };

function copyFor(reason: SoftPromptReason): Copy {
  switch (reason) {
    case "orders":
      return {
        icon: "cube-outline",
        title:
          i18n.t("pushPromptOrdersTitle") ||
          "Get real-time order updates",
        body:
          i18n.t("pushPromptOrdersBody") ||
          "Allow notifications so we can let you know the moment your order ships, is out for delivery, and arrives.",
      };
    case "offers":
      return {
        icon: "pricetags-outline",
        title:
          i18n.t("pushPromptOffersTitle") ||
          "Never miss a price drop",
        body:
          i18n.t("pushPromptOffersBody") ||
          "Turn on notifications to hear about flash sales, restocks, and offers tailored to what you love.",
      };
    case "general":
    default:
      return {
        icon: "notifications-outline",
        title:
          i18n.t("pushPromptGeneralTitle") ||
          "Stay in the loop",
        body:
          i18n.t("pushPromptGeneralBody") ||
          "Enable notifications for order updates, offers, and important account activity. You can change this anytime.",
      };
  }
}

type Props = {
  visible: boolean;
  reason: SoftPromptReason;
  onEnable: () => Promise<PushPermissionStatus> | PushPermissionStatus;
  onDismiss: () => void;
};

export function NotificationPermissionSheet({
  visible,
  reason,
  onEnable,
  onDismiss,
}: Props) {
  const colors = useColors();
  const [status, setStatus] = useState<PushPermissionStatus>("undetermined");
  const [busy, setBusy] = useState(false);

  const copy = useMemo(() => copyFor(reason), [reason]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      const s = await getPermissionStatus();
      if (!cancelled) setStatus(s);
      await markSoftPromptShown(reason);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, reason]);

  const isPermanentlyDenied = status === "denied";

  const handlePrimary = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (isPermanentlyDenied) {
        await openOsSettings();
        onDismiss();
        return;
      }
      const result = await onEnable();
      if (result !== "granted") {
        await markSoftPromptDeclined();
      }
      onDismiss();
    } finally {
      setBusy(false);
    }
  };

  const handleSecondary = async () => {
    if (busy) return;
    await markSoftPromptDeclined();
    onDismiss();
  };

  const primaryLabel = isPermanentlyDenied
    ? i18n.t("pushPromptOpenSettings") || "Open Settings"
    : i18n.t("pushPromptEnable") || "Enable notifications";
  const secondaryLabel = i18n.t("pushPromptNotNow") || "Not now";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSecondary}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleSecondary} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: `${colors.primary}1A` },
            ]}
          >
            <Ionicons name={copy.icon} size={28} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text.secondary }]}>
            {copy.title}
          </Text>

          <Text style={[styles.body, { color: colors.text.tertiary }]}>
            {copy.body}
          </Text>

          {isPermanentlyDenied ? (
            <Text style={[styles.hint, { color: colors.text.tertiary }]}>
              {i18n.t("pushPromptDeniedHint") ||
                "Notifications are turned off for this app. Open Settings to allow them."}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={handlePrimary}
            style={[
              styles.primary,
              { backgroundColor: colors.primary, opacity: busy ? 0.85 : 1 },
            ]}
          >
            {busy ? (
              <ActivityIndicator size="small" color={colors.text.white} />
            ) : (
              <Text style={[styles.primaryText, { color: colors.text.white }]}>
                {primaryLabel}
              </Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={handleSecondary}
            style={styles.secondary}
          >
            <Text
              style={[styles.secondaryText, { color: colors.text.tertiary }]}
            >
              {secondaryLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  primary: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondary: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
