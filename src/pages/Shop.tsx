import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopifyProduct, storefrontApiRequest, STOREFRONT_PRODUCTS_QUERY } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = [
  { label: "All", tag: null },
  { label: "Players", tag: "players" },
  { label: "Supporters", tag: "supporters" },
  { label: "Coaches", tag: "coaches" },
] as const;

export default function ShopPage() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(true);
  const addItem = useCartStore(state => state.addItem);
  const isCartLoading = useCartStore(state => state.isLoading);

  useEffect(() => {
    supabase
      .from("site_settings" as any)
      .select("value")
      .eq("key", "shop_open")
      .single()
      .then(({ data }) => {
        if (data) setShopOpen((data as any).value === "true");
      });
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const queryVar = activeCategory ? `tag:${activeCategory}` : undefined;
        const data = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, { first: 50, query: queryVar });
        if (data?.data?.products?.edges) {
          setProducts(data.data.products.edges);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    fetchProducts();
  }, [activeCategory]);

  const handleAddToCart = async (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    toast.success("Added to cart", { description: product.node.title });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              <span className="text-gold-gradient">Club</span> Shop
            </h1>
            <p className="text-muted-foreground text-center mb-8">
              Official Peterborough Athletic FC merchandise
            </p>
          </motion.div>

          {!shopOpen && (
            <div className="max-w-lg mx-auto mb-8 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-200 font-display">
                The club shop is currently closed for orders. You can still browse our products.
              </p>
            </div>
          )}

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
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl mb-2 text-foreground">No products found</h3>
              <p className="text-muted-foreground">
                No merchandise in this category yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, i) => {
                const image = product.node.images.edges[0]?.node;
                const price = product.node.priceRange.minVariantPrice;
                return (
                  <motion.div
                    key={product.node.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="bg-card border border-border rounded-lg overflow-hidden group"
                  >
                    <Link to={`/product/${product.node.handle}`}>
                      <div className="aspect-square bg-white border-b border-border overflow-hidden flex items-center justify-center p-4">
                        {image ? (
                          <img
                            src={image.url}
                            alt={image.altText || product.node.title}
                            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link to={`/product/${product.node.handle}`}>
                        <h3 className="font-display text-sm font-bold truncate hover:text-primary transition-colors">
                          {product.node.title}
                        </h3>
                      </Link>
                      <p className="text-primary font-bold mt-1">
                        £{parseFloat(price.amount).toFixed(2)}
                      </p>
                      {shopOpen && (
                        <Button
                          onClick={() => handleAddToCart(product)}
                          disabled={isCartLoading}
                          className="w-full mt-3 bg-gold-gradient text-primary-foreground font-display text-xs tracking-wider hover:opacity-90"
                          size="sm"
                        >
                          {isCartLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Cart"}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
