import type { AssignableRole, CommunityRole } from "./schemas";
import { ROLE_HIERARCHY } from "./schemas";

/**
 * Check if actor role can manage target role.
 * Actor must have strictly higher hierarchy than target.
 */
export function canManageRole(actorRole: CommunityRole, targetRole: CommunityRole): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Check if actor role can assign a new role.
 * Actor must have strictly higher hierarchy than the role being assigned.
 */
export function canAssignRole(actorRole: CommunityRole, newRole: AssignableRole): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[newRole];
}

/**
 * Check if actor has at least the minimum required role.
 */
export function hasMinimumRole(actorRole: CommunityRole, minimumRole: CommunityRole): boolean {
  return ROLE_HIERARCHY[actorRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Check if actor can ban members.
 * Moderators and above can ban (but only members below their level).
 */
export function canBanMembers(actorRole: CommunityRole): boolean {
  return hasMinimumRole(actorRole, "moderator");
}

/**
 * Check if actor can manage admins.
 * Only owner and co_owner can manage admins.
 */
export function canManageAdmins(actorRole: CommunityRole): boolean {
  return hasMinimumRole(actorRole, "co_owner");
}

/**
 * Check if actor can manage moderators.
 * Admins and above can manage moderators.
 */
export function canManageModerators(actorRole: CommunityRole): boolean {
  return hasMinimumRole(actorRole, "admin");
}
