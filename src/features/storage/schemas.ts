/** Allowed image MIME types for uploads. */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/** Maximum file sizes in bytes. */
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_COMMUNITY_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

/** Storage bucket names. */
export const BUCKET_AVATARS = "avatars";
export const BUCKET_COMMUNITIES = "communities";

/**
 * Get file extension from MIME type.
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return extensions[mimeType] ?? "bin";
}

/**
 * Check if a MIME type is allowed.
 */
export function isAllowedImageType(mimeType: string): mimeType is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType);
}
