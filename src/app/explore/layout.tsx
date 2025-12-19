import type { ReactNode } from "react";

interface ExploreLayoutProps {
  children: ReactNode;
}

export default function ExploreLayout({ children }: ExploreLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center px-4">
          <a href="/" className="font-semibold">
            Community App
          </a>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
