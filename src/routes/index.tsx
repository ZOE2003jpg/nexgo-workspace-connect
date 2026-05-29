import { createFileRoute } from "@tanstack/react-router";
import LandingPage from "@/pages/LandingPage";
import { RedirectIfAuth } from "@/components/RouteGuards";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NexGo — Your Campus, Supercharged" },
      { name: "description", content: "Order food, send packages, and book campus rides — all in one app for Nigerian university students, vendors, and riders." },
      { property: "og:title", content: "NexGo — Your Campus, Supercharged" },
      { property: "og:description", content: "Order food, send packages, and book campus rides — all in one app for Nigerian university students, vendors, and riders." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <RedirectIfAuth>
      <LandingPage />
    </RedirectIfAuth>
  );
}
