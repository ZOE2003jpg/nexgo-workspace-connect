import { useState } from "react";
import { User, Lock, FileText, LogOut, Pencil, ChevronRight, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { G, btn, card, inp } from "@/lib/nexgo-theme";
import { STitle, Lbl, Spinner } from "@/components/nexgo/SharedUI";
import { toast } from "@/components/nexgo/ToastContainer";

export function ProfileScreen({ onLogout, setTab }: any) {
  const { user, profile, role, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async () => {
    if (!user || !editName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: editName.trim() }).eq("id", user.id);
    setSaving(false);
    if (error) { toast("Failed to update profile", "error"); return; }
    await refreshProfile();
    toast("Profile updated!", "success");
    setEditing(false);
  };

  const changePassword = async () => {
    if (!newPw || newPw.length < 6) { toast("Password must be at least 6 characters", "error"); return; }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSavingPw(false);
    if (error) { toast(error.message, "error"); return; }
    toast("Password updated!", "success");
    setChangingPw(false);
    setNewPw("");
  };

  const Row = ({ Icon, label, sub, onClick, danger }: any) => (
    <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: G.b3, border: `1px solid ${G.b5}`, borderRadius: 14, cursor: "pointer", textAlign: "left" }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: danger ? `${G.danger}22` : `linear-gradient(135deg,${G.goldGlow},transparent)`, border: `1px solid ${danger ? `${G.danger}55` : G.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={19} color={danger ? G.danger : G.gold} strokeWidth={1.7} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: danger ? G.danger : G.white }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: G.whiteDim, marginTop: 2 }}>{sub}</div>}
      </div>
      <ChevronRight size={18} color={G.whiteDim} />
    </button>
  );

  return (
    <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .4s ease", maxWidth: 800, margin: "0 auto", width: "100%" }}>
      <div style={{ textAlign: "center", paddingTop: 10 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg,${G.goldDark},${G.gold})`, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 700, color: G.black }}>{profile?.full_name?.[0] || "?"}</div>
        <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 28, fontWeight: 700, color: G.white }}>{profile?.full_name}</div>
        <div style={{ color: G.gold, fontSize: 12, marginTop: 4, fontFamily: "'DM Mono'", textTransform: "capitalize" }}>{role}</div>
        <div style={{ color: G.whiteDim, fontSize: 12, marginTop: 2 }}>{profile?.email || user?.email}</div>
      </div>

      {/* Edit Profile */}
      <div style={card()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <STitle>Edit Profile</STitle>
          {!editing && (
            <button onClick={() => { setEditing(true); setEditName(profile?.full_name || ""); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: G.gold, fontSize: 13, cursor: "pointer", fontWeight: 600, background: "transparent", border: "none" }}>
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>
        {editing ? (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            <Lbl>Full Name</Lbl>
            <input style={inp()} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveProfile} disabled={saving} style={{ ...btn("gold", { flex: 1, padding: "12px" }) }}>
                {saving ? <Spinner size={14} /> : "Save"}
              </button>
              <button onClick={() => setEditing(false)} style={{ ...btn("ghost", { padding: "12px 16px" }) }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 12, fontSize: 14, color: G.whiteDim }}>{profile?.full_name}</div>
        )}
      </div>

      {/* Quick actions list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {setTab && <Row Icon={FileText} label="How NexGo works & Terms" sub="Why we collect payment, refunds, ToS" onClick={() => setTab("legal")} />}
        {setTab && <Row Icon={MessageCircle} label="Contact Support" sub="Chat with our team" onClick={() => setTab("chat")} />}
        <Row Icon={Lock} label="Change Password" sub="Keep your account secure" onClick={() => setChangingPw(p => !p)} />
        <Row Icon={LogOut} label="Sign Out" sub="Log out of NexGo" onClick={onLogout} danger />
      </div>

      {changingPw && (
        <div style={card()}>
          <STitle>New Password</STitle>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            <input style={inp()} type="password" placeholder="Min 6 characters" value={newPw} onChange={e => setNewPw(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={changePassword} disabled={savingPw} style={{ ...btn("gold", { flex: 1, padding: "12px" }) }}>
                {savingPw ? <Spinner size={14} /> : "Update Password"}
              </button>
              <button onClick={() => { setChangingPw(false); setNewPw(""); }} style={{ ...btn("ghost", { padding: "12px 16px" }) }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
