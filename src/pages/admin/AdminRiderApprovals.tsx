import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { G, btn, card } from "@/lib/nexgo-theme";
import { STitle, Spinner } from "@/components/nexgo/SharedUI";
import { toast } from "@/components/nexgo/ToastContainer";

export function AdminRiderApprovals() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("rider_profiles")
      .select("user_id, approved, full_name, phone, vehicle, created_at")
      .order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const decide = async (riderId: string, approved: boolean) => {
    if (!user) return;
    setBusy(riderId);
    const { data, error } = await supabase.rpc("admin_set_rider_approval", { _admin_id: user.id, _rider_id: riderId, _approved: approved });
    setBusy(null);
    const d = data as any;
    if (error || !d?.success) { toast(error?.message || d?.message || "Failed", "error"); return; }
    toast(approved ? "Approved" : "Revoked", "success");
    fetchRows();
  };

  return (
    <div style={{ padding: "24px 16px", maxWidth: 900, margin: "0 auto" }}>
      <STitle>Rider Approvals</STitle>
      {loading && <div style={{ padding: 40, textAlign: "center" }}><Spinner /></div>}
      {!loading && rows.length === 0 && <div style={{ color: G.whiteDim, textAlign: "center", padding: 40 }}>No rider applications yet.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        {rows.map(r => (
          <div key={r.user_id} style={card()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: G.white, fontWeight: 600 }}>{r.full_name || "(no name)"}</div>
                <div style={{ color: G.whiteDim, fontSize: 12, marginTop: 2 }}>{r.phone || "—"} · {r.vehicle || "—"}</div>
                <div style={{ color: G.whiteDim, fontSize: 11, marginTop: 4 }}>{new Date(r.created_at).toLocaleString()}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 10, background: r.approved ? `${G.success}22` : `${G.danger}22`, color: r.approved ? G.success : G.danger, fontWeight: 700 }}>
                  {r.approved ? "Approved" : "Pending"}
                </span>
                {!r.approved && (
                  <button disabled={busy === r.user_id} onClick={() => decide(r.user_id, true)} style={{ ...btn("gold", { padding: "6px 12px", fontSize: 12 }) }}>Approve</button>
                )}
                {r.approved && (
                  <button disabled={busy === r.user_id} onClick={() => decide(r.user_id, false)} style={{ ...btn("outline", { padding: "6px 12px", fontSize: 12 }) }}>Revoke</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
