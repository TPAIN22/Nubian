import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StyleSheet, View, Pressable } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/providers/ThemeProvider";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm action in the danger color. */
  destructive?: boolean;
  onConfirm: () => void;
}

export interface ConfirmSheetRef {
  present: (opts: ConfirmOptions) => void;
  dismiss: () => void;
}

/**
 * Themed, Cairo-typed confirmation sheet — a branded replacement for the native
 * `Alert.alert` destructive-confirm pattern. Mount one instance per screen and
 * drive it imperatively via its ref:
 *
 *   const confirm = useRef<ConfirmSheetRef>(null);
 *   confirm.current?.present({ title, message, destructive: true, onConfirm });
 *   ...
 *   <ConfirmSheet ref={confirm} />
 *
 * Requires a BottomSheetModalProvider ancestor (already mounted at the app root).
 */
export const ConfirmSheet = forwardRef<ConfirmSheetRef, object>(
  function ConfirmSheet(_props, ref) {
    const { theme } = useTheme();
    const colors = theme.colors;
    const insets = useSafeAreaInsets();
    const modalRef = useRef<BottomSheetModal>(null);
    const [opts, setOpts] = useState<ConfirmOptions | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        present: (o: ConfirmOptions) => {
          setOpts(o);
          // present on the next frame so the freshly-set content is measured
          requestAnimationFrame(() => modalRef.current?.present());
        },
        dismiss: () => modalRef.current?.dismiss(),
      }),
      []
    );

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      []
    );

    const handleConfirm = useCallback(() => {
      const cb = opts?.onConfirm;
      modalRef.current?.dismiss();
      // fire after starting the dismiss so the sheet animates out cleanly
      cb?.();
    }, [opts]);

    const handleCancel = useCallback(() => modalRef.current?.dismiss(), []);

    const accent = opts?.destructive
      ? colors.danger || colors.primary
      : colors.primary;

    return (
      <BottomSheetModal
        ref={modalRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.cardBackground }}
        handleIndicatorStyle={{ backgroundColor: colors.borderLight }}
      >
        <BottomSheetView
          style={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        >
          <Text style={[styles.title, { color: colors.text.gray }]}>
            {opts?.title}
          </Text>
          {opts?.message ? (
            <Text style={[styles.message, { color: colors.text.veryLightGray }]}>
              {opts.message}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel={opts?.cancelLabel || "Cancel"}
              style={[
                styles.btn,
                styles.cancelBtn,
                { borderColor: colors.borderLight },
              ]}
            >
              <Text style={[styles.btnText, { color: colors.text.gray }]}>
                {opts?.cancelLabel || "Cancel"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel={opts?.confirmLabel || "Confirm"}
              style={[styles.btn, { backgroundColor: accent }]}
            >
              <Text style={[styles.btnText, { color: "#fff" }]}>
                {opts?.confirmLabel || "Confirm"}
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

ConfirmSheet.displayName = "ConfirmSheet";

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    borderWidth: 1.5,
  },
  btnText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
