import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";

import type { PaginatedResponse } from "@/shared/schemas/pagination";

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

const mockPaginatedResponse: PaginatedResponse<Membership> = {
  items: [mockMembership],
  pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
};

// AlreadyMemberError class for testing
class AlreadyMemberError extends Error {
  readonly code = "ALREADY_MEMBER";
  readonly statusCode = 409;
  constructor(communityId: string) {
    super(`Already a member of community: ${communityId}`);
    this.name = "AlreadyMemberError";
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
const mockListCommunityMembersPaginated = mock(() => Promise.resolve(mockPaginatedResponse));
const mockJoinCommunity = mock(() => Promise.resolve(mockMembership));

// We need to mock all exports that might be imported
mock.module("@/features/memberships", () => ({
  // Service functions
  listCommunityMembersPaginated: mockListCommunityMembersPaginated,
  joinCommunity: mockJoinCommunity,
  getMembershipByProfileAndCommunity: mock(() => Promise.resolve(mockMembership)),
  leaveCommunity: mock(() => Promise.resolve()),
  updateMembership: mock(() => Promise.resolve(mockMembership)),
  removeMember: mock(() => Promise.resolve()),
  transferOwnership: mock(() => Promise.resolve({})),
  getMembership: mock(() => Promise.resolve(mockMembership)),
  listCommunityMembers: mock(() => Promise.resolve([mockMembership])),
  listActiveCommunityMembers: mock(() => Promise.resolve([mockMembership])),
  getCommunityMemberCount: mock(() => Promise.resolve(1)),
  isMember: mock(() => Promise.resolve(true)),
  // Schemas
  ListMembersQuerySchema: {
    parse: (data: unknown) => ({
      page: 1,
      pageSize: 20,
      ...(data as object),
    }),
  },
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
  AlreadyMemberError,
  MembershipError: class extends Error {},
  BannedUserError: class extends Error {},
  CannotModifyOwnerError: class extends Error {},
  DatabaseError: class extends Error {},
  InsufficientPermissionsError: class extends Error {},
  InvalidRoleAssignmentError: class extends Error {},
  MembershipCreationFailedError: class extends Error {},
  MembershipDeleteFailedError: class extends Error {},
  MembershipNotFoundError: class extends Error {},
  NotMemberError: class extends Error {},
  OwnerCannotLeaveError: class extends Error {},
  OwnershipTransferFailedError: class extends Error {},
}));

// Import routes after mocking
const { GET, POST } = await import("./route");

describe("GET /api/communities/[slug]/members", () => {
  beforeEach(() => {
    mockGetCommunityBySlug.mockClear();
    mockListCommunityMembersPaginated.mockClear();
  });

  it("returns paginated members list", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/members?page=1&pageSize=20",
    );
    const response = await GET(request, { params: Promise.resolve({ slug: "test-community" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.pagination.page).toBe(1);
  });

  it("calls service with correct community ID", async () => {
    const request = new NextRequest("http://localhost:3000/api/communities/test-community/members");
    await GET(request, { params: Promise.resolve({ slug: "test-community" }) });

    expect(mockGetCommunityBySlug).toHaveBeenCalledWith("test-community");
    expect(mockListCommunityMembersPaginated).toHaveBeenCalled();
  });
});

describe("POST /api/communities/[slug]/members", () => {
  beforeEach(() => {
    mockGetUser.mockClear();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockJoinCommunity.mockClear();
    mockJoinCommunity.mockResolvedValue(mockMembership);
  });

  it("joins community for authenticated user", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/members",
      { method: "POST" },
    );
    const response = await POST(request, { params: Promise.resolve({ slug: "test-community" }) });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.membershipId).toBe("membership-123");
  });

  it("returns 401 for unauthenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/members",
      { method: "POST" },
    );
    const response = await POST(request, { params: Promise.resolve({ slug: "test-community" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("returns 409 when already a member", async () => {
    mockJoinCommunity.mockRejectedValueOnce(new AlreadyMemberError("community-123"));

    const request = new NextRequest(
      "http://localhost:3000/api/communities/test-community/members",
      { method: "POST" },
    );
    const response = await POST(request, { params: Promise.resolve({ slug: "test-community" }) });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.code).toBe("ALREADY_MEMBER");
  });
});
