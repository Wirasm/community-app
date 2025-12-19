import { z } from "zod/v4";

/** Valid community roles in hierarchy order (highest to lowest). */
export const COMMUNITY_ROLES = ["owner", "co_owner", "admin", "moderator", "member"] as const;
export type CommunityRole = (typeof COMMUNITY_ROLES)[number];

/** Valid membership statuses. */
export const MEMBERSHIP_STATUSES = ["active", "pending", "banned"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

/** Role hierarchy values - higher number = more permissions. */
export const ROLE_HIERARCHY: Record<CommunityRole, number> = {
  owner: 5,
  co_owner: 4,
  admin: 3,
  moderator: 2,
  member: 1,
} as const;

/** Roles that can be assigned (owner is never assigned, only transferred). */
export const ASSIGNABLE_ROLES = ["co_owner", "admin", "moderator", "member"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const UpdateMembershipSchema = z.object({
  role: z.enum(ASSIGNABLE_ROLES).optional(),
  status: z.enum(MEMBERSHIP_STATUSES).optional(),
});

export type UpdateMembershipInput = z.infer<typeof UpdateMembershipSchema>;

export const TransferOwnershipSchema = z.object({
  newOwnerProfileId: z.string().uuid("Invalid profile ID format"),
});

export type TransferOwnershipInput = z.infer<typeof TransferOwnershipSchema>;

export const MembershipResponseSchema = z.object({
  membershipId: z.string().uuid(),
  communityId: z.string().uuid(),
  profileId: z.string().uuid(),
  role: z.enum(COMMUNITY_ROLES),
  status: z.enum(MEMBERSHIP_STATUSES),
  invitedByProfileId: z.string().uuid().nullable(),
  joinedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MembershipResponse = z.infer<typeof MembershipResponseSchema>;
