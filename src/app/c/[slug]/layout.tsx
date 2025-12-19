import type { ReactNode } from "react";

interface CommunityLayoutProps {
  children: ReactNode;
}

export default function CommunityLayout({ children }: CommunityLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center px-4">
          <a href="/" className="font-semibold">
            Community App
          </a>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
