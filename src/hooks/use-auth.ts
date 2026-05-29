import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "vendor" | "rider" | "student" | "school";

export interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const loadRole = async (userId: string): Promise<AppRole | null> => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      return (data?.role as AppRole) ?? null;
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState((s) => ({ ...s, session, user: session?.user ?? null, loading: false }));
      if (session?.user) {
        // Defer to avoid deadlocks inside the auth callback
        setTimeout(() => {
          void loadRole(session.user.id).then((role) => {
            if (mounted) setState((s) => ({ ...s, role }));
          });
        }, 0);
      } else {
        setState((s) => ({ ...s, role: null }));
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const session = data.session;
      setState((s) => ({ ...s, session, user: session?.user ?? null, loading: false }));
      if (session?.user) {
        void loadRole(session.user.id).then((role) => {
          if (mounted) setState((s) => ({ ...s, role }));
        });
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}
