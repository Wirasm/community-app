import { describe, expect, it } from "bun:test";

import { CheckUsernameSchema, ProfileResponseSchema, UpdateProfileSchema } from "../schemas";

describe("UpdateProfileSchema", () => {
  it("accepts valid complete input", () => {
    const input = {
      username: "johndoe",
      displayName: "John Doe",
      bio: "Hello world",
      location: "San Francisco",
      website: "https://example.com",
      socialLinks: { twitter: "https://twitter.com/johndoe" },
    };
    const result = UpdateProfileSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts partial input (all fields optional)", () => {
    const result = UpdateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts single field update", () => {
    const result = UpdateProfileSchema.safeParse({ displayName: "New Name" });
    expect(result.success).toBe(true);
  });

  describe("username validation", () => {
    it("rejects username too short", () => {
      const result = UpdateProfileSchema.safeParse({ username: "ab" });
      expect(result.success).toBe(false);
    });

    it("rejects username too long", () => {
      const result = UpdateProfileSchema.safeParse({ username: "a".repeat(31) });
      expect(result.success).toBe(false);
    });

    it("rejects uppercase letters", () => {
      const result = UpdateProfileSchema.safeParse({ username: "JohnDoe" });
      expect(result.success).toBe(false);
    });

    it("rejects spaces", () => {
      const result = UpdateProfileSchema.safeParse({ username: "john doe" });
      expect(result.success).toBe(false);
    });

    it("rejects special characters", () => {
      const result = UpdateProfileSchema.safeParse({ username: "john@doe" });
      expect(result.success).toBe(false);
    });

    it("accepts underscores", () => {
      const result = UpdateProfileSchema.safeParse({ username: "john_doe" });
      expect(result.success).toBe(true);
    });

    it("accepts numbers", () => {
      const result = UpdateProfileSchema.safeParse({ username: "john123" });
      expect(result.success).toBe(true);
    });
  });

  describe("bio validation", () => {
    it("rejects bio over 500 characters", () => {
      const result = UpdateProfileSchema.safeParse({ bio: "a".repeat(501) });
      expect(result.success).toBe(false);
    });

    it("accepts empty bio", () => {
      const result = UpdateProfileSchema.safeParse({ bio: "" });
      expect(result.success).toBe(true);
    });
  });

  describe("website validation", () => {
    it("rejects invalid URL", () => {
      const result = UpdateProfileSchema.safeParse({ website: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("accepts valid URL", () => {
      const result = UpdateProfileSchema.safeParse({ website: "https://example.com" });
      expect(result.success).toBe(true);
    });
  });

  describe("socialLinks validation", () => {
    it("rejects invalid URL in socialLinks", () => {
      const result = UpdateProfileSchema.safeParse({
        socialLinks: { twitter: "not-a-url" },
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid URLs in socialLinks", () => {
      const result = UpdateProfileSchema.safeParse({
        socialLinks: {
          twitter: "https://twitter.com/johndoe",
          linkedin: "https://linkedin.com/in/johndoe",
        },
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("CheckUsernameSchema", () => {
  it("accepts valid username", () => {
    const result = CheckUsernameSchema.safeParse({ username: "johndoe" });
    expect(result.success).toBe(true);
  });

  it("rejects missing username", () => {
    const result = CheckUsernameSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid username format", () => {
    const result = CheckUsernameSchema.safeParse({ username: "John Doe" });
    expect(result.success).toBe(false);
  });
});

describe("ProfileResponseSchema", () => {
  it("validates complete profile response", () => {
    const profile = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      userId: "550e8400-e29b-41d4-a716-446655440001",
      username: "johndoe",
      displayName: "John Doe",
      bio: null,
      avatarUrl: null,
      bannerUrl: null,
      location: null,
      website: null,
      socialLinks: {},
      platformRole: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = ProfileResponseSchema.safeParse(profile);
    expect(result.success).toBe(true);
  });

  it("rejects invalid platformRole", () => {
    const profile = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      userId: "550e8400-e29b-41d4-a716-446655440001",
      username: "johndoe",
      displayName: "John Doe",
      bio: null,
      avatarUrl: null,
      bannerUrl: null,
      location: null,
      website: null,
      socialLinks: {},
      platformRole: "superadmin",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = ProfileResponseSchema.safeParse(profile);
    expect(result.success).toBe(false);
  });
});
