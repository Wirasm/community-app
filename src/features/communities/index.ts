// Errors
export type { CommunityErrorCode } from "./errors";
export {
  CommunityAccessDeniedError,
  CommunityCreationError,
  CommunityError,
  CommunityNotFoundError,
  SlugExistsError,
} from "./errors";

// Types and Schemas
export type { Community, NewCommunity } from "./models";
export type {
  CheckSlugInput,
  CommunityVisibility,
  CreateCommunityInput,
  UpdateCommunityInput,
} from "./schemas";
export {
  CheckSlugSchema,
  CreateCommunitySchema,
  SLUG_MAX_LENGTH,
  SLUG_MIN_LENGTH,
  SLUG_PATTERN,
  slugSchema,
  UpdateCommunitySchema,
  VISIBILITY_OPTIONS,
} from "./schemas";

// Service functions (public API - repository is NOT exported)
export {
  checkSlugAvailable,
  createCommunity,
  deleteCommunity,
  getCommunitiesByOwner,
  getCommunity,
  getCommunityBySlug,
  getCommunityCount,
  getPublicCommunities,
  updateCommunity,
} from "./service";
