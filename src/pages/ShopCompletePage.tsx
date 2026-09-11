import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useShopCartStore } from "@/stores/shopCartStore";

export default function ShopCompletePage() {
  const [searchParams] = useSearchParams();
  const clearCart = useShopCartStore((s) => s.clear);
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const orderId = searchParams.get("order");
    const brId = searchParams.get("br");
    if (!orderId || !brId) {
      setStatus("error");
      setMessage("Missing order details");
      return;
    }

    let attempts = 0;
    let cancelled = false;

    async function verify() {
      attempts++;
      try {
        const { data, error } = await supabase.functions.invoke("verify-shop-order", {
          body: { order_id: orderId, br_id: brId },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        if (data?.status === "paid") {
          if (!cancelled) {
            setStatus("paid");
            clearCart();
          }
          return;
        }
        if (attempts < 4 && !cancelled) {
          setTimeout(verify, 4000);
        } else if (!cancelled) {
          setStatus("pending");
        }
      } catch (err: any) {
        if (!cancelled) {
          setStatus("error");
          setMessage(err.message || "Could not verify your payment");
        }
      }
    }
    verify();
    return () => { cancelled = true; };
  }, [searchParams, clearCart]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Order Status | PAFC Club Shop" description="Your Peterborough Athletic FC club shop order status." path="/shop/complete" />
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-lg text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-14 w-14 animate-spin text-primary mx-auto mb-6" />
              <h1 className="text-2xl font-bold font-display mb-2">Confirming your payment…</h1>
              <p className="text-muted-foreground">This usually takes a few seconds.</p>
            </>
          )}
          {status === "paid" && (
            <>
              <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-6" />
              <h1 className="text-3xl font-bold font-display mb-2">
                <span className="text-gold-gradient">Order</span> Confirmed!
              </h1>
              <p className="text-muted-foreground mb-6">
                Thank you! Your payment has been received and a confirmation email is on its way.
                We'll be in touch when your order is ready.
              </p>
              <Button asChild className="bg-gold-gradient text-primary-foreground font-display tracking-wider">
                <Link to="/shop">Back to Shop</Link>
              </Button>
            </>
          )}
          {status === "pending" && (
            <>
              <Clock className="h-14 w-14 text-primary mx-auto mb-6" />
              <h1 className="text-2xl font-bold font-display mb-2">Payment Processing</h1>
              <p className="text-muted-foreground mb-6">
                Your bank is still confirming the payment. This can take a short while —
                you'll receive an email as soon as it's confirmed.
              </p>
              <Button asChild variant="outline">
                <Link to="/shop">Back to Shop</Link>
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-14 w-14 text-destructive mx-auto mb-6" />
              <h1 className="text-2xl font-bold font-display mb-2">Something went wrong</h1>
              <p className="text-muted-foreground mb-6">{message || "We couldn't confirm your order. Please contact the club."}</p>
              <Button asChild variant="outline">
                <Link to="/shop">Back to Shop</Link>
              </Button>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
