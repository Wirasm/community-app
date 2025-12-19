import { z } from "zod/v4";

/** Valid visibility options for communities. */
export const VISIBILITY_OPTIONS = ["public", "private", "paid"] as const;
export type CommunityVisibility = (typeof VISIBILITY_OPTIONS)[number];

/** Slug validation constraints. */
export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 50;
export const SLUG_PATTERN = /^[a-z0-9-]+$/;

/** Reusable slug schema for validation. */
export const slugSchema = z
  .string()
  .min(SLUG_MIN_LENGTH, `Slug must be at least ${SLUG_MIN_LENGTH} characters`)
  .max(SLUG_MAX_LENGTH, `Slug must be at most ${SLUG_MAX_LENGTH} characters`)
  .regex(SLUG_PATTERN, "Slug can only contain lowercase letters, numbers, and hyphens");

export const CreateCommunitySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be at most 100 characters"),
  slug: slugSchema.optional(), // Auto-generated from name if not provided
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  visibility: z.enum(VISIBILITY_OPTIONS).default("public"),
});

export type CreateCommunityInput = z.infer<typeof CreateCommunitySchema>;

export const UpdateCommunitySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  about: z.string().max(10000, "About must be at most 10000 characters").optional(),
  visibility: z.enum(VISIBILITY_OPTIONS).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateCommunityInput = z.infer<typeof UpdateCommunitySchema>;

export const CheckSlugSchema = z.object({
  slug: slugSchema,
});

export type CheckSlugInput = z.infer<typeof CheckSlugSchema>;
