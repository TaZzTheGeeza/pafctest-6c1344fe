import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ShieldX, Loader2 } from "lucide-react";

interface Props {
  children: ReactNode;
  requiredRole: "player" | "coach" | "admin" | "treasurer" | "news_editor" | "authenticated";
  redirectTo?: string;
}

// 🔧 DEV BYPASS — set to false before publishing!
const DEV_BYPASS = false;

export function RoleGate({ children, requiredRole, redirectTo = "/auth" }: Props) {
  const { user, loading, isPlayer, isCoach, isAdmin, isTreasurer, isNewsEditor, rolesLoading } = useAuth();

  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname.includes("lovable.app") || window.location.hostname.includes("lovableproject.com");

  if (DEV_BYPASS && isLocalhost) {
    return <>{children}</>;
  }

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`${redirectTo}?redirect=${window.location.pathname}`} replace />;
  }

  const hasAccess =
    requiredRole === "authenticated" ? true :
    requiredRole === "admin" ? isAdmin :
    requiredRole === "coach" ? (isCoach || isAdmin || isTreasurer) :
    requiredRole === "treasurer" ? (isTreasurer || isAdmin) :
    isPlayer;

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center px-4">
            <ShieldX className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">Access Restricted</h1>
            <p className="text-muted-foreground max-w-md">
              This area is only available to registered players. Please contact a club admin to request access.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return <>{children}</>;
}
