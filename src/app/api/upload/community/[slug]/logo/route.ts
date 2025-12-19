import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import { getCommunityBySlug, updateCommunity } from "@/features/communities";
import { uploadCommunityImage } from "@/features/storage";
import { createErrorResponse } from "@/shared/schemas/errors";

const logger = getLogger("api.upload.community.logo");

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * POST /api/upload/community/[slug]/logo
 * Upload a new logo for a community. Only owner can upload.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedResponse();
    }

    logger.info({ userId: user.id, slug }, "upload.community_logo_started");

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      logger.warn(
        { userId: user.id, slug, hasFile: !!file, fileType: typeof file },
        "upload.community_logo_invalid_file",
      );
      return NextResponse.json(createErrorResponse("No file provided", "VALIDATION_ERROR"), {
        status: 400,
      });
    }

    // Get community and verify ownership (handled by updateCommunity)
    const community = await getCommunityBySlug(slug);

    // Upload to storage
    const url = await uploadCommunityImage(community.communityId, "logo", file);

    // Update community with new logo URL
    await updateCommunity(community.communityId, { logoUrl: url }, user.id);

    logger.info(
      { userId: user.id, communityId: community.communityId, url },
      "upload.community_logo_completed",
    );

    return NextResponse.json({ url });
  } catch (error) {
    return handleApiError(error);
  }
}
