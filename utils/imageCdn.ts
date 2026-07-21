import { PixelRatio } from "react-native";

// ImageKit is the image CDN (see utils/imageKitUpload.ts — urlEndpoint
// https://ik.imagekit.io). Rendering full-resolution uploads at card/banner
// sizes wastes bandwidth and decode time, so we ask ImageKit for a rendition
// sized to the actual layout box (times device pixel ratio, capped).
//
// Transform is appended as a query param (`?tr=w-<px>,q-75,f-auto`):
//   w      — target width in device pixels
//   q-75   — quality 75 (visually lossless at these sizes, ~half the bytes)
//   f-auto — negotiate WebP/AVIF when the client supports it
const MAX_CDN_WIDTH = 1600;

/**
 * Return an ImageKit URL resized to `layoutWidth` (in dp). Non-ImageKit URLs
 * and falsy inputs are returned unchanged, so this is always safe to wrap
 * around a `uri`.
 */
export function ikResize(url: string | null | undefined, layoutWidth: number): string | null {
  if (!url || !url.includes("ik.imagekit.io")) return url ?? null;
  // Cap DPR at 3 — beyond that the extra pixels aren't perceptible and just
  // cost bytes on very high-density panels.
  const dpr = Math.min(PixelRatio.get(), 3);
  const w = Math.min(Math.ceil(layoutWidth * dpr), MAX_CDN_WIDTH);
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}tr=w-${w},q-75,f-auto`;
}
