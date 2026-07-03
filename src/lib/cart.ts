import { useEffect, useState } from "react";
import type { CartItem } from "./types";

const KEY = "luku_cart";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("luku-cart-change"));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    setItems(read());
    const h = () => setItems(read());
    window.addEventListener("luku-cart-change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("luku-cart-change", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  return {
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: items.reduce((n, i) => n + i.price * i.qty, 0),
    add(item: CartItem) {
      const current = read();
      const idx = current.findIndex(c => c.product_id === item.product_id && c.size === item.size);
      if (idx >= 0) current[idx].qty += item.qty;
      else current.push(item);
      write(current);
    },
    update(product_id: string, size: string, qty: number) {
      const current = read().map(c => c.product_id === product_id && c.size === size ? { ...c, qty } : c).filter(c => c.qty > 0);
      write(current);
    },
    remove(product_id: string, size: string) {
      write(read().filter(c => !(c.product_id === product_id && c.size === size)));
    },
    clear() { write([]); },
  };
}

export function formatKES(n: number) {
  return `KSh ${n.toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;
}