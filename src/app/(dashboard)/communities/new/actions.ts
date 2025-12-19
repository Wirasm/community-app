"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import { CreateCommunitySchema, createCommunity, SlugExistsError } from "@/features/communities";
import { getProfileByUserId } from "@/features/profiles";

const logger = getLogger("communities.new.actions");

export interface CreateCommunityState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function extractFormInput(formData: FormData): Record<string, string | undefined> {
  const fields = ["name", "slug", "description", "visibility"];
  const input: Record<string, string | undefined> = {};

  for (const field of fields) {
    const value = formData.get(field);
    if (typeof value === "string" && value.trim() !== "") {
      input[field] = value.trim();
    }
  }

  return input;
}

function formatValidationErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of issues) {
    const path = issue.path.join(".") || "root";
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }

  return fieldErrors;
}

export async function createCommunityAction(
  _prevState: CreateCommunityState,
  formData: FormData,
): Promise<CreateCommunityState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const filteredInput = extractFormInput(formData);
  const result = CreateCommunitySchema.safeParse(filteredInput);

  if (!result.success) {
    return { fieldErrors: formatValidationErrors(result.error.issues) };
  }

  let communitySlug: string;

  try {
    logger.info({ userId: user.id }, "communities.create_started");

    const profile = await getProfileByUserId(user.id);
    const community = await createCommunity(result.data, profile.profileId);
    communitySlug = community.slug;

    logger.info(
      { communityId: community.communityId, userId: user.id },
      "communities.create_completed",
    );

    revalidatePath("/dashboard");
    revalidatePath("/explore");
  } catch (error) {
    if (error instanceof SlugExistsError) {
      return { fieldErrors: { slug: ["This slug is already taken"] } };
    }
    logger.error({ userId: user.id, error }, "communities.create_failed");
    return { error: "Failed to create community" };
  }

  redirect(`/c/${communitySlug}`);
}
