import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { G, btn, card, inp } from "@/lib/nexgo-theme";
import { STitle, Spinner } from "@/components/nexgo/SharedUI";
import { toast } from "@/components/nexgo/ToastContainer";

type Status = "loading" | "missing" | "pending" | "approved";

export function RiderOnboarding({ onApproved }: { onApproved: () => void }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasDoc, setHasDoc] = useState(false);

  const check = async () => {
    if (!user) return;
    const [{ data: rp }, { data: docs }] = await Promise.all([
      supabase.from("rider_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("rider_documents").select("id").eq("rider_id", user.id).limit(1),
    ]);
    if (rp) {
      setFullName(rp.full_name || "");
      setPhone(rp.phone || "");
      setVehicle(rp.vehicle || "");
      setHasDoc((docs?.length ?? 0) > 0);
      if (rp.approved) { setStatus("approved"); onApproved(); return; }
      setStatus(rp.full_name && (docs?.length ?? 0) > 0 ? "pending" : "missing");
    } else {
      setStatus("missing");
    }
  };

  useEffect(() => { check(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const save = async () => {
    if (!user) return;
    if (!fullName.trim() || !phone.trim() || !vehicle.trim()) { toast("Fill all fields", "error"); return; }
    if (!file && !hasDoc) { toast("Upload at least one document", "error"); return; }
    setSaving(true);
    const { error: upErr } = await supabase.from("rider_profiles").upsert({
      user_id: user.id, full_name: fullName, phone, vehicle,
    }, { onConflict: "user_id" });
    if (upErr) { toast(upErr.message, "error"); setSaving(false); return; }

    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: stErr } = await supabase.storage.from("rider-docs").upload(path, file);
      if (stErr) { toast(stErr.message, "error"); setSaving(false); return; }
      const { error: dErr } = await supabase.from("rider_documents").insert({
        rider_id: user.id, doc_type: "identity", file_path: path, status: "pending",
      });
      if (dErr) { toast(dErr.message, "error"); setSaving(false); return; }
    }
    toast("Submitted! Awaiting admin approval.", "success");
    setSaving(false);
    check();
  };

  if (status === "loading") return <div style={{ padding: 40, textAlign: "center" }}><Spinner /></div>;
  if (status === "approved") return null;

  return (
    <div style={{ padding: "24px 16px", maxWidth: 600, margin: "0 auto", animation: "fadeUp .4s ease" }}>
      <div style={{ ...card(), marginBottom: 16 }}>
        <STitle>Rider Onboarding</STitle>
        <div style={{ color: G.whiteDim, fontSize: 13, marginTop: 6 }}>
          {status === "pending"
            ? "Your application is under review. You'll be able to accept deliveries once approved."
            : "Complete your profile and upload an identity document to start accepting deliveries."}
        </div>
      </div>

      <div style={{ ...card() }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: G.whiteDim, marginBottom: 6 }}>Full name</div>
            <input style={inp()} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full legal name" disabled={status === "pending"} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: G.whiteDim, marginBottom: 6 }}>Phone</div>
            <input style={inp()} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234…" disabled={status === "pending"} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: G.whiteDim, marginBottom: 6 }}>Vehicle</div>
            <input style={inp()} value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="e.g. Bajaj 150" disabled={status === "pending"} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: G.whiteDim, marginBottom: 6 }}>Identity document {hasDoc && <span style={{ color: G.success }}>✓ uploaded</span>}</div>
            <input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} disabled={status === "pending"} style={{ color: G.white }} />
          </div>
          {status !== "pending" && (
            <button onClick={save} disabled={saving} style={{ ...btn("gold", { padding: 14, width: "100%", opacity: saving ? 0.6 : 1 }) }}>
              {saving ? <Spinner /> : "Submit for approval"}
            </button>
          )}
          {status === "pending" && (
            <div style={{ padding: 12, borderRadius: 10, background: G.goldGlow, border: `1px solid ${G.goldBorder}`, color: G.white, fontSize: 13, textAlign: "center" }}>
              ⏳ Pending admin review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
