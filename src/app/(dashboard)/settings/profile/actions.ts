"use server";

import { revalidatePath } from "next/cache";

import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import {
  getProfileByUserId,
  ProfileNotFoundError,
  UpdateProfileSchema,
  UsernameExistsError,
  updateProfile,
} from "@/features/profiles";

const logger = getLogger("settings.profile.actions");

export interface UpdateProfileState {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
}

function extractFormInput(formData: FormData): Record<string, string | undefined> {
  const fields = ["username", "displayName", "bio", "location", "website"];
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

export async function updateProfileAction(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const filteredInput = extractFormInput(formData);
  const result = UpdateProfileSchema.safeParse(filteredInput);

  if (!result.success) {
    return { fieldErrors: formatValidationErrors(result.error.issues) };
  }

  try {
    logger.info({ userId: user.id }, "settings.profile.update_started");

    const profile = await getProfileByUserId(user.id);
    await updateProfile(profile.profileId, result.data, user.id);

    logger.info({ userId: user.id }, "settings.profile.update_completed");

    revalidatePath("/settings/profile");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    if (error instanceof ProfileNotFoundError) {
      return { error: "Profile not found" };
    }
    if (error instanceof UsernameExistsError) {
      return { fieldErrors: { username: ["Username is already taken"] } };
    }
    logger.error({ userId: user.id, error }, "settings.profile.update_failed");
    return { error: "Failed to update profile" };
  }
}
