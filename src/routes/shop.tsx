import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { SiteShell } from "@/components/site/SiteShell";
import { ProductCard, ProductCardSkeleton } from "@/components/site/ProductCard";
import { fetchProducts } from "@/lib/queries";

const schema = z.object({
  cat: fallback(z.enum(["all","kids","ladies","men"]), "all").default("all"),
  type: fallback(z.string().optional(), undefined).default(undefined as any),
});

export const Route = createFileRoute("/shop")({
  validateSearch: zodValidator(schema),
  head: () => ({ meta: [{ title: "Shop — LUKU LEGIT" }, { name: "description", content: "Browse curated thrift sneakers, heels and kids shoes." }] }),
  component: Shop,
});

const tabs = [
  { v: "all", label: "All" },
  { v: "men", label: "Men" },
  { v: "ladies", label: "Ladies" },
  { v: "kids", label: "Kids" },
] as const;

const typesByCat: Record<string, { v: string; label: string }[]> = {
  men: [
    { v: "sneakers", label: "Sneakers" },
    { v: "boots", label: "Boots" },
    { v: "loafers", label: "Loafers" },
    { v: "oxford", label: "Oxford" },
    { v: "derby", label: "Derby" },
    { v: "sandals", label: "Sandals" },
    { v: "slippers", label: "Slippers" },
    { v: "running", label: "Running" },
    { v: "casual", label: "Casual" },
    { v: "formal", label: "Formal" },
  ],
  ladies: [
    { v: "heels", label: "Heels" },
    { v: "sneakers", label: "Sneakers" },
    { v: "boots", label: "Boots" },
    { v: "flats", label: "Flats" },
    { v: "sandals", label: "Sandals" },
  ],
  kids: [
    { v: "school", label: "School" },
    { v: "sport", label: "Sport" },
    { v: "sandals", label: "Sandals" },
    { v: "casual", label: "Casual" },
  ],
};

function Shop() {
  const { cat, type } = Route.useSearch();
  const q = useQuery({ queryKey: ["products", cat, type], queryFn: () => fetchProducts(cat, type) });
  const subTypes = cat !== "all" ? typesByCat[cat] : undefined;
  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-10">
        <h1 className="display-font text-4xl lg:text-6xl font-bold">{cat === "all" ? "All Kicks" : cat === "men" ? "MEN'S" : cat.toUpperCase()}</h1>
        <p className="text-muted-foreground mt-2">Hand-picked. Verified. Ready to ship.</p>
        <div className="mt-6 flex gap-2 flex-wrap">
          {tabs.map(t => (
            <Link key={t.v} to="/shop" search={{ cat: t.v }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${cat===t.v?"bg-primary text-primary-foreground shadow-[var(--neon-glow)]":"glass hover:text-primary"}`}>
              {t.label}
            </Link>
          ))}
        </div>
        {subTypes && (
          <div className="mt-3 flex gap-2 flex-wrap">
            <Link to="/shop" search={{ cat }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${!type?"bg-primary/20 text-primary border border-primary/40":"glass hover:text-primary"}`}>
              All types
            </Link>
            {subTypes.map(t => (
              <Link key={t.v} to="/shop" search={{ cat, type: t.v }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${type===t.v?"bg-primary/20 text-primary border border-primary/40":"glass hover:text-primary"}`}>
                {t.label}
              </Link>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5 mt-8">
          {q.isLoading ? Array.from({length:8}).map((_,i)=><ProductCardSkeleton key={i}/>) :
            q.data?.length ? q.data.map((p,i)=><ProductCard key={p.id} product={p} index={i}/>) :
            <p className="col-span-full text-center py-20 text-muted-foreground">No products yet in this category.</p>
          }
        </div>
      </section>
    </SiteShell>
  );
}