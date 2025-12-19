import Image from "next/image";
import { notFound } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Community } from "@/features/communities";
import { CommunityNotFoundError, getCommunityBySlug } from "@/features/communities";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CommunityPage({ params }: PageProps) {
  const { slug } = await params;

  let community: Community;
  try {
    community = await getCommunityBySlug(slug);
  } catch (error) {
    if (error instanceof CommunityNotFoundError) {
      notFound();
    }
    throw error;
  }

  const initials = community.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {community.bannerUrl && (
        <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg">
          <Image
            src={community.bannerUrl}
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
            <AvatarImage src={community.logoUrl ?? undefined} alt={community.name} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{community.name}</h1>
                <p className="text-muted-foreground">@{community.slug}</p>
              </div>
              <Badge variant="secondary">{community.visibility}</Badge>
            </div>
            {community.description && (
              <p className="mt-2 text-muted-foreground">{community.description}</p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {community.about && (
            <div>
              <h2 className="mb-2 font-semibold">About</h2>
              <p className="whitespace-pre-wrap text-muted-foreground">{community.about}</p>
            </div>
          )}

          <div className="pt-4 text-xs text-muted-foreground">
            Created {community.createdAt.toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
