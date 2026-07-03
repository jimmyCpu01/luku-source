import { useEffect, useState } from "react";
import type { Shopper } from "./types";

const KEY = "luku_shopper";

export function getShopper(): Shopper | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}

export function setShopper(s: Shopper | null) {
  if (typeof window === "undefined") return;
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("luku-shopper-change"));
}

export function useShopper() {
  const [shopper, setLocal] = useState<Shopper | null>(null);
  useEffect(() => {
    setLocal(getShopper());
    const h = () => setLocal(getShopper());
    window.addEventListener("luku-shopper-change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("luku-shopper-change", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return shopper;
}