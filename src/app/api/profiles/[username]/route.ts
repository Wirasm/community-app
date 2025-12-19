import { type NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { getProfileByUsername } from "@/features/profiles";

const logger = getLogger("api.profiles");

interface RouteParams {
  params: Promise<{ username: string }>;
}

/**
 * GET /api/profiles/[username]
 * Get a public profile by username.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { username } = await params;

    logger.info({ username }, "profile.public.get_started");

    const profile = await getProfileByUsername(username);

    logger.info({ profileId: profile.id, username }, "profile.public.get_completed");

    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
