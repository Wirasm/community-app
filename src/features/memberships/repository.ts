import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/core/database/client";
import { getLogger } from "@/core/logging";

import type { Membership, NewMembership } from "./models";
import { memberships } from "./models";

const logger = getLogger("memberships.repository");

export async function findById(membershipId: string): Promise<Membership | undefined> {
  const results = await db
    .select()
    .from(memberships)
    .where(eq(memberships.membershipId, membershipId))
    .limit(1);
  return results[0];
}

export async function findByProfileAndCommunity(
  profileId: string,
  communityId: string,
): Promise<Membership | undefined> {
  const results = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.profileId, profileId), eq(memberships.communityId, communityId)))
    .limit(1);
  return results[0];
}

export async function findByCommunity(communityId: string): Promise<Membership[]> {
  return db
    .select()
    .from(memberships)
    .where(eq(memberships.communityId, communityId))
    .orderBy(desc(memberships.joinedAt));
}

export async function findActiveByCommunity(communityId: string): Promise<Membership[]> {
  return db
    .select()
    .from(memberships)
    .where(and(eq(memberships.communityId, communityId), eq(memberships.status, "active")))
    .orderBy(desc(memberships.joinedAt));
}

export async function findByProfile(profileId: string): Promise<Membership[]> {
  return db
    .select()
    .from(memberships)
    .where(eq(memberships.profileId, profileId))
    .orderBy(desc(memberships.joinedAt));
}

export async function countByCommunity(communityId: string): Promise<number> {
  const results = await db
    .select({ count: count() })
    .from(memberships)
    .where(and(eq(memberships.communityId, communityId), eq(memberships.status, "active")));
  return results[0]?.count ?? 0;
}

export async function create(data: NewMembership): Promise<Membership> {
  logger.info(
    { communityId: data.communityId, profileId: data.profileId },
    "membership.create_started",
  );

  const results = await db.insert(memberships).values(data).returning();
  const membership = results[0];

  if (!membership) {
    logger.error(
      { communityId: data.communityId, profileId: data.profileId },
      "membership.create_failed",
    );
    throw new Error("Failed to create membership");
  }

  logger.info({ membershipId: membership.membershipId }, "membership.create_completed");
  return membership;
}

export async function update(
  membershipId: string,
  data: Partial<Pick<Membership, "role" | "status">>,
): Promise<Membership | undefined> {
  const results = await db
    .update(memberships)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(memberships.membershipId, membershipId))
    .returning();
  return results[0];
}

export async function deleteById(membershipId: string): Promise<boolean> {
  const results = await db
    .delete(memberships)
    .where(eq(memberships.membershipId, membershipId))
    .returning();
  return results.length > 0;
}

export async function membershipExists(profileId: string, communityId: string): Promise<boolean> {
  const results = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.profileId, profileId), eq(memberships.communityId, communityId)))
    .limit(1);
  return results[0] !== undefined;
}
