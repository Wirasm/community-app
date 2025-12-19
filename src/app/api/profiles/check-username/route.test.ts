import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";

import type { Profile } from "@/features/profiles";
import { ProfileNotFoundError } from "@/features/profiles";

// Mock user type
type MockUser = { id: string; email: string } | null;
const mockUser: MockUser = { id: "user-123", email: "test@example.com" };
const mockProfile: Profile = {
  id: "profile-123",
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
const mockCheckUsernameAvailable = mock<
  (username: string, excludeProfileId?: string) => Promise<boolean>
>(() => Promise.resolve(true));

import { z } from "zod/v4";

// Re-import the actual CheckUsernameSchema for validation tests
const RealCheckUsernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
});

mock.module("@/features/profiles", () => ({
  getProfileByUserId: mockGetProfileByUserId,
  checkUsernameAvailable: mockCheckUsernameAvailable,
  CheckUsernameSchema: RealCheckUsernameSchema,
  ProfileNotFoundError,
}));

// Import routes after mocking
const { GET } = await import("./route");

describe("GET /api/profiles/check-username", () => {
  beforeEach(() => {
    mockGetUser.mockClear();
    mockGetProfileByUserId.mockClear();
    mockCheckUsernameAvailable.mockClear();
    mockGetProfileByUserId.mockResolvedValue(mockProfile);
    mockCheckUsernameAvailable.mockResolvedValue(true);
  });

  it("returns available=true when username is free", async () => {
    mockCheckUsernameAvailable.mockResolvedValue(true);

    const request = new NextRequest(
      "http://localhost:3000/api/profiles/check-username?username=newname",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.available).toBe(true);
    expect(data.username).toBe("newname");
    expect(mockCheckUsernameAvailable).toHaveBeenCalledWith("newname", "profile-123");
  });

  it("returns available=false when username is taken", async () => {
    mockCheckUsernameAvailable.mockResolvedValue(false);

    const request = new NextRequest(
      "http://localhost:3000/api/profiles/check-username?username=takenname",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.available).toBe(false);
    expect(data.username).toBe("takenname");
  });

  it("returns 401 for unauthenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest(
      "http://localhost:3000/api/profiles/check-username?username=test",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 for invalid username format", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/profiles/check-username?username=AB",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for missing username parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/profiles/check-username");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
  });
});
