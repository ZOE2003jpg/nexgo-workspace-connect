import { useState, useEffect, useCallback } from "react";
import {
  UtensilsCrossed, Package, Bus, AlertTriangle, Search, Eye, EyeOff,
  Plus, ArrowDownLeft, History, Receipt, Bell, ShieldCheck, FileText,
  Headphones, Sparkles, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { G, btn, card, inp } from "@/lib/nexgo-theme";
import { STitle, Badge, Spinner } from "@/components/nexgo/SharedUI";
import { toast } from "@/components/nexgo/ToastContainer";

export function StudentHome({ wallet, setTab, profile }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [disputeId, setDisputeId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [hideBalance, setHideBalance] = useState(false);
  const { user, refreshWallet } = useAuth();

  const fetchOrders = useCallback(() => {
    if (!user) return;
    supabase.from("orders").select("id, order_number, total_amount, status, created_at, restaurant_id, delivery_fee, disputed_at, restaurants(name)").eq("student_id", user.id).order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setOrders(data); });
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('student-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `student_id=eq.${user.id}` }, () => { fetchOrders(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchOrders]);

  const cancelOrder = async (orderId: string) => {
    if (!user) return;
    setCancellingId(orderId);
    const { data: result } = await supabase.rpc("refund_order", { _order_id: orderId, _user_id: user.id });
    const r = result as any;
    if (!r?.success) { toast(r?.message || "Cannot cancel this order", "error"); setCancellingId(null); return; }
    refreshWallet();
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
    toast(`Order cancelled${r.refunded > 0 ? ` & ₦${r.refunded.toLocaleString()} refunded` : ""}`, "success");
    setCancellingId(null);
  };

  const submitDispute = async () => {
    if (!user || !disputeId || !disputeReason) return;
    const order = orders.find(o => o.id === disputeId);
    if (!order) return;
    const ageMs = Date.now() - new Date(order.created_at).getTime();
    if (ageMs > 30 * 60 * 1000) { toast("Dispute window closed (30 min)", "error"); setDisputeId(null); return; }
    await supabase.from("orders").update({ status: "under_review", dispute_reason: disputeReason, disputed_at: new Date().toISOString() }).eq("id", disputeId);
    toast("Dispute submitted for review", "success");
    setDisputeId(null); setDisputeReason("");
    fetchOrders();
  };

  const firstName = profile?.full_name?.split(" ")[0] || "Student";
  const initial = (profile?.full_name?.[0] || "N").toUpperCase();

  const primaryActions = [
    { Icon: Plus, label: "Add Money", onClick: () => setTab("wallet") },
    { Icon: ArrowDownLeft, label: "Withdraw", onClick: () => setTab("wallet") },
    { Icon: History, label: "History", onClick: () => setTab("wallet") },
  ];

  const services = [
    { Icon: UtensilsCrossed, label: "NexChow", tint: G.gold, onClick: () => setTab("chow") },
    { Icon: Package, label: "Dispatch", tint: G.gold, onClick: () => setTab("dispatch") },
    { Icon: Bus, label: "NexTrip", tint: G.gold, onClick: () => setTab("trip") },
    { Icon: Receipt, label: "Orders", tint: G.gold, onClick: () => {} },
    { Icon: Headphones, label: "Support", tint: G.gold, onClick: () => setTab("chat") },
    { Icon: ShieldCheck, label: "Safety", tint: G.gold, onClick: () => setTab("legal") },
    { Icon: FileText, label: "How it works", tint: G.gold, onClick: () => setTab("legal") },
    { Icon: Sparkles, label: "Rewards", tint: G.gold, onClick: () => {} },
  ];

  return (
    <div style={{ padding: "20px 14px 8px", display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .4s ease", maxWidth: 800, margin: "0 auto", width: "100%" }}>
      {disputeId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setDisputeId(null)}>
          <div onClick={e => e.stopPropagation()} style={{ ...card({ maxWidth: 400, width: "100%" }) }}>
            <STitle>Flag Order</STitle>
            <div style={{ fontSize: 13, color: G.whiteDim, margin: "8px 0 12px" }}>Describe your issue (within 30 min of delivery)</div>
            <textarea style={{ ...inp({ height: 80, resize: "none" as any }), marginBottom: 12 }} placeholder="What went wrong?" value={disputeReason} onChange={e => setDisputeReason(e.target.value)} />
            <button onClick={submitDispute} style={{ ...btn("gold", { width: "100%", padding: "13px" }) }}>Submit Dispute</button>
          </div>
        </div>
      )}

      {/* Top bar: avatar + greeting + bell */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div onClick={() => setTab("profile")} style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${G.goldDark},${G.gold})`, color: G.black, fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          {initial}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: G.whiteDim, letterSpacing: ".04em" }}>Welcome back</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: G.white }}>Hi, {firstName}</div>
        </div>
        <button onClick={() => setTab("chat")} style={{ width: 40, height: 40, borderRadius: 12, background: G.b3, border: `1px solid ${G.b5}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
          <Bell size={18} color={G.white} strokeWidth={1.7} />
        </button>
      </div>

      {/* Balance card — fintech style */}
      <div style={{ background: `linear-gradient(135deg,${G.goldDark},${G.gold})`, borderRadius: 22, padding: "20px 20px 18px", position: "relative", overflow: "hidden", color: G.black }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />
        <div style={{ position: "absolute", right: -60, bottom: -80, width: 180, height: 180, borderRadius: "50%", background: "rgba(0,0,0,0.06)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={15} color={G.black} />
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", opacity: .8 }}>Available Balance</div>
            <button onClick={() => setHideBalance(p => !p)} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "flex" }}>
              {hideBalance ? <EyeOff size={15} color={G.black} /> : <Eye size={15} color={G.black} />}
            </button>
          </div>
          <button onClick={() => setTab("wallet")} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: G.black, background: "transparent", border: "none", cursor: "pointer" }}>
            History <ChevronRight size={14} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 14, position: "relative" }}>
          <span style={{ fontSize: 22, fontWeight: 700 }}>₦</span>
          <span style={{ fontFamily: "'Cormorant Garamond'", fontSize: 42, fontWeight: 700, lineHeight: 1 }}>
            {hideBalance ? "••••" : wallet.toLocaleString()}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 18, position: "relative" }}>
          {primaryActions.map((a) => (
            <button key={a.label} onClick={a.onClick} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 8px", background: "rgba(0,0,0,0.85)", color: G.gold, border: "none", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              <a.Icon size={14} strokeWidth={2} /> {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Promo strip */}
      <button onClick={() => setTab("chow")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: G.b3, border: `1px solid ${G.goldBorder}`, borderRadius: 14, cursor: "pointer", textAlign: "left", width: "100%" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: G.goldGlow, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Sparkles size={18} color={G.gold} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: G.white }}>Free delivery on NexChow today</div>
          <div style={{ fontSize: 11, color: G.whiteDim }}>Order any meal, zero delivery fee</div>
        </div>
        <ChevronRight size={18} color={G.whiteDim} />
      </button>

      {/* Services grid — fintech tiles */}
      <div style={card({ padding: "18px 14px" })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, padding: "0 4px" }}>
          <STitle>Services</STitle>
          <span style={{ fontSize: 11, color: G.whiteDim, letterSpacing: ".06em", textTransform: "uppercase" }}>All in one place</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {services.map((s) => (
            <button key={s.label} onClick={s.onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: G.b4, border: `1px solid ${G.b5}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
                <s.Icon size={22} color={s.tint} strokeWidth={1.7} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: G.white, textAlign: "center", lineHeight: 1.2 }}>{s.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 4px" }}>
          <STitle>Recent Orders</STitle>
          {orders.length > 0 && <span style={{ fontSize: 11, color: G.gold, fontWeight: 600 }}>{orders.length} total</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orders.length === 0 && (
            <div style={{ ...card({ textAlign: "center", padding: "28px 16px" }) }}>
              <Receipt size={28} color={G.whiteDim} strokeWidth={1.5} style={{ marginBottom: 8 }} />
              <div style={{ color: G.white, fontSize: 14, fontWeight: 600 }}>No orders yet</div>
              <div style={{ color: G.whiteDim, fontSize: 12, marginTop: 4 }}>Tap NexChow above to place your first order</div>
            </div>
          )}
          {orders.map((o: any) => (
            <div key={o.id} style={card({ cursor: "pointer", padding: 14 })}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: G.goldGlow, border: `1px solid ${G.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <UtensilsCrossed size={18} color={G.gold} strokeWidth={1.7} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: G.white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(o.restaurants as any)?.name || "Order"}</div>
                    <div style={{ fontSize: 11.5, color: G.whiteDim, marginTop: 2 }}>{o.order_number} · {new Date(o.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: G.gold, fontFamily: "'DM Mono'", fontSize: 13 }}>₦{o.total_amount?.toLocaleString()}</div>
                  <Badge status={o.status} />
                </div>
              </div>
              {(o.status === "Pending" || (o.status === "Delivered" && !o.disputed_at) || o.status === "under_review") && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {o.status === "Pending" && (
                    <button onClick={(e) => { e.stopPropagation(); cancelOrder(o.id); }} disabled={cancellingId === o.id} style={{ ...btn("ghost", { padding: "6px 12px", fontSize: 12, color: G.danger, border: `1px solid ${G.danger}40`, opacity: cancellingId === o.id ? .5 : 1 }) }}>
                      {cancellingId === o.id ? <Spinner size={12} color={G.danger} /> : "Cancel"}
                    </button>
                  )}
                  {o.status === "Delivered" && !o.disputed_at && (Date.now() - new Date(o.created_at).getTime() <= 30 * 60 * 1000) && (
                    <button onClick={(e) => { e.stopPropagation(); setDisputeId(o.id); }} style={{ ...btn("ghost", { padding: "6px 12px", fontSize: 12, color: "#E8A030", border: "1px solid rgba(232,160,48,0.4)", gap: 4 }) }}>
                      <AlertTriangle size={12} /> Dispute
                    </button>
                  )}
                  {o.status === "under_review" && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#E8A030", fontWeight: 600 }}><Search size={11} /> Under Review</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
