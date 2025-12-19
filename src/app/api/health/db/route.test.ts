import { describe, expect, it, mock } from "bun:test";

// Mock database client
const mockExecute = mock(() => Promise.resolve([{ "?column?": 1 }]));

mock.module("@/core/database/client", () => ({
  db: {
    execute: mockExecute,
  },
}));

// Mock logger
mock.module("@/core/logging", () => ({
  getLogger: () => ({
    info: mock(() => {}),
    error: mock(() => {}),
  }),
}));

const { GET } = await import("./route");

describe("GET /api/health/db", () => {
  it("returns healthy when database is connected", async () => {
    mockExecute.mockResolvedValueOnce([{ "?column?": 1 }] as never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.service).toBe("database");
    expect(data.provider).toBe("supabase");
  });

  it("returns unhealthy when database fails", async () => {
    mockExecute.mockRejectedValueOnce(new Error("Connection refused") as never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.service).toBe("database");
    expect(data.error).toBe("Connection refused");
  });

  it("handles non-Error exceptions", async () => {
    mockExecute.mockRejectedValueOnce("string error" as never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.error).toBe("Unknown error");
  });
});
