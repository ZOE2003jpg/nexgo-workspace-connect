import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NexGo — Campus food, dispatch & trips" },
      {
        name: "description",
        content:
          "Order food, send a dispatch, or book a ride. One app for everything on campus.",
      },
      { property: "og:title", content: "NexGo — Campus food, dispatch & trips" },
      {
        property: "og:description",
        content:
          "Order food, send a dispatch, or book a ride. One app for everything on campus.",
      },
    ],
  }),
  component: LandingPage,
});

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email").max(255);

function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: parsed.data, subscribed: true });
    setSubmitting(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error(error.message);
      return;
    }
    toast.success("You're on the list!");
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="container mx-auto flex items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span
            className="inline-block size-8 rounded-lg"
            style={{ backgroundImage: "var(--gradient-sunset)" }}
            aria-hidden
          />
          NexGo
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            to="/signin"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/10"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-md px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
            style={{ backgroundImage: "var(--gradient-sunset)" }}
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 pt-12 pb-20 text-center">
        <span className="inline-block rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          For students • vendors • riders
        </span>
        <h1 className="mt-6 text-balance text-5xl font-extrabold tracking-tight text-foreground md:text-7xl">
          Campus life,{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--gradient-sunset)" }}
          >
            on one app.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
          Order food, send a package across campus, or book a trip home — NexGo
          handles it all with verified vendors and trusted riders.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/signup"
            className="rounded-md px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5"
            style={{
              backgroundImage: "var(--gradient-sunset)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            Create an account
          </Link>
          <Link
            to="/signin"
            className="rounded-md border border-border bg-card px-6 py-3 text-base font-semibold text-foreground hover:bg-accent/10"
          >
            I already have one
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto grid gap-4 px-6 pb-20 md:grid-cols-3">
        {[
          {
            title: "NexChow",
            body: "Browse campus vendors and get food delivered to your hostel.",
            emoji: "🍲",
          },
          {
            title: "NexDispatch",
            body: "Send packages anywhere on campus with verified riders.",
            emoji: "📦",
          },
          {
            title: "NexTrip",
            body: "Book private or public seats on trips home, with a boarding code.",
            emoji: "🚌",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="text-3xl">{f.emoji}</div>
            <h3 className="mt-3 text-lg font-bold text-foreground">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      {/* Newsletter */}
      <section
        className="border-t border-border"
        style={{ backgroundImage: "var(--gradient-sunset)" }}
      >
        <div className="container mx-auto px-6 py-16 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold md:text-4xl">Get launch updates</h2>
          <p className="mx-auto mt-2 max-w-xl text-primary-foreground/90">
            Drop your email — we'll let you know when NexGo lands on your campus.
          </p>
          <form
            onSubmit={onSubscribe}
            className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row"
          >
            <Input
              type="email"
              required
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card text-foreground"
              maxLength={255}
            />
            <Button
              type="submit"
              disabled={submitting}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {submitting ? "Subscribing…" : "Subscribe"}
            </Button>
          </form>
        </div>
      </section>

      <footer className="container mx-auto px-6 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} NexGo. Built for campus.
      </footer>
    </div>
  );
}
