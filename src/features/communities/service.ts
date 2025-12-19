import { getLogger } from "@/core/logging";

import { CommunityAccessDeniedError, CommunityNotFoundError, SlugExistsError } from "./errors";
import type { Community } from "./models";
import * as repository from "./repository";
import type { CreateCommunityInput, UpdateCommunityInput } from "./schemas";

const logger = getLogger("communities.service");

/**
 * Generate a URL-safe slug from a name.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug, appending a suffix if necessary.
 */
export async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let attempt = 0;
  const maxAttempts = 10;

  while (await repository.slugExists(slug)) {
    attempt++;
    if (attempt >= maxAttempts) {
      throw new SlugExistsError(baseSlug);
    }
    slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  return slug;
}

/**
 * Create a new community.
 */
export async function createCommunity(
  input: CreateCommunityInput,
  ownerId: string,
): Promise<Community> {
  logger.info({ ownerId, name: input.name }, "community.create_started");

  const slug = input.slug ?? (await generateUniqueSlug(input.name));

  // Check if slug exists (even if user provided it)
  if (input.slug) {
    const exists = await repository.slugExists(input.slug);
    if (exists) {
      logger.warn({ ownerId, slug: input.slug }, "community.slug_exists");
      throw new SlugExistsError(input.slug);
    }
  }

  const community = await repository.create({
    ownerId,
    name: input.name,
    slug,
    description: input.description,
    visibility: input.visibility,
  });

  logger.info({ communityId: community.communityId, ownerId }, "community.create_completed");
  return community;
}

/**
 * Get a community by ID.
 */
export async function getCommunity(communityId: string): Promise<Community> {
  logger.info({ communityId }, "community.get_started");

  const community = await repository.findById(communityId);

  if (!community) {
    logger.warn({ communityId }, "community.get_failed");
    throw new CommunityNotFoundError(communityId);
  }

  logger.info({ communityId }, "community.get_completed");
  return community;
}

/**
 * Get a community by slug.
 */
export async function getCommunityBySlug(slug: string): Promise<Community> {
  logger.info({ slug }, "community.get_by_slug_started");

  const community = await repository.findBySlug(slug);

  if (!community) {
    logger.warn({ slug }, "community.get_by_slug_failed");
    throw new CommunityNotFoundError(slug);
  }

  logger.info({ communityId: community.communityId, slug }, "community.get_by_slug_completed");
  return community;
}

/**
 * Get all communities owned by a user.
 */
export async function getCommunitiesByOwner(ownerId: string): Promise<Community[]> {
  logger.info({ ownerId }, "community.get_by_owner_started");

  const communities = await repository.findByOwnerId(ownerId);

  logger.info({ ownerId, count: communities.length }, "community.get_by_owner_completed");
  return communities;
}

/**
 * Get all public communities.
 */
export async function getPublicCommunities(search?: string): Promise<Community[]> {
  logger.info({ search }, "community.get_public_started");

  const communities = await repository.findPublic(search);

  logger.info({ count: communities.length, search }, "community.get_public_completed");
  return communities;
}

/**
 * Update a community.
 * Only the owner can update.
 */
export async function updateCommunity(
  communityId: string,
  input: UpdateCommunityInput,
  userId: string,
): Promise<Community> {
  logger.info({ communityId, userId }, "community.update_started");

  const existing = await repository.findById(communityId);
  if (!existing) {
    logger.warn({ communityId }, "community.update_failed");
    throw new CommunityNotFoundError(communityId);
  }

  if (existing.ownerId !== userId) {
    logger.warn({ communityId, userId }, "community.access_denied");
    throw new CommunityAccessDeniedError(communityId);
  }

  // Build update data, only including defined properties (for exactOptionalPropertyTypes)
  const updateData: Partial<
    Pick<
      Community,
      "name" | "description" | "about" | "visibility" | "settings" | "logoUrl" | "bannerUrl"
    >
  > = {};
  if (input.name !== undefined) {
    updateData.name = input.name;
  }
  if (input.description !== undefined) {
    updateData.description = input.description;
  }
  if (input.about !== undefined) {
    updateData.about = input.about;
  }
  if (input.visibility !== undefined) {
    updateData.visibility = input.visibility;
  }
  if (input.settings !== undefined) {
    updateData.settings = input.settings;
  }
  if (input.logoUrl !== undefined) {
    updateData.logoUrl = input.logoUrl;
  }
  if (input.bannerUrl !== undefined) {
    updateData.bannerUrl = input.bannerUrl;
  }

  const updated = await repository.update(communityId, updateData);

  if (!updated) {
    logger.error({ communityId }, "community.update_failed");
    throw new CommunityNotFoundError(communityId);
  }

  logger.info({ communityId }, "community.update_completed");
  return updated;
}

/**
 * Delete a community.
 * Only the owner can delete.
 */
export async function deleteCommunity(communityId: string, userId: string): Promise<void> {
  logger.info({ communityId, userId }, "community.delete_started");

  const existing = await repository.findById(communityId);
  if (!existing) {
    logger.warn({ communityId }, "community.delete_failed");
    throw new CommunityNotFoundError(communityId);
  }

  if (existing.ownerId !== userId) {
    logger.warn({ communityId, userId }, "community.access_denied");
    throw new CommunityAccessDeniedError(communityId);
  }

  const deleted = await repository.deleteById(communityId);

  if (!deleted) {
    logger.error({ communityId }, "community.delete_failed");
    throw new CommunityNotFoundError(communityId);
  }

  logger.info({ communityId }, "community.delete_completed");
}

/**
 * Check if a slug is available.
 */
export async function checkSlugAvailable(
  slug: string,
  excludeCommunityId?: string,
): Promise<boolean> {
  logger.info({ slug }, "community.check_slug_started");

  const exists = await repository.slugExists(slug, excludeCommunityId);

  logger.info({ slug, available: !exists }, "community.check_slug_completed");
  return !exists;
}

/**
 * Get the count of communities owned by a user.
 */
export async function getCommunityCount(ownerId: string): Promise<number> {
  logger.info({ ownerId }, "community.count_started");

  const count = await repository.countByOwnerId(ownerId);

  logger.info({ ownerId, count }, "community.count_completed");
  return count;
}
