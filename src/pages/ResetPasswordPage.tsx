import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, isPasswordRecovery, clearPasswordRecovery, clearMustChangePassword } = useAuth();
  const forced = params.get("forced") === "1";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [linkError, setLinkError] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    if (hash.has("error") || query.has("error")) {
      setLinkError("This reset link has expired or has already been used. Request a new link below.");
      return;
    }
    const timer = setTimeout(() => {
      if (!cancelled) setLinkError("We couldn't verify this reset link. Request a new link below.");
    }, 10000);
    // getUser waits for URL/session hydration and validates with the auth server.
    // A normal signed-in session can also change its password, with the current
    // password; only a recovery session skips that requirement.
    supabase.auth.getUser().then(({ data, error }) => {
      if (cancelled) return;
      clearTimeout(timer);
      if (error || !data.user) {
        setLinkError("This reset link has expired or has already been used. Request a new link below.");
        return;
      }
      setLinkError("");
      setReady(true);
    }).catch(() => {
      if (!cancelled) {
        clearTimeout(timer);
        setLinkError("We couldn't verify this reset link. Request a new link below.");
      }
    });
    return () => { cancelled = true; clearTimeout(timer); };
  }, [user, isPasswordRecovery]);

  const resendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) { toast.error(error.message); return; }
      setSent(true);
    } catch {
      toast.error("Couldn't send the reset link. Please try again.");
    } finally { setSubmitting(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setSubmitting(true);
    try {
    const { error } = await supabase.auth.updateUser(isPasswordRecovery ? { password } : { password, current_password: currentPassword });
    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }
    if (forced && user) {
      const { error: profileError } = await supabase.from("profiles").update({ must_change_password: false } as any).eq("id", user.id);
      if (profileError) { toast.error("Password updated, but we couldn't finish setting up your account. Please try again."); return; }
      clearMustChangePassword();
    }
    clearPasswordRecovery();
    setSubmitting(false);
    toast.success("Password updated successfully!");
    navigate("/");
    } catch {
      toast.error("Couldn't update your password. Please try again.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto px-4">
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Lock className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold font-display">
                {forced ? "Set Your Password" : "Reset Password"}
              </h1>
            </div>

            {forced && (
              <p className="text-xs text-muted-foreground text-center mb-4">
                An admin set a temporary password for your account. Please choose your own password to continue.
              </p>
            )}

            {linkError ? (
              <div className="space-y-4">
                <p role="alert" className="text-sm text-muted-foreground">{linkError}</p>
                {sent ? <p role="status" className="text-sm text-foreground">Check your inbox and spam folder for a new reset link. Use the most recent email.</p> : (
                  <form onSubmit={resendLink} className="space-y-4">
                    <label htmlFor="reset-email" className="block text-sm">Email address</label>
                    <input id="reset-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm" />
                    <Button type="submit" disabled={submitting} className="w-full">{submitting && <Loader2 className="animate-spin" />}Send new reset link</Button>
                  </form>
                )}
              </div>
            ) : !ready ? (
              <p className="text-sm text-muted-foreground text-center">
                Verifying your reset link…
                <Loader2 className="inline h-4 w-4 animate-spin ml-2" />
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isPasswordRecovery && (
                  <div>
                    <label htmlFor="current-password" className="block text-xs font-display text-muted-foreground mb-1">Current Password *</label>
                    <input id="current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm" />
                  </div>
                )}
                <div>
                  <label htmlFor="new-password" className="block text-xs font-display tracking-wider text-muted-foreground mb-1">New Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      id="new-password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-secondary border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      id="confirm-password"
                      autoComplete="new-password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-secondary border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground font-display tracking-wider py-3 rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting ? "Updating…" : "Update Password"}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
