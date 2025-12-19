import { beforeEach, describe, expect, it, mock } from "bun:test";

import type { Profile } from "../models";

// Mock the repository module with properly typed functions
const mockRepository = {
  findById: mock<(profileId: string) => Promise<Profile | undefined>>(() =>
    Promise.resolve(undefined),
  ),
  findByUserId: mock<(userId: string) => Promise<Profile | undefined>>(() =>
    Promise.resolve(undefined),
  ),
  findByUsername: mock<(username: string) => Promise<Profile | undefined>>(() =>
    Promise.resolve(undefined),
  ),
  update: mock<(profileId: string, data: unknown) => Promise<Profile | undefined>>(() =>
    Promise.resolve(undefined),
  ),
  usernameExists: mock<(username: string, excludeProfileId?: string) => Promise<boolean>>(() =>
    Promise.resolve(false),
  ),
};

// Mock the repository before importing service
mock.module("../repository", () => mockRepository);

// Import service after mocking
const {
  checkUsernameAvailable,
  getProfile,
  getProfileByUserId,
  getProfileByUsername,
  updateProfile,
} = await import("../service");

const mockProfile: Profile = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  userId: "550e8400-e29b-41d4-a716-446655440001",
  username: "johndoe",
  displayName: "John Doe",
  bio: "A test bio",
  avatarUrl: null,
  bannerUrl: null,
  location: "San Francisco",
  website: "https://example.com",
  socialLinks: {},
  platformRole: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ownerId = "550e8400-e29b-41d4-a716-446655440001";
const otherUserId = "550e8400-e29b-41d4-a716-446655440002";

describe("getProfile", () => {
  beforeEach(() => {
    mockRepository.findById.mockReset();
  });

  it("returns profile when found", async () => {
    mockRepository.findById.mockResolvedValue(mockProfile);

    const result = await getProfile(mockProfile.id);

    expect(result).toEqual(mockProfile);
    expect(mockRepository.findById).toHaveBeenCalledWith(mockProfile.id);
  });

  it("throws ProfileNotFoundError when profile does not exist", async () => {
    mockRepository.findById.mockResolvedValue(undefined);

    await expect(getProfile("non-existent-id")).rejects.toThrow("Profile not found");
  });
});

describe("getProfileByUserId", () => {
  beforeEach(() => {
    mockRepository.findByUserId.mockReset();
  });

  it("returns profile when found", async () => {
    mockRepository.findByUserId.mockResolvedValue(mockProfile);

    const result = await getProfileByUserId(ownerId);

    expect(result).toEqual(mockProfile);
    expect(mockRepository.findByUserId).toHaveBeenCalledWith(ownerId);
  });

  it("throws ProfileNotFoundError when profile does not exist", async () => {
    mockRepository.findByUserId.mockResolvedValue(undefined);

    await expect(getProfileByUserId("non-existent-user")).rejects.toThrow("Profile not found");
  });
});

describe("getProfileByUsername", () => {
  beforeEach(() => {
    mockRepository.findByUsername.mockReset();
  });

  it("returns profile when found", async () => {
    mockRepository.findByUsername.mockResolvedValue(mockProfile);

    const result = await getProfileByUsername("johndoe");

    expect(result).toEqual(mockProfile);
    expect(mockRepository.findByUsername).toHaveBeenCalledWith("johndoe");
  });

  it("throws ProfileNotFoundError when username does not exist", async () => {
    mockRepository.findByUsername.mockResolvedValue(undefined);

    await expect(getProfileByUsername("nonexistent")).rejects.toThrow("Profile not found");
  });
});

describe("updateProfile", () => {
  beforeEach(() => {
    mockRepository.findById.mockReset();
    mockRepository.update.mockReset();
    mockRepository.usernameExists.mockReset();
  });

  it("updates profile when user is owner", async () => {
    const updatedProfile = { ...mockProfile, displayName: "Updated Name" };
    mockRepository.findById.mockResolvedValue(mockProfile);
    mockRepository.update.mockResolvedValue(updatedProfile);

    const result = await updateProfile(mockProfile.id, { displayName: "Updated Name" }, ownerId);

    expect(result.displayName).toBe("Updated Name");
  });

  it("throws ProfileNotFoundError when profile does not exist", async () => {
    mockRepository.findById.mockResolvedValue(undefined);

    await expect(
      updateProfile("non-existent-id", { displayName: "New Name" }, ownerId),
    ).rejects.toThrow("Profile not found");
  });

  it("throws ProfileAccessDeniedError when user is not owner", async () => {
    mockRepository.findById.mockResolvedValue(mockProfile);

    await expect(
      updateProfile(mockProfile.id, { displayName: "New Name" }, otherUserId),
    ).rejects.toThrow("Access denied");
  });

  it("throws UsernameExistsError when changing to existing username", async () => {
    mockRepository.findById.mockResolvedValue(mockProfile);
    mockRepository.usernameExists.mockResolvedValue(true);

    await expect(updateProfile(mockProfile.id, { username: "taken" }, ownerId)).rejects.toThrow(
      "Username already exists",
    );
  });

  it("allows updating username when it is available", async () => {
    const updatedProfile = { ...mockProfile, username: "newname" };
    mockRepository.findById.mockResolvedValue(mockProfile);
    mockRepository.usernameExists.mockResolvedValue(false);
    mockRepository.update.mockResolvedValue(updatedProfile);

    const result = await updateProfile(mockProfile.id, { username: "newname" }, ownerId);

    expect(result.username).toBe("newname");
    expect(mockRepository.usernameExists).toHaveBeenCalledWith("newname", mockProfile.id);
  });

  it("skips username check when username is not changing", async () => {
    const updatedProfile = { ...mockProfile, bio: "New bio" };
    mockRepository.findById.mockResolvedValue(mockProfile);
    mockRepository.update.mockResolvedValue(updatedProfile);

    const result = await updateProfile(mockProfile.id, { bio: "New bio" }, ownerId);

    expect(result.bio).toBe("New bio");
    expect(mockRepository.usernameExists).not.toHaveBeenCalled();
  });

  it("throws ProfileNotFoundError when update fails (race condition)", async () => {
    mockRepository.findById.mockResolvedValue(mockProfile);
    mockRepository.update.mockResolvedValue(undefined);

    await expect(
      updateProfile(mockProfile.id, { displayName: "New Name" }, ownerId),
    ).rejects.toThrow("Profile not found");
  });
});

describe("checkUsernameAvailable", () => {
  beforeEach(() => {
    mockRepository.usernameExists.mockReset();
  });

  it("returns true when username is available", async () => {
    mockRepository.usernameExists.mockResolvedValue(false);

    const result = await checkUsernameAvailable("newusername");

    expect(result).toBe(true);
    expect(mockRepository.usernameExists).toHaveBeenCalledWith("newusername", undefined);
  });

  it("returns false when username is taken", async () => {
    mockRepository.usernameExists.mockResolvedValue(true);

    const result = await checkUsernameAvailable("takenname");

    expect(result).toBe(false);
  });

  it("passes excludeProfileId when provided", async () => {
    mockRepository.usernameExists.mockResolvedValue(false);

    await checkUsernameAvailable("myusername", mockProfile.id);

    expect(mockRepository.usernameExists).toHaveBeenCalledWith("myusername", mockProfile.id);
  });
});
