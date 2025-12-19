import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { memberships } from "@/core/database/schema";

export { memberships };

export type Membership = InferSelectModel<typeof memberships>;
export type NewMembership = InferInsertModel<typeof memberships>;
