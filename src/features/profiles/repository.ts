import { eq } from "drizzle-orm";

import { db } from "@/core/database/client";

import type { NewProfile, Profile } from "./models";
import { profiles } from "./models";

export async function findById(profileId: string): Promise<Profile | undefined> {
  const results = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
  return results[0];
}

export async function findByUserId(userId: string): Promise<Profile | undefined> {
  const results = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return results[0];
}

export async function findByUsername(username: string): Promise<Profile | undefined> {
  const results = await db.select().from(profiles).where(eq(profiles.username, username)).limit(1);
  return results[0];
}

export async function create(data: NewProfile): Promise<Profile> {
  const results = await db.insert(profiles).values(data).returning();
  const profile = results[0];
  if (!profile) {
    throw new Error("Failed to create profile");
  }
  return profile;
}

export async function update(
  profileId: string,
  data: Partial<
    Pick<
      Profile,
      | "username"
      | "displayName"
      | "bio"
      | "location"
      | "website"
      | "socialLinks"
      | "avatarUrl"
      | "bannerUrl"
    >
  >,
): Promise<Profile | undefined> {
  const results = await db
    .update(profiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(profiles.id, profileId))
    .returning();
  return results[0];
}

export async function usernameExists(
  username: string,
  excludeProfileId?: string,
): Promise<boolean> {
  const results = await db.select().from(profiles).where(eq(profiles.username, username)).limit(1);
  const existing = results[0];
  if (!existing) {
    return false;
  }
  if (excludeProfileId && existing.id === excludeProfileId) {
    return false;
  }
  return true;
}
