import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Initialize a Korapay charge. Returns a checkout_url for the user to complete payment.
export const initializeKorapayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { amount: number; purpose?: "wallet" | "order"; orderId?: string }) => {
    if (!input || typeof input.amount !== "number") throw new Error("Invalid amount");
    if (input.amount < 100) throw new Error("Minimum deposit is ₦100");
    if (input.amount > 10_000_000) throw new Error("Amount out of range");
    return {
      amount: Math.floor(input.amount),
      purpose: input.purpose === "order" ? "order" : "wallet",
      orderId: input.orderId,
    };
  })
  .handler(async ({ data, context }) => {
    const secret = process.env.KORAPAY_SECRET_KEY;
    if (!secret) throw new Error("KORAPAY_SECRET_KEY not configured");

    const { userId, supabase } = context;

    // Look up user email for the customer object
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    const reference = `NX-${data.purpose === "order" ? "ORD" : "WAL"}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();

    // Stable public URLs for webhook + redirect (do NOT change if project is renamed)
    const projectId = "3aeaa6c0-4753-4df4-8c93-d01eb49264e1";
    const baseUrl = `https://project--${projectId}.lovable.app`;

    const body = {
      amount: data.amount,
      currency: "NGN",
      reference,
      notification_url: `${baseUrl}/api/public/korapay-webhook`,
      redirect_url: `${baseUrl}/`,
      customer: {
        email: profile?.email || `${userId}@nexgo.local`,
        name: profile?.full_name || "NexGo User",
      },
      metadata: {
        user_id: userId,
        purpose: data.purpose,
        ...(data.orderId ? { order_id: data.orderId } : {}),
      },
    };

    const res = await fetch("https://api.korapay.com/merchant/api/v1/charges/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as any;
    if (!res.ok || !json?.status || !json?.data?.checkout_url) {
      console.error("[Korapay] init failed", json);
      throw new Error(json?.message || "Korapay initialization failed");
    }

    // Record pending deposit (wallet only) so user sees it before webhook fires
    if (data.purpose === "wallet") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("deposits").insert({
        user_id: userId,
        reference: json.data.reference,
        amount: data.amount,
        status: "pending",
        purpose: "wallet",
      });
    }

    return {
      checkout_url: json.data.checkout_url as string,
      reference: json.data.reference as string,
    };
  });
