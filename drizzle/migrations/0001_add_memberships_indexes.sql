-- Add indexes for common membership queries
CREATE INDEX IF NOT EXISTS idx_memberships_profile ON memberships(profile_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_memberships_community ON memberships(community_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_memberships_community_role ON memberships(community_id, role);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_memberships_community_status ON memberships(community_id, status);
