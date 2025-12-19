import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import { getProfileByUserId, UpdateProfileSchema, updateProfile } from "@/features/profiles";

const logger = getLogger("api.profiles");

/**
 * GET /api/profiles/me
 * Get the current user's profile.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedResponse();
    }

    logger.info({ userId: user.id }, "profile.me.get_started");

    const profile = await getProfileByUserId(user.id);

    logger.info({ profileId: profile.id, userId: user.id }, "profile.me.get_completed");

    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/profiles/me
 * Update the current user's profile.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const input = UpdateProfileSchema.parse(body);

    logger.info({ userId: user.id }, "profile.me.update_started");

    // First get the profile to get profileId
    const existingProfile = await getProfileByUserId(user.id);
    const profile = await updateProfile(existingProfile.id, input, user.id);

    logger.info({ profileId: profile.id, userId: user.id }, "profile.me.update_completed");

    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
