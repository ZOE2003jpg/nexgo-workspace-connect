import { ShieldCheck, Wallet, Truck, Lock, FileText, HelpCircle, ChevronLeft, Sparkles } from "lucide-react";
import { G, card } from "@/lib/nexgo-theme";

export function LegalScreen({ onBack }: { onBack?: () => void }) {
  const Section = ({ Icon, title, children }: any) => (
    <div style={card({ display: "flex", gap: 14, alignItems: "flex-start" })}>
      <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg,${G.goldGlow},transparent)`, border: `1px solid ${G.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={20} color={G.gold} strokeWidth={1.7} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 19, fontWeight: 700, color: G.white, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: G.whiteDim }}>{children}</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .4s ease", maxWidth: 800, margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onBack && (
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: G.b3, border: `1px solid ${G.b5}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={20} color={G.white} />
          </button>
        )}
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 28, fontWeight: 700, color: G.white, lineHeight: 1.1 }}>How NexGo Works</div>
          <div style={{ color: G.whiteDim, fontSize: 12 }}>Transparency · Trust · Terms of Service</div>
        </div>
      </div>

      <div style={{ background: `linear-gradient(135deg,${G.goldDark},${G.gold})`, borderRadius: 18, padding: "20px 18px", color: G.black }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, opacity: 0.75, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>
          <Sparkles size={13} /> Welcome to NexGo
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>
          We connect students, campus vendors and riders into one safe payment‑first marketplace.
        </div>
      </div>

      <Section Icon={Wallet} title="Why we collect payment upfront">
        Funding your NexWallet (or paying at checkout) lets us confirm your order instantly with the vendor, dispatch a rider, and protect both sides from no‑shows or fake orders. Money held for an order is escrowed by NexGo — vendors and riders are paid only after delivery, and you are eligible for an automatic refund if an order is cancelled before it is accepted.
      </Section>

      <Section Icon={Truck} title="How an order works">
        1. You place an order and pay from your wallet or card.<br />
        2. The vendor accepts and begins preparing.<br />
        3. A nearby NexGo rider picks it up and delivers to you.<br />
        4. Funds are released to the vendor and rider on delivery.<br />
        5. You have 30 minutes after delivery to flag any issue for review.
      </Section>

      <Section Icon={ShieldCheck} title="Refunds & disputes">
        Cancel a pending (not‑yet‑accepted) order any time for a full refund to your wallet. After delivery, use the “Dispute” button within 30 minutes if something is wrong — our team reviews every flagged order and can issue partial or full refunds.
      </Section>

      <Section Icon={Lock} title="Your money is safe">
        Payments are processed by Korapay, a licensed Nigerian payment processor. We never see or store your card details. Your wallet balance lives in a regulated escrow account and is reconciled daily. Withdrawals are processed to your verified bank account.
      </Section>

      <Section Icon={FileText} title="Terms of Service (summary)">
        By using NexGo you agree to: provide accurate delivery details, only dispute orders honestly, treat vendors and riders with respect, and accept that NexGo charges a small service fee on each transaction to keep the platform running. Fraudulent disputes or chargebacks may result in account suspension. The full terms are available on request from support@nexgo.app.
      </Section>

      <Section Icon={HelpCircle} title="Need help?">
        Tap the chat icon in the bottom menu to reach a human support agent. Most issues are resolved within minutes during campus hours.
      </Section>

      <div style={{ textAlign: "center", color: G.whiteDim, fontSize: 11, padding: "8px 0 24px" }}>
        © {new Date().getFullYear()} NexGo · Built for Nigerian campuses
      </div>
    </div>
  );
}
