import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { G, card } from "@/lib/nexgo-theme";
import { PHeader, Spinner } from "@/components/nexgo/SharedUI";

export function SchoolApp() {
  const [stats, setStats] = useState<{ orders: number; dispatches: number; trips: number; vendors: number } | null>(null);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const [o, d, t, v] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("dispatches").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("trip_bookings").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("restaurants").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        orders: o.count ?? 0,
        dispatches: d.count ?? 0,
        trips: t.count ?? 0,
        vendors: v.count ?? 0,
      });
    })();
  }, []);

  return (
    <div style={{ padding: "24px 16px", maxWidth: 1000, margin: "0 auto" }}>
      <PHeader title="School Dashboard" sub="Last 7 days · read-only" icon="🏫" />
      {!stats && <div style={{ padding: 40, textAlign: "center" }}><Spinner /></div>}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 18 }}>
          {[
            { l: "Food orders", v: stats.orders, i: "🍽️" },
            { l: "Dispatches", v: stats.dispatches, i: "📦" },
            { l: "Trip bookings", v: stats.trips, i: "🚌" },
            { l: "Vendors", v: stats.vendors, i: "🏪" },
          ].map(s => (
            <div key={s.l} style={card({ textAlign: "center", padding: 20 })}>
              <div style={{ fontSize: 32 }}>{s.i}</div>
              <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 36, fontWeight: 700, color: G.gold, marginTop: 4 }}>{s.v}</div>
              <div style={{ fontSize: 12, color: G.whiteDim, marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
