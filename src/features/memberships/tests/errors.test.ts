import { describe, expect, it } from "bun:test";

import {
  AlreadyMemberError,
  CannotModifyOwnerError,
  InsufficientPermissionsError,
  InvalidRoleAssignmentError,
  MembershipError,
  MembershipNotFoundError,
  NotMemberError,
  OwnerCannotLeaveError,
} from "../errors";

describe("MembershipError", () => {
  it("creates error with message, code, and status", () => {
    const error = new MembershipError("Test error", "MEMBERSHIP_NOT_FOUND", 404);
    expect(error.message).toBe("Test error");
    expect(error.code).toBe("MEMBERSHIP_NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("MembershipError");
  });

  it("is instanceof Error", () => {
    const error = new MembershipError("Test", "MEMBERSHIP_NOT_FOUND", 404);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("MembershipNotFoundError", () => {
  it("creates error with correct defaults", () => {
    const error = new MembershipNotFoundError("membership-123");
    expect(error.message).toBe("Membership not found: membership-123");
    expect(error.code).toBe("MEMBERSHIP_NOT_FOUND");
    expect(error.statusCode).toBe(404);
  });
});

describe("AlreadyMemberError", () => {
  it("creates error with correct defaults", () => {
    const error = new AlreadyMemberError("community-123");
    expect(error.message).toBe("Already a member of community: community-123");
    expect(error.code).toBe("ALREADY_MEMBER");
    expect(error.statusCode).toBe(409);
  });
});

describe("NotMemberError", () => {
  it("creates error with correct defaults", () => {
    const error = new NotMemberError("community-123");
    expect(error.message).toBe("Not a member of community: community-123");
    expect(error.code).toBe("NOT_MEMBER");
    expect(error.statusCode).toBe(404);
  });
});

describe("InsufficientPermissionsError", () => {
  it("creates error with correct defaults", () => {
    const error = new InsufficientPermissionsError("update membership");
    expect(error.message).toBe("Insufficient permissions to: update membership");
    expect(error.code).toBe("INSUFFICIENT_PERMISSIONS");
    expect(error.statusCode).toBe(403);
  });
});

describe("CannotModifyOwnerError", () => {
  it("creates error with correct defaults", () => {
    const error = new CannotModifyOwnerError();
    expect(error.message).toBe("Cannot modify the community owner");
    expect(error.code).toBe("CANNOT_MODIFY_OWNER");
    expect(error.statusCode).toBe(403);
  });
});

describe("OwnerCannotLeaveError", () => {
  it("creates error with correct defaults", () => {
    const error = new OwnerCannotLeaveError();
    expect(error.message).toBe("Owner cannot leave community. Transfer ownership first.");
    expect(error.code).toBe("OWNER_CANNOT_LEAVE");
    expect(error.statusCode).toBe(403);
  });
});

describe("InvalidRoleAssignmentError", () => {
  it("creates error with correct defaults", () => {
    const error = new InvalidRoleAssignmentError("owner");
    expect(error.message).toBe("Cannot assign role: owner");
    expect(error.code).toBe("INVALID_ROLE_ASSIGNMENT");
    expect(error.statusCode).toBe(403);
  });
});
