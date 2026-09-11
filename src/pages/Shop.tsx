import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Loader2, Minus, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useShopCartStore } from "@/stores/shopCartStore";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useShopWindow } from "@/hooks/useShopWindow";
import { ShopWindowBanner } from "@/components/shop/ShopWindowBanner";
import { useSearchParams } from "react-router-dom";

export interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  sizes: string[];
  tags: string[];
  requires_initials: boolean;
}

const CATEGORIES = [
  { label: "All", tag: null },
  { label: "Players", tag: "players" },
  { label: "Supporters", tag: "supporters" },
  { label: "Coaches", tag: "coaches" },
] as const;

export default function ShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<ShopProduct | null>(null);
  const [size, setSize] = useState<string>("");
  const [initials, setInitials] = useState("");
  const [quantity, setQuantity] = useState(1);
  const shopWindow = useShopWindow();
  const shopOpen = shopWindow.isOpen;
  const addItem = useShopCartStore((s) => s.addItem);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("cancelled") === "true") {
      toast.info("Checkout cancelled — your basket is still saved.");
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("shop_products")
        .select("id, name, description, price_cents, image_url, sizes, tags, requires_initials")
        .eq("active", true)
        .order("sort_order");
      if (error) {
        console.error("Failed to fetch products:", error);
      } else {
        setProducts((data as ShopProduct[]) || []);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const filtered = activeCategory
    ? products.filter((p) => p.tags?.includes(activeCategory))
    : products;

  const openProduct = (p: ShopProduct) => {
    setSelected(p);
    setSize(p.sizes?.length ? "" : "__none__");
    setInitials("");
    setQuantity(1);
  };

  const handleAdd = () => {
    if (!selected) return;
    if (selected.sizes?.length && !size) {
      toast.error("Please choose a size");
      return;
    }
    if (selected.requires_initials && !initials.trim()) {
      toast.error("Please add the initials for personalisation");
      return;
    }
    addItem(
      {
        product_id: selected.id,
        name: selected.name,
        price_cents: selected.price_cents,
        image_url: selected.image_url,
        size: selected.sizes?.length ? size : null,
        initials: initials.trim() ? initials.trim().toUpperCase() : null,
      },
      quantity
    );
    toast.success("Added to basket", { description: selected.name });
    setSelected(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Club Shop | Peterborough Athletic FC Kit & Merch" description="Official Peterborough Athletic FC shop — kit, training wear, hoodies and merchandise. Support your local junior football club." keywords="Peterborough Athletic FC shop, PAFC kit, Peterborough football kit, junior football merchandise Peterborough, PAFC hoodies" path="/shop" />
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              <span className="text-gold-gradient">Club</span> Shop
            </h1>
            <p className="text-muted-foreground text-center mb-8">
              Official Peterborough Athletic FC merchandise — pay securely straight from your bank
            </p>
          </motion.div>

          <ShopWindowBanner window={shopWindow} className="max-w-xl mx-auto mb-8" />

          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.tag)}
                className={`px-5 py-2 rounded-full font-display text-sm tracking-wider transition-all duration-200 border ${
                  activeCategory === cat.tag
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl mb-2 text-foreground">No products found</h3>
              <p className="text-muted-foreground">No merchandise in this category yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="bg-card border border-border rounded-lg overflow-hidden group"
                >
                  <button onClick={() => openProduct(product)} className="w-full">
                    <div className="aspect-square bg-white border-b border-border overflow-hidden flex items-center justify-center p-4">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
                          loading="lazy"
                        />
                      ) : (
                        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                  <div className="p-4">
                    <button onClick={() => openProduct(product)} className="text-left w-full">
                      <h3 className="font-display text-sm font-bold truncate hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </button>
                    <p className="text-primary font-bold mt-1">£{(product.price_cents / 100).toFixed(2)}</p>
                    {shopOpen && (
                      <Button
                        onClick={() => openProduct(product)}
                        className="w-full mt-3 bg-gold-gradient text-primary-foreground font-display text-xs tracking-wider hover:opacity-90"
                        size="sm"
                      >
                        Add to Basket
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Product detail / add-to-basket dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display tracking-wider">{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="bg-white rounded-lg p-4 flex items-center justify-center h-56">
                {selected.image_url ? (
                  <img src={selected.image_url} alt={selected.name} className="max-h-full object-contain mix-blend-multiply" />
                ) : (
                  <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              {selected.description && (
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              )}
              <p className="text-primary font-bold text-xl font-display">£{(selected.price_cents / 100).toFixed(2)}</p>

              {selected.sizes?.length > 0 && (
                <div>
                  <p className="text-xs font-display tracking-wider text-muted-foreground uppercase mb-2">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`px-3 py-1.5 rounded border text-sm font-display transition-colors ${
                          size === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selected.requires_initials && (
                <div>
                  <p className="text-xs font-display tracking-wider text-muted-foreground uppercase mb-2">
                    Initials (printed on item)
                  </p>
                  <input
                    value={initials}
                    onChange={(e) => setInitials(e.target.value.slice(0, 4))}
                    placeholder="e.g. BM"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground uppercase"
                    maxLength={4}
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                <p className="text-xs font-display tracking-wider text-muted-foreground uppercase">Qty</p>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1.5 rounded border border-border hover:border-primary" aria-label="Decrease quantity">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center font-bold">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(20, quantity + 1))} className="p-1.5 rounded border border-border hover:border-primary" aria-label="Increase quantity">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {shopOpen ? (
                <Button onClick={handleAdd} className="w-full bg-gold-gradient text-primary-foreground font-display tracking-wider hover:opacity-90">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Add to Basket — £{((selected.price_cents * quantity) / 100).toFixed(2)}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground text-center">The shop is currently closed</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
