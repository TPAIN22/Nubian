import { Platform, ToastAndroid } from "react-native";
import { toast as sonnerToast } from "sonner-native";

type ToastOpts = { description?: string };

function showAndroid(message: string, opts: ToastOpts | undefined, long: boolean) {
  const text = opts?.description ? `${message}\n${opts.description}` : message;
  ToastAndroid.show(text, long ? ToastAndroid.LONG : ToastAndroid.SHORT);
}

export const toast = {
  success(message: string, opts?: ToastOpts) {
    if (Platform.OS === "android") return showAndroid(message, opts, false);
    try { sonnerToast.success(message, opts as any); } catch {}
  },
  error(message: string, opts?: ToastOpts) {
    if (Platform.OS === "android") return showAndroid(message, opts, true);
    try { sonnerToast.error(message, opts as any); } catch {}
  },
  info(message: string, opts?: ToastOpts) {
    if (Platform.OS === "android") return showAndroid(message, opts, false);
    try { sonnerToast.info(message, opts as any); } catch {}
  },
};

export default toast;
