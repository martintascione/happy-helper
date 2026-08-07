import { createFileRoute } from "@tanstack/react-router";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-background">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl mb-6">
        Proyecto Web & iOS
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground">
        Necesito trabajar en un proyecto, en donde tengamos página web y a la vez, la versión en SwiftUI, para app de iOS.
      </p>
    </div>
  );
}
