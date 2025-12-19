import { describe, expect, it } from "bun:test";

import {
  canAssignRole,
  canBanMembers,
  canManageAdmins,
  canManageModerators,
  canManageRole,
  hasMinimumRole,
} from "../permissions";

describe("canManageRole", () => {
  it("owner can manage all other roles", () => {
    expect(canManageRole("owner", "co_owner")).toBe(true);
    expect(canManageRole("owner", "admin")).toBe(true);
    expect(canManageRole("owner", "moderator")).toBe(true);
    expect(canManageRole("owner", "member")).toBe(true);
  });

  it("owner cannot manage owner", () => {
    expect(canManageRole("owner", "owner")).toBe(false);
  });

  it("co_owner can manage admin, moderator, member", () => {
    expect(canManageRole("co_owner", "admin")).toBe(true);
    expect(canManageRole("co_owner", "moderator")).toBe(true);
    expect(canManageRole("co_owner", "member")).toBe(true);
  });

  it("co_owner cannot manage owner or co_owner", () => {
    expect(canManageRole("co_owner", "owner")).toBe(false);
    expect(canManageRole("co_owner", "co_owner")).toBe(false);
  });

  it("admin can manage moderator and member", () => {
    expect(canManageRole("admin", "moderator")).toBe(true);
    expect(canManageRole("admin", "member")).toBe(true);
  });

  it("admin cannot manage owner, co_owner, or admin", () => {
    expect(canManageRole("admin", "owner")).toBe(false);
    expect(canManageRole("admin", "co_owner")).toBe(false);
    expect(canManageRole("admin", "admin")).toBe(false);
  });

  it("moderator can manage member", () => {
    expect(canManageRole("moderator", "member")).toBe(true);
  });

  it("moderator cannot manage owner, co_owner, admin, or moderator", () => {
    expect(canManageRole("moderator", "owner")).toBe(false);
    expect(canManageRole("moderator", "co_owner")).toBe(false);
    expect(canManageRole("moderator", "admin")).toBe(false);
    expect(canManageRole("moderator", "moderator")).toBe(false);
  });

  it("member cannot manage anyone", () => {
    expect(canManageRole("member", "owner")).toBe(false);
    expect(canManageRole("member", "co_owner")).toBe(false);
    expect(canManageRole("member", "admin")).toBe(false);
    expect(canManageRole("member", "moderator")).toBe(false);
    expect(canManageRole("member", "member")).toBe(false);
  });
});

describe("canAssignRole", () => {
  it("owner can assign co_owner, admin, moderator, member", () => {
    expect(canAssignRole("owner", "co_owner")).toBe(true);
    expect(canAssignRole("owner", "admin")).toBe(true);
    expect(canAssignRole("owner", "moderator")).toBe(true);
    expect(canAssignRole("owner", "member")).toBe(true);
  });

  it("co_owner can assign admin, moderator, member", () => {
    expect(canAssignRole("co_owner", "admin")).toBe(true);
    expect(canAssignRole("co_owner", "moderator")).toBe(true);
    expect(canAssignRole("co_owner", "member")).toBe(true);
  });

  it("co_owner cannot assign co_owner", () => {
    expect(canAssignRole("co_owner", "co_owner")).toBe(false);
  });

  it("admin can assign moderator, member", () => {
    expect(canAssignRole("admin", "moderator")).toBe(true);
    expect(canAssignRole("admin", "member")).toBe(true);
  });

  it("admin cannot assign co_owner or admin", () => {
    expect(canAssignRole("admin", "co_owner")).toBe(false);
    expect(canAssignRole("admin", "admin")).toBe(false);
  });

  it("moderator can assign member", () => {
    expect(canAssignRole("moderator", "member")).toBe(true);
  });

  it("moderator cannot assign moderator or above", () => {
    expect(canAssignRole("moderator", "co_owner")).toBe(false);
    expect(canAssignRole("moderator", "admin")).toBe(false);
    expect(canAssignRole("moderator", "moderator")).toBe(false);
  });

  it("member cannot assign any role", () => {
    expect(canAssignRole("member", "co_owner")).toBe(false);
    expect(canAssignRole("member", "admin")).toBe(false);
    expect(canAssignRole("member", "moderator")).toBe(false);
    expect(canAssignRole("member", "member")).toBe(false);
  });
});

describe("hasMinimumRole", () => {
  it("owner has all roles", () => {
    expect(hasMinimumRole("owner", "owner")).toBe(true);
    expect(hasMinimumRole("owner", "co_owner")).toBe(true);
    expect(hasMinimumRole("owner", "admin")).toBe(true);
    expect(hasMinimumRole("owner", "moderator")).toBe(true);
    expect(hasMinimumRole("owner", "member")).toBe(true);
  });

  it("member has only member role", () => {
    expect(hasMinimumRole("member", "owner")).toBe(false);
    expect(hasMinimumRole("member", "co_owner")).toBe(false);
    expect(hasMinimumRole("member", "admin")).toBe(false);
    expect(hasMinimumRole("member", "moderator")).toBe(false);
    expect(hasMinimumRole("member", "member")).toBe(true);
  });
});

describe("canBanMembers", () => {
  it("moderator and above can ban", () => {
    expect(canBanMembers("owner")).toBe(true);
    expect(canBanMembers("co_owner")).toBe(true);
    expect(canBanMembers("admin")).toBe(true);
    expect(canBanMembers("moderator")).toBe(true);
  });

  it("member cannot ban", () => {
    expect(canBanMembers("member")).toBe(false);
  });
});

describe("canManageAdmins", () => {
  it("owner and co_owner can manage admins", () => {
    expect(canManageAdmins("owner")).toBe(true);
    expect(canManageAdmins("co_owner")).toBe(true);
  });

  it("admin and below cannot manage admins", () => {
    expect(canManageAdmins("admin")).toBe(false);
    expect(canManageAdmins("moderator")).toBe(false);
    expect(canManageAdmins("member")).toBe(false);
  });
});

describe("canManageModerators", () => {
  it("admin and above can manage moderators", () => {
    expect(canManageModerators("owner")).toBe(true);
    expect(canManageModerators("co_owner")).toBe(true);
    expect(canManageModerators("admin")).toBe(true);
  });

  it("moderator and below cannot manage moderators", () => {
    expect(canManageModerators("moderator")).toBe(false);
    expect(canManageModerators("member")).toBe(false);
  });
});
