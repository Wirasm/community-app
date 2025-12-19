import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import { BUCKET_AVATARS, BUCKET_COMMUNITIES } from "@/features/storage";
import { createErrorResponse } from "@/shared/schemas/errors";

const logger = getLogger("api.upload.delete");

const ALLOWED_BUCKETS = [BUCKET_AVATARS, BUCKET_COMMUNITIES];

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

/**
 * DELETE /api/upload/[bucket]/[...path]
 * Delete a file from storage. Only the file owner can delete.
 *
 * Example: DELETE /api/upload/avatars/profile-id/123456.jpg
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedResponse();
    }

    const { path } = await params;

    if (!path || path.length < 2) {
      return NextResponse.json(
        createErrorResponse(
          "Invalid path. Expected: /api/upload/[bucket]/[...filePath]",
          "VALIDATION_ERROR",
        ),
        { status: 400 },
      );
    }

    const [bucket, ...filePath] = path;
    const fullPath = filePath.join("/");

    if (!bucket || !ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json(
        createErrorResponse(
          `Invalid bucket. Allowed: ${ALLOWED_BUCKETS.join(", ")}`,
          "VALIDATION_ERROR",
        ),
        { status: 400 },
      );
    }

    logger.info({ bucket, path: fullPath, userId: user.id }, "upload.delete_started");

    // Delete from storage (RLS policies will enforce ownership)
    const { error } = await supabase.storage.from(bucket).remove([fullPath]);

    if (error) {
      logger.error({ bucket, path: fullPath, error: error.message }, "upload.delete_failed");
      return NextResponse.json(createErrorResponse(error.message, "DELETE_FAILED"), {
        status: 500,
      });
    }

    logger.info({ bucket, path: fullPath, userId: user.id }, "upload.delete_completed");

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
