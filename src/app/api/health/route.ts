import { NextResponse } from "next/server";

import { formatIso, utcNow } from "@/shared/utils";

/**
 * Basic health check endpoint.
 * Always returns 200 - used for load balancer health checks.
 */
export function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "api",
    timestamp: formatIso(utcNow()),
  });
}
