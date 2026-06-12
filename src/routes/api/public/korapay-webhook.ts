import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

// Korapay webhook receiver.
// Signature: HMAC SHA256 of the JSON-stringified `data` field using the
// merchant secret key, sent in the `x-korapay-signature` header.
// Docs: https://developers.korahq.com/reference/webhook-notifications
export const Route = createFileRoute("/api/public/korapay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.KORAPAY_SECRET_KEY;
        if (!secret) return new Response("Server misconfigured", { status: 500 });

        const raw = await request.text();
        let payload: any;
        try {
          payload = JSON.parse(raw);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const signature = request.headers.get("x-korapay-signature") ?? "";
        const expected = createHmac("sha256", secret)
          .update(JSON.stringify(payload.data ?? {}))
          .digest("hex");

        try {
          const a = Buffer.from(signature, "hex");
          const b = Buffer.from(expected, "hex");
          if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return new Response("Invalid signature", { status: 401 });
          }
        } catch {
          return new Response("Invalid signature", { status: 401 });
        }

        const event = payload.event as string | undefined;
        const data = payload.data ?? {};

        // Only credit on successful charges
        if (event !== "charge.success" && data.status !== "success") {
          return new Response("ignored", { status: 200 });
        }

        const reference: string | undefined = data.reference;
        const amount: number | undefined =
          typeof data.amount === "number" ? data.amount : Number(data.amount);
        const metadata = data.metadata ?? {};
        const userId: string | undefined = metadata.user_id;
        const purpose: string = metadata.purpose ?? "wallet";

        if (!reference || !amount || !userId) {
          console.error("[Korapay webhook] missing fields", { reference, amount, userId });
          return new Response("Missing fields", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotency: skip if we already recorded this reference
        const label = `Korapay Deposit · ${reference}`;
        const { data: existing } = await supabaseAdmin
          .from("wallet_transactions")
          .select("id")
          .eq("user_id", userId)
          .eq("label", label)
          .maybeSingle();
        if (existing) return new Response("already processed", { status: 200 });

        if (purpose === "wallet") {
          const { data: result, error } = await supabaseAdmin.rpc("topup_wallet", {
            _user_id: userId,
            _amount: Math.floor(amount),
          });
          if (error) {
            console.error("[Korapay webhook] topup failed", error);
            return new Response("Topup failed", { status: 500 });
          }
          // Replace the generic label inserted by topup_wallet with one containing the reference (for idempotency).
          await supabaseAdmin
            .from("wallet_transactions")
            .update({ label })
            .eq("user_id", userId)
            .eq("label", "Wallet Top-up")
            .order("created_at", { ascending: false })
            .limit(1);
          console.log("[Korapay webhook] credited", { userId, amount, reference, result });
        } else if (purpose === "order") {
          // Mark the order as paid
          const orderId = metadata.order_id;
          if (orderId) {
            await supabaseAdmin
              .from("orders")
              .update({ payment_reference: reference, status: "accepted" })
              .eq("id", orderId);
          }
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
