import { useState, useEffect } from "react";
import { ShoppingBag, Search, Star, Clock, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { G, btn, card, inp } from "@/lib/nexgo-theme";
import { Chip } from "@/components/nexgo/SharedUI";

export function NexChow({ onSelect, cart, onCheckout }: any) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [restaurants, setRestaurants] = useState<any[]>([]);

  useEffect(() => {
    const fetchRestaurants = () => {
      supabase.from("restaurants").select("*").order("rating", { ascending: false })
        .then(({ data }) => { if (data) setRestaurants(data); });
    };
    fetchRestaurants();

    // Real-time restaurant updates
    const channel = supabase.channel('restaurants-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => { fetchRestaurants(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const total = cart.reduce((a: number, c: any) => a + c.price * c.qty, 0);
  const qty = cart.reduce((a: number, c: any) => a + c.qty, 0);
  const CATEGORIES = [
    { id: "All", label: "All" },
    { id: "food", label: "Food" },
    { id: "market", label: "Market" },
    { id: "supermarket", label: "Supermarket" },
    { id: "retail", label: "Retail" },
    { id: "container", label: "Container" },
  ];
  const list = restaurants.filter((r: any) => {
    const ms = r.name.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "All" || r.category === filter;
    return ms && mf;
  });

  return (
    <div style={{ padding: "24px 16px", animation: "fadeUp .4s ease", maxWidth: 800, margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${G.goldGlow},transparent)`, border: `1px solid ${G.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShoppingBag size={22} color={G.gold} strokeWidth={1.7} />
        </div>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 26, fontWeight: 700, color: G.white, lineHeight: 1.1 }}>NexShop</div>
          <div style={{ color: G.whiteDim, fontSize: 12 }}>Food, markets, retail & more</div>
        </div>
      </div>
      <div style={{ position: "relative", marginTop: 16, marginBottom: 14 }}>
        <Search size={16} color={G.whiteDim} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input style={{ ...inp({ paddingLeft: 40 }) }} placeholder="Search vendors…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setFilter(c.id)} style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: filter === c.id ? G.goldGlow : G.b4, color: filter === c.id ? G.gold : G.whiteDim, border: `1px solid ${filter === c.id ? G.gold : G.b5}`, cursor: "pointer", transition: "all .2s" }}>{c.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: qty > 0 ? 80 : 0 }}>
        {list.map((r: any) => (
          <div key={r.id} onClick={() => r.is_open ? onSelect(r) : null} className={r.is_open ? "hover-gold" : ""} style={{ ...card({ cursor: r.is_open ? "pointer" : "default", display: "flex", gap: 14, alignItems: "center", transition: "all .2s", opacity: r.is_open ? 1 : 0.5 }) }}>
            <div style={{ width: 66, height: 66, borderRadius: 14, background: G.b4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, flexShrink: 0 }}>{r.image}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, color: G.white, fontSize: 15 }}>{r.name}</div>
                {!r.is_open ? <Chip>Closed</Chip> : r.tag ? <Chip>{r.tag}</Chip> : null}
              </div>
              <div style={{ fontSize: 12, color: G.whiteDim, marginTop: 3 }}>{r.cuisine} · {r.price_range || ""}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12, color: G.whiteDim, alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Star size={12} color={G.gold} fill={G.gold} /> {r.rating}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {r.delivery_time}</span>
              </div>
            </div>
          </div>
        ))}
        {list.length === 0 && <div style={{ ...card(), textAlign: "center", color: G.whiteDim }}>No restaurants found</div>}
      </div>
      {qty > 0 && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 500, zIndex: 90 }}>
          <button onClick={onCheckout} style={{ ...btn("gold", { width: "100%", padding: "16px", borderRadius: 14, fontSize: 15, justifyContent: "space-between", boxShadow: `0 8px 24px rgba(201,168,76,0.35)`, gap: 0 }) }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><ShoppingCart size={16} /> {qty} item{qty !== 1 ? "s" : ""}</span>
            <span>Cart · ₦{total.toLocaleString()}</span>
          </button>
        </div>
      )}
    </div>
  );
}
