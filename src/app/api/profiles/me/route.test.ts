import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";

import type { Profile } from "@/features/profiles";
import { ProfileNotFoundError } from "@/features/profiles";

// Mock user type
type MockUser = { id: string; email: string } | null;
const mockUser: MockUser = { id: "user-123", email: "test@example.com" };
const mockProfile: Profile = {
  profileId: "profile-123",
  userId: "user-123",
  username: "johndoe",
  displayName: "John Doe",
  bio: "A test bio",
  avatarUrl: null,
  bannerUrl: null,
  location: "San Francisco",
  website: "https://example.com",
  socialLinks: {},
  platformRole: "user",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Mock Supabase auth
const mockGetUser = mock<() => Promise<{ data: { user: MockUser }; error: null }>>(() =>
  Promise.resolve({ data: { user: mockUser }, error: null }),
);
mock.module("@/core/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    }),
}));

// Mock service functions
const mockGetProfileByUserId = mock<(userId: string) => Promise<Profile>>(() =>
  Promise.resolve(mockProfile),
);
const mockUpdateProfile = mock<
  (profileId: string, input: unknown, userId: string) => Promise<Profile>
>(() => Promise.resolve(mockProfile));

mock.module("@/features/profiles", () => ({
  getProfileByUserId: mockGetProfileByUserId,
  updateProfile: mockUpdateProfile,
  UpdateProfileSchema: {
    parse: (data: unknown) => {
      // Simple validation mock
      const obj = data as Record<string, unknown>;
      if (obj["username"] && (obj["username"] as string).length < 3) {
        throw {
          name: "ZodError",
          issues: [{ path: ["username"], message: "Too short" }],
          message: "Validation failed",
        };
      }
      return data;
    },
  },
  ProfileNotFoundError,
}));

// Import routes after mocking
const { GET, PATCH } = await import("./route");

describe("GET /api/profiles/me", () => {
  beforeEach(() => {
    mockGetUser.mockClear();
    mockGetProfileByUserId.mockClear();
    mockGetProfileByUserId.mockResolvedValue(mockProfile);
  });

  it("returns profile for authenticated user", async () => {
    const request = new NextRequest("http://localhost:3000/api/profiles/me");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.profileId).toBe("profile-123");
    expect(data.username).toBe("johndoe");
    expect(mockGetProfileByUserId).toHaveBeenCalledWith("user-123");
  });

  it("returns 401 for unauthenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/api/profiles/me");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("returns 404 when profile not found", async () => {
    mockGetProfileByUserId.mockRejectedValueOnce(new ProfileNotFoundError("user-123"));

    const request = new NextRequest("http://localhost:3000/api/profiles/me");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe("PROFILE_NOT_FOUND");
  });
});

describe("PATCH /api/profiles/me", () => {
  beforeEach(() => {
    mockGetUser.mockClear();
    mockGetProfileByUserId.mockClear();
    mockUpdateProfile.mockClear();
    mockGetProfileByUserId.mockResolvedValue(mockProfile);
    mockUpdateProfile.mockResolvedValue(mockProfile);
  });

  it("updates profile for authenticated user", async () => {
    const updatedProfile = { ...mockProfile, displayName: "Updated Name" };
    mockUpdateProfile.mockResolvedValue(updatedProfile);

    const request = new NextRequest("http://localhost:3000/api/profiles/me", {
      method: "PATCH",
      body: JSON.stringify({ displayName: "Updated Name" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.displayName).toBe("Updated Name");
  });

  it("returns 401 for unauthenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/api/profiles/me", {
      method: "PATCH",
      body: JSON.stringify({ displayName: "Updated Name" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });
});
