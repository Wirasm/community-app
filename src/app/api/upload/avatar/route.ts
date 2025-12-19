import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import { getProfileByUserId, updateProfile } from "@/features/profiles";
import { uploadAvatar } from "@/features/storage";
import { createErrorResponse } from "@/shared/schemas/errors";

const logger = getLogger("api.upload.avatar");

/**
 * POST /api/upload/avatar
 * Upload a new avatar for the current user.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedResponse();
    }

    logger.info({ userId: user.id }, "upload.avatar_started");

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      logger.warn(
        { userId: user.id, hasFile: !!file, fileType: typeof file },
        "upload.avatar_invalid_file",
      );
      return NextResponse.json(createErrorResponse("No file provided", "VALIDATION_ERROR"), {
        status: 400,
      });
    }

    // Get profile to get profileId
    const profile = await getProfileByUserId(user.id);

    // Upload to storage
    const url = await uploadAvatar(profile.profileId, file);

    // Update profile with new avatar URL
    await updateProfile(profile.profileId, { avatarUrl: url }, user.id);

    logger.info({ userId: user.id, profileId: profile.profileId, url }, "upload.avatar_completed");

    return NextResponse.json({ url });
  } catch (error) {
    return handleApiError(error);
  }
}
