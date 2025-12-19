import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";

import type { Project } from "@/features/projects";

// Mock user type
type MockUser = { id: string; email: string } | null;
const mockUser: MockUser = { id: "user-123", email: "test@example.com" };
const mockProject: Project = {
  id: "project-123",
  name: "Test Project",
  slug: "test-project",
  description: "A test project",
  isPublic: false,
  ownerId: "user-123",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Mock Supabase auth
const mockGetUser = mock<() => Promise<{ data: { user: MockUser }; error: null }>>(() =>
  Promise.resolve({ data: { user: mockUser }, error: null }),
);
mock.module("@/core/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    }),
}));

// Mock repository (the database layer)
const mockFindByOwnerId = mock<(ownerId: string) => Promise<Project[]>>(() =>
  Promise.resolve([mockProject]),
);
const mockCountByOwnerId = mock<(ownerId: string) => Promise<number>>(() => Promise.resolve(1));
const mockFindBySlug = mock<(slug: string) => Promise<Project | undefined>>(() =>
  Promise.resolve(undefined),
);
const mockCreate = mock<(data: unknown) => Promise<Project>>(() => Promise.resolve(mockProject));

mock.module("@/features/projects/repository", () => ({
  findByOwnerId: mockFindByOwnerId,
  countByOwnerId: mockCountByOwnerId,
  findBySlug: mockFindBySlug,
  create: mockCreate,
}));

// Import routes after mocking
const { GET, POST } = await import("./route");

describe("GET /api/projects", () => {
  beforeEach(() => {
    mockGetUser.mockClear();
    mockFindByOwnerId.mockClear();
    mockCountByOwnerId.mockClear();
  });

  it("returns paginated projects for authenticated user", async () => {
    const request = new NextRequest("http://localhost:3000/api/projects");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].id).toBe("project-123");
    expect(data.pagination.total).toBe(1);
    expect(data.pagination.page).toBe(1);
  });

  it("returns 401 for unauthenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/api/projects");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("respects pagination parameters", async () => {
    const request = new NextRequest("http://localhost:3000/api/projects?page=2&pageSize=10");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.page).toBe(2);
    expect(data.pagination.pageSize).toBe(10);
  });
});

describe("POST /api/projects", () => {
  beforeEach(() => {
    mockGetUser.mockClear();
    mockCreate.mockClear();
    mockFindBySlug.mockClear();
  });

  it("creates a project for authenticated user", async () => {
    const request = new NextRequest("http://localhost:3000/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: "New Project", isPublic: false }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe("project-123");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("returns 401 for unauthenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: "New Project" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 for invalid input", async () => {
    const request = new NextRequest("http://localhost:3000/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: "ab" }), // Too short
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
  });
});
