import type { HttpStatusCode } from "@/core/api/errors";

/** Known error codes for community operations. */
export type CommunityErrorCode =
  | "COMMUNITY_NOT_FOUND"
  | "SLUG_EXISTS"
  | "COMMUNITY_ACCESS_DENIED"
  | "COMMUNITY_CREATION_FAILED";

/**
 * Base error for community-related errors.
 */
export class CommunityError extends Error {
  readonly code: CommunityErrorCode;
  readonly statusCode: HttpStatusCode;

  constructor(message: string, code: CommunityErrorCode, statusCode: HttpStatusCode) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class CommunityNotFoundError extends CommunityError {
  constructor(identifier: string) {
    super(`Community not found: ${identifier}`, "COMMUNITY_NOT_FOUND", 404);
  }
}

export class SlugExistsError extends CommunityError {
  constructor(slug: string) {
    super(`Slug already exists: ${slug}`, "SLUG_EXISTS", 409);
  }
}

export class CommunityAccessDeniedError extends CommunityError {
  constructor(communityId: string) {
    super(`Access denied to community: ${communityId}`, "COMMUNITY_ACCESS_DENIED", 403);
  }
}

export class CommunityCreationError extends CommunityError {
  constructor(ownerId: string) {
    super(`Failed to create community for owner: ${ownerId}`, "COMMUNITY_CREATION_FAILED", 500);
  }
}
