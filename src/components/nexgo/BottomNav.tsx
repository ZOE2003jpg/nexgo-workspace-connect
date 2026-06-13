import { useState } from "react";
import { Home, UtensilsCrossed, Wallet, User, Package, Bus, MessageCircle, LayoutDashboard, ListOrdered, BookOpen, BarChart3, Users, Bike, Settings, Building2 } from "lucide-react";
import { G } from "@/lib/nexgo-theme";
import NEXGO_LOGO from "@/assets/nexgo-logo.png";

export function BottomNav({ role, tab, setTab, cartCount }: any) {
  const [showMore, setShowMore] = useState(false);
  const cfg: any = {
    student: {
      left: [{ id: "home", Icon: Home, label: "Home" }, { id: "chow", Icon: UtensilsCrossed, label: "NexChow" }],
      right: [{ id: "wallet", Icon: Wallet, label: "Wallet" }, { id: "profile", Icon: User, label: "Profile" }],
      more: [{ id: "dispatch", Icon: Package, label: "Dispatch" }, { id: "trip", Icon: Bus, label: "NexTrip" }, { id: "chat", Icon: MessageCircle, label: "Support" }],
    },
    vendor: {
      left: [{ id: "dashboard", Icon: LayoutDashboard, label: "Dashboard" }, { id: "orders", Icon: Package, label: "Orders" }],
      right: [{ id: "menu", Icon: BookOpen, label: "Menu" }, { id: "profile", Icon: User, label: "Profile" }],
      more: [{ id: "earnings", Icon: Wallet, label: "Earnings" }, { id: "chat", Icon: MessageCircle, label: "Support" }],
    },
    rider: {
      left: [{ id: "rdashboard", Icon: LayoutDashboard, label: "Dashboard" }, { id: "deliveries", Icon: Bike, label: "Active" }],
      right: [{ id: "earnings", Icon: Wallet, label: "Earnings" }, { id: "profile", Icon: User, label: "Profile" }],
      more: [{ id: "chat", Icon: MessageCircle, label: "Support" }],
    },
    admin: {
      left: [{ id: "adashboard", Icon: LayoutDashboard, label: "Dashboard" }, { id: "users", Icon: Users, label: "Users" }],
      right: [{ id: "riders", Icon: Bike, label: "Riders" }, { id: "profile", Icon: User, label: "Profile" }],
      more: [{ id: "restaurants", Icon: UtensilsCrossed, label: "Restaurants" }, { id: "orders", Icon: ListOrdered, label: "Orders" }, { id: "settings", Icon: Settings, label: "Settings" }, { id: "analytics", Icon: BarChart3, label: "Analytics" }],
    },
    school: {
      left: [{ id: "sdashboard", Icon: Building2, label: "Dashboard" }],
      right: [{ id: "profile", Icon: User, label: "Profile" }],
      more: [],
    },
  }[role as "student" | "vendor" | "rider" | "admin" | "school"] || { left: [], right: [], more: [] };

  const NavBtn = ({ t }: any) => {
    const active = t.id === tab;
    return (
      <button onClick={() => { setTab(t.id); setShowMore(false); }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 2px", background: "transparent", border: "none", cursor: "pointer", position: "relative" }}>
        <div style={{ filter: active ? `drop-shadow(0 0 6px ${G.gold})` : "none", transition: "filter .2s" }}>
          <t.Icon size={20} color={active ? G.gold : G.whiteDim} strokeWidth={active ? 2.2 : 1.6} />
        </div>
        {t.id === "chow" && cartCount > 0 && <div style={{ position: "absolute", top: 0, right: "14%", minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8, background: G.gold, color: G.black, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</div>}
        <div style={{ fontSize: 10, fontWeight: 600, color: active ? G.gold : G.whiteDim, transition: "color .2s" }}>{t.label}</div>
        {active && <div style={{ position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)", width: 18, height: 2, background: G.gold, borderRadius: 1 }} />}
      </button>
    );
  };

  return (
    <>
      {showMore && <div onClick={() => setShowMore(false)} style={{ position: "fixed", inset: 0, zIndex: 98, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} />}
      {showMore && cfg.more.length > 0 && (
        <div style={{ position: "fixed", bottom: 82, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 500, background: G.b3, border: `1px solid ${G.goldBorder}`, borderRadius: 20, zIndex: 99, padding: "18px 14px 14px", boxShadow: "0 -8px 40px rgba(0,0,0,0.8)", animation: "popUp .28s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: G.whiteDim, textAlign: "center", marginBottom: 14 }}>More Services</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(cfg.more.length, 3)},1fr)`, gap: 10 }}>
            {cfg.more.map((t: any) => {
              const active = t.id === tab;
              return (
                <button key={t.id} onClick={() => { setTab(t.id); setShowMore(false); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: active ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${active ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, padding: "14px 8px", cursor: "pointer", transition: "all .2s" }}>
                  <t.Icon size={24} color={active ? G.gold : G.whiteDim} strokeWidth={1.7} />
                  <div style={{ fontSize: 10, fontWeight: 600, color: active ? G.gold : G.whiteDim, textAlign: "center", letterSpacing: "0.04em", textTransform: "uppercase" }}>{t.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: G.b2, borderTop: `1px solid rgba(201,168,76,0.2)`, display: "flex", alignItems: "center", padding: "8px 4px 14px", zIndex: 100 }}>
        {cfg.left.map((t: any) => <NavBtn key={t.id} t={t} />)}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", marginTop: -24 }} onClick={() => setShowMore((p: boolean) => !p)}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${G.goldDark},${G.gold},${G.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 -4px 20px rgba(201,168,76,0.5),0 4px 16px rgba(0,0,0,0.6)`, border: `3px solid ${G.b2}`, transition: "transform .28s cubic-bezier(0.34,1.56,0.64,1)", transform: showMore ? "rotate(45deg) scale(1.08)" : "rotate(0deg) scale(1)" }}>
            <img src={NEXGO_LOGO} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: G.gold, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>{showMore ? "Close" : "Menu"}</div>
        </div>
        {cfg.right.map((t: any) => <NavBtn key={t.id} t={t} />)}
      </div>
    </>
  );
}
