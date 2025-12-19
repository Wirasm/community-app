import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import { getCommunityBySlug } from "@/features/communities";
import { getMembershipByProfileAndCommunity, leaveCommunity } from "@/features/memberships";
import { getProfileByUserId } from "@/features/profiles";

const logger = getLogger("api.communities.members.me");

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/communities/[slug]/members/me
 * Get current user's membership in community.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedResponse();
    }

    const { slug } = await params;

    logger.info({ slug, userId: user.id }, "members.me.get_started");

    const community = await getCommunityBySlug(slug);
    const profile = await getProfileByUserId(user.id);
    const membership = await getMembershipByProfileAndCommunity(
      profile.profileId,
      community.communityId,
    );

    logger.info({ membershipId: membership.membershipId, slug }, "members.me.get_completed");

    return NextResponse.json(membership);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/communities/[slug]/members/me
 * Leave a community.
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

    const { slug } = await params;

    logger.info({ slug, userId: user.id }, "members.me.leave_started");

    const community = await getCommunityBySlug(slug);
    const profile = await getProfileByUserId(user.id);
    await leaveCommunity(profile.profileId, community.communityId);

    logger.info({ slug, userId: user.id }, "members.me.leave_completed");

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
