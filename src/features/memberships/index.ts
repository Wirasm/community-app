// Errors
export type { MembershipErrorCode } from "./errors";
export {
  AlreadyMemberError,
  BannedUserError,
  CannotModifyOwnerError,
  DatabaseError,
  InsufficientPermissionsError,
  InvalidRoleAssignmentError,
  MembershipCreationFailedError,
  MembershipDeleteFailedError,
  MembershipError,
  MembershipNotFoundError,
  NotMemberError,
  OwnerCannotLeaveError,
  OwnershipTransferFailedError,
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
  ListMembersQuery,
  MembershipResponse,
  MembershipStatus,
  TransferOwnershipInput,
  UpdateMembershipInput,
} from "./schemas";
export {
  ASSIGNABLE_ROLES,
  COMMUNITY_ROLES,
  ListMembersQuerySchema,
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
  listCommunityMembersPaginated,
  removeMember,
  transferOwnership,
  updateMembership,
} from "./service";
