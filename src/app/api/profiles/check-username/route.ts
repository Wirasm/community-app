import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import {
  CheckUsernameSchema,
  checkUsernameAvailable,
  getProfileByUserId,
} from "@/features/profiles";

const logger = getLogger("api.profiles");

/**
 * GET /api/profiles/check-username?username=xxx
 * Check if a username is available.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const usernameParam = searchParams.get("username");

    const input = CheckUsernameSchema.parse({ username: usernameParam });

    logger.info({ username: input.username, userId: user.id }, "profile.check_username_started");

    // Get current user's profile to exclude their own username
    const currentProfile = await getProfileByUserId(user.id);
    const available = await checkUsernameAvailable(input.username, currentProfile.profileId);

    logger.info({ username: input.username, available }, "profile.check_username_completed");

    return NextResponse.json({ available, username: input.username });
  } catch (error) {
    return handleApiError(error);
  }
}
