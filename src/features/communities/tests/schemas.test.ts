import { describe, expect, it } from "bun:test";

import { CheckSlugSchema, CreateCommunitySchema, UpdateCommunitySchema } from "../schemas";

describe("CreateCommunitySchema", () => {
  it("accepts valid complete input", () => {
    const input = {
      name: "My Community",
      slug: "my-community",
      description: "A great community",
      visibility: "public" as const,
    };
    const result = CreateCommunitySchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts minimal input (only name required)", () => {
    const result = CreateCommunitySchema.safeParse({ name: "Test Community" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.visibility).toBe("public"); // default
    }
  });

  it("auto-fills visibility default", () => {
    const result = CreateCommunitySchema.safeParse({ name: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.visibility).toBe("public");
    }
  });

  describe("name validation", () => {
    it("rejects name too short", () => {
      const result = CreateCommunitySchema.safeParse({ name: "ab" });
      expect(result.success).toBe(false);
    });

    it("rejects name too long", () => {
      const result = CreateCommunitySchema.safeParse({ name: "a".repeat(101) });
      expect(result.success).toBe(false);
    });

    it("accepts name at boundaries", () => {
      expect(CreateCommunitySchema.safeParse({ name: "abc" }).success).toBe(true);
      expect(CreateCommunitySchema.safeParse({ name: "a".repeat(100) }).success).toBe(true);
    });
  });

  describe("slug validation", () => {
    it("rejects slug too short", () => {
      const result = CreateCommunitySchema.safeParse({ name: "Test", slug: "ab" });
      expect(result.success).toBe(false);
    });

    it("rejects slug too long", () => {
      const result = CreateCommunitySchema.safeParse({ name: "Test", slug: "a".repeat(51) });
      expect(result.success).toBe(false);
    });

    it("rejects uppercase letters", () => {
      const result = CreateCommunitySchema.safeParse({ name: "Test", slug: "MySlug" });
      expect(result.success).toBe(false);
    });

    it("rejects spaces", () => {
      const result = CreateCommunitySchema.safeParse({ name: "Test", slug: "my slug" });
      expect(result.success).toBe(false);
    });

    it("rejects underscores", () => {
      const result = CreateCommunitySchema.safeParse({ name: "Test", slug: "my_slug" });
      expect(result.success).toBe(false);
    });

    it("accepts hyphens", () => {
      const result = CreateCommunitySchema.safeParse({ name: "Test", slug: "my-slug" });
      expect(result.success).toBe(true);
    });

    it("accepts numbers", () => {
      const result = CreateCommunitySchema.safeParse({ name: "Test", slug: "community123" });
      expect(result.success).toBe(true);
    });
  });

  describe("visibility validation", () => {
    it("accepts public", () => {
      const result = CreateCommunitySchema.safeParse({ name: "Test", visibility: "public" });
      expect(result.success).toBe(true);
    });

    it("accepts private", () => {
      const result = CreateCommunitySchema.safeParse({ name: "Test", visibility: "private" });
      expect(result.success).toBe(true);
    });

    it("accepts paid", () => {
      const result = CreateCommunitySchema.safeParse({ name: "Test", visibility: "paid" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid visibility", () => {
      const result = CreateCommunitySchema.safeParse({ name: "Test", visibility: "hidden" });
      expect(result.success).toBe(false);
    });
  });

  describe("description validation", () => {
    it("rejects description over 500 characters", () => {
      const result = CreateCommunitySchema.safeParse({
        name: "Test",
        description: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("accepts empty description", () => {
      const result = CreateCommunitySchema.safeParse({ name: "Test", description: "" });
      expect(result.success).toBe(true);
    });
  });
});

describe("UpdateCommunitySchema", () => {
  it("accepts valid complete input", () => {
    const input = {
      name: "Updated Community",
      description: "Updated description",
      about: "About this community",
      visibility: "private" as const,
      settings: { theme: "dark" },
    };
    const result = UpdateCommunitySchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts partial input (all fields optional)", () => {
    const result = UpdateCommunitySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts single field update", () => {
    const result = UpdateCommunitySchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  describe("about validation", () => {
    it("rejects about over 10000 characters", () => {
      const result = UpdateCommunitySchema.safeParse({ about: "a".repeat(10001) });
      expect(result.success).toBe(false);
    });

    it("accepts long about within limit", () => {
      const result = UpdateCommunitySchema.safeParse({ about: "a".repeat(10000) });
      expect(result.success).toBe(true);
    });
  });

  describe("settings validation", () => {
    it("accepts complex nested objects", () => {
      const result = UpdateCommunitySchema.safeParse({
        settings: {
          theme: "dark",
          notifications: { email: true, push: false },
          limits: { maxMembers: 1000 },
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty settings object", () => {
      const result = UpdateCommunitySchema.safeParse({ settings: {} });
      expect(result.success).toBe(true);
    });
  });
});

describe("CheckSlugSchema", () => {
  it("accepts valid slug", () => {
    const result = CheckSlugSchema.safeParse({ slug: "my-community" });
    expect(result.success).toBe(true);
  });

  it("rejects missing slug", () => {
    const result = CheckSlugSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug format", () => {
    const result = CheckSlugSchema.safeParse({ slug: "My Community" });
    expect(result.success).toBe(false);
  });

  it("rejects slug with special characters", () => {
    const result = CheckSlugSchema.safeParse({ slug: "my@community" });
    expect(result.success).toBe(false);
  });
});
