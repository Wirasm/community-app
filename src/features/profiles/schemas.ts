import { z } from "zod/v4";

export const UpdateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores")
    .optional(),
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
  id: z.string().uuid(),
  userId: z.string().uuid(),
  username: z.string(),
  displayName: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  location: z.string().nullable(),
  website: z.string().nullable(),
  socialLinks: z.record(z.string(), z.string()),
  platformRole: z.enum(["admin", "user", "suspended"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export const CheckUsernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
});

export type CheckUsernameInput = z.infer<typeof CheckUsernameSchema>;
