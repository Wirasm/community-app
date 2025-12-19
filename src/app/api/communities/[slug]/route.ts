import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import {
  deleteCommunity,
  getCommunityBySlug,
  UpdateCommunitySchema,
  updateCommunity,
} from "@/features/communities";
import { getProfileByUserId } from "@/features/profiles";

const logger = getLogger("api.communities");

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/communities/[slug]
 * Get a community by slug.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    logger.info({ slug }, "community.get_started");

    const community = await getCommunityBySlug(slug);

    logger.info({ communityId: community.communityId, slug }, "community.get_completed");

    return NextResponse.json(community);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/communities/[slug]
 * Update a community (owner only).
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

    const { slug } = await params;
    const body = await request.json();
    const input = UpdateCommunitySchema.parse(body);

    logger.info({ slug, userId: user.id }, "community.update_started");

    // Get the community and user's profile
    const community = await getCommunityBySlug(slug);
    const profile = await getProfileByUserId(user.id);

    const updated = await updateCommunity(community.communityId, input, profile.profileId);

    logger.info(
      { communityId: updated.communityId, userId: user.id },
      "community.update_completed",
    );

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/communities/[slug]
 * Delete a community (owner only).
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

    logger.info({ slug, userId: user.id }, "community.delete_started");

    // Get the community and user's profile
    const community = await getCommunityBySlug(slug);
    const profile = await getProfileByUserId(user.id);

    await deleteCommunity(community.communityId, profile.profileId);

    logger.info({ slug, userId: user.id }, "community.delete_completed");

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
