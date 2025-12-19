// Errors
export type { ProfileErrorCode } from "./errors";
export {
  ProfileAccessDeniedError,
  ProfileError,
  ProfileNotFoundError,
  UsernameExistsError,
} from "./errors";

// Types and Schemas
export type { NewProfile, Profile } from "./models";
export type { CheckUsernameInput, ProfileResponse, UpdateProfileInput } from "./schemas";
export { CheckUsernameSchema, ProfileResponseSchema, UpdateProfileSchema } from "./schemas";

// Service functions (public API - repository is NOT exported)
export {
  checkUsernameAvailable,
  getProfile,
  getProfileByUserId,
  getProfileByUsername,
  updateProfile,
} from "./service";
