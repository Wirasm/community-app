import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import {
  CreateCommunitySchema,
  createCommunity,
  getPublicCommunities,
} from "@/features/communities";
import { getProfileByUserId } from "@/features/profiles";

const logger = getLogger("api.communities");

/**
 * GET /api/communities
 * List public communities.
 */
export async function GET(_request: NextRequest) {
  try {
    logger.info({}, "communities.list_started");

    const communities = await getPublicCommunities();

    logger.info({ count: communities.length }, "communities.list_completed");

    return NextResponse.json(communities);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/communities
 * Create a new community.
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

    const body = await request.json();
    const input = CreateCommunitySchema.parse(body);

    logger.info({ userId: user.id, name: input.name }, "communities.create_started");

    // Get the user's profile to use as owner
    const profile = await getProfileByUserId(user.id);

    const community = await createCommunity(input, profile.id);

    logger.info(
      { communityId: community.communityId, userId: user.id },
      "communities.create_completed",
    );

    return NextResponse.json(community, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
