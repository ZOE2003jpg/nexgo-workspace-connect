import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Wallet, Hourglass, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { G, btn, card, inp } from "@/lib/nexgo-theme";
import { STitle, Spinner } from "@/components/nexgo/SharedUI";
import { toast } from "@/components/nexgo/ToastContainer";
import { initializeKorapayPayment } from "@/lib/korapay.functions";

export function WalletScreen({ wallet }: any) {
  const { user, profile, refreshWallet } = useAuth();
  const [amt, setAmt] = useState("");
  const [txns, setTxns] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [funding, setFunding] = useState(false);
  const initPay = useServerFn(initializeKorapayPayment);

  const loadHistory = () => {
    if (!user) return;
    supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setTxns(data); });
    supabase.from("deposits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setDeposits(data); });
  };

  useEffect(() => { loadHistory(); }, [user, wallet]);

  // Auto-refresh while a pending deposit exists so the webhook update appears without manual refresh
  useEffect(() => {
    if (!user) return;
    const hasPending = deposits.some((d) => d.status === "pending");
    if (!hasPending) return;
    const t = setInterval(() => { loadHistory(); refreshWallet(); }, 5000);
    return () => clearInterval(t);
  }, [deposits, user]);

  const fund = async () => {
    if (!user) return;
    const v = parseInt(amt);
    if (isNaN(v) || v < 100) { toast("Minimum deposit is ₦100", "error"); return; }

    setFunding(true);
    try {
      const res = await initPay({ data: { amount: v, purpose: "wallet" } });
      setFunding(false);
      if (!res?.checkout_url) { toast("Payment initialization failed", "error"); return; }
      window.open(res.checkout_url, "_blank");
      toast("Complete payment in the new tab. Your wallet will update automatically.", "info");
      loadHistory();
    } catch (e: any) {
      setFunding(false);
      toast(e?.message || "Payment initialization failed", "error");
    }
  };

  return (
    <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .4s ease", maxWidth: 800, margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${G.goldGlow},transparent)`, border: `1px solid ${G.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Wallet size={22} color={G.gold} strokeWidth={1.7} />
        </div>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 26, fontWeight: 700, color: G.white, lineHeight: 1.1 }}>NexWallet</div>
          <div style={{ color: G.whiteDim, fontSize: 12 }}>Your campus money</div>
        </div>
      </div>
      <div style={{ background: `linear-gradient(135deg,${G.goldDark},${G.gold})`, borderRadius: 22, padding: "32px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ fontSize: 12, color: G.black, opacity: .7, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Total Balance</div>
        <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 52, fontWeight: 700, color: G.black, lineHeight: 1 }}>₦{wallet.toLocaleString()}</div>
        <div style={{ fontSize: 13, color: G.black, opacity: .6, marginTop: 8 }}>{profile?.full_name}</div>
      </div>
      <div style={card()}>
        <STitle>Fund Wallet</STitle>
        <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 12, flexWrap: "wrap" }}>
          {[500, 1000, 2000, 5000].map((v: number) => (
            <button key={v} onClick={() => setAmt(String(v))} style={{ padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: amt === String(v) ? G.goldGlow : G.b4, border: `1px solid ${amt === String(v) ? G.gold : G.b5}`, color: amt === String(v) ? G.gold : G.whiteDim, cursor: "pointer", transition: "all .2s" }}>₦{v.toLocaleString()}</button>
          ))}
        </div>
        <input style={{ ...inp({ marginBottom: 8 }) }} type="number" min={100} placeholder="Enter amount (min ₦100)…" value={amt} onChange={e => setAmt(e.target.value)} />
        <div style={{ fontSize: 11, color: G.whiteDim, marginBottom: 12 }}>Minimum deposit is ₦100</div>
        <button onClick={fund} disabled={funding} style={{ ...btn("gold", { width: "100%", padding: "13px", opacity: funding ? .6 : 1 }) }}>
          {funding ? <><Spinner /> Connecting…</> : <>Pay with KoraPay <ArrowRight size={15} /></>}
        </button>
      </div>
      {deposits.filter((d: any) => d.status !== "completed").length > 0 && (
        <div>
          <STitle>Pending Deposits</STitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {deposits.filter((d: any) => d.status !== "completed").map((d: any) => (
              <div key={d.id} style={card({ display: "flex", justifyContent: "space-between", alignItems: "center" })}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: G.b4, display: "flex", alignItems: "center", justifyContent: "center" }}><Hourglass size={18} color={G.gold} /></div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: G.white }}>Korapay Deposit</div>
                    <div style={{ fontSize: 11, color: G.whiteDim }}>{d.reference} · {d.status}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontFamily: "'DM Mono'", fontSize: 14, color: G.gold }}>₦{d.amount.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <STitle>Transactions</STitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {txns.length === 0 && <div style={{ ...card(), textAlign: "center", color: G.whiteDim }}>No transactions yet</div>}
          {txns.map((tx: any) => (
            <div key={tx.id} style={card({ display: "flex", justifyContent: "space-between", alignItems: "center" })}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: G.b4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{tx.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: G.white }}>{tx.label}</div>
                  <div style={{ fontSize: 11, color: G.whiteDim }}>{new Date(tx.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontFamily: "'DM Mono'", fontSize: 14, color: tx.amount > 0 ? G.success : G.danger }}>{tx.amount > 0 ? "+" : ""}₦{Math.abs(tx.amount).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
