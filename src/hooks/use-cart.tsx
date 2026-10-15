import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  key: string;
  product_id: string;
  slug: string;
  name: string;
  image?: string;
  unit_price: number; // apenas para exibição; o servidor recalcula
  quantity: number;
  options: Record<string, string>; // option_id -> valor
  option_labels: { name: string; value: string }[];
};

type Cart = {
  items: CartItem[];
  add: (item: Omit<CartItem, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<Cart | null>(null);
const KEY = "lumen-carrinho";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignora */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const value: Cart = {
    items,
    add: (item) => {
      const key = item.product_id + JSON.stringify(item.options);
      setItems((prev) => {
        const found = prev.find((i) => i.key === key);
        if (found) return prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(1000, i.quantity + item.quantity) } : i));
        return [...prev, { ...item, key }];
      });
    },
    setQty: (key, qty) =>
      setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(1000, qty)) } : i))),
    remove: (key) => setItems((prev) => prev.filter((i) => i.key !== key)),
    clear: () => setItems([]),
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: items.reduce((s, i) => s + i.unit_price * i.quantity, 0),
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart fora do CartProvider");
  return c;
}
