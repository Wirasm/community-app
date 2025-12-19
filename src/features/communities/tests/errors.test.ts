import { describe, expect, it } from "bun:test";

import {
  CommunityAccessDeniedError,
  CommunityCreationError,
  CommunityError,
  CommunityNotFoundError,
  SlugExistsError,
} from "../errors";

describe("CommunityError", () => {
  it("creates error with message, code, and status", () => {
    const error = new CommunityError("Test error", "COMMUNITY_NOT_FOUND", 404);
    expect(error.message).toBe("Test error");
    expect(error.code).toBe("COMMUNITY_NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("CommunityError");
  });

  it("is instanceof Error", () => {
    const error = new CommunityError("Test", "COMMUNITY_NOT_FOUND", 404);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("CommunityNotFoundError", () => {
  it("creates error with correct defaults", () => {
    const error = new CommunityNotFoundError("community-123");
    expect(error.message).toBe("Community not found: community-123");
    expect(error.code).toBe("COMMUNITY_NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("CommunityNotFoundError");
  });

  it("is instanceof CommunityError", () => {
    const error = new CommunityNotFoundError("community-123");
    expect(error).toBeInstanceOf(CommunityError);
  });
});

describe("SlugExistsError", () => {
  it("creates error with correct defaults", () => {
    const error = new SlugExistsError("my-community");
    expect(error.message).toBe("Slug already exists: my-community");
    expect(error.code).toBe("SLUG_EXISTS");
    expect(error.statusCode).toBe(409);
    expect(error.name).toBe("SlugExistsError");
  });

  it("is instanceof CommunityError", () => {
    const error = new SlugExistsError("my-community");
    expect(error).toBeInstanceOf(CommunityError);
  });
});

describe("CommunityAccessDeniedError", () => {
  it("creates error with correct defaults", () => {
    const error = new CommunityAccessDeniedError("community-123");
    expect(error.message).toBe("Access denied to community: community-123");
    expect(error.code).toBe("COMMUNITY_ACCESS_DENIED");
    expect(error.statusCode).toBe(403);
    expect(error.name).toBe("CommunityAccessDeniedError");
  });

  it("is instanceof CommunityError", () => {
    const error = new CommunityAccessDeniedError("community-123");
    expect(error).toBeInstanceOf(CommunityError);
  });
});

describe("CommunityCreationError", () => {
  it("creates error with correct defaults", () => {
    const error = new CommunityCreationError("owner-123");
    expect(error.message).toBe("Failed to create community for owner: owner-123");
    expect(error.code).toBe("COMMUNITY_CREATION_FAILED");
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe("CommunityCreationError");
  });

  it("is instanceof CommunityError", () => {
    const error = new CommunityCreationError("owner-123");
    expect(error).toBeInstanceOf(CommunityError);
  });
});
