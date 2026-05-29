import { createFileRoute } from "@tanstack/react-router";
import NexGoApp from "@/components/NexGo";
import { RequireAuth } from "@/components/RouteGuards";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "NexGo" },
      { name: "description", content: "Your NexGo dashboard." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <NexGoApp />
    </RequireAuth>
  ),
});