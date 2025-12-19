import { beforeEach, describe, expect, it, mock } from "bun:test";

// Types for mock return values
type UploadResult = { data: { path: string } | null; error: { message: string } | null };
type ListResult = { data: { name: string }[] | null; error: { message: string } | null };

// Mock Supabase storage responses
const mockUpload = mock<() => Promise<UploadResult>>(() =>
  Promise.resolve({ data: { path: "test-profile-id/123456789.jpg" }, error: null }),
);
const mockRemove = mock(() => Promise.resolve({ data: null, error: null }));
const mockList = mock<() => Promise<ListResult>>(() => Promise.resolve({ data: [], error: null }));
const mockGetPublicUrl = mock(() => ({
  data: { publicUrl: "https://example.supabase.co/storage/v1/object/public/avatars/test.jpg" },
}));

const mockStorageFrom = mock(() => ({
  upload: mockUpload,
  remove: mockRemove,
  list: mockList,
  getPublicUrl: mockGetPublicUrl,
}));

// Mock Supabase client
mock.module("@/core/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      storage: { from: mockStorageFrom },
    }),
}));

// Import after mocking
const { uploadAvatar, uploadCommunityImage, deleteAvatar } = await import("../service");
const { FileTooLargeError, InvalidFileTypeError, UploadFailedError } = await import("../errors");
const { MAX_AVATAR_SIZE, MAX_COMMUNITY_IMAGE_SIZE } = await import("../schemas");

// Helper to create mock File
function createMockFile(name: string, size: number, type: string): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

describe("uploadAvatar", () => {
  beforeEach(() => {
    mockUpload.mockClear();
    mockRemove.mockClear();
    mockList.mockClear();
    mockGetPublicUrl.mockClear();
    mockStorageFrom.mockClear();

    // Reset to success responses
    mockUpload.mockImplementation(() =>
      Promise.resolve({ data: { path: "test-profile-id/123456789.jpg" }, error: null }),
    );
    mockList.mockImplementation(() => Promise.resolve({ data: [], error: null }));
  });

  it("uploads valid avatar and returns URL", async () => {
    const file = createMockFile("avatar.jpg", 1024, "image/jpeg");

    const url = await uploadAvatar("test-profile-id", file);

    expect(url).toContain("supabase.co");
    expect(mockStorageFrom).toHaveBeenCalledWith("avatars");
    expect(mockUpload).toHaveBeenCalled();
  });

  it("throws FileTooLargeError when file exceeds max size", async () => {
    const file = createMockFile("avatar.jpg", MAX_AVATAR_SIZE + 1, "image/jpeg");

    await expect(uploadAvatar("test-profile-id", file)).rejects.toThrow(FileTooLargeError);
  });

  it("throws InvalidFileTypeError for disallowed types", async () => {
    const file = createMockFile("avatar.gif", 1024, "image/gif");

    await expect(uploadAvatar("test-profile-id", file)).rejects.toThrow(InvalidFileTypeError);
  });

  it("throws UploadFailedError when Supabase upload fails", async () => {
    mockUpload.mockImplementation(() =>
      Promise.resolve({ data: null, error: { message: "Storage error" } }),
    );

    const file = createMockFile("avatar.jpg", 1024, "image/jpeg");

    await expect(uploadAvatar("test-profile-id", file)).rejects.toThrow(UploadFailedError);
  });

  it("deletes existing files before uploading", async () => {
    mockList.mockImplementation(() =>
      Promise.resolve({ data: [{ name: "old-avatar.jpg" }], error: null }),
    );

    const file = createMockFile("avatar.jpg", 1024, "image/jpeg");
    await uploadAvatar("test-profile-id", file);

    expect(mockList).toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalled();
  });
});

describe("uploadCommunityImage", () => {
  beforeEach(() => {
    mockUpload.mockClear();
    mockRemove.mockClear();
    mockList.mockClear();
    mockStorageFrom.mockClear();

    mockUpload.mockImplementation(() =>
      Promise.resolve({ data: { path: "comm-id/logo/123456789.jpg" }, error: null }),
    );
    mockList.mockImplementation(() => Promise.resolve({ data: [], error: null }));
  });

  it("uploads valid community logo", async () => {
    const file = createMockFile("logo.png", 2048, "image/png");

    const url = await uploadCommunityImage("comm-id", "logo", file);

    expect(url).toContain("supabase.co");
    expect(mockStorageFrom).toHaveBeenCalledWith("communities");
  });

  it("uploads valid community banner", async () => {
    const file = createMockFile("banner.webp", 4096, "image/webp");

    const url = await uploadCommunityImage("comm-id", "banner", file);

    expect(url).toContain("supabase.co");
  });

  it("throws FileTooLargeError when file exceeds community max size", async () => {
    const file = createMockFile("logo.jpg", MAX_COMMUNITY_IMAGE_SIZE + 1, "image/jpeg");

    await expect(uploadCommunityImage("comm-id", "logo", file)).rejects.toThrow(FileTooLargeError);
  });
});

describe("deleteAvatar", () => {
  beforeEach(() => {
    mockList.mockClear();
    mockRemove.mockClear();
    mockStorageFrom.mockClear();

    mockList.mockImplementation(() =>
      Promise.resolve({ data: [{ name: "avatar.jpg" }], error: null }),
    );
  });

  it("deletes files in avatar folder", async () => {
    await deleteAvatar("test-profile-id");

    expect(mockStorageFrom).toHaveBeenCalledWith("avatars");
    expect(mockList).toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalled();
  });
});
