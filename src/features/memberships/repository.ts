import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/core/database/client";
import { getLogger } from "@/core/logging";
import type { PaginationParams } from "@/shared/schemas/pagination";
import { getOffset } from "@/shared/schemas/pagination";

import type { Membership, NewMembership } from "./models";
import { memberships } from "./models";
import type { CommunityRole, MembershipStatus } from "./schemas";

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

export async function findByCommunityPaginated(
  communityId: string,
  params: PaginationParams,
  filters?: { status?: MembershipStatus; role?: CommunityRole },
): Promise<{ members: Membership[]; total: number }> {
  const conditions = [eq(memberships.communityId, communityId)];

  if (filters?.status) {
    conditions.push(eq(memberships.status, filters.status));
  }
  if (filters?.role) {
    conditions.push(eq(memberships.role, filters.role));
  }

  const whereClause = and(...conditions);

  const [members, countResult] = await Promise.all([
    db
      .select()
      .from(memberships)
      .where(whereClause)
      .orderBy(desc(memberships.joinedAt))
      .limit(params.pageSize)
      .offset(getOffset(params)),
    db.select({ count: count() }).from(memberships).where(whereClause),
  ]);

  return {
    members,
    total: countResult[0]?.count ?? 0,
  };
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

  // Count query should always return exactly one row
  const result = results[0];
  if (results.length !== 1 || result === undefined) {
    logger.error(
      { communityId, resultCount: results.length },
      "membership.count_unexpected_result",
    );
    return 0;
  }

  return result.count;
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
  logger.info({ membershipId, updates: Object.keys(data) }, "membership.update_started");

  const results = await db
    .update(memberships)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(memberships.membershipId, membershipId))
    .returning();

  if (!results[0]) {
    logger.warn({ membershipId }, "membership.update_no_rows_affected");
  }

  return results[0];
}

export async function deleteById(membershipId: string): Promise<boolean> {
  const results = await db
    .delete(memberships)
    .where(eq(memberships.membershipId, membershipId))
    .returning();

  if (results.length === 0) {
    logger.warn({ membershipId }, "membership.delete_not_found");
  }

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
