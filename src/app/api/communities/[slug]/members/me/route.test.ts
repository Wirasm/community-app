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
  profileId: "profile-123",
  role: "member",
  status: "active",
  invitedByProfileId: null,
  joinedAt: new Date("2024-01-01"),
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// NotMemberError class for testing
class NotMemberError extends Error {
  readonly code = "NOT_MEMBER";
  readonly statusCode = 404;
  constructor(communityId: string) {
    super(`Not a member of community: ${communityId}`);
    this.name = "NotMemberError";
  }
}

// OwnerCannotLeaveError class for testing
class OwnerCannotLeaveError extends Error {
  readonly code = "OWNER_CANNOT_LEAVE";
  readonly statusCode = 403;
  constructor() {
    super("Owner cannot leave community. Transfer ownership first.");
    this.name = "OwnerCannotLeaveError";
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
const mockLeaveCommunity = mock(() => Promise.resolve());

// We need to mock all exports that might be imported
mock.module("@/features/memberships", () => ({
  // Service functions
  getMembershipByProfileAndCommunity: mockGetMembershipByProfileAndCommunity,
  leaveCommunity: mockLeaveCommunity,
  listCommunityMembersPaginated: mock(() => Promise.resolve({ items: [], pagination: {} })),
  joinCommunity: mock(() => Promise.resolve(mockMembership)),
  updateMembership: mock(() => Promise.resolve(mockMembership)),
  removeMember: mock(() => Promise.resolve()),
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
  NotMemberError,
  OwnerCannotLeaveError,
  MembershipError: class extends Error {},
  AlreadyMemberError: class extends Error {},
  BannedUserError: class extends Error {},
  CannotModifyOwnerError: class extends Error {},
  DatabaseError: class extends Error {},
  InsufficientPermissionsError: class extends Error {},
  InvalidRoleAssignmentError: class extends Error {},
  MembershipCreationFailedError: class extends Error {},
  MembershipDeleteFailedError: class extends Error {},
  MembershipNotFoundError: class extends Error {},
  OwnershipTransferFailedError: class extends Error {},
}));

// Import routes after mocking
const { GET, DELETE } = await import("./route");

describe("GET /api/communities/[slug]/members/me", () => {
  beforeEach(() => {
    mockGetUser.mockClear();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockGetMembershipByProfileAndCommunity.mockClear();
    mockGetMembershipByProfileAndCommunity.mockResolvedValue(mockMembership);
  });

  it("returns own membership for authenticated user", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/members/me",
    );
    const response = await GET(request, { params: Promise.resolve({ slug: "test-community" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.membershipId).toBe("membership-123");
    expect(data.role).toBe("member");
  });

  it("returns 401 for unauthenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/members/me",
    );
    const response = await GET(request, { params: Promise.resolve({ slug: "test-community" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("returns 404 when not a member", async () => {
    mockGetMembershipByProfileAndCommunity.mockRejectedValueOnce(
      new NotMemberError("community-123"),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/members/me",
    );
    const response = await GET(request, { params: Promise.resolve({ slug: "test-community" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe("NOT_MEMBER");
  });
});

describe("DELETE /api/communities/[slug]/members/me", () => {
  beforeEach(() => {
    mockGetUser.mockClear();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockLeaveCommunity.mockClear();
    mockLeaveCommunity.mockResolvedValue(undefined);
  });

  it("leaves community for authenticated user", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/members/me",
      { method: "DELETE" },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ slug: "test-community" }),
    });

    expect(response.status).toBe(204);
  });

  it("returns 401 for unauthenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/members/me",
      { method: "DELETE" },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ slug: "test-community" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 when owner tries to leave", async () => {
    mockLeaveCommunity.mockRejectedValueOnce(new OwnerCannotLeaveError());

    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/members/me",
      { method: "DELETE" },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ slug: "test-community" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe("OWNER_CANNOT_LEAVE");
  });
});
