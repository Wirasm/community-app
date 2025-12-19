import { describe, expect, it } from "bun:test";
import { ZodError } from "zod/v4";

import { ProjectAccessDeniedError, ProjectNotFoundError } from "@/features/projects";

import { handleApiError, unauthorizedResponse } from "./errors";

describe("handleApiError", () => {
  it("handles ProjectNotFoundError with 404", async () => {
    const error = new ProjectNotFoundError("test-id");
    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe("PROJECT_NOT_FOUND");
    expect(data.error).toContain("test-id");
  });

  it("handles ProjectAccessDeniedError with 403", async () => {
    const error = new ProjectAccessDeniedError("test-id");
    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe("PROJECT_ACCESS_DENIED");
  });

  it("handles ZodError with 400 and field details", async () => {
    const error = new ZodError([
      {
        code: "too_small",
        minimum: 3,
        origin: "string",
        inclusive: true,
        message: "String must contain at least 3 character(s)",
        path: ["name"],
        input: "ab",
      },
    ]);
    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
    expect(data.details?.fields).toBeDefined();
  });

  it("handles unknown errors with 500", async () => {
    const error = new Error("Something went wrong");
    const response = handleApiError(error);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
    expect(data.error).toBe("Internal server error");
  });

  it("handles non-Error objects with 500", async () => {
    const response = handleApiError("string error");
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
  });
});

describe("unauthorizedResponse", () => {
  it("returns 401 with UNAUTHORIZED code", async () => {
    const response = unauthorizedResponse();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
    expect(data.error).toBe("Authentication required");
  });
});
