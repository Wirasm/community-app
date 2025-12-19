import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import { getCommunityBySlug } from "@/features/communities";
import {
  getMembershipByProfileAndCommunity,
  removeMember,
  UpdateMembershipSchema,
  updateMembership,
} from "@/features/memberships";
import { getProfileByUserId } from "@/features/profiles";

const logger = getLogger("api.communities.members.profile");

interface RouteParams {
  params: Promise<{ slug: string; profileId: string }>;
}

/**
 * PATCH /api/communities/[slug]/members/[profileId]
 * Update a member's role or status.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedResponse();
    }

    const { slug, profileId: targetProfileId } = await params;

    const body = await request.json();
    const input = UpdateMembershipSchema.parse(body);

    logger.info({ slug, targetProfileId, userId: user.id }, "members.update_started");

    const community = await getCommunityBySlug(slug);
    const actorProfile = await getProfileByUserId(user.id);
    const targetMembership = await getMembershipByProfileAndCommunity(
      targetProfileId,
      community.communityId,
    );

    const membership = await updateMembership(
      targetMembership.membershipId,
      input,
      actorProfile.profileId,
      community.communityId,
    );

    logger.info({ membershipId: membership.membershipId, slug }, "members.update_completed");

    return NextResponse.json(membership);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/communities/[slug]/members/[profileId]
 * Remove a member from the community.
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

    const { slug, profileId: targetProfileId } = await params;

    logger.info({ slug, targetProfileId, userId: user.id }, "members.remove_started");

    const community = await getCommunityBySlug(slug);
    const actorProfile = await getProfileByUserId(user.id);
    const targetMembership = await getMembershipByProfileAndCommunity(
      targetProfileId,
      community.communityId,
    );

    await removeMember(
      targetMembership.membershipId,
      actorProfile.profileId,
      community.communityId,
    );

    logger.info({ slug, targetProfileId }, "members.remove_completed");

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
