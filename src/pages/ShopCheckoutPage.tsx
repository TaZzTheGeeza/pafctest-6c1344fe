import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ShoppingBag, ArrowLeft, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useShopCartStore, cartItemKey } from "@/stores/shopCartStore";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ShopCheckoutPage() {
  const { items } = useShopCartStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);

  const totalCents = items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-shop-checkout", {
        body: {
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            size: i.size,
            initials: i.initials,
          })),
          buyer_name: name.trim(),
          buyer_email: email.trim(),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err: any) {
      toast.error(err.message || "Could not start checkout");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Checkout | PAFC Club Shop" description="Secure checkout for Peterborough Athletic FC club shop orders." path="/shop/checkout" />
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to shop
          </Link>
          <h1 className="text-3xl font-bold font-display mb-6">
            <span className="text-gold-gradient">Check</span>out
          </h1>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Your basket is empty</p>
              <Button onClick={() => navigate("/shop")} variant="outline">Browse the shop</Button>
            </div>
          ) : (
            <div className="grid gap-6">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-display text-sm tracking-wider uppercase text-muted-foreground mb-4">Order Summary</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={cartItemKey(item)} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium text-foreground">{item.quantity}x {item.name}</span>
                        <span className="text-muted-foreground text-xs block">
                          {item.size && `Size: ${item.size}`}
                          {item.size && item.initials && " · "}
                          {item.initials && `Initials: ${item.initials}`}
                        </span>
                      </div>
                      <span className="text-primary font-bold">£{((item.price_cents * item.quantity) / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border mt-4 pt-3 flex justify-between font-display text-lg">
                  <span>Total</span>
                  <span className="text-primary font-bold">£{(totalCents / 100).toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleCheckout} className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h2 className="font-display text-sm tracking-wider uppercase text-muted-foreground">Your Details</h2>
                <div>
                  <label className="text-xs text-muted-foreground font-display">Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-display">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Your order confirmation will be sent here.</p>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gold-gradient text-primary-foreground font-display tracking-wider hover:opacity-90">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Landmark className="h-4 w-4 mr-2" />}
                  Pay £{(totalCents / 100).toFixed(2)} by Bank
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Secure instant bank payment via GoCardless — no card details needed.
                </p>
              </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
