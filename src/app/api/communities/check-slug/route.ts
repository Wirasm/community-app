import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import { CheckSlugSchema, checkSlugAvailable } from "@/features/communities";

const logger = getLogger("api.communities");

/**
 * GET /api/communities/check-slug?slug=xxx
 * Check if a slug is available.
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
    const slugParam = searchParams.get("slug");

    const input = CheckSlugSchema.parse({ slug: slugParam });

    logger.info({ slug: input.slug, userId: user.id }, "community.check_slug_started");

    const available = await checkSlugAvailable(input.slug);

    logger.info({ slug: input.slug, available }, "community.check_slug_completed");

    return NextResponse.json({ available, slug: input.slug });
  } catch (error) {
    return handleApiError(error);
  }
}
