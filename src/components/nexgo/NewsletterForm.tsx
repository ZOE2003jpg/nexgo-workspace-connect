import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { G, btn, inp } from "@/lib/nexgo-theme";
import { toast } from "@/components/nexgo/ToastContainer";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) { toast("Enter a valid email", "error"); return; }
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email, subscribed: true });
    setLoading(false);
    if (error && !/duplicate|unique/i.test(error.message)) { toast(error.message, "error"); return; }
    toast("You're subscribed! 🎉", "success");
    setEmail("");
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 8, maxWidth: 460, margin: "0 auto", width: "100%" }}>
      <input
        type="email"
        required
        placeholder="you@university.edu.ng"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ ...inp({ flex: 1, margin: 0 }) }}
      />
      <button type="submit" disabled={loading} style={{ ...btn("gold", { padding: "12px 20px", opacity: loading ? 0.6 : 1 }) }}>
        {loading ? "…" : "Subscribe"}
      </button>
    </form>
  );
}

NewsletterForm.G = G;
