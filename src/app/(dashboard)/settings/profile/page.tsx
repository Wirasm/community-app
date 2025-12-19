import { redirect } from "next/navigation";

import { createClient } from "@/core/supabase/server";
import { getProfileByUserId } from "@/features/profiles";

import { ProfileForm } from "./profile-form";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfileByUserId(user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">Settings</h1>
      <ProfileForm profile={profile} />
    </div>
  );
}
