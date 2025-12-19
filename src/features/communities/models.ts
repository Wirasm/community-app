import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { communities } from "@/core/database/schema";

export { communities };

export type Community = InferSelectModel<typeof communities>;
export type NewCommunity = InferInsertModel<typeof communities>;
