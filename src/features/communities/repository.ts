import { and, count, desc, eq, ilike, ne, or } from "drizzle-orm";

import { db } from "@/core/database/client";
import { getLogger } from "@/core/logging";

import { CommunityCreationError } from "./errors";
import type { Community, NewCommunity } from "./models";
import { communities } from "./models";

const logger = getLogger("communities.repository");

export async function findById(communityId: string): Promise<Community | undefined> {
  const results = await db
    .select()
    .from(communities)
    .where(eq(communities.communityId, communityId))
    .limit(1);
  return results[0];
}

export async function findBySlug(slug: string): Promise<Community | undefined> {
  const results = await db.select().from(communities).where(eq(communities.slug, slug)).limit(1);
  return results[0];
}

export async function findByOwnerId(ownerId: string): Promise<Community[]> {
  return db.select().from(communities).where(eq(communities.ownerId, ownerId));
}

export async function findPublic(search?: string): Promise<Community[]> {
  if (search) {
    const searchPattern = `%${search.toLowerCase()}%`;
    return db
      .select()
      .from(communities)
      .where(
        and(
          eq(communities.visibility, "public"),
          or(ilike(communities.name, searchPattern), ilike(communities.description, searchPattern)),
        ),
      )
      .orderBy(desc(communities.createdAt));
  }

  return db
    .select()
    .from(communities)
    .where(eq(communities.visibility, "public"))
    .orderBy(desc(communities.createdAt));
}

export async function create(data: NewCommunity): Promise<Community> {
  logger.info({ ownerId: data.ownerId, slug: data.slug }, "community.create_started");

  const results = await db.insert(communities).values(data).returning();
  const community = results[0];

  if (!community) {
    logger.error({ ownerId: data.ownerId }, "community.create_failed");
    throw new CommunityCreationError(data.ownerId);
  }

  logger.info(
    { communityId: community.communityId, ownerId: data.ownerId },
    "community.create_completed",
  );
  return community;
}

export async function update(
  communityId: string,
  data: Partial<
    Pick<
      Community,
      "name" | "description" | "about" | "visibility" | "settings" | "logoUrl" | "bannerUrl"
    >
  >,
): Promise<Community | undefined> {
  const results = await db
    .update(communities)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(communities.communityId, communityId))
    .returning();
  return results[0];
}

export async function deleteById(communityId: string): Promise<boolean> {
  const results = await db
    .delete(communities)
    .where(eq(communities.communityId, communityId))
    .returning();
  return results.length > 0;
}

export async function slugExists(slug: string, excludeCommunityId?: string): Promise<boolean> {
  if (excludeCommunityId) {
    const results = await db
      .select()
      .from(communities)
      .where(and(eq(communities.slug, slug), ne(communities.communityId, excludeCommunityId)))
      .limit(1);
    return results.length > 0;
  }
  const results = await db.select().from(communities).where(eq(communities.slug, slug)).limit(1);
  return results.length > 0;
}

export async function countByOwnerId(ownerId: string): Promise<number> {
  const results = await db
    .select({ count: count() })
    .from(communities)
    .where(eq(communities.ownerId, ownerId));
  const result = results[0];
  return result?.count ?? 0;
}
