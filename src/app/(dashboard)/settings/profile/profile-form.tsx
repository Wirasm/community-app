"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFileUpload } from "@/features/storage/hooks/use-file-upload";
import { MAX_AVATAR_SIZE } from "@/features/storage/schemas";
import { ImageUpload } from "@/shared/components/image-upload";

import { type UpdateProfileState, updateProfileAction } from "./actions";

const initialState: UpdateProfileState = {};

interface ProfileFormProps {
  profile: {
    username: string;
    displayName: string;
    bio: string | null;
    location: string | null;
    website: string | null;
    avatarUrl: string | null;
  };
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);

  const {
    isUploading,
    progress,
    error: uploadError,
    url: uploadedUrl,
    upload,
  } = useFileUpload({
    maxSize: MAX_AVATAR_SIZE,
  });

  const handleAvatarUpload = async (file: File) => {
    await upload("/api/upload/avatar", file);
  };

  // Use uploaded URL if available, otherwise use profile URL
  const currentAvatarUrl = uploadedUrl ?? profile.avatarUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your public profile information</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
              Profile updated successfully!
            </div>
          )}

          {/* Avatar Upload Section */}
          <div className="flex flex-col gap-2">
            <Label>Profile Photo</Label>
            <ImageUpload
              currentUrl={currentAvatarUrl}
              onUpload={handleAvatarUpload}
              isUploading={isUploading}
              progress={progress}
              error={uploadError}
              maxSizeMB={MAX_AVATAR_SIZE / (1024 * 1024)}
              aspectRatio="square"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              defaultValue={profile.username}
              placeholder="johndoe"
              pattern="[a-z0-9_]+"
              minLength={3}
              maxLength={30}
            />
            {state.fieldErrors?.["username"] && (
              <p className="text-sm text-destructive">{state.fieldErrors["username"][0]}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and underscores only
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={profile.displayName}
              placeholder="John Doe"
              maxLength={100}
            />
            {state.fieldErrors?.["displayName"] && (
              <p className="text-sm text-destructive">{state.fieldErrors["displayName"][0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              defaultValue={profile.bio ?? ""}
              placeholder="Tell us about yourself"
              maxLength={500}
              rows={3}
            />
            {state.fieldErrors?.["bio"] && (
              <p className="text-sm text-destructive">{state.fieldErrors["bio"][0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              defaultValue={profile.location ?? ""}
              placeholder="San Francisco, CA"
              maxLength={100}
            />
            {state.fieldErrors?.["location"] && (
              <p className="text-sm text-destructive">{state.fieldErrors["location"][0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={profile.website ?? ""}
              placeholder="https://example.com"
            />
            {state.fieldErrors?.["website"] && (
              <p className="text-sm text-destructive">{state.fieldErrors["website"][0]}</p>
            )}
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
