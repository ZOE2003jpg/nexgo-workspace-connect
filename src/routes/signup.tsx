import { createFileRoute } from "@tanstack/react-router";
import SignUp from "@/pages/SignUp";
import { RedirectIfAuth } from "@/components/RouteGuards";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — NexGo" },
      { name: "description", content: "Create your NexGo account — student, vendor, or rider." },
      { property: "og:title", content: "Sign Up — NexGo" },
      { property: "og:description", content: "Create your NexGo account — student, vendor, or rider." },
    ],
  }),
  component: () => (
    <RedirectIfAuth>
      <SignUp />
    </RedirectIfAuth>
  ),
});