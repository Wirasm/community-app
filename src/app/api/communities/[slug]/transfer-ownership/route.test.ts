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

const mockOldOwnerMembership: Membership = {
  membershipId: "membership-123",
  communityId: "community-123",
  profileId: "profile-123",
  role: "co_owner",
  status: "active",
  invitedByProfileId: null,
  joinedAt: new Date("2024-01-01"),
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const mockNewOwnerMembership: Membership = {
  membershipId: "membership-456",
  communityId: "community-123",
  profileId: "profile-456",
  role: "owner",
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

// NotMemberError class for testing
class NotMemberError extends Error {
  readonly code = "NOT_MEMBER";
  readonly statusCode = 404;
  constructor(communityId: string) {
    super(`Not a member of community: ${communityId}`);
    this.name = "NotMemberError";
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
const mockTransferOwnership = mock(() =>
  Promise.resolve({
    oldOwnerMembership: mockOldOwnerMembership,
    newOwnerMembership: mockNewOwnerMembership,
  }),
);

// We need to mock all exports that might be imported
mock.module("@/features/memberships", () => ({
  // Service functions
  transferOwnership: mockTransferOwnership,
  getMembershipByProfileAndCommunity: mock(() => Promise.resolve(mockNewOwnerMembership)),
  listCommunityMembersPaginated: mock(() => Promise.resolve({ items: [], pagination: {} })),
  joinCommunity: mock(() => Promise.resolve(mockNewOwnerMembership)),
  leaveCommunity: mock(() => Promise.resolve()),
  updateMembership: mock(() => Promise.resolve(mockNewOwnerMembership)),
  removeMember: mock(() => Promise.resolve()),
  getMembership: mock(() => Promise.resolve(mockNewOwnerMembership)),
  listCommunityMembers: mock(() => Promise.resolve([mockNewOwnerMembership])),
  listActiveCommunityMembers: mock(() => Promise.resolve([mockNewOwnerMembership])),
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
  NotMemberError,
  MembershipError: class extends Error {},
  AlreadyMemberError: class extends Error {},
  BannedUserError: class extends Error {},
  CannotModifyOwnerError: class extends Error {},
  DatabaseError: class extends Error {},
  InvalidRoleAssignmentError: class extends Error {},
  MembershipCreationFailedError: class extends Error {},
  MembershipDeleteFailedError: class extends Error {},
  MembershipNotFoundError: class extends Error {},
  OwnerCannotLeaveError: class extends Error {},
  OwnershipTransferFailedError: class extends Error {},
}));

// Import routes after mocking
const { POST } = await import("./route");

describe("POST /api/communities/[slug]/transfer-ownership", () => {
  beforeEach(() => {
    mockGetUser.mockClear();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockTransferOwnership.mockClear();
    mockTransferOwnership.mockResolvedValue({
      oldOwnerMembership: mockOldOwnerMembership,
      newOwnerMembership: mockNewOwnerMembership,
    });
  });

  it("transfers ownership for owner", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/transfer-ownership",
      {
        method: "POST",
        body: JSON.stringify({ newOwnerProfileId: "profile-456" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ slug: "test-community" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.oldOwnerMembership.role).toBe("co_owner");
    expect(data.newOwnerMembership.role).toBe("owner");
  });

  it("returns 401 for unauthenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/transfer-ownership",
      {
        method: "POST",
        body: JSON.stringify({ newOwnerProfileId: "profile-456" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ slug: "test-community" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 when non-owner tries to transfer", async () => {
    mockTransferOwnership.mockRejectedValueOnce(
      new InsufficientPermissionsError("transfer ownership"),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/transfer-ownership",
      {
        method: "POST",
        body: JSON.stringify({ newOwnerProfileId: "profile-456" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ slug: "test-community" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe("INSUFFICIENT_PERMISSIONS");
  });

  it("returns 404 when new owner is not a member", async () => {
    mockTransferOwnership.mockRejectedValueOnce(new NotMemberError("community-123"));

    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/transfer-ownership",
      {
        method: "POST",
        body: JSON.stringify({ newOwnerProfileId: "profile-999" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ slug: "test-community" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe("NOT_MEMBER");
  });
});
