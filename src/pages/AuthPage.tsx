import { useState, useEffect, useRef } from "react";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, LogIn, UserPlus, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";

const TEAM_NAMES: Record<string, string> = {
  u6s: "U6", u7s: "U7", "u8s-black": "U8 Black", "u8s-gold": "U8 Gold",
  u9s: "U9", u10s: "U10", "u11s-black": "U11 Black", "u11s-gold": "U11 Gold",
  "u13s-black": "U13 Black", "u13s-gold": "U13 Gold", u14s: "U14",
};

export default function AuthPage() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectTo = searchParams.get("redirect") || "/";
  const [inviteTeamSlug, setInviteTeamSlug] = useState<string | null>(null);
  const inviteToken = searchParams.get("invite");
  const [mode, setMode] = useState<"login" | "signup">(inviteToken ? "signup" : "login");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
  const [processingInvite, setProcessingInvite] = useState(false);
  const inviteProcessed = useRef(false);
  const [inviteTeamName, setInviteTeamName] = useState<string | null>(null);

  // Look up invite details to show team name
  useEffect(() => {
    if (!inviteToken) return;
    supabase
      .from("team_invites" as any)
      .select("team_slug")
      .eq("invite_token", inviteToken)
      .single()
      .then(({ data }) => {
        if (data) {
          const slug = (data as any).team_slug;
          setInviteTeamSlug(slug);
          setInviteTeamName(TEAM_NAMES[slug] || slug);
        }
      });
  }, [inviteToken]);

  // Process invite token when user is authenticated
  useEffect(() => {
    if (!user || !inviteToken || inviteProcessed.current) return;
    inviteProcessed.current = true;
    setProcessingInvite(true);

    supabase.functions
      .invoke("accept-team-invite", { body: { invite_token: inviteToken } })
      .then(({ data, error }) => {
        const teamSlug = data?.team_slug || inviteTeamSlug;
        if (error || !data?.success) {
          const msg = data?.error || error?.message || "Could not process invite";
          if (msg !== "Invalid or expired invite link" && msg !== "You are already a member of this team") {
            toast.error(msg);
          }
        } else {
          const teamLabel = TEAM_NAMES[data.team_slug] || data.team_slug;
          toast.success(`Welcome! You've been added to ${teamLabel} as a ${data.role || "parent"}.`);
        }
        setProcessingInvite(false);
        const dest = teamSlug ? `/hub?tab=chat&team=${teamSlug}` : redirectTo;
        navigate(dest, { replace: true });
      })
      .catch(() => {
        setProcessingInvite(false);
        const dest = inviteTeamSlug ? `/hub?tab=chat&team=${inviteTeamSlug}` : redirectTo;
        navigate(dest, { replace: true });
      });
  }, [user, inviteToken]);

  if (loading || processingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          {processingInvite && <p className="text-sm text-muted-foreground font-display">Setting up your team access…</p>}
        </div>
      </div>
    );
  }

  if (user && !inviteToken) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (mode === "signup" && !form.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    setSubmitting(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      setSubmitting(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account created — you can sign in right away.");
        setMode("login");
        setForm((current) => ({ ...current, password: "" }));
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      setSubmitting(false);
      if (error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto px-4"
        >
          {inviteToken && (
            <div className="mb-4 bg-primary/10 border border-primary/30 rounded-xl p-5 text-center">
              <p className="text-lg font-bold text-primary font-display tracking-wider">
                🎉 You've been invited to join{inviteTeamName ? ` ${inviteTeamName}` : " a team"}!
              </p>
              <p className="text-sm text-foreground mt-2 font-display">
                Peterborough Athletic FC
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {mode === "signup" ? "Create an account" : "Sign in"} below to accept your invite and access your team hub.
              </p>
            </div>
          )}
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              {mode === "login" ? <LogIn className="h-6 w-6 text-primary" /> : <UserPlus className="h-6 w-6 text-primary" />}
              <h1 className="text-2xl font-bold font-display">
                {mode === "login" ? "Sign In" : "Create Account"}
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <input
                      required
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="Your full name"
                      className="w-full bg-secondary border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full bg-secondary border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-secondary border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {mode === "login" && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!form.email) {
                      toast.error("Please enter your email address first");
                      return;
                    }
                    setSubmitting(true);
                    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    setSubmitting(false);
                    if (error) {
                      toast.error(error.message);
                    } else {
                      toast.success("Check your email for a password reset link!");
                    }
                  }}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors text-right w-full"
                >
                  Forgot password?
                </button>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-primary-foreground font-display tracking-wider py-3 rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {submitting ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) toast.error(error.message);
                }}
                className="w-full flex items-center justify-center gap-3 bg-secondary border border-border rounded-lg py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("apple", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) toast.error(error.message);
                }}
                className="w-full flex items-center justify-center gap-3 bg-secondary border border-border rounded-lg py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>

            {mode === "signup" && (
              <p className="mt-4 text-xs text-muted-foreground text-center">
                After signing up, an admin will need to grant you coach access before you can use the Coach Panel.
              </p>
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
