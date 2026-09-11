import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trash2, Minus, Plus, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useShopCartStore, cartItemKey } from "@/stores/shopCartStore";

export function ShopCartDrawer() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity } = useShopCartStore();

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalCents = items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 text-foreground hover:text-primary transition-colors" aria-label="Open basket">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display tracking-wider uppercase">Your Basket</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Your basket is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {items.map((item) => {
                const key = cartItemKey(item);
                return (
                  <div key={key} className="flex gap-3 bg-card border border-border rounded-lg p-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-16 h-16 object-contain bg-white rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-secondary rounded flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm font-bold truncate">{item.name}</p>
                      <div className="text-xs text-muted-foreground">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.size && item.initials && <span> · </span>}
                        {item.initials && <span>Initials: {item.initials}</span>}
                      </div>
                      <p className="text-primary font-bold text-sm mt-1">£{((item.price_cents * item.quantity) / 100).toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity(key, item.quantity - 1)} className="p-1 rounded border border-border hover:border-primary" aria-label="Decrease quantity">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(key, item.quantity + 1)} className="p-1 rounded border border-border hover:border-primary" aria-label="Increase quantity">
                          <Plus className="h-3 w-3" />
                        </button>
                        <button onClick={() => removeItem(key)} className="ml-auto p-1 text-muted-foreground hover:text-destructive" aria-label="Remove item">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between font-display text-lg">
                <span>Total</span>
                <span className="text-primary font-bold">£{(totalCents / 100).toFixed(2)}</span>
              </div>
              <Button
                className="w-full bg-gold-gradient text-primary-foreground font-display tracking-wider hover:opacity-90"
                onClick={() => { setOpen(false); navigate("/shop/checkout"); }}
              >
                Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
