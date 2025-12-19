import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import { getCommunityBySlug } from "@/features/communities";
import { TransferOwnershipSchema, transferOwnership } from "@/features/memberships";
import { getProfileByUserId } from "@/features/profiles";

const logger = getLogger("api.communities.transfer-ownership");

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * POST /api/communities/[slug]/transfer-ownership
 * Transfer community ownership to another active member.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedResponse();
    }

    const { slug } = await params;
    const body = await request.json();
    const { newOwnerProfileId } = TransferOwnershipSchema.parse(body);

    logger.info({ slug, userId: user.id, newOwnerProfileId }, "transfer-ownership_started");

    const community = await getCommunityBySlug(slug);
    const currentOwnerProfile = await getProfileByUserId(user.id);

    const result = await transferOwnership(
      community.communityId,
      currentOwnerProfile.profileId,
      newOwnerProfileId,
    );

    logger.info({ slug, newOwnerProfileId }, "transfer-ownership_completed");

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
