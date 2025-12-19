import { beforeEach, describe, expect, it, mock } from "bun:test";

import type { Community } from "../models";

// Mock the repository module with properly typed functions
const mockRepository = {
  findById: mock<(communityId: string) => Promise<Community | undefined>>(() =>
    Promise.resolve(undefined),
  ),
  findBySlug: mock<(slug: string) => Promise<Community | undefined>>(() =>
    Promise.resolve(undefined),
  ),
  findByOwnerId: mock<(ownerId: string) => Promise<Community[]>>(() => Promise.resolve([])),
  findPublic: mock<() => Promise<Community[]>>(() => Promise.resolve([])),
  create: mock<(data: unknown) => Promise<Community>>(() => Promise.resolve(mockCommunity)),
  update: mock<(communityId: string, data: unknown) => Promise<Community | undefined>>(() =>
    Promise.resolve(undefined),
  ),
  deleteById: mock<(communityId: string) => Promise<boolean>>(() => Promise.resolve(false)),
  slugExists: mock<(slug: string, excludeCommunityId?: string) => Promise<boolean>>(() =>
    Promise.resolve(false),
  ),
  countByOwnerId: mock<(ownerId: string) => Promise<number>>(() => Promise.resolve(0)),
};

// Mock the repository before importing service
mock.module("../repository", () => mockRepository);

// Import service after mocking
const {
  checkSlugAvailable,
  createCommunity,
  deleteCommunity,
  generateSlug,
  getCommunity,
  getCommunityBySlug,
  getCommunityCount,
  getCommunitiesByOwner,
  getPublicCommunities,
  updateCommunity,
} = await import("../service");

const mockCommunity: Community = {
  communityId: "550e8400-e29b-41d4-a716-446655440000",
  ownerId: "550e8400-e29b-41d4-a716-446655440001",
  name: "Test Community",
  slug: "test-community",
  description: "A test community",
  about: null,
  logoUrl: null,
  bannerUrl: null,
  visibility: "public",
  settings: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ownerId = "550e8400-e29b-41d4-a716-446655440001";
const otherUserId = "550e8400-e29b-41d4-a716-446655440002";

describe("generateSlug", () => {
  it("converts name to lowercase kebab-case", () => {
    expect(generateSlug("My Community Name")).toBe("my-community-name");
  });

  it("removes special characters", () => {
    expect(generateSlug("Hello! World?")).toBe("hello-world");
  });

  it("collapses multiple spaces and hyphens", () => {
    expect(generateSlug("Hello   World---Test")).toBe("hello-world-test");
  });

  it("removes leading and trailing hyphens", () => {
    expect(generateSlug("  -Hello World-  ")).toBe("hello-world");
  });

  it("handles numbers", () => {
    expect(generateSlug("Community 123")).toBe("community-123");
  });
});

describe("createCommunity", () => {
  beforeEach(() => {
    mockRepository.create.mockReset();
    mockRepository.slugExists.mockReset();
    mockRepository.create.mockResolvedValue(mockCommunity);
  });

  it("creates community with auto-generated slug", async () => {
    mockRepository.slugExists.mockResolvedValue(false);

    const result = await createCommunity({ name: "Test Community", visibility: "public" }, ownerId);

    expect(result).toEqual(mockCommunity);
    expect(mockRepository.create).toHaveBeenCalled();
  });

  it("creates community with provided slug", async () => {
    mockRepository.slugExists.mockResolvedValue(false);

    await createCommunity({ name: "Test", slug: "custom-slug", visibility: "public" }, ownerId);

    expect(mockRepository.slugExists).toHaveBeenCalledWith("custom-slug");
  });

  it("throws SlugExistsError when provided slug is taken", async () => {
    mockRepository.slugExists.mockResolvedValue(true);

    await expect(
      createCommunity({ name: "Test", slug: "taken-slug", visibility: "public" }, ownerId),
    ).rejects.toThrow("Slug already exists");
  });
});

describe("getCommunity", () => {
  beforeEach(() => {
    mockRepository.findById.mockReset();
  });

  it("returns community when found", async () => {
    mockRepository.findById.mockResolvedValue(mockCommunity);

    const result = await getCommunity(mockCommunity.communityId);

    expect(result).toEqual(mockCommunity);
    expect(mockRepository.findById).toHaveBeenCalledWith(mockCommunity.communityId);
  });

  it("throws CommunityNotFoundError when community does not exist", async () => {
    mockRepository.findById.mockResolvedValue(undefined);

    await expect(getCommunity("non-existent-id")).rejects.toThrow("Community not found");
  });
});

describe("getCommunityBySlug", () => {
  beforeEach(() => {
    mockRepository.findBySlug.mockReset();
  });

  it("returns community when found", async () => {
    mockRepository.findBySlug.mockResolvedValue(mockCommunity);

    const result = await getCommunityBySlug("test-community");

    expect(result).toEqual(mockCommunity);
    expect(mockRepository.findBySlug).toHaveBeenCalledWith("test-community");
  });

  it("throws CommunityNotFoundError when slug does not exist", async () => {
    mockRepository.findBySlug.mockResolvedValue(undefined);

    await expect(getCommunityBySlug("nonexistent")).rejects.toThrow("Community not found");
  });
});

describe("getCommunitiesByOwner", () => {
  beforeEach(() => {
    mockRepository.findByOwnerId.mockReset();
  });

  it("returns communities for owner", async () => {
    mockRepository.findByOwnerId.mockResolvedValue([mockCommunity]);

    const result = await getCommunitiesByOwner(ownerId);

    expect(result).toEqual([mockCommunity]);
    expect(mockRepository.findByOwnerId).toHaveBeenCalledWith(ownerId);
  });

  it("returns empty array when no communities", async () => {
    mockRepository.findByOwnerId.mockResolvedValue([]);

    const result = await getCommunitiesByOwner(ownerId);

    expect(result).toEqual([]);
  });
});

describe("getPublicCommunities", () => {
  beforeEach(() => {
    mockRepository.findPublic.mockReset();
  });

  it("returns public communities", async () => {
    mockRepository.findPublic.mockResolvedValue([mockCommunity]);

    const result = await getPublicCommunities();

    expect(result).toEqual([mockCommunity]);
    expect(mockRepository.findPublic).toHaveBeenCalled();
  });
});

describe("updateCommunity", () => {
  beforeEach(() => {
    mockRepository.findById.mockReset();
    mockRepository.update.mockReset();
  });

  it("updates community when user is owner", async () => {
    const updatedCommunity = { ...mockCommunity, name: "Updated Name" };
    mockRepository.findById.mockResolvedValue(mockCommunity);
    mockRepository.update.mockResolvedValue(updatedCommunity);

    const result = await updateCommunity(
      mockCommunity.communityId,
      { name: "Updated Name" },
      ownerId,
    );

    expect(result.name).toBe("Updated Name");
  });

  it("throws CommunityNotFoundError when community does not exist", async () => {
    mockRepository.findById.mockResolvedValue(undefined);

    await expect(updateCommunity("non-existent-id", { name: "New Name" }, ownerId)).rejects.toThrow(
      "Community not found",
    );
  });

  it("throws CommunityAccessDeniedError when user is not owner", async () => {
    mockRepository.findById.mockResolvedValue(mockCommunity);

    await expect(
      updateCommunity(mockCommunity.communityId, { name: "New Name" }, otherUserId),
    ).rejects.toThrow("Access denied");
  });

  it("throws CommunityNotFoundError when update fails (race condition)", async () => {
    mockRepository.findById.mockResolvedValue(mockCommunity);
    mockRepository.update.mockResolvedValue(undefined);

    await expect(
      updateCommunity(mockCommunity.communityId, { name: "New Name" }, ownerId),
    ).rejects.toThrow("Community not found");
  });
});

describe("deleteCommunity", () => {
  beforeEach(() => {
    mockRepository.findById.mockReset();
    mockRepository.deleteById.mockReset();
  });

  it("deletes community when user is owner", async () => {
    mockRepository.findById.mockResolvedValue(mockCommunity);
    mockRepository.deleteById.mockResolvedValue(true);

    await expect(deleteCommunity(mockCommunity.communityId, ownerId)).resolves.toBeUndefined();
    expect(mockRepository.deleteById).toHaveBeenCalledWith(mockCommunity.communityId);
  });

  it("throws CommunityNotFoundError when community does not exist", async () => {
    mockRepository.findById.mockResolvedValue(undefined);

    await expect(deleteCommunity("non-existent-id", ownerId)).rejects.toThrow(
      "Community not found",
    );
  });

  it("throws CommunityAccessDeniedError when user is not owner", async () => {
    mockRepository.findById.mockResolvedValue(mockCommunity);

    await expect(deleteCommunity(mockCommunity.communityId, otherUserId)).rejects.toThrow(
      "Access denied",
    );
  });

  it("throws CommunityNotFoundError when delete fails (race condition)", async () => {
    mockRepository.findById.mockResolvedValue(mockCommunity);
    mockRepository.deleteById.mockResolvedValue(false);

    await expect(deleteCommunity(mockCommunity.communityId, ownerId)).rejects.toThrow(
      "Community not found",
    );
  });
});

describe("checkSlugAvailable", () => {
  beforeEach(() => {
    mockRepository.slugExists.mockReset();
  });

  it("returns true when slug is available", async () => {
    mockRepository.slugExists.mockResolvedValue(false);

    const result = await checkSlugAvailable("new-slug");

    expect(result).toBe(true);
    expect(mockRepository.slugExists).toHaveBeenCalledWith("new-slug", undefined);
  });

  it("returns false when slug is taken", async () => {
    mockRepository.slugExists.mockResolvedValue(true);

    const result = await checkSlugAvailable("taken-slug");

    expect(result).toBe(false);
  });

  it("passes excludeCommunityId when provided", async () => {
    mockRepository.slugExists.mockResolvedValue(false);

    await checkSlugAvailable("my-slug", mockCommunity.communityId);

    expect(mockRepository.slugExists).toHaveBeenCalledWith("my-slug", mockCommunity.communityId);
  });
});

describe("getCommunityCount", () => {
  beforeEach(() => {
    mockRepository.countByOwnerId.mockReset();
  });

  it("returns count of communities", async () => {
    mockRepository.countByOwnerId.mockResolvedValue(5);

    const result = await getCommunityCount(ownerId);

    expect(result).toBe(5);
    expect(mockRepository.countByOwnerId).toHaveBeenCalledWith(ownerId);
  });

  it("returns zero when no communities", async () => {
    mockRepository.countByOwnerId.mockResolvedValue(0);

    const result = await getCommunityCount(ownerId);

    expect(result).toBe(0);
  });
});
