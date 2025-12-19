import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { profiles } from "@/core/database/schema";

export { profiles };

export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;
