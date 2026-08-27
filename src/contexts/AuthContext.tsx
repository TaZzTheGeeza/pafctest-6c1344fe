import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isCoach: boolean;
  isPlayer: boolean;
  isAdmin: boolean;
  isTreasurer: boolean;
  isNewsEditor: boolean;
  isPhotographer: boolean;
  rolesLoading: boolean;
  mustChangePassword: boolean;
  clearMustChangePassword: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isCoach: false,
  isPlayer: false,
  isAdmin: false,
  isTreasurer: false,
  isNewsEditor: false,
  isPhotographer: false,
  rolesLoading: true,
  mustChangePassword: false,
  clearMustChangePassword: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const [isPlayer, setIsPlayer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTreasurer, setIsTreasurer] = useState(false);
  const [isNewsEditor, setIsNewsEditor] = useState(false);
  const [isPhotographer, setIsPhotographer] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setIsCoach(false);
      setIsPlayer(false);
      setIsAdmin(false);
      setIsTreasurer(false);
      setIsNewsEditor(false);
      setIsPhotographer(false);
      setRolesLoading(false);
      setMustChangePassword(false);
      return;
    }

    let cancelled = false;
    setRolesLoading(true);

    // Safety net: never leave the app stuck on a loading spinner if the roles
    // request hangs (flaky mobile networks / slow backend).
    const rolesTimeout = setTimeout(() => {
      if (!cancelled) setRolesLoading(false);
    }, 8000);

    async function loadRoles() {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (cancelled) return;
      if (error) {
        console.error("Unable to load user roles", error);
        setRolesLoading(false);
        return;
      }

      const roles = data?.map((r) => r.role) ?? [];
        setIsAdmin(roles.includes("admin"));
        setIsCoach(roles.includes("coach") || roles.includes("admin"));
        setIsPlayer(roles.includes("player") || roles.includes("coach") || roles.includes("admin"));
        setIsTreasurer(roles.includes("treasurer") || roles.includes("admin"));
        setIsNewsEditor(roles.includes("news_editor") || roles.includes("admin"));
        setIsPhotographer(roles.includes("photographer") || roles.includes("admin"));
        setRolesLoading(false);
    }

    void loadRoles().catch((e) => {
      console.error("Roles lookup failed", e);
      if (!cancelled) setRolesLoading(false);
    });


    supabase
      .from("profiles")
      .select("must_change_password")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setMustChangePassword(Boolean((data as any)?.must_change_password));
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const clearMustChangePassword = () => setMustChangePassword(false);

  return (
    <AuthContext.Provider value={{ user, session, loading, isCoach, isPlayer, isAdmin, isTreasurer, isNewsEditor, isPhotographer, rolesLoading, mustChangePassword, clearMustChangePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
