import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";

import {
  DeleteFailedError,
  FileTooLargeError,
  InvalidFileTypeError,
  UploadFailedError,
} from "./errors";
import {
  ALLOWED_IMAGE_TYPES,
  BUCKET_AVATARS,
  BUCKET_COMMUNITIES,
  getExtensionFromMimeType,
  isAllowedImageType,
  MAX_AVATAR_SIZE,
  MAX_COMMUNITY_IMAGE_SIZE,
} from "./schemas";

const logger = getLogger("storage.service");

/** Result of a delete operation */
export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Validate file size and type.
 */
function validateFile(file: File, maxSize: number, allowedTypes: readonly string[]): void {
  if (file.size > maxSize) {
    throw new FileTooLargeError(maxSize);
  }
  if (!isAllowedImageType(file.type)) {
    throw new InvalidFileTypeError(allowedTypes);
  }
}

/**
 * Delete all files in a folder within a bucket.
 * Returns a result indicating success or failure instead of throwing.
 */
async function deleteFolder(bucket: string, folderPath: string): Promise<DeleteResult> {
  const supabase = await createClient();

  const { data: files, error: listError } = await supabase.storage.from(bucket).list(folderPath);

  if (listError) {
    logger.error({ bucket, folderPath, error: listError.message }, "storage.list_failed");
    return { success: false, error: `Failed to list files: ${listError.message}` };
  }

  if (files && files.length > 0) {
    const filePaths = files.map((f) => `${folderPath}/${f.name}`);
    const { error: deleteError } = await supabase.storage.from(bucket).remove(filePaths);

    if (deleteError) {
      logger.error(
        { bucket, folderPath, filePaths, error: deleteError.message },
        "storage.delete_failed",
      );
      return { success: false, error: `Failed to delete files: ${deleteError.message}` };
    }
    logger.info({ bucket, count: filePaths.length }, "storage.old_files_deleted");
  }

  return { success: true };
}

/**
 * Get public URL for a file in a bucket.
 */
export async function getPublicUrl(bucket: string, filePath: string): Promise<string> {
  const supabase = await createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Upload a user avatar.
 * Deletes existing avatar before uploading new one.
 */
export async function uploadAvatar(profileId: string, file: File): Promise<string> {
  logger.info(
    { profileId, fileSize: file.size, fileType: file.type },
    "storage.upload_avatar_started",
  );

  validateFile(file, MAX_AVATAR_SIZE, ALLOWED_IMAGE_TYPES);

  const supabase = await createClient();
  const folderPath = profileId;
  const extension = getExtensionFromMimeType(file.type);
  const fileName = `${Date.now()}.${extension}`;
  const filePath = `${folderPath}/${fileName}`;

  // Delete old avatar(s) in the folder
  await deleteFolder(BUCKET_AVATARS, folderPath);

  // Upload new file
  const { data, error } = await supabase.storage.from(BUCKET_AVATARS).upload(filePath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    logger.error({ profileId, error: error.message }, "storage.upload_avatar_failed");
    throw new UploadFailedError(error.message);
  }

  const url = await getPublicUrl(BUCKET_AVATARS, data.path);

  logger.info({ profileId, url }, "storage.upload_avatar_completed");
  return url;
}

/**
 * Upload a community image (logo or banner).
 * Deletes existing image of same type before uploading new one.
 */
export async function uploadCommunityImage(
  communityId: string,
  imageType: "logo" | "banner",
  file: File,
): Promise<string> {
  logger.info(
    { communityId, imageType, fileSize: file.size, fileType: file.type },
    "storage.upload_community_image_started",
  );

  validateFile(file, MAX_COMMUNITY_IMAGE_SIZE, ALLOWED_IMAGE_TYPES);

  const supabase = await createClient();
  const folderPath = `${communityId}/${imageType}`;
  const extension = getExtensionFromMimeType(file.type);
  const fileName = `${Date.now()}.${extension}`;
  const filePath = `${folderPath}/${fileName}`;

  // Delete old image(s) in the folder
  await deleteFolder(BUCKET_COMMUNITIES, folderPath);

  // Upload new file
  const { data, error } = await supabase.storage.from(BUCKET_COMMUNITIES).upload(filePath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    logger.error(
      { communityId, imageType, error: error.message },
      "storage.upload_community_image_failed",
    );
    throw new UploadFailedError(error.message);
  }

  const url = await getPublicUrl(BUCKET_COMMUNITIES, data.path);

  logger.info({ communityId, imageType, url }, "storage.upload_community_image_completed");
  return url;
}

/**
 * Delete a user's avatar folder.
 * Throws DeleteFailedError if the operation fails.
 */
export async function deleteAvatar(profileId: string): Promise<void> {
  logger.info({ profileId }, "storage.delete_avatar_started");

  const result = await deleteFolder(BUCKET_AVATARS, profileId);

  if (!result.success) {
    logger.error({ profileId, error: result.error }, "storage.delete_avatar_failed");
    throw new DeleteFailedError(result.error ?? "Unknown error");
  }

  logger.info({ profileId }, "storage.delete_avatar_completed");
}

/**
 * Delete a community image folder.
 * Throws DeleteFailedError if the operation fails.
 */
export async function deleteCommunityImage(
  communityId: string,
  imageType: "logo" | "banner",
): Promise<void> {
  logger.info({ communityId, imageType }, "storage.delete_community_image_started");

  const result = await deleteFolder(BUCKET_COMMUNITIES, `${communityId}/${imageType}`);

  if (!result.success) {
    logger.error(
      { communityId, imageType, error: result.error },
      "storage.delete_community_image_failed",
    );
    throw new DeleteFailedError(result.error ?? "Unknown error");
  }

  logger.info({ communityId, imageType }, "storage.delete_community_image_completed");
}
