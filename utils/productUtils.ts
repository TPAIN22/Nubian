// utils/productUtils.ts
// Keep only non-business, non-schema helpers here.
// Product schema logic must live in `/domain/product`.

const safeStr = (v: unknown) => String(v ?? "").trim();

export const cleanImages = (images: any): string[] => {
  if (!Array.isArray(images)) return [];
  return images.map((x) => safeStr(x)).filter((x) => x.length > 0);
};

