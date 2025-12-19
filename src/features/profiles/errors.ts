import type { HttpStatusCode } from "@/core/api/errors";

/** Known error codes for profile operations. */
export type ProfileErrorCode =
  | "PROFILE_NOT_FOUND"
  | "USERNAME_EXISTS"
  | "PROFILE_ACCESS_DENIED"
  | "PROFILE_CREATION_FAILED";

/**
 * Base error for profile-related errors.
 */
export class ProfileError extends Error {
  readonly code: ProfileErrorCode;
  readonly statusCode: HttpStatusCode;

  constructor(message: string, code: ProfileErrorCode, statusCode: HttpStatusCode) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ProfileNotFoundError extends ProfileError {
  constructor(identifier: string) {
    super(`Profile not found: ${identifier}`, "PROFILE_NOT_FOUND", 404);
  }
}

export class UsernameExistsError extends ProfileError {
  constructor(username: string) {
    super(`Username already exists: ${username}`, "USERNAME_EXISTS", 409);
  }
}

export class ProfileAccessDeniedError extends ProfileError {
  constructor(profileId: string) {
    super(`Access denied to profile: ${profileId}`, "PROFILE_ACCESS_DENIED", 403);
  }
}

export class ProfileCreationError extends ProfileError {
  constructor(userId: string) {
    super(`Failed to create profile for user: ${userId}`, "PROFILE_CREATION_FAILED", 500);
  }
}
