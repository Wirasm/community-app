import { getLogger } from "@/core/logging";

import { ProfileAccessDeniedError, ProfileNotFoundError, UsernameExistsError } from "./errors";
import type { Profile } from "./models";
import * as repository from "./repository";
import type { UpdateProfileInput } from "./schemas";

const logger = getLogger("profiles.service");

/**
 * Get a profile by ID.
 */
export async function getProfile(profileId: string): Promise<Profile> {
  logger.info({ profileId }, "profile.get_started");

  const profile = await repository.findById(profileId);

  if (!profile) {
    logger.warn({ profileId }, "profile.get_failed");
    throw new ProfileNotFoundError(profileId);
  }

  logger.info({ profileId }, "profile.get_completed");
  return profile;
}

/**
 * Get a profile by user ID.
 */
export async function getProfileByUserId(userId: string): Promise<Profile> {
  logger.info({ userId }, "profile.get_by_user_id_started");

  const profile = await repository.findByUserId(userId);

  if (!profile) {
    logger.warn({ userId }, "profile.get_by_user_id_failed");
    throw new ProfileNotFoundError(userId);
  }

  logger.info({ profileId: profile.profileId, userId }, "profile.get_by_user_id_completed");
  return profile;
}

/**
 * Get a profile by username.
 * Public profiles are viewable by anyone.
 */
export async function getProfileByUsername(username: string): Promise<Profile> {
  logger.info({ username }, "profile.get_by_username_started");

  const profile = await repository.findByUsername(username);

  if (!profile) {
    logger.warn({ username }, "profile.get_by_username_failed");
    throw new ProfileNotFoundError(username);
  }

  logger.info({ profileId: profile.profileId, username }, "profile.get_by_username_completed");
  return profile;
}

/**
 * Update a profile.
 * Only the owner can update their profile.
 */
export async function updateProfile(
  profileId: string,
  input: UpdateProfileInput,
  userId: string,
): Promise<Profile> {
  logger.info({ profileId, userId }, "profile.update_started");

  const existing = await repository.findById(profileId);
  if (!existing) {
    logger.warn({ profileId }, "profile.update_failed");
    throw new ProfileNotFoundError(profileId);
  }

  if (existing.userId !== userId) {
    logger.warn({ profileId, userId }, "profile.access_denied");
    throw new ProfileAccessDeniedError(profileId);
  }

  // Check username uniqueness if being changed
  if (input.username !== undefined && input.username !== existing.username) {
    const usernameExists = await repository.usernameExists(input.username, profileId);
    if (usernameExists) {
      logger.warn({ profileId, username: input.username }, "profile.username_exists");
      throw new UsernameExistsError(input.username);
    }
  }

  // Build update data, only including defined properties (for exactOptionalPropertyTypes)
  const updateData: Partial<
    Pick<Profile, "username" | "displayName" | "bio" | "location" | "website" | "socialLinks">
  > = {};
  if (input.username !== undefined) {
    updateData.username = input.username;
  }
  if (input.displayName !== undefined) {
    updateData.displayName = input.displayName;
  }
  if (input.bio !== undefined) {
    updateData.bio = input.bio;
  }
  if (input.location !== undefined) {
    updateData.location = input.location;
  }
  if (input.website !== undefined) {
    updateData.website = input.website;
  }
  if (input.socialLinks !== undefined) {
    updateData.socialLinks = input.socialLinks;
  }

  const updated = await repository.update(profileId, updateData);

  if (!updated) {
    logger.error({ profileId }, "profile.update_failed");
    throw new ProfileNotFoundError(profileId);
  }

  logger.info({ profileId }, "profile.update_completed");
  return updated;
}

/**
 * Check if a username is available.
 */
export async function checkUsernameAvailable(
  username: string,
  excludeProfileId?: string,
): Promise<boolean> {
  logger.info({ username }, "profile.check_username_started");

  const exists = await repository.usernameExists(username, excludeProfileId);

  logger.info({ username, available: !exists }, "profile.check_username_completed");
  return !exists;
}
