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
  rolesLoading: boolean;
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
  rolesLoading: true,
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
  const [rolesLoading, setRolesLoading] = useState(true);

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
      setRolesLoading(false);
      return;
    }

    setRolesLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const roles = data?.map((r) => r.role) ?? [];
        setIsAdmin(roles.includes("admin"));
        setIsCoach(roles.includes("coach") || roles.includes("admin"));
        setIsPlayer(roles.includes("player") || roles.includes("coach") || roles.includes("admin"));
        setIsTreasurer(roles.includes("treasurer") || roles.includes("admin"));
        setRolesLoading(false);
      });
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isCoach, isPlayer, isAdmin, isTreasurer, rolesLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
