import { describe, expect, it } from "bun:test";

import {
  ProfileAccessDeniedError,
  ProfileError,
  ProfileNotFoundError,
  UsernameExistsError,
} from "../errors";

describe("ProfileError", () => {
  it("creates error with message, code, and status", () => {
    const error = new ProfileError("Test error", "PROFILE_NOT_FOUND", 404);
    expect(error.message).toBe("Test error");
    expect(error.code).toBe("PROFILE_NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("ProfileError");
  });

  it("is instanceof Error", () => {
    const error = new ProfileError("Test", "PROFILE_NOT_FOUND", 404);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("ProfileNotFoundError", () => {
  it("creates error with correct defaults", () => {
    const error = new ProfileNotFoundError("profile-123");
    expect(error.message).toBe("Profile not found: profile-123");
    expect(error.code).toBe("PROFILE_NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("ProfileNotFoundError");
  });

  it("is instanceof ProfileError", () => {
    const error = new ProfileNotFoundError("profile-123");
    expect(error).toBeInstanceOf(ProfileError);
  });
});

describe("UsernameExistsError", () => {
  it("creates error with correct defaults", () => {
    const error = new UsernameExistsError("johndoe");
    expect(error.message).toBe("Username already exists: johndoe");
    expect(error.code).toBe("USERNAME_EXISTS");
    expect(error.statusCode).toBe(409);
    expect(error.name).toBe("UsernameExistsError");
  });

  it("is instanceof ProfileError", () => {
    const error = new UsernameExistsError("johndoe");
    expect(error).toBeInstanceOf(ProfileError);
  });
});

describe("ProfileAccessDeniedError", () => {
  it("creates error with correct defaults", () => {
    const error = new ProfileAccessDeniedError("profile-123");
    expect(error.message).toBe("Access denied to profile: profile-123");
    expect(error.code).toBe("PROFILE_ACCESS_DENIED");
    expect(error.statusCode).toBe(403);
    expect(error.name).toBe("ProfileAccessDeniedError");
  });

  it("is instanceof ProfileError", () => {
    const error = new ProfileAccessDeniedError("profile-123");
    expect(error).toBeInstanceOf(ProfileError);
  });
});
