import { useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ShoppingBag, MapPin, Wallet, Landmark, Check, Plus, Minus, Trash2, PartyPopper } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { G, btn, card, inp } from "@/lib/nexgo-theme";
import { STitle, Spinner } from "@/components/nexgo/SharedUI";
import { toast } from "@/components/nexgo/ToastContainer";
import { initializeKorapayPayment } from "@/lib/korapay.functions";

export function Checkout({ cart, setCart, wallet, onBack, onDone, restaurantId }: any) {
  const { user, refreshWallet } = useAuth();
  const initPay = useServerFn(initializeKorapayPayment);
  const [pay, setPay] = useState("wallet");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone_] = useState(false);
  const placedRef = useRef(false);
  const lastOrderRef = useRef(0);
  const fee = 150;
  const subtotal = cart.reduce((a: number, c: any) => a + c.price * c.qty, 0);
  const total = subtotal + fee;

  const inc = (id: string) => setCart((p: any) => p.map((c: any) => c.id === id ? { ...c, qty: c.qty + 1 } : c));
  const dec = (id: string) => setCart((p: any) => p.map((c: any) => c.id === id ? { ...c, qty: c.qty - 1 } : c).filter((c: any) => c.qty > 0));
  const remove = (id: string) => setCart((p: any) => p.filter((c: any) => c.id !== id));

  const place = async () => {
    if (!user) return;
    if (placedRef.current) return;
    if (cart.length === 0) { toast("Your cart is empty", "error"); return; }
    const now = Date.now();
    if (now - lastOrderRef.current < 60000) { toast("Please wait before placing another order", "error"); return; }
    placedRef.current = true;
    if (!address) { toast("Please enter delivery address", "error"); placedRef.current = false; return; }
    if (pay === "wallet" && wallet < total) { toast("Insufficient wallet balance", "error"); placedRef.current = false; return; }
    lastOrderRef.current = now;
    setLoading(true);

    const orderNum = "NX-" + Date.now().toString(36).toUpperCase();

    if (pay === "wallet") {
      const { data: deductResult } = await supabase.rpc("deduct_wallet", { _user_id: user.id, _amount: total, _label: `NexChow ${orderNum}`, _icon: "🍽️" });
      const dr = deductResult as any;
      if (!dr?.success) { toast(dr?.message || "Wallet deduction failed", "error"); setLoading(false); placedRef.current = false; return; }
      refreshWallet();
    }

    let payRef: string | null = null;
    if (pay === "transfer") {
      try {
        const res = await initPay({ data: { amount: total, purpose: "order" } });
        if (!res?.checkout_url) { toast("Payment failed to initialize", "error"); setLoading(false); placedRef.current = false; return; }
        payRef = res.reference;
        window.open(res.checkout_url, "_blank");
        toast("Complete payment in the new tab", "info");
      } catch (e: any) {
        toast(e?.message || "Payment failed to initialize", "error"); setLoading(false); placedRef.current = false; return;
      }
    }

    const { data: order, error } = await supabase.from("orders").insert({
      order_number: orderNum,
      student_id: user.id,
      restaurant_id: restaurantId,
      total_amount: total,
      delivery_fee: fee,
      delivery_address: address,
      payment_method: pay,
      payment_reference: payRef,
      status: "Pending",
    }).select().single();

    if (error) { toast("Failed to place order: " + error.message, "error"); setLoading(false); placedRef.current = false; return; }

    const items = cart.map((c: any) => ({
      order_id: order.id,
      menu_item_id: c.id,
      name: c.name,
      price: c.price,
      quantity: c.qty,
    }));
    await supabase.from("order_items").insert(items);

    setLoading(false); setDone_(true); setCart([]);
    setTimeout(onDone, 2500);
  };

  if (done) return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
      <div style={{ width: 110, height: 110, borderRadius: "50%", background: `radial-gradient(circle,${G.goldGlow},transparent 70%)`, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeUp .4s ease" }}>
        <PartyPopper size={64} color={G.gold} strokeWidth={1.5} />
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 36, fontWeight: 700, color: G.gold, textAlign: "center" }}>Order Placed</div>
      <div style={{ color: G.whiteDim, textAlign: "center", fontSize: 14, maxWidth: 260 }}>Your food is being prepared. Estimated delivery: 25 minutes.</div>
    </div>
  );

  return (
    <div style={{ animation: "fadeUp .4s ease", maxWidth: 800, margin: "0 auto", width: "100%", paddingBottom: 110 }}>
      {/* Sticky top CTA */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: `linear-gradient(180deg, ${G.black} 0%, ${G.black} 85%, transparent 100%)`, padding: "14px 16px 18px", backdropFilter: "blur(10px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <button onClick={onBack} aria-label="Back" style={{ width: 38, height: 38, borderRadius: 12, background: G.b3, border: `1px solid ${G.b5}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={18} color={G.white} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: G.whiteDim, letterSpacing: ".14em", textTransform: "uppercase" }}>Checkout</div>
            <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 22, fontWeight: 700, color: G.white, lineHeight: 1.1 }}>Review & Pay</div>
          </div>
        </div>
        <button onClick={place} disabled={loading || cart.length === 0} style={{ ...btn("gold", { width: "100%", padding: "15px", borderRadius: 14, fontSize: 14, opacity: (loading || cart.length === 0) ? .55 : 1, boxShadow: `0 10px 30px rgba(201,168,76,0.35)`, letterSpacing: ".04em" }) }}>
          {loading ? <><Spinner /> Placing…</> : <><ShoppingBag size={16} /> Place Order · ₦{total.toLocaleString()}</>}
        </button>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Order items with qty controls */}
        <div style={card()}>
          <STitle>Your Cart</STitle>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {cart.length === 0 && <div style={{ color: G.whiteDim, fontSize: 13, textAlign: "center", padding: "16px 0" }}>Cart is empty</div>}
            {cart.map((item: any) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${G.b5}` }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: G.b4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{item.image || "🍽️"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: G.white, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                  <div style={{ color: G.gold, fontFamily: "'DM Mono'", fontSize: 12, marginTop: 2 }}>₦{(item.price * item.qty).toLocaleString()}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => dec(item.id)} aria-label="Decrease" style={qtyBtn(G)}><Minus size={13} color={G.white} /></button>
                  <span style={{ minWidth: 18, textAlign: "center", color: G.gold, fontWeight: 700, fontFamily: "'DM Mono'", fontSize: 13 }}>{item.qty}</span>
                  <button onClick={() => inc(item.id)} aria-label="Increase" style={qtyBtn(G, true)}><Plus size={13} color={G.black} /></button>
                  <button onClick={() => remove(item.id)} aria-label="Remove" style={{ ...qtyBtn(G), borderColor: `${G.danger}55`, marginLeft: 4 }}><Trash2 size={13} color={G.danger} /></button>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", fontSize: 13 }}>
              <span style={{ color: G.whiteDim }}>Subtotal</span>
              <span style={{ color: G.white, fontFamily: "'DM Mono'" }}>₦{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: G.whiteDim }}>Delivery</span>
              <span style={{ color: G.white, fontFamily: "'DM Mono'" }}>₦{fee.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: `1px dashed ${G.b5}` }}>
              <span style={{ fontWeight: 700, color: G.white }}>Total</span>
              <span style={{ fontWeight: 700, color: G.gold, fontFamily: "'DM Mono'", fontSize: 18 }}>₦{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Address */}
        <div style={card()}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={16} color={G.gold} />
            <STitle>Delivery Address</STitle>
          </div>
          <input style={{ ...inp({ marginTop: 12 }) }} value={address} onChange={e => setAddress(e.target.value)} placeholder="Hall, room number, landmark…" />
        </div>

        {/* Payment */}
        <div style={card()}>
          <STitle>Payment Method</STitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {[
              { id: "wallet", label: "NexGo Wallet", sub: `Balance: ₦${wallet.toLocaleString()}`, Icon: Wallet },
              { id: "transfer", label: "Bank Transfer", sub: "Pay via your bank app", Icon: Landmark },
            ].map((m: any) => {
              const active = pay === m.id;
              return (
                <div key={m.id} onClick={() => setPay(m.id)} style={{ padding: 14, borderRadius: 12, border: `1.5px solid ${active ? G.gold : G.b5}`, background: active ? G.goldGlow : G.b4, cursor: "pointer", display: "flex", gap: 12, alignItems: "center", transition: "all .2s" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: active ? `linear-gradient(135deg,${G.gold},${G.goldDark})` : G.b3, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${active ? "transparent" : G.b5}` }}>
                    <m.Icon size={18} color={active ? G.black : G.gold} strokeWidth={1.8} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: G.white, fontSize: 14 }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: G.whiteDim }}>{m.sub}</div>
                  </div>
                  {active && <Check size={18} color={G.gold} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const qtyBtn = (G: any, primary = false): any => ({
  width: 28, height: 28, borderRadius: 8,
  background: primary ? `linear-gradient(135deg,${G.gold},${G.goldDark})` : G.b4,
  border: `1px solid ${primary ? "transparent" : G.b5}`,
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
});
