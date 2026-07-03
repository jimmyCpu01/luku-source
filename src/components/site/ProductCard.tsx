import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatKES, useCart } from "@/lib/cart";
import { toast } from "sonner";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const cart = useCart();
  const img = product.images?.[0] || "/src/assets/shoe-1.jpg";
  const discounted = product.discount_pct > 0 ? product.price * (1 - product.discount_pct / 100) : product.price;
  const soldOut = product.sold_out;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: (index % 8) * 0.04 }}
      className="group relative glass rounded-2xl overflow-hidden hover-lift">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
        <div className="relative aspect-square overflow-hidden bg-secondary/30">
          <img src={img} alt={product.name} loading="lazy"
            className="w-full h-full object-contain p-6 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-[-4deg]" />
          {product.featured && <span className="absolute top-3 left-3 px-2 py-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-md">FEATURED</span>}
          {product.discount_pct > 0 && <span className="absolute top-3 right-3 px-2 py-1 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-md">-{product.discount_pct}%</span>}
          {soldOut && <span className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm text-sm font-bold tracking-wider text-destructive">SOLD OUT</span>}
        </div>
        <div className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{product.brand || product.subcategory}</p>
          <h3 className="font-semibold mt-0.5 line-clamp-1">{product.name}</h3>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-bold text-primary">{formatKES(discounted)}</span>
            <span className="text-[11px] text-muted-foreground">{product.condition}</span>
          </div>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          if (soldOut) { toast.error("Sold out"); return; }
          const size = product.sizes[0] || "—";
          cart.add({ product_id: product.id, slug: product.slug, name: product.name, image: img, price: discounted, size, qty: 1 });
          toast.success("Added to cart");
        }}
        disabled={soldOut}
        className="absolute bottom-4 right-4 size-10 rounded-full bg-primary text-primary-foreground grid place-items-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition shadow-[var(--neon-glow)] disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Add to cart">
        <ShoppingBag className="size-4" />
      </button>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-1/3 skeleton rounded" />
        <div className="h-4 w-2/3 skeleton rounded" />
        <div className="h-4 w-1/4 skeleton rounded" />
      </div>
    </div>
  );
}