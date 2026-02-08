import axiosInstance from "@/services/api/client";
import * as FileSystem from "expo-file-system/legacy";
import { compressImage } from "./compressImage";

interface ImageKitAuthParams {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint?: string;
}

type AnyObj = Record<string, any>;

function pickAuthParams(payload: AnyObj): ImageKitAuthParams | null {
  const candidates: AnyObj[] = [];

  if (payload && typeof payload === "object") candidates.push(payload);
  if (payload?.data && typeof payload.data === "object") candidates.push(payload.data);
  if (payload?.data?.data && typeof payload.data.data === "object") candidates.push(payload.data.data);
  if (payload?.auth && typeof payload.auth === "object") candidates.push(payload.auth);
  if (payload?.data?.auth && typeof payload.data.auth === "object") candidates.push(payload.data.auth);

  for (const c of candidates) {
    const token = c?.token;
    const expire = c?.expire;
    const signature = c?.signature;
    const publicKey = c?.publicKey;
    const urlEndpoint = c?.urlEndpoint;

    if (
      typeof token === "string" &&
      typeof signature === "string" &&
      typeof publicKey === "string" &&
      (typeof expire === "number" || typeof expire === "string")
    ) {
      return {
        token,
        signature,
        publicKey,
        expire: typeof expire === "string" ? Number(expire) : expire,
        urlEndpoint,
      };
    }
  }

  return null;
}

function guessMimeFromUri(uri: string) {
  const u = uri.toLowerCase();
  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function guessExtFromMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export const uploadImageToImageKit = async (imageUri: string): Promise<string> => {
  // 1) Compress image before upload (converts to WebP, resizes if >1920px)
  // This reduces file size significantly while maintaining quality
  const compressionResult = await compressImage(imageUri);
  const compressedUri = compressionResult.uri;
  
  if (compressionResult.wasCompressed) {
    console.log(
      `ImageKit: Image compressed - ` +
      `${((compressionResult.originalSize || 0) / 1024).toFixed(1)}KB → ` +
      `${((compressionResult.newSize || 0) / 1024).toFixed(1)}KB`
    );
  }

  // 2) auth
  const authResponse = await axiosInstance.get("/upload/imagekit-auth");
  const authParams = pickAuthParams(authResponse?.data);

  if (!authParams) {
    const preview = JSON.stringify(authResponse?.data ?? {}, null, 2).slice(0, 1500);
    console.error("ImageKit auth response invalid:", preview);
    throw new Error("IMAGEKIT_AUTH_INVALID_RESPONSE");
  }

  // 3) base64 - Use compressed URI and WebP mime type
  // After compression, the image is always WebP format
  const mime = compressionResult.wasCompressed ? "image/webp" : guessMimeFromUri(compressedUri);
  const ext = compressionResult.wasCompressed ? "webp" : guessExtFromMime(mime);

  const base64 = await FileSystem.readAsStringAsync(compressedUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // IMPORTANT: ImageKit expects "file" to be either
  // - binary file (multipart)
  // - base64 string (NOT necessarily data URL, but data URL works too)
  // We'll send multipart/form-data with file as data URL (works reliably).
  const fileName = `payment-proof-${Date.now()}.${ext}`;

  // 3) multipart upload
  const form = new FormData();
  form.append("file", `data:${mime};base64,${base64}` as any);
  form.append("fileName", fileName as any);
  form.append("publicKey", authParams.publicKey as any);
  form.append("signature", authParams.signature as any);
  form.append("expire", String(authParams.expire) as any);
  form.append("token", authParams.token as any);
  form.append("folder", "/payment-proofs/" as any);
  form.append("useUniqueFileName", "true" as any);

  const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    // ⚠️ لا تحدد Content-Type هنا — fetch هيضيف boundary تلقائيًا
    body: form,
  });

  const json = await uploadRes.json().catch(() => ({} as AnyObj));

  if (!uploadRes.ok) {
    const msg =
      json?.message ||
      json?.error?.message ||
      json?.error ||
      `Upload failed with status ${uploadRes.status}`;
    console.error("ImageKit upload failed:", json);
    throw new Error(msg);
  }

  const url: string | undefined = json?.url || json?.filePath;

  if (!url) {
    console.error("ImageKit upload response missing url:", json);
    throw new Error("UPLOAD_SUCCEEDED_BUT_NO_URL");
  }

  if (url.startsWith("http")) return url;

  const endpoint = authParams.urlEndpoint || "https://ik.imagekit.io";
  return `${endpoint}/${String(url).replace(/^\//, "")}`;
};
