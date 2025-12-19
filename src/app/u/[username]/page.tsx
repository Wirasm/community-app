import Image from "next/image";
import { notFound } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Profile } from "@/features/profiles";
import { getProfileByUsername, ProfileNotFoundError } from "@/features/profiles";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;

  let profile: Profile;
  try {
    profile = await getProfileByUsername(username);
  } catch (error) {
    if (error instanceof ProfileNotFoundError) {
      notFound();
    }
    throw error;
  }

  const initials = profile.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Banner area */}
      {profile.bannerUrl && (
        <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg">
          <Image
            src={profile.bannerUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
          />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.displayName} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.displayName}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
            {profile.location && (
              <p className="mt-1 text-sm text-muted-foreground">{profile.location}</p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.bio && (
            <div>
              <h2 className="mb-2 font-semibold">About</h2>
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>
          )}

          {profile.website && (
            <div>
              <h2 className="mb-2 font-semibold">Website</h2>
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {profile.website}
              </a>
            </div>
          )}

          {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
            <div>
              <h2 className="mb-2 font-semibold">Social Links</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(profile.socialLinks).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-muted px-3 py-1 text-sm hover:bg-muted/80"
                  >
                    {platform}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 text-xs text-muted-foreground">
            Member since {profile.createdAt.toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
