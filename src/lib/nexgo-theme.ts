/**
 * Palette tokens. Values are CSS variables defined in `injectStyles` below
 * so the entire app reacts to light/dark mode without re-rendering.
 *  - "black" = page background (white in light mode, near-black in dark)
 *  - "white" = primary text color (near-black in light mode, cream in dark)
 * Names are kept for backwards compatibility with existing pages.
 */
export const G = {
  gold: "var(--g-gold)",
  goldLight: "var(--g-gold-light)",
  goldDark: "var(--g-gold-dark)",
  goldGlow: "var(--g-gold-glow)",
  goldBorder: "var(--g-gold-border)",
  black: "var(--g-bg)",
  b2: "var(--g-b2)",
  b3: "var(--g-b3)",
  b4: "var(--g-b4)",
  b5: "var(--g-b5)",
  white: "var(--g-text)",
  whiteDim: "var(--g-text-dim)",
  danger: "var(--g-danger)",
  success: "var(--g-success)",
};

export const injectStyles = () => {
  if (document.getElementById("nexgo-styles")) return;
  const s = document.createElement("style");
  s.id = "nexgo-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
    :root{
      --g-gold:#C9A84C; --g-gold-light:#E8C97A; --g-gold-dark:#9A7A2E;
      --g-gold-glow:rgba(201,168,76,0.12); --g-gold-border:rgba(201,168,76,0.3);
      --g-bg:#FAFAF7; --g-b2:#F2EFE8; --g-b3:#FFFFFF; --g-b4:#ECE7DC; --g-b5:#DFD8C7;
      --g-text:#1A1A1A; --g-text-dim:rgba(26,26,26,0.62);
      --g-danger:#D14343; --g-success:#2E9E63;
    }
    html.dark{
      --g-gold:#C9A84C; --g-gold-light:#E8C97A; --g-gold-dark:#9A7A2E;
      --g-gold-glow:rgba(201,168,76,0.15); --g-gold-border:rgba(201,168,76,0.3);
      --g-bg:#0A0A0A; --g-b2:#111111; --g-b3:#1A1A1A; --g-b4:#242424; --g-b5:#2E2E2E;
      --g-text:#F5F0E8; --g-text-dim:rgba(245,240,232,0.55);
      --g-danger:#E05555; --g-success:#4CAF7A;
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html,body,#root{height:100%;background:var(--g-bg);color:var(--g-text);font-family:'DM Sans',sans-serif;transition:background .25s ease,color .25s ease;}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--g-b2)}::-webkit-scrollbar-thumb{background:var(--g-gold-dark);border-radius:2px}
    @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%,100%{opacity:.6}50%{opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes glow{0%,100%{text-shadow:0 0 20px rgba(201,168,76,0.3)}50%{text-shadow:0 0 60px rgba(201,168,76,0.9)}}
    @keyframes popUp{from{opacity:0;transform:translateX(-50%) translateY(24px) scale(0.94)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
    @keyframes slideIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
    input,textarea,select{outline:none;font-family:inherit;}
    button{cursor:pointer;font-family:inherit;border:none;}
    .hover-gold:hover{border-color:rgba(201,168,76,0.4)!important;background:rgba(201,168,76,0.06)!important;}
    .hover-lift:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.4)!important;}
  `;
  document.head.appendChild(s);
};

export const btn = (v = "gold", ex: any = {}) => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  padding: "12px 24px", borderRadius: 10, fontWeight: 600, fontSize: 14,
  letterSpacing: ".03em", cursor: "pointer", border: "none", transition: "all .2s",
  ...(v === "gold" ? { background: `linear-gradient(135deg,${G.gold},${G.goldDark})`, color: G.black } :
    v === "outline" ? { background: "transparent", border: `1.5px solid ${G.gold}`, color: G.gold } :
      { background: G.b4, color: G.white }),
  ...ex,
});

export const card = (ex: any = {}) => ({ background: G.b3, border: `1px solid ${G.b5}`, borderRadius: 16, padding: 20, ...ex });
export const inp = (ex: any = {}) => ({ width: "100%", padding: "13px 16px", background: G.b4, border: `1.5px solid ${G.b5}`, borderRadius: 10, color: G.white, fontSize: 14, ...ex });
