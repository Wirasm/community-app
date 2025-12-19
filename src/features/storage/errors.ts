import type { HttpStatusCode } from "@/core/api/errors";

/** Known error codes for storage operations. */
export type StorageErrorCode =
  | "FILE_TOO_LARGE"
  | "INVALID_FILE_TYPE"
  | "UPLOAD_FAILED"
  | "DELETE_FAILED"
  | "NOT_AUTHORIZED";

/**
 * Base error for storage-related errors.
 */
export class StorageError extends Error {
  readonly code: StorageErrorCode;
  readonly statusCode: HttpStatusCode;

  constructor(message: string, code: StorageErrorCode, statusCode: HttpStatusCode) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class FileTooLargeError extends StorageError {
  constructor(maxSizeBytes: number) {
    const maxSizeMB = maxSizeBytes / (1024 * 1024);
    super(`File exceeds maximum size of ${maxSizeMB}MB`, "FILE_TOO_LARGE", 413);
  }
}

export class InvalidFileTypeError extends StorageError {
  constructor(allowedTypes: readonly string[]) {
    super(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`, "INVALID_FILE_TYPE", 400);
  }
}

export class UploadFailedError extends StorageError {
  constructor(reason: string) {
    super(`Upload failed: ${reason}`, "UPLOAD_FAILED", 500);
  }
}

export class DeleteFailedError extends StorageError {
  constructor(reason: string) {
    super(`Delete failed: ${reason}`, "DELETE_FAILED", 500);
  }
}

export class StorageNotAuthorizedError extends StorageError {
  constructor(resource: string) {
    super(`Not authorized to modify: ${resource}`, "NOT_AUTHORIZED", 403);
  }
}
