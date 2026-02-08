/**
 * Image Compression Utility for React Native / Expo
 * 
 * Compresses images before upload to reduce file size while maintaining quality.
 * Uses expo-image-manipulator for client-side compression.
 * 
 * Features:
 * - Converts images to WebP format (optimal compression)
 * - Resizes large images (max width: 1920px)
 * - Preserves aspect ratio
 * - Skips compression for small files (<500KB)
 * - Handles multiple images
 * - Graceful error handling
 */

import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Compression settings - easily adjustable
 */
export const COMPRESSION_CONFIG = {
  /** Maximum width in pixels. Images wider than this will be resized. */
  MAX_WIDTH: 1920,
  
  /** Output format - WebP provides excellent compression with good quality */
  OUTPUT_FORMAT: ImageManipulator.SaveFormat.WEBP,
  
  /** Quality setting (0-1). 0.75 is a good balance of size and quality */
  QUALITY: 0.75,
  
  /** Files smaller than this (in bytes) will skip compression */
  MIN_SIZE_FOR_COMPRESSION: 500 * 1024, // 500KB
  
  /** Supported input formats (lowercase) */
  SUPPORTED_FORMATS: ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"],
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface CompressionResult {
  /** URI of the compressed image (local file path) */
  uri: string;
  
  /** Width of the compressed image */
  width: number;
  
  /** Height of the compressed image */
  height: number;
  
  /** Whether the image was actually compressed or skipped */
  wasCompressed: boolean;
  
  /** Original file size in bytes (if available) */
  originalSize?: number;
  
  /** New file size in bytes (if available) */
  newSize?: number;
  
  /** Compression ratio (e.g., 0.6 means 60% of original size) */
  compressionRatio?: number;
}

export interface CompressionOptions {
  /** Maximum width (default: 1920) */
  maxWidth?: number;
  
  /** Quality 0-1 (default: 0.75) */
  quality?: number;
  
  /** Minimum file size in bytes to trigger compression (default: 500KB) */
  minSizeForCompression?: number;
  
  /** Force compression even for small files */
  forceCompress?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get file size in bytes from a local file URI
 */
async function getFileSize(uri: string): Promise<number | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && "size" in info) {
      return info.size as number;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract file extension from URI (lowercase)
 */
function getFileExtension(uri: string): string {
  const parts = uri.split(".");
  if (parts.length > 1) {
    // Handle query params in URI
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      return (lastPart.split("?")[0] ?? "").toLowerCase();
    }
  }
  return "";
}

/**
 * Check if the file format is supported for compression
 */
function isSupportedFormat(uri: string): boolean {
  const ext = getFileExtension(uri);
  return COMPRESSION_CONFIG.SUPPORTED_FORMATS.includes(ext as any);
}

// ============================================================================
// MAIN COMPRESSION FUNCTION
// ============================================================================

/**
 * Compress a single image
 * 
 * @param imageUri - Local file URI of the image to compress
 * @param options - Optional compression settings
 * @returns Promise<CompressionResult> - Compressed image info
 * 
 * @example
 * ```ts
 * const result = await compressImage(selectedImageUri);
 * console.log(`Compressed: ${result.wasCompressed}, Size: ${result.newSize}`);
 * // Use result.uri for upload
 * ```
 */
export async function compressImage(
  imageUri: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = COMPRESSION_CONFIG.MAX_WIDTH,
    quality = COMPRESSION_CONFIG.QUALITY,
    minSizeForCompression = COMPRESSION_CONFIG.MIN_SIZE_FOR_COMPRESSION,
    forceCompress = false,
  } = options;

  // Validate input
  if (!imageUri) {
    throw new Error("COMPRESS_ERROR: No image URI provided");
  }

  // Check file format
  if (!isSupportedFormat(imageUri)) {
    const ext = getFileExtension(imageUri);
    console.warn(`compressImage: Unsupported format "${ext}", returning original`);
    return {
      uri: imageUri,
      width: 0,
      height: 0,
      wasCompressed: false,
    };
  }

  // Get original file size
  const originalSize = await getFileSize(imageUri);

  // Skip compression for small files (unless forced)
  if (!forceCompress && originalSize !== null && originalSize < minSizeForCompression) {
    console.log(
      `compressImage: Skipping (${(originalSize / 1024).toFixed(1)}KB < ${(minSizeForCompression / 1024).toFixed(0)}KB threshold)`
    );
    return {
      uri: imageUri,
      width: 0,
      height: 0,
      wasCompressed: false,
      originalSize,
    };
  }

  try {
    // Step 1: Get image dimensions to calculate resize ratio
    // We first manipulate with empty actions to get dimensions
    const probeResult = await ImageManipulator.manipulateAsync(imageUri, []);
    const { width: originalWidth, height: originalHeight } = probeResult;

    // Step 2: Determine if resize is needed
    const actions: ImageManipulator.Action[] = [];
    
    if (originalWidth > maxWidth) {
      // Calculate new dimensions preserving aspect ratio
      const ratio = maxWidth / originalWidth;
      const newHeight = Math.round(originalHeight * ratio);
      
      actions.push({
        resize: {
          width: maxWidth,
          height: newHeight,
        },
      });
    }

    // Step 3: Apply compression with WebP format
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      actions,
      {
        compress: quality,
        format: COMPRESSION_CONFIG.OUTPUT_FORMAT,
      }
    );

    // Step 4: Get new file size for stats
    const newSize = await getFileSize(result.uri);
    
    const compressionRatio = 
      originalSize && newSize 
        ? newSize / originalSize 
        : undefined;

    console.log(
      `compressImage: Success ` +
      `${originalWidth}x${originalHeight} → ${result.width}x${result.height}, ` +
      `${originalSize ? (originalSize / 1024).toFixed(1) + "KB" : "?KB"} → ` +
      `${newSize ? (newSize / 1024).toFixed(1) + "KB" : "?KB"} ` +
      `(${compressionRatio ? (compressionRatio * 100).toFixed(0) + "%" : "?%"})`
    );

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      wasCompressed: true,
      originalSize: originalSize || undefined,
      newSize: newSize || undefined,
      compressionRatio,
    };

  } catch (error: any) {
    // Graceful error handling - return original on failure
    console.error("compressImage: Compression failed, returning original:", error?.message);
    return {
      uri: imageUri,
      width: 0,
      height: 0,
      wasCompressed: false,
      originalSize: originalSize || undefined,
    };
  }
}

// ============================================================================
// BATCH COMPRESSION
// ============================================================================

/**
 * Compress multiple images in parallel
 * 
 * @param imageUris - Array of local file URIs
 * @param options - Optional compression settings
 * @returns Promise<CompressionResult[]> - Array of compression results
 * 
 * @example
 * ```ts
 * const results = await compressImages([uri1, uri2, uri3]);
 * const compressedUris = results.map(r => r.uri);
 * ```
 */
export async function compressImages(
  imageUris: string[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> {
  if (!imageUris.length) {
    return [];
  }

  // Process in parallel for better performance
  const results = await Promise.all(
    imageUris.map((uri) => compressImage(uri, options))
  );

  // Log summary
  const compressed = results.filter((r) => r.wasCompressed);
  const totalOriginal = results.reduce((sum, r) => sum + (r.originalSize || 0), 0);
  const totalNew = results.reduce((sum, r) => sum + (r.newSize || r.originalSize || 0), 0);

  console.log(
    `compressImages: ${compressed.length}/${results.length} images compressed, ` +
    `total: ${(totalOriginal / 1024).toFixed(1)}KB → ${(totalNew / 1024).toFixed(1)}KB`
  );

  return results;
}

// ============================================================================
// CONVENIENCE FUNCTION FOR IMAGEKIT INTEGRATION
// ============================================================================

/**
 * Compress an image and return just the URI for uploading
 * This is a convenience wrapper for direct integration with upload flows.
 * 
 * @param imageUri - Local file URI of the image
 * @returns Promise<string> - Compressed image URI (or original if skipped/failed)
 * 
 * @example
 * ```ts
 * // In your image picker callback:
 * const compressedUri = await prepareImageForUpload(selectedUri);
 * const uploadedUrl = await uploadImageToImageKit(compressedUri);
 * ```
 */
export async function prepareImageForUpload(imageUri: string): Promise<string> {
  const result = await compressImage(imageUri);
  return result.uri;
}
