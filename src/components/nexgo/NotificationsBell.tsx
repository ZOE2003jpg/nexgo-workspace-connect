import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { G } from "@/lib/nexgo-theme";

type N = { id: string; type: string; title: string; body: string | null; read_at: string | null; created_at: string };

export function NotificationsBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<N[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchItems = async (uid: string) => {
    const { data } = await supabase.from("notifications").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(20);
    if (data) setItems(data as N[]);
  };

  useEffect(() => {
    if (!user) return;
    fetchItems(user.id);
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => fetchItems(user.id))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const unread = items.filter(i => !i.read_at).length;

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    const ids = items.filter(i => !i.read_at).map(i => i.id);
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
  };

  if (!user) return null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) setTimeout(markAllRead, 1500); }}
        aria-label="Notifications"
        style={{ width: 40, height: 40, borderRadius: 20, background: G.b3, border: `1px solid ${G.b5}`, color: G.white, fontSize: 18, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        🔔
        {unread > 0 && (
          <span style={{ position: "absolute", top: -2, right: -2, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9, background: G.danger, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", top: 48, right: 0, width: 320, maxHeight: 420, overflowY: "auto", background: G.b3, border: `1px solid ${G.goldBorder}`, borderRadius: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.5)", zIndex: 150 }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${G.b4}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ color: G.white, fontSize: 14 }}>Notifications</strong>
            <span style={{ fontSize: 11, color: G.whiteDim }}>{items.length} recent</span>
          </div>
          {items.length === 0 && <div style={{ padding: 24, textAlign: "center", color: G.whiteDim, fontSize: 13 }}>You're all caught up.</div>}
          {items.map(n => (
            <div key={n.id} style={{ padding: "12px 14px", borderBottom: `1px solid ${G.b4}`, background: n.read_at ? "transparent" : "rgba(201,168,76,0.06)" }}>
              <div style={{ color: G.white, fontSize: 13, fontWeight: 600 }}>{n.title}</div>
              {n.body && <div style={{ color: G.whiteDim, fontSize: 12, marginTop: 2 }}>{n.body}</div>}
              <div style={{ color: G.whiteDim, fontSize: 10, marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
