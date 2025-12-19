import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";

import type { Profile } from "@/features/profiles";
import { ProfileNotFoundError } from "@/features/profiles";

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

// Mock service functions
const mockGetProfileByUsername = mock<(username: string) => Promise<Profile>>(() =>
  Promise.resolve(mockProfile),
);

mock.module("@/features/profiles", () => ({
  getProfileByUsername: mockGetProfileByUsername,
  ProfileNotFoundError,
}));

// Import routes after mocking
const { GET } = await import("./route");

describe("GET /api/profiles/[username]", () => {
  beforeEach(() => {
    mockGetProfileByUsername.mockClear();
    mockGetProfileByUsername.mockResolvedValue(mockProfile);
  });

  it("returns public profile by username", async () => {
    const request = new NextRequest("http://localhost:3000/api/profiles/johndoe");
    const response = await GET(request, { params: Promise.resolve({ username: "johndoe" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.username).toBe("johndoe");
    expect(data.displayName).toBe("John Doe");
    expect(mockGetProfileByUsername).toHaveBeenCalledWith("johndoe");
  });

  it("returns 404 for non-existent username", async () => {
    mockGetProfileByUsername.mockRejectedValue(new ProfileNotFoundError("nonexistent"));

    const request = new NextRequest("http://localhost:3000/api/profiles/nonexistent");
    const response = await GET(request, { params: Promise.resolve({ username: "nonexistent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe("PROFILE_NOT_FOUND");
  });
});
