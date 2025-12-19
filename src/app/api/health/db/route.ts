import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/core/database/client";
import { getLogger } from "@/core/logging";

const logger = getLogger("health.db");

/**
 * Database health check endpoint.
 * Verifies database connectivity by executing a simple query.
 */
export async function GET() {
  try {
    logger.info("health.db_check_started");

    await db.execute(sql`SELECT 1`);

    logger.info("health.db_check_completed");

    return NextResponse.json({
      status: "healthy",
      service: "database",
      provider: "supabase",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    logger.error({ error: message }, "health.db_check_failed");

    return NextResponse.json(
      {
        status: "unhealthy",
        service: "database",
        error: message,
      },
      { status: 503 },
    );
  }
}
