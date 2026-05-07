import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, clearMustChangePassword } = useAuth();
  const forced = params.get("forced") === "1";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (forced && user) {
      setReady(true);
      return;
    }
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setReady(true);
    } else {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") setReady(true);
      });
      return () => subscription.unsubscribe();
    }
  }, [forced, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }
    if (forced && user) {
      await supabase.from("profiles").update({ must_change_password: false } as any).eq("id", user.id);
      clearMustChangePassword();
    }
    setSubmitting(false);
    toast.success("Password updated successfully!");
    navigate("/");
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

            {!ready ? (
              <p className="text-sm text-muted-foreground text-center">
                Verifying your reset link…
                <Loader2 className="inline h-4 w-4 animate-spin ml-2" />
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">New Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-secondary border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-secondary border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground font-display tracking-wider py-3 rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting ? "Updating…" : "Update Password"}
                </button>
              </form>
            )}
          </div>
        </main>
      <Footer />
    </div>
  );
}
