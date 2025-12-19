import { getLogger } from "@/core/logging";
import type { PaginatedResponse, PaginationParams } from "@/shared/schemas/pagination";
import { createPaginatedResponse } from "@/shared/schemas/pagination";

import {
  AlreadyMemberError,
  BannedUserError,
  CannotModifyOwnerError,
  InsufficientPermissionsError,
  InvalidRoleAssignmentError,
  MembershipNotFoundError,
  NotMemberError,
  OwnerCannotLeaveError,
} from "./errors";
import type { Membership } from "./models";
import { canAssignRole, canManageRole } from "./permissions";
import * as repository from "./repository";
import type { CommunityRole, MembershipStatus, UpdateMembershipInput } from "./schemas";

const logger = getLogger("memberships.service");

/**
 * Get a membership by ID.
 */
export async function getMembership(membershipId: string): Promise<Membership> {
  logger.info({ membershipId }, "membership.get_started");

  const membership = await repository.findById(membershipId);

  if (!membership) {
    logger.warn({ membershipId }, "membership.get_failed");
    throw new MembershipNotFoundError(membershipId);
  }

  logger.info({ membershipId }, "membership.get_completed");
  return membership;
}

/**
 * Get membership for a profile in a community.
 * Throws BannedUserError if user is banned (unless throwOnBanned is false).
 */
export async function getMembershipByProfileAndCommunity(
  profileId: string,
  communityId: string,
  options?: { throwOnBanned?: boolean },
): Promise<Membership> {
  logger.info({ profileId, communityId }, "membership.get_by_profile_community_started");

  const membership = await repository.findByProfileAndCommunity(profileId, communityId);

  if (!membership) {
    logger.warn({ profileId, communityId }, "membership.get_by_profile_community_failed");
    throw new NotMemberError(communityId);
  }

  // Check if user is banned
  if (options?.throwOnBanned !== false && membership.status === "banned") {
    logger.warn({ profileId, communityId }, "membership.user_banned");
    throw new BannedUserError(communityId);
  }

  logger.info(
    { membershipId: membership.membershipId },
    "membership.get_by_profile_community_completed",
  );
  return membership;
}

/**
 * List all members of a community.
 */
export async function listCommunityMembers(communityId: string): Promise<Membership[]> {
  logger.info({ communityId }, "membership.list_started");

  const members = await repository.findByCommunity(communityId);

  logger.info({ communityId, count: members.length }, "membership.list_completed");
  return members;
}

/**
 * List members of a community with pagination and optional filters.
 */
export async function listCommunityMembersPaginated(
  communityId: string,
  params: PaginationParams,
  filters?: { status?: MembershipStatus; role?: CommunityRole },
): Promise<PaginatedResponse<Membership>> {
  logger.info({ communityId, page: params.page }, "membership.list_paginated_started");

  const { members, total } = await repository.findByCommunityPaginated(
    communityId,
    params,
    filters,
  );

  logger.info({ communityId, count: members.length, total }, "membership.list_paginated_completed");
  return createPaginatedResponse(members, total, params);
}

/**
 * List active members of a community.
 */
export async function listActiveCommunityMembers(communityId: string): Promise<Membership[]> {
  logger.info({ communityId }, "membership.list_active_started");

  const members = await repository.findActiveByCommunity(communityId);

  logger.info({ communityId, count: members.length }, "membership.list_active_completed");
  return members;
}

/**
 * Get member count for a community.
 */
export async function getCommunityMemberCount(communityId: string): Promise<number> {
  logger.info({ communityId }, "membership.count_started");

  const memberCount = await repository.countByCommunity(communityId);

  logger.info({ communityId, count: memberCount }, "membership.count_completed");
  return memberCount;
}

/**
 * Join a community.
 * Public communities: status = active
 * Private/Paid communities: status = pending (requires approval)
 */
export async function joinCommunity(
  profileId: string,
  communityId: string,
  communityVisibility: "public" | "private" | "paid",
): Promise<Membership> {
  logger.info({ profileId, communityId }, "membership.join_started");

  // Check if already a member
  const existing = await repository.findByProfileAndCommunity(profileId, communityId);
  if (existing) {
    logger.warn({ profileId, communityId }, "membership.already_member");
    throw new AlreadyMemberError(communityId);
  }

  // Determine initial status based on community visibility
  const status: MembershipStatus = communityVisibility === "public" ? "active" : "pending";

  const membership = await repository.create({
    communityId,
    profileId,
    role: "member",
    status,
  });

  logger.info({ membershipId: membership.membershipId, status }, "membership.join_completed");
  return membership;
}

/**
 * Leave a community.
 * Owner cannot leave - must transfer ownership first.
 */
export async function leaveCommunity(profileId: string, communityId: string): Promise<void> {
  logger.info({ profileId, communityId }, "membership.leave_started");

  const membership = await repository.findByProfileAndCommunity(profileId, communityId);

  if (!membership) {
    logger.warn({ profileId, communityId }, "membership.not_member");
    throw new NotMemberError(communityId);
  }

  if (membership.role === "owner") {
    logger.warn({ profileId, communityId }, "membership.owner_cannot_leave");
    throw new OwnerCannotLeaveError();
  }

  await repository.deleteById(membership.membershipId);

  logger.info({ membershipId: membership.membershipId }, "membership.leave_completed");
}

/**
 * Update a membership (role or status).
 * Enforces role hierarchy permissions.
 */
export async function updateMembership(
  targetMembershipId: string,
  input: UpdateMembershipInput,
  actorProfileId: string,
  communityId: string,
): Promise<Membership> {
  logger.info({ targetMembershipId, actorProfileId }, "membership.update_started");

  // Get actor's membership to check permissions
  const actorMembership = await repository.findByProfileAndCommunity(actorProfileId, communityId);
  if (!actorMembership || actorMembership.status !== "active") {
    logger.warn({ actorProfileId, communityId }, "membership.actor_not_active_member");
    throw new InsufficientPermissionsError("update membership");
  }

  // Get target membership
  const targetMembership = await repository.findById(targetMembershipId);
  if (!targetMembership) {
    logger.warn({ targetMembershipId }, "membership.target_not_found");
    throw new MembershipNotFoundError(targetMembershipId);
  }

  // Cannot modify owner
  if (targetMembership.role === "owner") {
    logger.warn({ targetMembershipId }, "membership.cannot_modify_owner");
    throw new CannotModifyOwnerError();
  }

  // Check if actor can manage target based on role hierarchy
  if (!canManageRole(actorMembership.role, targetMembership.role)) {
    logger.warn(
      { actorRole: actorMembership.role, targetRole: targetMembership.role },
      "membership.insufficient_hierarchy",
    );
    throw new InsufficientPermissionsError("manage this member");
  }

  // If changing role, validate the new role
  if (input.role !== undefined) {
    if (!canAssignRole(actorMembership.role, input.role)) {
      logger.warn(
        { actorRole: actorMembership.role, newRole: input.role },
        "membership.cannot_assign_role",
      );
      throw new InvalidRoleAssignmentError(input.role);
    }
  }

  // Build update data for exactOptionalPropertyTypes
  const updateData: Partial<Pick<Membership, "role" | "status">> = {};
  if (input.role !== undefined) {
    updateData.role = input.role;
  }
  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  const updated = await repository.update(targetMembershipId, updateData);

  if (!updated) {
    logger.error({ targetMembershipId }, "membership.update_failed");
    throw new MembershipNotFoundError(targetMembershipId);
  }

  logger.info({ membershipId: targetMembershipId }, "membership.update_completed");
  return updated;
}

/**
 * Remove a member from a community.
 */
export async function removeMember(
  targetMembershipId: string,
  actorProfileId: string,
  communityId: string,
): Promise<void> {
  logger.info({ targetMembershipId, actorProfileId }, "membership.remove_started");

  // Get actor's membership
  const actorMembership = await repository.findByProfileAndCommunity(actorProfileId, communityId);
  if (!actorMembership || actorMembership.status !== "active") {
    logger.warn({ actorProfileId, communityId }, "membership.actor_not_active_member");
    throw new InsufficientPermissionsError("remove member");
  }

  // Get target membership
  const targetMembership = await repository.findById(targetMembershipId);
  if (!targetMembership) {
    logger.warn({ targetMembershipId }, "membership.target_not_found");
    throw new MembershipNotFoundError(targetMembershipId);
  }

  // Cannot remove owner
  if (targetMembership.role === "owner") {
    logger.warn({ targetMembershipId }, "membership.cannot_remove_owner");
    throw new CannotModifyOwnerError();
  }

  // Check hierarchy
  if (!canManageRole(actorMembership.role, targetMembership.role)) {
    logger.warn(
      { actorRole: actorMembership.role, targetRole: targetMembership.role },
      "membership.insufficient_hierarchy",
    );
    throw new InsufficientPermissionsError("remove this member");
  }

  await repository.deleteById(targetMembershipId);

  logger.info({ membershipId: targetMembershipId }, "membership.remove_completed");
}

/**
 * Check if a membership record exists for a profile in a community.
 * Note: Returns true for any membership status (active, pending, or banned).
 */
export async function isMember(profileId: string, communityId: string): Promise<boolean> {
  logger.info({ profileId, communityId }, "membership.check_started");

  const exists = await repository.membershipExists(profileId, communityId);

  logger.info({ profileId, communityId, isMember: exists }, "membership.check_completed");
  return exists;
}

/**
 * Transfer community ownership to another active member.
 * Current owner becomes co_owner, new owner gets owner role.
 */
export async function transferOwnership(
  communityId: string,
  currentOwnerProfileId: string,
  newOwnerProfileId: string,
): Promise<{ oldOwnerMembership: Membership; newOwnerMembership: Membership }> {
  logger.info(
    { communityId, currentOwnerProfileId, newOwnerProfileId },
    "membership.transfer_started",
  );

  // Get current owner's membership
  const currentOwnerMembership = await repository.findByProfileAndCommunity(
    currentOwnerProfileId,
    communityId,
  );
  if (!currentOwnerMembership) {
    throw new NotMemberError(communityId);
  }
  if (currentOwnerMembership.role !== "owner") {
    logger.warn(
      { currentOwnerProfileId, role: currentOwnerMembership.role },
      "membership.not_owner",
    );
    throw new InsufficientPermissionsError("transfer ownership");
  }

  // Get new owner's membership
  const newOwnerMembership = await repository.findByProfileAndCommunity(
    newOwnerProfileId,
    communityId,
  );
  if (!newOwnerMembership) {
    logger.warn({ newOwnerProfileId }, "membership.new_owner_not_member");
    throw new NotMemberError(communityId);
  }
  if (newOwnerMembership.status !== "active") {
    logger.warn(
      { newOwnerProfileId, status: newOwnerMembership.status },
      "membership.new_owner_not_active",
    );
    throw new InsufficientPermissionsError("transfer to non-active member");
  }

  // Perform transfer: demote current owner to co_owner, promote new owner to owner
  const [updatedOldOwner, updatedNewOwner] = await Promise.all([
    repository.update(currentOwnerMembership.membershipId, { role: "co_owner" }),
    repository.update(newOwnerMembership.membershipId, { role: "owner" }),
  ]);

  if (!updatedOldOwner || !updatedNewOwner) {
    logger.error({ communityId }, "membership.transfer_failed");
    throw new Error("Failed to transfer ownership");
  }

  logger.info(
    {
      communityId,
      oldOwner: currentOwnerProfileId,
      newOwner: newOwnerProfileId,
    },
    "membership.transfer_completed",
  );

  return {
    oldOwnerMembership: updatedOldOwner,
    newOwnerMembership: updatedNewOwner,
  };
}
