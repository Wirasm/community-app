// Errors
export type { StorageErrorCode } from "./errors";
export {
  DeleteFailedError,
  FileTooLargeError,
  InvalidFileTypeError,
  StorageError,
  StorageNotAuthorizedError,
  UploadFailedError,
} from "./errors";
// Hooks (client-side)
export { useFileUpload } from "./hooks/use-file-upload";
// Types and Schemas
export type { AllowedImageType, CommunityImageType } from "./schemas";
export {
  ALLOWED_IMAGE_TYPES,
  BUCKET_AVATARS,
  BUCKET_COMMUNITIES,
  getExtensionFromMimeType,
  isAllowedImageType,
  MAX_AVATAR_SIZE,
  MAX_COMMUNITY_IMAGE_SIZE,
} from "./schemas";
// Service functions (public API)
export {
  deleteAvatar,
  deleteCommunityImage,
  getPublicUrl,
  uploadAvatar,
  uploadCommunityImage,
} from "./service";
