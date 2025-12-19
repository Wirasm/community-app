import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";

// Mock fetch globally
const mockFetch = mock(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ url: "https://example.com/uploaded.jpg" }),
  }),
);
globalThis.fetch = mockFetch as unknown as typeof fetch;

// Import after mocking
const { useFileUpload } = await import("../hooks/use-file-upload");
const { MAX_AVATAR_SIZE } = await import("../schemas");

// Helper to create mock File
function createMockFile(name: string, size: number, type: string): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

describe("useFileUpload", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: "https://example.com/uploaded.jpg" }),
      }),
    );
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useFileUpload());

    expect(result.current.isUploading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.url).toBeNull();
  });

  it("validates file size before upload", async () => {
    const { result } = renderHook(() => useFileUpload());
    const oversizedFile = createMockFile("big.jpg", MAX_AVATAR_SIZE + 1, "image/jpeg");

    await act(async () => {
      await result.current.upload("/api/upload/avatar", oversizedFile);
    });

    expect(result.current.error).toContain("exceeds maximum size");
    expect(result.current.isUploading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("validates file type before upload", async () => {
    const { result } = renderHook(() => useFileUpload());
    const invalidFile = createMockFile("doc.pdf", 1024, "application/pdf");

    await act(async () => {
      await result.current.upload("/api/upload/avatar", invalidFile);
    });

    expect(result.current.error).toContain("Invalid file type");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("uploads valid file and returns URL", async () => {
    const { result } = renderHook(() => useFileUpload());
    const validFile = createMockFile("avatar.jpg", 1024, "image/jpeg");

    await act(async () => {
      await result.current.upload("/api/upload/avatar", validFile);
    });

    expect(result.current.url).toBe("https://example.com/uploaded.jpg");
    expect(result.current.error).toBeNull();
    expect(result.current.isUploading).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("handles upload errors", async () => {
    (mockFetch as ReturnType<typeof mock>).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Upload failed" }),
      }),
    );

    const { result } = renderHook(() => useFileUpload());
    const validFile = createMockFile("avatar.jpg", 1024, "image/jpeg");

    await act(async () => {
      await result.current.upload("/api/upload/avatar", validFile);
    });

    expect(result.current.error).toBe("Upload failed");
    expect(result.current.url).toBeNull();
  });

  it("calls onSuccess callback on successful upload", async () => {
    const onSuccess = mock(() => {});
    const { result } = renderHook(() => useFileUpload({ onSuccess }));
    const validFile = createMockFile("avatar.jpg", 1024, "image/jpeg");

    await act(async () => {
      await result.current.upload("/api/upload/avatar", validFile);
    });

    expect(onSuccess).toHaveBeenCalledWith("https://example.com/uploaded.jpg");
  });

  it("calls onError callback on validation failure", async () => {
    const onError = mock(() => {});
    const { result } = renderHook(() => useFileUpload({ onError }));
    const invalidFile = createMockFile("doc.pdf", 1024, "application/pdf");

    await act(async () => {
      await result.current.upload("/api/upload/avatar", invalidFile);
    });

    expect(onError).toHaveBeenCalled();
  });

  it("resets state", async () => {
    const { result } = renderHook(() => useFileUpload());
    const validFile = createMockFile("avatar.jpg", 1024, "image/jpeg");

    await act(async () => {
      await result.current.upload("/api/upload/avatar", validFile);
    });

    expect(result.current.url).toBe("https://example.com/uploaded.jpg");

    act(() => {
      result.current.reset();
    });

    expect(result.current.url).toBeNull();
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it("handles network exceptions", async () => {
    (mockFetch as ReturnType<typeof mock>).mockImplementation(() =>
      Promise.reject(new Error("Network failure")),
    );

    const { result } = renderHook(() => useFileUpload());
    const validFile = createMockFile("avatar.jpg", 1024, "image/jpeg");

    await act(async () => {
      await result.current.upload("/api/upload/avatar", validFile);
    });

    expect(result.current.error).toBe("Network failure");
    expect(result.current.isUploading).toBe(false);
  });

  it("handles non-Error exceptions with fallback message", async () => {
    (mockFetch as ReturnType<typeof mock>).mockImplementation(() => Promise.reject("string error"));

    const { result } = renderHook(() => useFileUpload());
    const validFile = createMockFile("avatar.jpg", 1024, "image/jpeg");

    await act(async () => {
      await result.current.upload("/api/upload/avatar", validFile);
    });

    expect(result.current.error).toBe("Upload failed");
  });

  it("respects custom maxSize option", async () => {
    const customMaxSize = 10 * 1024; // 10KB
    const { result } = renderHook(() => useFileUpload({ maxSize: customMaxSize }));

    const oversizedFile = createMockFile("big.jpg", customMaxSize + 1, "image/jpeg");

    await act(async () => {
      await result.current.upload("/api/upload/avatar", oversizedFile);
    });

    // Should reject the file - it exceeds custom limit, not default 2MB limit
    expect(result.current.error).toContain("exceeds maximum size");
    expect(result.current.error).not.toContain("2MB"); // Should NOT be default limit
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls onError callback on HTTP error", async () => {
    (mockFetch as ReturnType<typeof mock>).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.resolve({ error: "Server error" }),
      }),
    );

    const onError = mock(() => {});
    const { result } = renderHook(() => useFileUpload({ onError }));
    const validFile = createMockFile("avatar.jpg", 1024, "image/jpeg");

    await act(async () => {
      await result.current.upload("/api/upload/avatar", validFile);
    });

    expect(onError).toHaveBeenCalledWith("Server error");
  });

  it("uses fallback error message when response has no error field", async () => {
    (mockFetch as ReturnType<typeof mock>).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({}),
      }),
    );

    const { result } = renderHook(() => useFileUpload());
    const validFile = createMockFile("avatar.jpg", 1024, "image/jpeg");

    await act(async () => {
      await result.current.upload("/api/upload/avatar", validFile);
    });

    expect(result.current.error).toBe("Upload failed (HTTP 400)");
  });

  it("handles non-JSON error response gracefully", async () => {
    (mockFetch as ReturnType<typeof mock>).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
        json: () => Promise.reject(new SyntaxError("Unexpected token '<'")),
      }),
    );

    const { result } = renderHook(() => useFileUpload());
    const validFile = createMockFile("avatar.jpg", 1024, "image/jpeg");

    await act(async () => {
      await result.current.upload("/api/upload/avatar", validFile);
    });

    expect(result.current.error).toBe("Upload failed: 502 Bad Gateway");
  });
});
