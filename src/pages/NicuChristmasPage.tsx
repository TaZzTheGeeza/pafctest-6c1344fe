import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, CheckCircle2, Coffee, Gift, Heart, Landmark, Loader2, MapPin, MessageCircle, Minus, Plus, RefreshCw, Share2 } from "lucide-react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePersistentState } from "@/hooks/usePersistentState";
import { toast } from "sonner";
import carePackage from "@/assets/nicu-care-package.jpg";
import baubles from "@/assets/nicu-baubles.asset.json";
import keyrings from "@/assets/nicu-keyrings.asset.json";
import hospital from "@/assets/nicu-hospital.asset.json";
import poster from "@/assets/nicu-christmas-poster.asset.json";

const CAMPAIGN = "nicu-christmas-2026";
const wishlist = [
  { title: "Christmas care packages", icon: Gift, items: ["Muslin blanket", "Hand sanitiser", "Hand cream", "Lip balm", "A book", "Chocolates"] },
  { title: "The parents' kitchen", icon: Coffee, items: ["Instant snacks (e.g. pot noodles)", "Tinned food", "Cereals", "Soups & cup soups", "Christmas themed snacks", "Chocolates, biscuits & confectionery", "Mince pies", "Tea, coffee, hot chocolate & squash"] },
];
type Product = { id: string; name: string; price_cents: number; image_url: string | null };
type PaymentStatus = "checking" | "paid" | "pending" | "cancelled" | "error";

function Quantity({ value, onChange, name }: { value: number; onChange: (value: number) => void; name: string }) {
  return <div className="flex items-center gap-3">
    <Button type="button" size="icon" variant="outline" aria-label={`Remove one ${name}`} disabled={value === 0} onClick={() => onChange(Math.max(0, value - 1))}><Minus className="h-4 w-4" /></Button>
    <output className="w-7 text-center font-semibold" aria-label={`${name} quantity`}>{value}</output>
    <Button type="button" size="icon" variant="outline" aria-label={`Add one ${name}`} disabled={value === 20} onClick={() => onChange(Math.min(20, value + 1))}><Plus className="h-4 w-4" /></Button>
  </div>;
}

export default function NicuChristmasPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [productError, setProductError] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [quantities, setQuantities] = usePersistentState<Record<string, number>>("nicu-quantities", {});
  const [donation, setDonation] = usePersistentState("nicu-donation", "0");
  const [checkedItems, setCheckedItems] = usePersistentState<string[]>("nicu-wishlist", []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>("checking");
  const [statusMessage, setStatusMessage] = useState("");
  const [checkAttempt, setCheckAttempt] = useState(0);
  const orderId = params.get("order");
  const brId = params.get("br");
  const donationPence = donation.trim() === "" ? 0 : Math.round(Number(donation) * 100);
  const total = products.reduce((sum, p) => sum + p.price_cents * (quantities[p.id] ?? 0), 0) + (Number.isFinite(donationPence) ? donationPence : 0);

  useEffect(() => { if (user?.email) setEmail(user.email); }, [user?.email]);
  useEffect(() => {
    let alive = true;
    supabase.from("shop_products").select("id,name,price_cents,image_url").eq("active", true).contains("tags", [CAMPAIGN]).order("sort_order").then(({ data, error }) => {
      if (!alive) return;
      setProducts(data ?? []); setProductError(Boolean(error)); setLoadingProducts(false);
    });
    return () => { alive = false; };
  }, []);
  useEffect(() => { if (params.get("cancelled") === "true") toast.info("Payment was not completed. Your choices are saved."); }, [params]);
  useEffect(() => {
    if (!orderId || !brId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setStatus("checking");
    async function check(attempt = 0) {
      try {
        const { data, error } = await supabase.functions.invoke("verify-shop-order", { body: { order_id: orderId, br_id: brId } });
        if (error) throw error;
        if (cancelled) return;
        if (data?.status === "paid") { setStatus("paid"); setQuantities({}); setDonation("0"); return; }
        if (data?.status === "cancelled") { setStatus("cancelled"); return; }
        if (attempt < 15) { timer = setTimeout(() => check(attempt + 1), 5000); return; }
        setStatus("pending");
      } catch {
        if (!cancelled) { setStatus("error"); setStatusMessage("We couldn't check the payment yet. Please try again; don't pay a second time if money has left your account."); }
      }
    }
    check();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [orderId, brId, checkAttempt]);

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isSafeInteger(donationPence) || donationPence < 0 || donationPence > 100000 || (donationPence > 0 && donationPence < 100)) {
      toast.error("Please choose no donation or an amount between £1 and £1,000."); return;
    }
    if (total <= 0) { toast.error("Choose an item or add a donation."); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-shop-checkout", { body: {
        campaign: CAMPAIGN, donation_pence: donationPence, buyer_name: name.trim(), buyer_email: email.trim(),
        items: products.filter(p => (quantities[p.id] ?? 0) > 0).map(p => ({ product_id: p.id, quantity: quantities[p.id] })),
      } });
      if (error) {
        const details = error instanceof FunctionsHttpError ? await error.context.json().catch(() => null) : null;
        throw new Error(details?.error ?? "Could not start your bank payment. Please try again.");
      }
      if (!data?.url) throw new Error(data?.error ?? "No payment link was returned.");
      window.location.assign(data.url);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to start payment."); setBusy(false); }
  }
  async function share() {
    const url = "https://www.pa-fc.uk/nicu-christmas";
    if (navigator.share) { try { await navigator.share({ title: "PAFC NICU Christmas Collection", text: "Help us bring a Christmas gift to each cot side at Peterborough NICU.", url }); } catch { /* Share dismissed. */ } }
    else { try { await navigator.clipboard.writeText(url); toast.success("Collection link copied"); } catch { toast.error("Please copy the page address to share it."); } }
  }

  return <div className="nicu-page min-h-screen flex flex-col">
    <SEO title="NICU Christmas Collection | Peterborough Athletic FC" description="Support PAFC's fourth Christmas collection for Peterborough NICU. Donate, buy a £5 bauble or £2.50 keyring, or bring items to Jack Hunt School." path="/nicu-christmas" />
    <Navbar />
    <main className="flex-1 pt-28">
      <section className="nicu-hero relative overflow-hidden">
        <img src={carePackage} alt="Illustrative Christmas care package with a muslin blanket, toiletries, a book and chocolates" width={1536} height={1024} className="absolute inset-0 w-full h-full object-cover object-right" />
        <div className="nicu-hero-shade absolute inset-0" />
        <div className="container relative mx-auto px-5 py-16 md:py-24">
          <div className="max-w-xl">
            <p className="text-primary text-sm font-semibold mb-4 flex items-center gap-2"><Heart className="h-4 w-4" /> Our fourth year supporting Peterborough NICU</p>
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight">NICU Christmas<br /><span className="text-primary">Collection</span></h1>
            <p className="text-lg mt-6 max-w-md leading-relaxed">A Christmas gift at every cot side. A little comfort for families spending Christmas in neonatal care.</p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button asChild size="lg"><a href="#give"><Heart className="h-4 w-4 mr-2" /> Donate or buy a gift</a></Button>
              <Button asChild size="lg" variant="outline"><a href="#wishlist"><Gift className="h-4 w-4 mr-2" /> Donate items</a></Button>
            </div>
          </div>
        </div>
      </section>
      <div className="bg-secondary border-y border-border">
        <div className="container mx-auto px-5 py-5 flex flex-wrap gap-x-8 gap-y-3 justify-between text-sm">
          <span className="flex gap-2 items-center"><MapPin className="h-4 w-4 text-primary" /> Jack Hunt School</span>
          <span>Collections every Thursday & Friday until Christmas</span>
          <span className="text-primary">All money raised provides items for the collection</span>
        </div>
      </div>
      <section className="container mx-auto px-5 py-16 grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
        <div><p className="text-primary text-sm mb-3">From our club, with love</p><h2 className="font-display text-3xl md:text-4xl mb-5">Small gifts. A meaningful difference.</h2><p className="text-muted-foreground leading-relaxed">For the fourth year, PAFC is supporting the Peterborough Neonatal Intensive Care Unit (NICU), a cause close to many families within our club. Together, we're collecting Christmas care packages so each cot side has a gift on Christmas morning, along with supplies for the parents' kitchen.</p></div>
        <figure><img src={hospital.url} width={430} height={270} loading="lazy" className="w-full aspect-[3/2] object-cover rounded-lg" alt="The NICU Christmas collection team from the original appeal poster" /><figcaption className="text-xs text-muted-foreground mt-3">Our NICU collection, pictured on this year's poster.</figcaption></figure>
      </section>
      <section id="give" className="bg-card py-16 scroll-mt-32">
        <div className="container mx-auto px-5">
          <div className="mb-9"><p className="text-primary text-sm mb-3">Give a little Christmas kindness</p><h2 className="text-3xl md:text-4xl">Donate or buy a PAFC gift</h2><p className="text-muted-foreground mt-4 max-w-2xl">All money raised from baubles, keyrings and donations goes towards providing items for the NICU collection.</p></div>
          {orderId && brId ? <div role="status" className="max-w-xl py-8">
            {status === "checking" ? <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" /> : <CheckCircle2 className="h-10 w-10 text-primary mb-4" />}
            <h3 className="text-2xl mb-4">{status === "paid" ? "Thank you. Payment received!" : status === "checking" ? "Checking your bank payment" : status === "pending" ? "Awaiting bank confirmation" : status === "cancelled" ? "Payment not completed" : "Payment check unavailable"}</h3>
            <p className="text-muted-foreground mb-4">{status === "paid" ? "Your contribution is recorded for the NICU Christmas collection. Your receipt will be sent by email." : status === "pending" ? "Your contribution is recorded, but we are still waiting for your bank to confirm payment. Please don't pay again if money has left your account." : status === "checking" ? "We're checking with GoCardless. This may take a minute or two." : status === "cancelled" ? "Your bank payment was not completed. Your choices have been saved." : statusMessage}</p>
            <p className="text-sm mb-6">Reference: #{orderId.slice(0, 8).toUpperCase()}</p>
            <div className="flex flex-wrap gap-3">{(status === "pending" || status === "error") && <Button onClick={() => setCheckAttempt(v => v + 1)}><RefreshCw className="h-4 w-4 mr-2" /> Check again</Button>}
              <Button variant="outline" onClick={() => { setParams({}); }} >Back to the collection</Button>
              {user && <Button asChild variant="outline"><Link to="/my-profile?tab=orders">My contributions & orders</Link></Button>}
            </div>
          </div> : <form onSubmit={checkout} className="grid lg:grid-cols-[1.3fr_1fr] gap-12">
            <div>
              {loadingProducts ? <Loader2 className="h-6 w-6 animate-spin" /> : productError ? <p role="alert">Gift items could not load. You can still make a money donation below.</p> : products.length === 0 ? <p>Gift items are currently unavailable. Money donations are welcome.</p> : <div className="grid sm:grid-cols-2 gap-6">
                {products.map(p => <article key={p.id} className="bg-background rounded-lg overflow-hidden">
                  <img src={(p.price_cents === 500 ? baubles : keyrings).url} width={280} height={180} alt={p.name} loading="lazy" className="w-full aspect-[4/3] object-contain bg-secondary" />
                  <div className="p-5"><h3 className="text-lg mb-2">{p.name}</h3><p className="font-display text-3xl text-primary mb-5">£{(p.price_cents / 100).toFixed(2)}</p><Quantity name={p.name} value={quantities[p.id] ?? 0} onChange={value => setQuantities({ ...quantities, [p.id]: value })} /></div>
                </article>)}
              </div>}
              <fieldset className="mt-8"><legend className="font-display text-xl mb-4">A money donation</legend><div className="flex flex-wrap gap-2 mb-4">{[0, 5, 10, 20, 50].map(amount => <Button key={amount} type="button" variant={Number(donation) === amount ? "default" : "outline"} aria-pressed={Number(donation) === amount} onClick={() => setDonation(String(amount))}>{amount === 0 ? "No donation" : `£${amount}`}</Button>)}</div><label htmlFor="donation" className="block text-sm mb-2">Or choose an amount (£)</label><Input id="donation" type="number" inputMode="decimal" min="0" max="1000" step="0.01" value={donation} onChange={e => setDonation(e.target.value)} className="max-w-48" /><p className="text-sm text-muted-foreground mt-3">A one-off contribution towards items for the collection.</p></fieldset>
            </div>
            <div className="lg:border-l lg:border-border lg:pl-10">
              <h3 className="text-xl mb-5">Your contribution</h3>
              <div className="space-y-3 text-sm mb-6">{products.filter(p => (quantities[p.id] ?? 0) > 0).map(p => <div key={p.id} className="flex justify-between gap-3"><span>{quantities[p.id]} × {p.name}</span><span className="shrink-0">£{(p.price_cents * quantities[p.id] / 100).toFixed(2)}</span></div>)}{donationPence > 0 && <div className="flex justify-between"><span>NICU donation</span><span>£{(donationPence / 100).toFixed(2)}</span></div>}</div>
              <div className="border-y border-border py-4 mb-6 flex justify-between font-display text-2xl"><span>Total</span><span className="text-primary">£{(total / 100).toFixed(2)}</span></div>
              <label htmlFor="donor-name" className="block text-sm mb-2">Your name</label><Input id="donor-name" autoComplete="name" required maxLength={100} value={name} onChange={e => setName(e.target.value)} className="mb-4" />
              <label htmlFor="donor-email" className="block text-sm mb-2">Email for your receipt</label><Input id="donor-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} className="mb-5" />
              <Button type="submit" size="lg" className="w-full" disabled={busy || total <= 0 || loadingProducts}>{busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Landmark className="h-4 w-4 mr-2" />}Pay £{(total / 100).toFixed(2)} by bank</Button>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">One-off payment through GoCardless Instant Bank Pay. No monthly payments. Please contact the club to arrange handover of your baubles or keyrings.</p>
              {!user && <p className="text-sm text-muted-foreground mt-4"><Link className="text-primary underline" to="/auth">Sign in</Link> to see this contribution in your orders, or continue as a guest.</p>}
            </div>
          </form>}
        </div>
      </section>
      <section id="wishlist" className="container mx-auto px-5 py-16 scroll-mt-32">
        <p className="text-primary text-sm mb-3">Prefer to donate items?</p><h2 className="text-3xl md:text-4xl mb-4">The Christmas collection wishlist</h2><p className="text-muted-foreground mb-8">Choose something to bring along to Jack Hunt School.</p>
        <div className="grid md:grid-cols-2 gap-12">{wishlist.map(group => <div key={group.title}><h3 className="text-2xl mb-5 flex gap-3 items-center"><group.icon className="h-6 w-6 text-primary" />{group.title}</h3><ul>{group.items.map(item => <li key={item} className="border-b border-border py-3"><label className="flex items-center gap-3 cursor-pointer"><Checkbox checked={checkedItems.includes(item)} onCheckedChange={checked => setCheckedItems(checked ? [...checkedItems, item] : checkedItems.filter(i => i !== item))} /><span>{item}</span>{checkedItems.includes(item) && <Check className="h-4 w-4 text-primary ml-auto" />}</label></li>)}</ul></div>)}</div>
      </section>
      <section className="bg-secondary py-12"><div className="container mx-auto px-5 grid md:grid-cols-2 gap-10"><div><MapPin className="h-7 w-7 text-primary mb-4" /><h2 className="text-3xl mb-4">Bring your donations</h2><p className="text-lg mb-2">Jack Hunt School</p><p className="text-muted-foreground mb-5">Every Thursday and Friday until Christmas.</p><Button asChild variant="outline"><Link to="/contact">Ask about collection times</Link></Button></div><div><MessageCircle className="h-7 w-7 text-primary mb-4" /><h2 className="text-3xl mb-4">Spread a little kindness</h2><p className="text-muted-foreground mb-5">Thank you for any contribution you are able to offer. Share the collection with friends, family and your team.</p><div className="flex flex-wrap gap-3"><Button asChild><a href={`https://wa.me/?text=${encodeURIComponent("Support PAFC's NICU Christmas collection: donate, buy a £5 bauble or £2.50 keyring, or bring wishlist items to Jack Hunt School. https://www.pa-fc.uk/nicu-christmas")}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4 mr-2" />WhatsApp</a></Button><Button variant="outline" onClick={share}><Share2 className="h-4 w-4 mr-2" />Share</Button><Button asChild variant="outline"><a href={poster.url} target="_blank" rel="noopener noreferrer">View the original poster</a></Button></div></div></div></section>
    </main><Footer />
  </div>;
}