import type { Logger as PinoLogger } from "pino";

import {
  generateRequestId,
  getRequestContext,
  setRequestContext,
  withRequestContext,
} from "./context";
import { logger } from "./logger";

export type { RequestContext } from "./context";
export type { Logger } from "./logger";

export { generateRequestId, getRequestContext, logger, setRequestContext, withRequestContext };

/**
 * Get a child logger for a specific component.
 * Automatically includes request context (requestId, userId) when available.
 *
 * @param component - Component name using dotted namespace pattern (e.g., "auth.service", "profiles.api")
 *
 * @example
 * const logger = getLogger("profiles.service");
 *
 * // Pattern: domain.action_state
 * logger.info({ profileId }, "profile.create_started");
 * logger.info({ profileId }, "profile.create_completed");
 * logger.error({ profileId, error }, "profile.create_failed");
 */
export function getLogger(component: string): PinoLogger {
  const context = getRequestContext();

  const bindings: Record<string, unknown> = { component };

  if (context) {
    bindings["requestId"] = context.requestId;
    if (context.userId) {
      bindings["userId"] = context.userId;
    }
    if (context.correlationId) {
      bindings["correlationId"] = context.correlationId;
    }
  }

  return logger.child(bindings);
}
