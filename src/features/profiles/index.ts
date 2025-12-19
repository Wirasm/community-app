// Errors
export type { ProfileErrorCode } from "./errors";
export {
  ProfileAccessDeniedError,
  ProfileCreationError,
  ProfileError,
  ProfileNotFoundError,
  UsernameExistsError,
} from "./errors";

// Types and Schemas
export type { NewProfile, Profile } from "./models";
export type {
  CheckUsernameInput,
  PlatformRole,
  ProfileResponse,
  UpdateProfileInput,
} from "./schemas";
export {
  CheckUsernameSchema,
  PLATFORM_ROLES,
  ProfileResponseSchema,
  UpdateProfileSchema,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
  usernameSchema,
} from "./schemas";

// Service functions (public API - repository is NOT exported)
export {
  checkUsernameAvailable,
  getProfile,
  getProfileByUserId,
  getProfileByUsername,
  updateProfile,
} from "./service";
