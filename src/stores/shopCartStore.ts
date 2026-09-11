import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ShopCartItem {
  product_id: string;
  name: string;
  price_cents: number;
  image_url: string | null;
  size: string | null;
  initials: string | null;
  quantity: number;
}

interface ShopCartState {
  items: ShopCartItem[];
  addItem: (item: Omit<ShopCartItem, "quantity">, quantity?: number) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clear: () => void;
}

export function cartItemKey(item: Pick<ShopCartItem, "product_id" | "size" | "initials">): string {
  return `${item.product_id}::${item.size || ""}::${item.initials || ""}`;
}

export const useShopCartStore = create<ShopCartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, quantity = 1) =>
        set((state) => {
          const key = cartItemKey(item);
          const existing = state.items.find((i) => cartItemKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartItemKey(i) === key ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),
      removeItem: (key) => set((state) => ({ items: state.items.filter((i) => cartItemKey(i) !== key) })),
      updateQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => cartItemKey(i) !== key)
              : state.items.map((i) => (cartItemKey(i) === key ? { ...i, quantity } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "pafc-shop-cart" }
  )
);
