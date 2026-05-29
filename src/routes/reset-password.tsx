import { createFileRoute } from "@tanstack/react-router";
import ResetPassword from "@/pages/ResetPassword";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — NexGo" },
      { name: "description", content: "Reset your NexGo account password." },
    ],
  }),
  component: ResetPassword,
});