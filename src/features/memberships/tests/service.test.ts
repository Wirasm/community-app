import { beforeEach, describe, expect, it, mock } from "bun:test";

import type { Membership } from "../models";

const mockMembership: Membership = {
  membershipId: "550e8400-e29b-41d4-a716-446655440000",
  communityId: "550e8400-e29b-41d4-a716-446655440001",
  profileId: "550e8400-e29b-41d4-a716-446655440002",
  role: "member",
  status: "active",
  invitedByProfileId: null,
  joinedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ownerMembership: Membership = {
  ...mockMembership,
  membershipId: "550e8400-e29b-41d4-a716-446655440010",
  profileId: "550e8400-e29b-41d4-a716-446655440003",
  role: "owner",
};

const adminMembership: Membership = {
  ...mockMembership,
  membershipId: "550e8400-e29b-41d4-a716-446655440011",
  profileId: "550e8400-e29b-41d4-a716-446655440004",
  role: "admin",
};

// Mock the repository module with properly typed functions
const mockRepository = {
  findById: mock<(membershipId: string) => Promise<Membership | undefined>>(() =>
    Promise.resolve(undefined),
  ),
  findByProfileAndCommunity: mock<
    (profileId: string, communityId: string) => Promise<Membership | undefined>
  >(() => Promise.resolve(undefined)),
  findByCommunity: mock<(communityId: string) => Promise<Membership[]>>(() => Promise.resolve([])),
  findActiveByCommunity: mock<(communityId: string) => Promise<Membership[]>>(() =>
    Promise.resolve([]),
  ),
  countByCommunity: mock<(communityId: string) => Promise<number>>(() => Promise.resolve(0)),
  create: mock<(data: unknown) => Promise<Membership>>(() => Promise.resolve(mockMembership)),
  update: mock<(membershipId: string, data: unknown) => Promise<Membership | undefined>>(() =>
    Promise.resolve(undefined),
  ),
  deleteById: mock<(membershipId: string) => Promise<boolean>>(() => Promise.resolve(true)),
  membershipExists: mock<(profileId: string, communityId: string) => Promise<boolean>>(() =>
    Promise.resolve(false),
  ),
};

// Mock the repository before importing service
mock.module("../repository", () => mockRepository);

// Import service after mocking
const {
  getMembership,
  getMembershipByProfileAndCommunity,
  listCommunityMembers,
  listActiveCommunityMembers,
  getCommunityMemberCount,
  joinCommunity,
  leaveCommunity,
  updateMembership,
  removeMember,
  isMember,
} = await import("../service");

describe("getMembership", () => {
  beforeEach(() => {
    mockRepository.findById.mockReset();
  });

  it("returns membership when found", async () => {
    mockRepository.findById.mockResolvedValue(mockMembership);

    const result = await getMembership(mockMembership.membershipId);

    expect(result).toEqual(mockMembership);
    expect(mockRepository.findById).toHaveBeenCalledWith(mockMembership.membershipId);
  });

  it("throws MembershipNotFoundError when not found", async () => {
    mockRepository.findById.mockResolvedValue(undefined);

    await expect(getMembership("non-existent-id")).rejects.toThrow("Membership not found");
  });
});

describe("getMembershipByProfileAndCommunity", () => {
  beforeEach(() => {
    mockRepository.findByProfileAndCommunity.mockReset();
  });

  it("returns membership when found", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(mockMembership);

    const result = await getMembershipByProfileAndCommunity(
      mockMembership.profileId,
      mockMembership.communityId,
    );

    expect(result).toEqual(mockMembership);
    expect(mockRepository.findByProfileAndCommunity).toHaveBeenCalledWith(
      mockMembership.profileId,
      mockMembership.communityId,
    );
  });

  it("throws NotMemberError when not found", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(undefined);

    await expect(
      getMembershipByProfileAndCommunity("non-member", mockMembership.communityId),
    ).rejects.toThrow("Not a member");
  });
});

describe("listCommunityMembers", () => {
  beforeEach(() => {
    mockRepository.findByCommunity.mockReset();
  });

  it("returns all members for community", async () => {
    const members = [mockMembership, adminMembership];
    mockRepository.findByCommunity.mockResolvedValue(members);

    const result = await listCommunityMembers(mockMembership.communityId);

    expect(result).toEqual(members);
    expect(mockRepository.findByCommunity).toHaveBeenCalledWith(mockMembership.communityId);
  });

  it("returns empty array when no members", async () => {
    mockRepository.findByCommunity.mockResolvedValue([]);

    const result = await listCommunityMembers(mockMembership.communityId);

    expect(result).toEqual([]);
  });
});

describe("listActiveCommunityMembers", () => {
  beforeEach(() => {
    mockRepository.findActiveByCommunity.mockReset();
  });

  it("returns active members for community", async () => {
    const members = [mockMembership];
    mockRepository.findActiveByCommunity.mockResolvedValue(members);

    const result = await listActiveCommunityMembers(mockMembership.communityId);

    expect(result).toEqual(members);
    expect(mockRepository.findActiveByCommunity).toHaveBeenCalledWith(mockMembership.communityId);
  });

  it("returns empty array when no active members", async () => {
    mockRepository.findActiveByCommunity.mockResolvedValue([]);

    const result = await listActiveCommunityMembers(mockMembership.communityId);

    expect(result).toEqual([]);
  });
});

describe("getCommunityMemberCount", () => {
  beforeEach(() => {
    mockRepository.countByCommunity.mockReset();
  });

  it("returns member count for community", async () => {
    mockRepository.countByCommunity.mockResolvedValue(42);

    const result = await getCommunityMemberCount(mockMembership.communityId);

    expect(result).toBe(42);
    expect(mockRepository.countByCommunity).toHaveBeenCalledWith(mockMembership.communityId);
  });

  it("returns 0 when no members", async () => {
    mockRepository.countByCommunity.mockResolvedValue(0);

    const result = await getCommunityMemberCount(mockMembership.communityId);

    expect(result).toBe(0);
  });
});

describe("joinCommunity", () => {
  beforeEach(() => {
    mockRepository.findByProfileAndCommunity.mockReset();
    mockRepository.create.mockReset();
  });

  it("creates membership with active status for public community", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(undefined);
    mockRepository.create.mockResolvedValue({ ...mockMembership, status: "active" });

    const result = await joinCommunity(
      mockMembership.profileId,
      mockMembership.communityId,
      "public",
    );

    expect(result.status).toBe("active");
    expect(mockRepository.create).toHaveBeenCalledWith({
      communityId: mockMembership.communityId,
      profileId: mockMembership.profileId,
      role: "member",
      status: "active",
    });
  });

  it("creates membership with pending status for private community", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(undefined);
    mockRepository.create.mockResolvedValue({ ...mockMembership, status: "pending" });

    await joinCommunity(mockMembership.profileId, mockMembership.communityId, "private");

    expect(mockRepository.create).toHaveBeenCalledWith({
      communityId: mockMembership.communityId,
      profileId: mockMembership.profileId,
      role: "member",
      status: "pending",
    });
  });

  it("creates membership with pending status for paid community", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(undefined);
    mockRepository.create.mockResolvedValue({ ...mockMembership, status: "pending" });

    await joinCommunity(mockMembership.profileId, mockMembership.communityId, "paid");

    expect(mockRepository.create).toHaveBeenCalledWith({
      communityId: mockMembership.communityId,
      profileId: mockMembership.profileId,
      role: "member",
      status: "pending",
    });
  });

  it("throws AlreadyMemberError when already a member", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(mockMembership);

    await expect(
      joinCommunity(mockMembership.profileId, mockMembership.communityId, "public"),
    ).rejects.toThrow("Already a member");
  });
});

describe("leaveCommunity", () => {
  beforeEach(() => {
    mockRepository.findByProfileAndCommunity.mockReset();
    mockRepository.deleteById.mockReset();
  });

  it("deletes membership when user is a member", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(mockMembership);
    mockRepository.deleteById.mockResolvedValue(true);

    await leaveCommunity(mockMembership.profileId, mockMembership.communityId);

    expect(mockRepository.deleteById).toHaveBeenCalledWith(mockMembership.membershipId);
  });

  it("throws NotMemberError when not a member", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(undefined);

    await expect(leaveCommunity("non-member", mockMembership.communityId)).rejects.toThrow(
      "Not a member",
    );
  });

  it("throws OwnerCannotLeaveError when user is owner", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(ownerMembership);

    await expect(
      leaveCommunity(ownerMembership.profileId, ownerMembership.communityId),
    ).rejects.toThrow("Owner cannot leave");
  });
});

describe("updateMembership", () => {
  beforeEach(() => {
    mockRepository.findByProfileAndCommunity.mockReset();
    mockRepository.findById.mockReset();
    mockRepository.update.mockReset();
  });

  it("updates membership when actor has sufficient permissions", async () => {
    const updatedMembership = { ...mockMembership, role: "moderator" as const };
    mockRepository.findByProfileAndCommunity.mockResolvedValue(adminMembership);
    mockRepository.findById.mockResolvedValue(mockMembership);
    mockRepository.update.mockResolvedValue(updatedMembership);

    const result = await updateMembership(
      mockMembership.membershipId,
      { role: "moderator" },
      adminMembership.profileId,
      mockMembership.communityId,
    );

    expect(result.role).toBe("moderator");
  });

  it("throws InsufficientPermissionsError when actor is not active member", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(undefined);

    await expect(
      updateMembership(
        mockMembership.membershipId,
        { role: "moderator" },
        "non-member",
        mockMembership.communityId,
      ),
    ).rejects.toThrow("Insufficient permissions");
  });

  it("throws CannotModifyOwnerError when trying to modify owner", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(adminMembership);
    mockRepository.findById.mockResolvedValue(ownerMembership);

    await expect(
      updateMembership(
        ownerMembership.membershipId,
        { status: "banned" },
        adminMembership.profileId,
        mockMembership.communityId,
      ),
    ).rejects.toThrow("Cannot modify the community owner");
  });

  it("throws InsufficientPermissionsError when actor cannot manage target role", async () => {
    // Admin trying to modify co_owner
    const coOwnerMembership = { ...mockMembership, role: "co_owner" as const };
    mockRepository.findByProfileAndCommunity.mockResolvedValue(adminMembership);
    mockRepository.findById.mockResolvedValue(coOwnerMembership);

    await expect(
      updateMembership(
        coOwnerMembership.membershipId,
        { status: "banned" },
        adminMembership.profileId,
        mockMembership.communityId,
      ),
    ).rejects.toThrow("Insufficient permissions");
  });

  it("throws InvalidRoleAssignmentError when trying to assign role >= own", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(adminMembership);
    mockRepository.findById.mockResolvedValue(mockMembership);

    await expect(
      updateMembership(
        mockMembership.membershipId,
        { role: "admin" },
        adminMembership.profileId,
        mockMembership.communityId,
      ),
    ).rejects.toThrow("Cannot assign role");
  });

  it("throws MembershipNotFoundError when update returns undefined (race condition)", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(adminMembership);
    mockRepository.findById.mockResolvedValue(mockMembership);
    mockRepository.update.mockResolvedValue(undefined); // Simulate concurrent deletion

    await expect(
      updateMembership(
        mockMembership.membershipId,
        { role: "moderator" },
        adminMembership.profileId,
        mockMembership.communityId,
      ),
    ).rejects.toThrow("Membership not found");
  });
});

describe("removeMember", () => {
  beforeEach(() => {
    mockRepository.findByProfileAndCommunity.mockReset();
    mockRepository.findById.mockReset();
    mockRepository.deleteById.mockReset();
  });

  it("removes member when actor has permissions", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(adminMembership);
    mockRepository.findById.mockResolvedValue(mockMembership);
    mockRepository.deleteById.mockResolvedValue(true);

    await removeMember(
      mockMembership.membershipId,
      adminMembership.profileId,
      mockMembership.communityId,
    );

    expect(mockRepository.deleteById).toHaveBeenCalledWith(mockMembership.membershipId);
  });

  it("throws CannotModifyOwnerError when trying to remove owner", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(adminMembership);
    mockRepository.findById.mockResolvedValue(ownerMembership);

    await expect(
      removeMember(
        ownerMembership.membershipId,
        adminMembership.profileId,
        mockMembership.communityId,
      ),
    ).rejects.toThrow("Cannot modify the community owner");
  });

  it("throws MembershipNotFoundError when target membership not found", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(adminMembership);
    mockRepository.findById.mockResolvedValue(undefined);

    await expect(
      removeMember("non-existent", adminMembership.profileId, mockMembership.communityId),
    ).rejects.toThrow("Membership not found");
  });

  it("throws InsufficientPermissionsError when actor cannot manage target role", async () => {
    const coOwnerMembership = { ...mockMembership, role: "co_owner" as const };
    mockRepository.findByProfileAndCommunity.mockResolvedValue(adminMembership);
    mockRepository.findById.mockResolvedValue(coOwnerMembership);

    await expect(
      removeMember(
        coOwnerMembership.membershipId,
        adminMembership.profileId,
        mockMembership.communityId,
      ),
    ).rejects.toThrow("Insufficient permissions");
  });

  it("throws InsufficientPermissionsError when actor is not active member", async () => {
    mockRepository.findByProfileAndCommunity.mockResolvedValue(undefined);

    await expect(
      removeMember(mockMembership.membershipId, "non-member", mockMembership.communityId),
    ).rejects.toThrow("Insufficient permissions");
  });
});

describe("isMember", () => {
  beforeEach(() => {
    mockRepository.membershipExists.mockReset();
  });

  it("returns true when membership exists", async () => {
    mockRepository.membershipExists.mockResolvedValue(true);

    const result = await isMember(mockMembership.profileId, mockMembership.communityId);

    expect(result).toBe(true);
  });

  it("returns false when membership does not exist", async () => {
    mockRepository.membershipExists.mockResolvedValue(false);

    const result = await isMember("non-member", mockMembership.communityId);

    expect(result).toBe(false);
  });
});
