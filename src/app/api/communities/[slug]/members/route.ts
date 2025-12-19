import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import { getCommunityBySlug } from "@/features/communities";
import { joinCommunity, listCommunityMembers } from "@/features/memberships";
import { getProfileByUserId } from "@/features/profiles";

const logger = getLogger("api.communities.members");

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/communities/[slug]/members
 * List all members of a community.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    logger.info({ slug }, "members.list_started");

    const community = await getCommunityBySlug(slug);
    const members = await listCommunityMembers(community.communityId);

    logger.info({ slug, count: members.length }, "members.list_completed");

    return NextResponse.json(members);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/communities/[slug]/members
 * Join a community.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedResponse();
    }

    const { slug } = await params;

    logger.info({ slug, userId: user.id }, "members.join_started");

    const community = await getCommunityBySlug(slug);
    const profile = await getProfileByUserId(user.id);
    const membership = await joinCommunity(
      profile.profileId,
      community.communityId,
      community.visibility,
    );

    logger.info({ membershipId: membership.membershipId, slug }, "members.join_completed");

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
