import { describe, expect, it } from "bun:test";

import {
  ALLOWED_IMAGE_TYPES,
  getExtensionFromMimeType,
  isAllowedImageType,
  MAX_AVATAR_SIZE,
  MAX_COMMUNITY_IMAGE_SIZE,
} from "../schemas";

describe("constants", () => {
  it("MAX_AVATAR_SIZE is 2MB", () => {
    expect(MAX_AVATAR_SIZE).toBe(2 * 1024 * 1024);
  });

  it("MAX_COMMUNITY_IMAGE_SIZE is 5MB", () => {
    expect(MAX_COMMUNITY_IMAGE_SIZE).toBe(5 * 1024 * 1024);
  });

  it("ALLOWED_IMAGE_TYPES contains expected types", () => {
    expect(ALLOWED_IMAGE_TYPES).toContain("image/jpeg");
    expect(ALLOWED_IMAGE_TYPES).toContain("image/png");
    expect(ALLOWED_IMAGE_TYPES).toContain("image/webp");
    expect(ALLOWED_IMAGE_TYPES).toHaveLength(3);
  });
});

describe("getExtensionFromMimeType", () => {
  it("returns jpg for image/jpeg", () => {
    expect(getExtensionFromMimeType("image/jpeg")).toBe("jpg");
  });

  it("returns png for image/png", () => {
    expect(getExtensionFromMimeType("image/png")).toBe("png");
  });

  it("returns webp for image/webp", () => {
    expect(getExtensionFromMimeType("image/webp")).toBe("webp");
  });

  it("returns bin for unknown type", () => {
    expect(getExtensionFromMimeType("application/octet-stream")).toBe("bin");
  });
});

describe("isAllowedImageType", () => {
  it("returns true for allowed types", () => {
    expect(isAllowedImageType("image/jpeg")).toBe(true);
    expect(isAllowedImageType("image/png")).toBe(true);
    expect(isAllowedImageType("image/webp")).toBe(true);
  });

  it("returns false for disallowed types", () => {
    expect(isAllowedImageType("image/gif")).toBe(false);
    expect(isAllowedImageType("image/svg+xml")).toBe(false);
    expect(isAllowedImageType("application/pdf")).toBe(false);
    expect(isAllowedImageType("text/plain")).toBe(false);
  });
});
