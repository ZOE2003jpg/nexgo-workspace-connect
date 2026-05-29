import { createFileRoute } from "@tanstack/react-router";
import SignIn from "@/pages/SignIn";
import { RedirectIfAuth } from "@/components/RouteGuards";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign In — NexGo" },
      { name: "description", content: "Sign in to your NexGo account." },
      { property: "og:title", content: "Sign In — NexGo" },
      { property: "og:description", content: "Sign in to your NexGo account." },
    ],
  }),
  component: () => (
    <RedirectIfAuth>
      <SignIn />
    </RedirectIfAuth>
  ),
});