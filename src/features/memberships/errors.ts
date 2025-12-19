import type { HttpStatusCode } from "@/core/api/errors";

import type { CommunityRole } from "./schemas";

/** Known error codes for membership operations. */
export type MembershipErrorCode =
  | "MEMBERSHIP_NOT_FOUND"
  | "ALREADY_MEMBER"
  | "NOT_MEMBER"
  | "INSUFFICIENT_PERMISSIONS"
  | "CANNOT_MODIFY_OWNER"
  | "OWNER_CANNOT_LEAVE"
  | "INVALID_ROLE_ASSIGNMENT";

/**
 * Base error for membership-related errors.
 */
export class MembershipError extends Error {
  readonly code: MembershipErrorCode;
  readonly statusCode: HttpStatusCode;

  constructor(message: string, code: MembershipErrorCode, statusCode: HttpStatusCode) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class MembershipNotFoundError extends MembershipError {
  constructor(identifier: string) {
    super(`Membership not found: ${identifier}`, "MEMBERSHIP_NOT_FOUND", 404);
  }
}

export class AlreadyMemberError extends MembershipError {
  constructor(communityId: string) {
    super(`Already a member of community: ${communityId}`, "ALREADY_MEMBER", 409);
  }
}

export class NotMemberError extends MembershipError {
  constructor(communityId: string) {
    super(`Not a member of community: ${communityId}`, "NOT_MEMBER", 404);
  }
}

export class InsufficientPermissionsError extends MembershipError {
  constructor(action: string) {
    super(`Insufficient permissions to: ${action}`, "INSUFFICIENT_PERMISSIONS", 403);
  }
}

export class CannotModifyOwnerError extends MembershipError {
  constructor() {
    super("Cannot modify the community owner", "CANNOT_MODIFY_OWNER", 403);
  }
}

export class OwnerCannotLeaveError extends MembershipError {
  constructor() {
    super("Owner cannot leave community. Transfer ownership first.", "OWNER_CANNOT_LEAVE", 403);
  }
}

export class InvalidRoleAssignmentError extends MembershipError {
  constructor(role: CommunityRole) {
    super(`Cannot assign role: ${role}`, "INVALID_ROLE_ASSIGNMENT", 403);
  }
}
