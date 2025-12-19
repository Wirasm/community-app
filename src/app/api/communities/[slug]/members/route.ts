import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import { getCommunityBySlug } from "@/features/communities";
import {
  joinCommunity,
  ListMembersQuerySchema,
  listCommunityMembersPaginated,
} from "@/features/memberships";
import { getProfileByUserId } from "@/features/profiles";

const logger = getLogger("api.communities.members");

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/communities/[slug]/members
 * List all members of a community with pagination.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    // Parse pagination and filter params
    const queryParams = ListMembersQuerySchema.parse({
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
      status: searchParams.get("status") ?? undefined,
      role: searchParams.get("role") ?? undefined,
    });

    logger.info({ slug, ...queryParams }, "members.list_started");

    const community = await getCommunityBySlug(slug);

    // Build filters object for exactOptionalPropertyTypes
    type CommunityRole = "owner" | "co_owner" | "admin" | "moderator" | "member";
    const filters: { status?: "active" | "pending" | "banned"; role?: CommunityRole } = {};
    if (queryParams.status !== undefined) {
      filters.status = queryParams.status;
    }
    if (queryParams.role !== undefined) {
      filters.role = queryParams.role;
    }

    const result = await listCommunityMembersPaginated(
      community.communityId,
      { page: queryParams.page, pageSize: queryParams.pageSize },
      filters,
    );

    logger.info({ slug, count: result.items.length }, "members.list_completed");

    return NextResponse.json(result);
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
