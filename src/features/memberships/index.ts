// Errors
export type { MembershipErrorCode } from "./errors";
export {
  AlreadyMemberError,
  CannotModifyOwnerError,
  InsufficientPermissionsError,
  InvalidRoleAssignmentError,
  MembershipError,
  MembershipNotFoundError,
  NotMemberError,
  OwnerCannotLeaveError,
} from "./errors";

// Types and Schemas
export type { Membership, NewMembership } from "./models";
// Permission helpers
export {
  canAssignRole,
  canBanMembers,
  canManageAdmins,
  canManageModerators,
  canManageRole,
  hasMinimumRole,
} from "./permissions";
export type {
  AssignableRole,
  CommunityRole,
  MembershipResponse,
  MembershipStatus,
  TransferOwnershipInput,
  UpdateMembershipInput,
} from "./schemas";
export {
  ASSIGNABLE_ROLES,
  COMMUNITY_ROLES,
  MEMBERSHIP_STATUSES,
  MembershipResponseSchema,
  ROLE_HIERARCHY,
  TransferOwnershipSchema,
  UpdateMembershipSchema,
} from "./schemas";

// Service functions (public API - repository is NOT exported)
export {
  getCommunityMemberCount,
  getMembership,
  getMembershipByProfileAndCommunity,
  isMember,
  joinCommunity,
  leaveCommunity,
  listActiveCommunityMembers,
  listCommunityMembers,
  removeMember,
  updateMembership,
} from "./service";
