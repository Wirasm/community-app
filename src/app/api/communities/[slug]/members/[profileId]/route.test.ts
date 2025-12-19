import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";

// Mock user type
type MockUser = { id: string; email: string } | null;
const mockUser: MockUser = { id: "user-123", email: "test@example.com" };

type Membership = {
  membershipId: string;
  communityId: string;
  profileId: string;
  role: "owner" | "co_owner" | "admin" | "moderator" | "member";
  status: "active" | "pending" | "banned";
  invitedByProfileId: string | null;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const mockMembership: Membership = {
  membershipId: "membership-123",
  communityId: "community-123",
  profileId: "profile-456",
  role: "member",
  status: "active",
  invitedByProfileId: null,
  joinedAt: new Date("2024-01-01"),
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// InsufficientPermissionsError class for testing
class InsufficientPermissionsError extends Error {
  readonly code = "INSUFFICIENT_PERMISSIONS";
  readonly statusCode = 403;
  constructor(action: string) {
    super(`Insufficient permissions to: ${action}`);
    this.name = "InsufficientPermissionsError";
  }
}

// Mock Supabase auth
const mockGetUser = mock<() => Promise<{ data: { user: MockUser }; error: null }>>(() =>
  Promise.resolve({ data: { user: mockUser }, error: null }),
);
mock.module("@/core/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    }),
}));

// Mock communities service
const mockGetCommunityBySlug = mock(() =>
  Promise.resolve({ communityId: "community-123", visibility: "public" }),
);
mock.module("@/features/communities", () => ({
  getCommunityBySlug: mockGetCommunityBySlug,
  CommunityError: class extends Error {},
}));

// Mock profiles service
const mockGetProfileByUserId = mock(() => Promise.resolve({ profileId: "profile-123" }));
mock.module("@/features/profiles", () => ({
  getProfileByUserId: mockGetProfileByUserId,
  ProfileError: class extends Error {},
}));

// Mock memberships service
const mockGetMembershipByProfileAndCommunity = mock(() => Promise.resolve(mockMembership));
const mockUpdateMembership = mock(() => Promise.resolve({ ...mockMembership, role: "moderator" }));
const mockRemoveMember = mock(() => Promise.resolve());

// We need to mock all exports that might be imported
mock.module("@/features/memberships", () => ({
  // Service functions
  getMembershipByProfileAndCommunity: mockGetMembershipByProfileAndCommunity,
  updateMembership: mockUpdateMembership,
  removeMember: mockRemoveMember,
  listCommunityMembersPaginated: mock(() => Promise.resolve({ items: [], pagination: {} })),
  joinCommunity: mock(() => Promise.resolve(mockMembership)),
  leaveCommunity: mock(() => Promise.resolve()),
  transferOwnership: mock(() => Promise.resolve({})),
  getMembership: mock(() => Promise.resolve(mockMembership)),
  listCommunityMembers: mock(() => Promise.resolve([mockMembership])),
  listActiveCommunityMembers: mock(() => Promise.resolve([mockMembership])),
  getCommunityMemberCount: mock(() => Promise.resolve(1)),
  isMember: mock(() => Promise.resolve(true)),
  // Schemas
  ListMembersQuerySchema: { parse: (data: unknown) => data },
  UpdateMembershipSchema: { parse: (data: unknown) => data },
  TransferOwnershipSchema: { parse: (data: unknown) => data },
  MembershipResponseSchema: {},
  ASSIGNABLE_ROLES: ["co_owner", "admin", "moderator", "member"],
  COMMUNITY_ROLES: ["owner", "co_owner", "admin", "moderator", "member"],
  MEMBERSHIP_STATUSES: ["active", "pending", "banned"],
  ROLE_HIERARCHY: { owner: 5, co_owner: 4, admin: 3, moderator: 2, member: 1 },
  // Permissions
  canAssignRole: () => true,
  canBanMembers: () => true,
  canManageAdmins: () => true,
  canManageModerators: () => true,
  canManageRole: () => true,
  hasMinimumRole: () => true,
  // Errors
  InsufficientPermissionsError,
  MembershipError: class extends Error {},
  AlreadyMemberError: class extends Error {},
  BannedUserError: class extends Error {},
  CannotModifyOwnerError: class extends Error {},
  InvalidRoleAssignmentError: class extends Error {},
  MembershipNotFoundError: class extends Error {},
  NotMemberError: class extends Error {},
  OwnerCannotLeaveError: class extends Error {},
}));

// Import routes after mocking
const { PATCH, DELETE } = await import("./route");

describe("PATCH /api/communities/[slug]/members/[profileId]", () => {
  beforeEach(() => {
    mockGetUser.mockClear();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockUpdateMembership.mockClear();
    mockUpdateMembership.mockResolvedValue({ ...mockMembership, role: "moderator" });
  });

  it("updates member role for admin user", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/members/profile-456",
      {
        method: "PATCH",
        body: JSON.stringify({ role: "moderator" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const response = await PATCH(request, {
      params: Promise.resolve({ slug: "test-community", profileId: "profile-456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.role).toBe("moderator");
  });

  it("returns 401 for unauthenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/members/profile-456",
      {
        method: "PATCH",
        body: JSON.stringify({ role: "moderator" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const response = await PATCH(request, {
      params: Promise.resolve({ slug: "test-community", profileId: "profile-456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 for insufficient permissions", async () => {
    mockUpdateMembership.mockRejectedValueOnce(
      new InsufficientPermissionsError("update membership"),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/members/profile-456",
      {
        method: "PATCH",
        body: JSON.stringify({ role: "admin" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const response = await PATCH(request, {
      params: Promise.resolve({ slug: "test-community", profileId: "profile-456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe("INSUFFICIENT_PERMISSIONS");
  });
});

describe("DELETE /api/communities/[slug]/members/[profileId]", () => {
  beforeEach(() => {
    mockGetUser.mockClear();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockRemoveMember.mockClear();
    mockRemoveMember.mockResolvedValue(undefined);
  });

  it("removes member for admin user", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/members/profile-456",
      { method: "DELETE" },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ slug: "test-community", profileId: "profile-456" }),
    });

    expect(response.status).toBe(204);
  });

  it("returns 401 for unauthenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/members/profile-456",
      { method: "DELETE" },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ slug: "test-community", profileId: "profile-456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 for insufficient permissions", async () => {
    mockRemoveMember.mockRejectedValueOnce(new InsufficientPermissionsError("remove member"));

    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/members/profile-456",
      { method: "DELETE" },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ slug: "test-community", profileId: "profile-456" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe("INSUFFICIENT_PERMISSIONS");
  });
});
