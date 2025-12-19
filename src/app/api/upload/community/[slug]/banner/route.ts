import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import { getCommunityBySlug, updateCommunity } from "@/features/communities";
import { uploadCommunityImage } from "@/features/storage";
import { createErrorResponse } from "@/shared/schemas/errors";

const logger = getLogger("api.upload.community.banner");

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * POST /api/upload/community/[slug]/banner
 * Upload a new banner for a community. Only owner can upload.
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

    logger.info({ userId: user.id, slug }, "upload.community_banner_started");

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(createErrorResponse("No file provided", "VALIDATION_ERROR"), {
        status: 400,
      });
    }

    // Get community and verify ownership (handled by updateCommunity)
    const community = await getCommunityBySlug(slug);

    // Upload to storage
    const url = await uploadCommunityImage(community.communityId, "banner", file);

    // Update community with new banner URL
    await updateCommunity(community.communityId, { bannerUrl: url }, user.id);

    logger.info(
      { userId: user.id, communityId: community.communityId, url },
      "upload.community_banner_completed",
    );

    return NextResponse.json({ url });
  } catch (error) {
    return handleApiError(error);
  }
}
