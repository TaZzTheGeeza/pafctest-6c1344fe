import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Loader2, CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useShopCartStore } from "@/stores/shopCartStore";

type Status = "loading" | "paid" | "pending" | "cancelled" | "error";

export default function ShopCompletePage() {
  const [searchParams] = useSearchParams();
  const clearCart = useShopCartStore((s) => s.clear);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const cancelledRef = useRef(false);

  const orderId = searchParams.get("order");
  const brId = searchParams.get("br");
  const orderRef = orderId ? orderId.slice(0, 8).toUpperCase() : "";

  const check = useCallback(
    async (attempt = 1): Promise<void> => {
      if (!orderId || !brId) {
        setStatus("error");
        setMessage("Missing order details");
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke("verify-shop-order", {
          body: { order_id: orderId, br_id: brId },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        if (cancelledRef.current) return;

        // Once the bank flow is done the basket has been paid for — empty it
        // so nothing looks like it's still waiting to be ordered.
        if (data?.status === "paid" || data?.flow_complete) clearCart();

        if (data?.status === "paid") {
          setStatus("paid");
          return;
        }
        if (data?.status === "cancelled") {
          setStatus("cancelled");
          return;
        }
        // Bank confirmations can lag by a minute or two — keep checking.
        if (attempt < 25) {
          setTimeout(() => check(attempt + 1), attempt < 6 ? 3000 : 6000);
        } else {
          setStatus("pending");
        }
      } catch (err: any) {
        if (cancelledRef.current) return;
        if (attempt < 5) {
          setTimeout(() => check(attempt + 1), 4000);
          return;
        }
        setStatus("error");
        setMessage(err.message || "Could not verify your payment");
      }
    },
    [orderId, brId, clearCart]
  );

  useEffect(() => {
    cancelledRef.current = false;
    check();
    return () => {
      cancelledRef.current = true;
    };
  }, [check]);

  async function recheck() {
    setChecking(true);
    cancelledRef.current = false;
    setStatus("loading");
    await check();
    setChecking(false);
  }

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
              <p className="text-muted-foreground">
                Please stay on this page — this usually takes a few seconds, occasionally a minute or two.
              </p>
            </>
          )}

          {status === "paid" && (
            <>
              <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-6" />
              <h1 className="text-3xl font-bold font-display mb-2">
                <span className="text-gold-gradient">Payment</span> Received!
              </h1>
              <p className="text-muted-foreground mb-2">
                Your order is confirmed and a receipt email is on its way.
              </p>
              {orderRef && (
                <p className="text-sm text-foreground mb-6">
                  Order reference <span className="font-bold text-primary">#{orderRef}</span>
                </p>
              )}
              <div className="flex flex-wrap gap-3 justify-center">
                <Button asChild className="bg-gold-gradient text-primary-foreground font-display tracking-wider">
                  <Link to="/profile?tab=orders">View My Orders</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/shop">Back to Shop</Link>
                </Button>
              </div>
            </>
          )}

          {status === "pending" && (
            <>
              <Clock className="h-14 w-14 text-primary mx-auto mb-6" />
              <h1 className="text-2xl font-bold font-display mb-2">Payment sent — awaiting bank confirmation</h1>
              <p className="text-muted-foreground mb-2">
                Your order has been placed{orderRef ? ` (reference #${orderRef})` : ""} and we're waiting on your bank
                to confirm it. If the money has left your account, nothing more is needed — the confirmation email
                follows automatically, usually within a few minutes.
              </p>
              <p className="text-muted-foreground text-sm mb-6">
                You can track it any time in My Orders — no need to message the club.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={recheck} disabled={checking} className="bg-gold-gradient text-primary-foreground font-display tracking-wider">
                  {checking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Check again
                </Button>
                <Button asChild variant="outline">
                  <Link to="/profile?tab=orders">My Orders</Link>
                </Button>
              </div>
            </>
          )}

          {status === "cancelled" && (
            <>
              <XCircle className="h-14 w-14 text-destructive mx-auto mb-6" />
              <h1 className="text-2xl font-bold font-display mb-2">Payment not completed</h1>
              <p className="text-muted-foreground mb-6">
                Your bank didn't complete this payment, so nothing has been taken. You can try again from the shop.
              </p>
              <Button asChild className="bg-gold-gradient text-primary-foreground font-display tracking-wider">
                <Link to="/shop">Back to Shop</Link>
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-14 w-14 text-destructive mx-auto mb-6" />
              <h1 className="text-2xl font-bold font-display mb-2">We couldn't check your payment</h1>
              <p className="text-muted-foreground mb-6">
                {message || "Please try again in a moment."} If money has left your account your order is safe —
                {orderRef ? ` quote reference #${orderRef} if you contact the club.` : " contact the club if you're unsure."}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={recheck} disabled={checking} variant="outline">
                  {checking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Try again
                </Button>
                <Button asChild variant="outline">
                  <Link to="/shop">Back to Shop</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
