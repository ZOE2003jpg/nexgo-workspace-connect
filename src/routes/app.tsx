import { createFileRoute } from "@tanstack/react-router";
import NexGoApp from "@/components/NexGo";
import { RequireAuth } from "@/components/RouteGuards";
import { AccountStatusGate } from "@/components/AccountStatusGate";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "NexGo" },
      { name: "description", content: "Your NexGo dashboard." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AccountStatusGate>
        <NexGoApp />
      </AccountStatusGate>
    </RequireAuth>
  ),
});