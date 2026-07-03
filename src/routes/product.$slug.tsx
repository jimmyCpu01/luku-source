import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Share2 } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site/SiteShell";
import { fetchProductBySlug } from "@/lib/queries";
import { useCart, formatKES } from "@/lib/cart";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = useParams({ from: "/product/$slug" });
  const cart = useCart();
  const { data: p, isLoading } = useQuery({ queryKey: ["product", slug], queryFn: () => fetchProductBySlug(slug) });
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  if (isLoading) return <SiteShell><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div></SiteShell>;
  if (!p) return <SiteShell><div className="container mx-auto px-4 py-20 text-center">Product not found.</div></SiteShell>;

  const img = p.images?.[0] || "/src/assets/shoe-1.jpg";
  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-10 grid lg:grid-cols-2 gap-10">
        <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className="glass rounded-3xl aspect-square grid place-items-center overflow-hidden">
          <img src={img} alt={p.name} className="w-full h-full object-contain p-10 animate-float"/>
        </motion.div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">{p.brand} • {p.condition}</p>
          <h1 className="display-font text-4xl lg:text-5xl font-bold mt-2">{p.name}</h1>
          <p className="mt-4 text-3xl font-bold neon-text">{formatKES(p.price)}</p>
          <p className="mt-6 text-muted-foreground">{p.description}</p>

          <div className="mt-8">
            <p className="text-sm font-semibold mb-2">Size</p>
            <div className="flex flex-wrap gap-2">
              {p.sizes.map(s => (
                <button key={s} onClick={()=>setSize(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${size===s?"bg-primary text-primary-foreground border-primary shadow-[var(--neon-glow)]":"glass border-border hover:border-primary"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center glass rounded-xl">
              <button onClick={()=>setQty(q=>Math.max(1,q-1))} className="px-4 py-3">−</button>
              <span className="px-4 font-semibold">{qty}</span>
              <button onClick={()=>setQty(q=>q+1)} className="px-4 py-3">+</button>
            </div>
            <button onClick={()=>{
              if (p.sold_out) { toast.error("This item is sold out"); return; }
              if (!size) { toast.error("Pick a size"); return; }
              cart.add({ product_id: p.id, slug: p.slug, name: p.name, image: img, price: p.price, size, qty });
              toast.success("Added to cart");
            }}
              disabled={p.sold_out}
              className="flex-1 inline-flex justify-center items-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-xl font-semibold shadow-[var(--neon-glow)] hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
              <ShoppingBag className="size-4"/> {p.sold_out ? "Sold Out" : "Add to Cart"}
            </button>
            <button className="size-12 grid place-items-center glass rounded-xl hover:text-primary"><Heart className="size-5"/></button>
            <button className="size-12 grid place-items-center glass rounded-xl hover:text-primary"><Share2 className="size-5"/></button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}