import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPublicCommunities } from "@/features/communities";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function ExplorePage({ searchParams }: PageProps) {
  const { search } = await searchParams;
  const communities = await getPublicCommunities(search);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Explore Communities</h1>
        <p className="text-muted-foreground">Discover communities to join</p>
      </div>

      <form className="max-w-md">
        <Input name="search" placeholder="Search communities..." defaultValue={search ?? ""} />
      </form>

      {communities.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <a key={community.communityId} href={`/c/${community.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{community.name}</CardTitle>
                    <Badge variant="secondary">{community.visibility}</Badge>
                  </div>
                  <CardDescription>@{community.slug}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {community.description || "No description"}
                  </p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">
          {search ? `No communities found for "${search}"` : "No communities yet"}
        </p>
      )}
    </div>
  );
}
