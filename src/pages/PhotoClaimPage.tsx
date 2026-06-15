import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Download, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

interface ClaimPhoto {
  id: string;
  caption: string | null;
  age_group: string | null;
  preview_url: string;
  photo_ref?: string | null;
}

export default function PhotoClaimPage() {
  const [params] = useSearchParams();
  const initialToken = params.get("token") || "";
  const sessionId = params.get("session_id") || "";
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [data, setData] = useState<{
    order_name: string | null;
    photos: ClaimPhoto[];
    expires_at: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token && !sessionId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 40; // ~2 min of polling while payment confirms

    const tryFetch = async () => {
      if (cancelled) return;
      setLoading(attempts === 0);
      const body: Record<string, string> = token ? { token } : { session_id: sessionId };
      const { data: res, error: invErr } = await supabase.functions.invoke("claim-photos", { body });
      if (cancelled) return;

      if (!invErr && (res as any)?.photos) {
        setData(res as any);
        if (!token && (res as any).token) setToken((res as any).token);
        setLoading(false);
        setWaiting(false);
        return;
      }

      // Pending payment — keep polling
      if (!invErr && (res as any)?.pending) {
        setWaiting(true);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(tryFetch, 3000);
          return;
        }
      }

      setError((res as any)?.error || invErr?.message || "Invalid or expired link");
      setLoading(false);
      setWaiting(false);
    };

    tryFetch();
    return () => { cancelled = true; };
  }, [token, sessionId]);


  const handleDownload = async (photoId: string) => {
    setDownloadingId(photoId);
    try {
      const { data, error } = await supabase.functions.invoke("claim-photos", {
        body: { token, photo_id: photoId },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      const url = (data as any).download_url;
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      toast.error(e.message || "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleResend = async () => {
    if (!resendEmail) return;
    setResending(true);
    try {
      await supabase.functions.invoke("resend-photo-claim", { body: { email: resendEmail } });
      setResent(true);
      toast.success("If we have an order for that email, a new link is on its way.");
    } catch (e: any) {
      toast.error(e.message || "Failed to resend");
    } finally {
      setResending(false);
    }
  };

  if (!token && !sessionId) {
    return (
      <div className="min-h-screen pt-28 px-4 max-w-xl mx-auto">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Resend my download link</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter the email you used at checkout and we'll send a fresh link to your tournament photos.
            </p>
            <Input
              type="email"
              placeholder="you@example.com"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
            />
            <Button onClick={handleResend} disabled={resending || resent || !resendEmail} className="w-full">
              {resending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {resent ? "Link sent — check your inbox" : "Send my link"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 px-4 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-2 mb-2">
        <Camera className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Your tournament photos</h1>
      </div>
      {data?.order_name && (
        <p className="text-sm text-muted-foreground mb-6">Order {data.order_name}</p>
      )}

      {(loading || waiting) && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {waiting ? "Payment received — preparing your photos…" : "Looking up your photos…"}
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-sm text-muted-foreground">
              Your link may have expired. Enter your email below and we'll send a fresh one.
            </p>
            <Input
              type="email"
              placeholder="you@example.com"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
            />
            <Button onClick={handleResend} disabled={resending || resent || !resendEmail} className="w-full">
              {resending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {resent ? "Link sent — check your inbox" : "Send a new link"}
            </Button>
          </CardContent>
        </Card>
      )}

      {data && data.photos.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Link valid until {new Date(data.expires_at).toLocaleDateString("en-GB")}. Bookmark this page or save your email.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {data.photos.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <div className="aspect-square bg-muted">
                  <img src={p.preview_url} alt={p.caption || ""} className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-2.5">
                  {p.caption && <p className="text-xs text-muted-foreground truncate mb-2">{p.caption}</p>}
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleDownload(p.id)}
                    disabled={downloadingId === p.id}
                  >
                    {downloadingId === p.id ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Download className="h-3 w-3 mr-1" />
                    )}
                    Download Hi-Res
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 text-sm text-muted-foreground">
        <Link to="/tournament" className="underline">Back to tournament</Link>
      </div>
    </div>
  );
}
