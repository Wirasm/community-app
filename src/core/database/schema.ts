import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Base timestamp columns for all tables.
 * Usage: ...timestamps
 */
export const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
};

/**
 * Users table - syncs with Supabase Auth via database trigger.
 *
 * To set up the trigger in Supabase SQL Editor:
 *
 * ```sql
 * -- Function to sync auth.users to public.users
 * CREATE OR REPLACE FUNCTION public.handle_new_user()
 * RETURNS trigger AS $$
 * BEGIN
 *   INSERT INTO public.users (id, email)
 *   VALUES (NEW.id, NEW.email);
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 *
 * -- Trigger on auth.users insert
 * CREATE OR REPLACE TRIGGER on_auth_user_created
 *   AFTER INSERT ON auth.users
 *   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
 * ```
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // References auth.users(id)
  email: text("email").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  ...timestamps,
});

/**
 * Platform role enum for user access levels.
 */
export const platformRoleEnum = pgEnum("platform_role", ["admin", "user", "suspended"]);

/**
 * Profiles table - public profile data for users.
 */
export const profiles = pgTable("profiles", {
  profileId: uuid("profile_id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  location: text("location"),
  website: text("website"),
  socialLinks: jsonb("social_links").$type<Record<string, string>>().default({}),
  platformRole: platformRoleEnum("platform_role").notNull().default("user"),
  ...timestamps,
});

/**
 * Community visibility enum for access control.
 */
export const communityVisibilityEnum = pgEnum("community_visibility", [
  "public",
  "private",
  "paid",
]);

/**
 * Community role enum for membership role hierarchy.
 */
export const communityRoleEnum = pgEnum("community_role", [
  "owner",
  "co_owner",
  "admin",
  "moderator",
  "member",
]);

/**
 * Membership status enum for membership states.
 */
export const membershipStatusEnum = pgEnum("membership_status", ["active", "pending", "banned"]);

/**
 * Communities table - groups of users organized around shared interests.
 */
export const communities = pgTable("communities", {
  communityId: uuid("community_id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => profiles.profileId, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  about: text("about"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  visibility: communityVisibilityEnum("visibility").notNull().default("public"),
  settings: jsonb("settings").$type<Record<string, unknown>>().default({}),
  ...timestamps,
});

/**
 * Memberships table - tracks user-community relationships with roles.
 */
export const memberships = pgTable("memberships", {
  membershipId: uuid("membership_id").primaryKey().defaultRandom(),
  communityId: uuid("community_id")
    .notNull()
    .references(() => communities.communityId, { onDelete: "cascade" }),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.profileId, { onDelete: "cascade" }),
  role: communityRoleEnum("role").notNull().default("member"),
  status: membershipStatusEnum("status").notNull().default("active"),
  invitedByProfileId: uuid("invited_by_profile_id").references(() => profiles.profileId),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  ...timestamps,
});
