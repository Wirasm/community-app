import { z } from "zod/v4";

/** Valid platform roles for user access levels. Shared between database schema and Zod validation. */
export const PLATFORM_ROLES = ["admin", "user", "suspended"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/** Username validation constraints. */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_PATTERN = /^[a-z0-9_]+$/;

/** Reusable username schema for validation. */
export const usernameSchema = z
  .string()
  .min(USERNAME_MIN_LENGTH, `Username must be at least ${USERNAME_MIN_LENGTH} characters`)
  .max(USERNAME_MAX_LENGTH, `Username must be at most ${USERNAME_MAX_LENGTH} characters`)
  .regex(USERNAME_PATTERN, "Username can only contain lowercase letters, numbers, and underscores");

export const UpdateProfileSchema = z.object({
  username: usernameSchema.optional(),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be at most 100 characters")
    .optional(),
  bio: z.string().max(500, "Bio must be at most 500 characters").optional(),
  location: z.string().max(100, "Location must be at most 100 characters").optional(),
  website: z.string().url("Invalid URL format").optional(),
  socialLinks: z.record(z.string(), z.string().url("Invalid URL format")).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const ProfileResponseSchema = z.object({
  profileId: z.string().uuid(),
  userId: z.string().uuid(),
  username: z.string(),
  displayName: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  location: z.string().nullable(),
  website: z.string().nullable(),
  socialLinks: z.record(z.string(), z.string()),
  platformRole: z.enum(PLATFORM_ROLES),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export const CheckUsernameSchema = z.object({
  username: usernameSchema,
});

export type CheckUsernameInput = z.infer<typeof CheckUsernameSchema>;
