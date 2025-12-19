import { describe, expect, it } from "bun:test";

import {
  MembershipResponseSchema,
  TransferOwnershipSchema,
  UpdateMembershipSchema,
} from "../schemas";

describe("UpdateMembershipSchema", () => {
  it("accepts valid complete input", () => {
    const input = {
      role: "admin",
      status: "active",
    };
    const result = UpdateMembershipSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts partial input (all fields optional)", () => {
    const result = UpdateMembershipSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts role-only update", () => {
    const result = UpdateMembershipSchema.safeParse({ role: "moderator" });
    expect(result.success).toBe(true);
  });

  it("accepts status-only update", () => {
    const result = UpdateMembershipSchema.safeParse({ status: "banned" });
    expect(result.success).toBe(true);
  });

  describe("role validation", () => {
    it("rejects owner role", () => {
      const result = UpdateMembershipSchema.safeParse({ role: "owner" });
      expect(result.success).toBe(false);
    });

    it("accepts co_owner role", () => {
      const result = UpdateMembershipSchema.safeParse({ role: "co_owner" });
      expect(result.success).toBe(true);
    });

    it("accepts admin role", () => {
      const result = UpdateMembershipSchema.safeParse({ role: "admin" });
      expect(result.success).toBe(true);
    });

    it("accepts moderator role", () => {
      const result = UpdateMembershipSchema.safeParse({ role: "moderator" });
      expect(result.success).toBe(true);
    });

    it("accepts member role", () => {
      const result = UpdateMembershipSchema.safeParse({ role: "member" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid role", () => {
      const result = UpdateMembershipSchema.safeParse({ role: "superadmin" });
      expect(result.success).toBe(false);
    });
  });

  describe("status validation", () => {
    it("accepts active status", () => {
      const result = UpdateMembershipSchema.safeParse({ status: "active" });
      expect(result.success).toBe(true);
    });

    it("accepts pending status", () => {
      const result = UpdateMembershipSchema.safeParse({ status: "pending" });
      expect(result.success).toBe(true);
    });

    it("accepts banned status", () => {
      const result = UpdateMembershipSchema.safeParse({ status: "banned" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const result = UpdateMembershipSchema.safeParse({ status: "suspended" });
      expect(result.success).toBe(false);
    });
  });
});

describe("TransferOwnershipSchema", () => {
  it("accepts valid UUID", () => {
    const result = TransferOwnershipSchema.safeParse({
      newOwnerProfileId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing newOwnerProfileId", () => {
    const result = TransferOwnershipSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID format", () => {
    const result = TransferOwnershipSchema.safeParse({
      newOwnerProfileId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("MembershipResponseSchema", () => {
  it("validates complete membership response", () => {
    const membership = {
      membershipId: "550e8400-e29b-41d4-a716-446655440000",
      communityId: "550e8400-e29b-41d4-a716-446655440001",
      profileId: "550e8400-e29b-41d4-a716-446655440002",
      role: "member" as const,
      status: "active" as const,
      invitedByProfileId: null,
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = MembershipResponseSchema.safeParse(membership);
    expect(result.success).toBe(true);
  });

  it("validates membership with invitedByProfileId", () => {
    const membership = {
      membershipId: "550e8400-e29b-41d4-a716-446655440000",
      communityId: "550e8400-e29b-41d4-a716-446655440001",
      profileId: "550e8400-e29b-41d4-a716-446655440002",
      role: "admin" as const,
      status: "active" as const,
      invitedByProfileId: "550e8400-e29b-41d4-a716-446655440003",
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = MembershipResponseSchema.safeParse(membership);
    expect(result.success).toBe(true);
  });

  it("rejects invalid role in response", () => {
    const membership = {
      membershipId: "550e8400-e29b-41d4-a716-446655440000",
      communityId: "550e8400-e29b-41d4-a716-446655440001",
      profileId: "550e8400-e29b-41d4-a716-446655440002",
      role: "superadmin",
      status: "active",
      invitedByProfileId: null,
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = MembershipResponseSchema.safeParse(membership);
    expect(result.success).toBe(false);
  });
});
