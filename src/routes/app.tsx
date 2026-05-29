import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "NexGo" }] }),
  component: AppHome,
});

function AppHome() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/signin", replace: true });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  const onSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span
              className="inline-block size-7 rounded-md"
              style={{ backgroundImage: "var(--gradient-sunset)" }}
              aria-hidden
            />
            NexGo
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {user.email}
            </span>
            {role && (
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-accent">
                {role}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={onSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-6 py-10">
        <RoleHome role={role} />
      </main>
    </div>
  );
}

function RoleHome({ role }: { role: AppRole | null }) {
  if (!role) {
    return (
      <Card>
        <h2 className="text-2xl font-bold text-foreground">Setting up your account…</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We're assigning your role. If this stays here for a while, sign out and
          back in, or contact support.
        </p>
      </Card>
    );
  }

  if (role === "student") return <StudentHome />;
  if (role === "vendor") return <VendorHome />;
  if (role === "rider") return <RiderHome />;
  if (role === "admin") return <AdminHome />;
  if (role === "school") return <SchoolHome />;
  return null;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      {children}
    </div>
  );
}

function Tile({
  title,
  body,
  emoji,
}: {
  title: string;
  body: string;
  emoji: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-transform hover:-translate-y-0.5">
      <div className="text-3xl">{emoji}</div>
      <div className="mt-2 font-semibold text-foreground">{title}</div>
      <div className="text-sm text-muted-foreground">{body}</div>
    </div>
  );
}

function StudentHome() {
  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6 text-primary-foreground shadow-lg"
        style={{ backgroundImage: "var(--gradient-sunset)" }}
      >
        <h1 className="text-2xl font-bold">Hey there 👋</h1>
        <p className="mt-1 text-primary-foreground/90">
          What do you need today?
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile emoji="🍲" title="NexChow" body="Order food from campus vendors" />
        <Tile emoji="📦" title="NexDispatch" body="Send a package across campus" />
        <Tile emoji="🚌" title="NexTrip" body="Book a ride home" />
        <Tile emoji="💳" title="Wallet" body="Top up and pay faster" />
        <Tile emoji="📜" title="My orders" body="Track in-progress orders" />
        <Tile emoji="👤" title="Profile" body="Manage your details" />
      </div>
    </div>
  );
}

function VendorHome() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Vendor dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile emoji="🧾" title="New orders" body="Accept incoming orders" />
        <Tile emoji="📋" title="Menu" body="Add, edit and toggle items" />
        <Tile emoji="🔔" title="Notifications" body="See order alerts" />
        <Tile emoji="🏪" title="Restaurant" body="Hours, name and image" />
      </div>
    </div>
  );
}

function RiderHome() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Rider dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile emoji="📍" title="Available pickups" body="Orders ready to deliver" />
        <Tile emoji="🚴" title="My deliveries" body="In-progress jobs" />
        <Tile emoji="🔑" title="Confirm pickup" body="Enter the NX code to deliver" />
        <Tile emoji="📄" title="Documents" body="Upload ID and vehicle docs" />
      </div>
    </div>
  );
}

function AdminHome() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Admin console</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile emoji="👥" title="Users & roles" body="Promote and manage users" />
        <Tile emoji="🛵" title="Rider approvals" body="Review pending riders" />
        <Tile emoji="📦" title="All orders" body="Audit live orders" />
        <Tile emoji="🚌" title="Trip routes" body="Add/edit travel routes" />
        <Tile emoji="⚙️" title="Settings" body="Platform fees and config" />
      </div>
    </div>
  );
}

function SchoolHome() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">School dashboard</h1>
      <Card>
        <p className="text-sm text-muted-foreground">
          Read-only overview of campus activity coming soon.
        </p>
      </Card>
    </div>
  );
}
