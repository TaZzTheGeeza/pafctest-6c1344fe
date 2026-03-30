import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";

type State = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    validateToken(token);
  }, [token]);

  async function validateToken(t: string) {
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${t}`;
      const res = await fetch(url, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      const data = await res.json();
      if (res.ok && data.valid === true) setState("valid");
      else if (data.reason === "already_unsubscribed" || data.valid === false) setState("already_unsubscribed");
      else setState("invalid");
    } catch {
      setState("invalid");
    }
  }

  async function handleUnsubscribe() {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setState("success");
      else if (data?.reason === "already_unsubscribed") setState("already_unsubscribed");
      else setState("error");
    } catch {
      setState("error");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center">
          {state === "loading" && (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">Validating your request...</p>
            </>
          )}

          {state === "valid" && (
            <>
              <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
              <h1 className="font-display text-xl font-bold text-foreground uppercase tracking-wider mb-2">
                Unsubscribe
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                Are you sure you want to unsubscribe from Peterborough Athletic FC emails?
              </p>
              <button
                onClick={handleUnsubscribe}
                disabled={processing}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-display text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm Unsubscribe
              </button>
            </>
          )}

          {state === "success" && (
            <>
              <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
              <h1 className="font-display text-xl font-bold text-foreground uppercase tracking-wider mb-2">
                Unsubscribed
              </h1>
              <p className="text-muted-foreground text-sm">
                You've been successfully unsubscribed and won't receive further emails from us.
              </p>
            </>
          )}

          {state === "already_unsubscribed" && (
            <>
              <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h1 className="font-display text-xl font-bold text-foreground uppercase tracking-wider mb-2">
                Already Unsubscribed
              </h1>
              <p className="text-muted-foreground text-sm">
                You've already unsubscribed from these emails.
              </p>
            </>
          )}

          {(state === "invalid" || state === "error") && (
            <>
              <XCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <h1 className="font-display text-xl font-bold text-foreground uppercase tracking-wider mb-2">
                {state === "invalid" ? "Invalid Link" : "Something Went Wrong"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {state === "invalid"
                  ? "This unsubscribe link is invalid or has expired."
                  : "We couldn't process your request. Please try again later."}
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
