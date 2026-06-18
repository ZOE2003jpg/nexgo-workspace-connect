import { useAuth } from "@/hooks/useAuth";
import { G, btn, card } from "@/lib/nexgo-theme";

const STATUS_INFO: Record<string, { icon: string; title: string; msg: string; color: string }> = {
  pending: {
    icon: "⏳",
    title: "Account Pending Approval",
    msg: "Your account has been created and is awaiting review by an administrator. You'll be able to access NexGo once approved. This usually takes less than 24 hours.",
    color: G.gold,
  },
  rejected: {
    icon: "🚫",
    title: "Account Not Approved",
    msg: "Unfortunately, your account application was not approved. If you believe this is an error, please contact NexGo support.",
    color: G.danger,
  },
  suspended: {
    icon: "⛔",
    title: "Account Suspended",
    msg: "Your account has been suspended. Please contact NexGo support for more information on how to restore access.",
    color: G.danger,
  },
};

export function AccountStatusGate({ children }: { children: React.ReactNode }) {
  const { profile, role, signOut } = useAuth();

  // Admins bypass status checks
  if (role === "admin") return <>{children}</>;
  // Profile may still be loading
  if (!profile) return <>{children}</>;
  const status = profile.status || "pending";
  if (status === "approved") return <>{children}</>;

  const info = STATUS_INFO[status] || STATUS_INFO.pending;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: G.black }}>
      <div style={card({ maxWidth: 460, width: "100%", padding: 32, border: `1px solid ${info.color}55`, textAlign: "center" })}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{info.icon}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: info.color, marginBottom: 10 }}>{info.title}</div>
        <div style={{ fontSize: 14, color: G.whiteDim, lineHeight: 1.55, marginBottom: 22 }}>{info.msg}</div>
        <div style={{ fontSize: 12, color: G.whiteDim, marginBottom: 18, fontFamily: "'DM Mono'" }}>
          Status: <span style={{ color: info.color, textTransform: "uppercase" }}>{status}</span>
        </div>
        <button onClick={() => signOut()} style={{ ...btn("ghost"), width: "100%" }}>Sign Out</button>
      </div>
    </div>
  );
}
