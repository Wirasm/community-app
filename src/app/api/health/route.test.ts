import { describe, expect, it } from "bun:test";

import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns healthy status", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.service).toBe("api");
    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
