import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Sparkles, ShieldCheck, Truck } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { ProductCard, ProductCardSkeleton } from "@/components/site/ProductCard";
import { fetchFeatured } from "@/lib/queries";
import heroShoe from "@/assets/hero-sneaker.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LUKU LEGIT — Premium Thrift Kicks" },
      { name: "description", content: "Authentic thrifted sneakers, heels & kids shoes. Nike, Adidas, Jordan, Vans and more — at prices that hit." },
      { property: "og:title", content: "LUKU LEGIT — Premium Thrift Kicks" },
      { property: "og:description", content: "Authentic Heat.No Replicas. Affordable prices. Shop now." },
    ],
  }),
  component: Index,
});

function Index() {
  const featured = useQuery({ queryKey: ["featured"], queryFn: fetchFeatured });
  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/3 -left-32 size-[500px] rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-32 right-0 size-[500px] rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 pt-12 pb-20 lg:pt-20 lg:pb-32 grid lg:grid-cols-2 gap-8 items-center">
          <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.7}}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium">
              <Sparkles className="size-3 text-primary"/> Fresh drops weekly
            </span>
            <h1 className="display-font mt-5 text-5xl lg:text-7xl font-bold leading-[0.95] tracking-tight">
              Premium <span className="gradient-text">Thrift Kicks.</span><br/>
              Authentic Style.<br/>
              <span className="text-muted-foreground text-3xl lg:text-5xl">Affordable Prices.</span>
            </h1>
            <p className="mt-6 text-base lg:text-lg text-muted-foreground max-w-xl">
              Hand-picked authentic sneakers, heels and kids shoes. Same energy as retail — without the retail tax.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" search={{cat:"all"}}
                className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-xl font-semibold shadow-[var(--neon-glow)] hover:scale-[1.03] transition">
                Shop Now <ArrowRight className="size-4 group-hover:translate-x-1 transition"/>
              </Link>
              <Link to="/shop" search={{cat:"all"}}
                className="inline-flex items-center gap-2 glass px-6 py-3.5 rounded-xl font-semibold hover:text-primary transition">
                New Arrivals
              </Link>
              <a href="https://wa.me/254700408174" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 glass px-6 py-3.5 rounded-xl font-semibold hover:text-primary transition">
                <MessageCircle className="size-4"/> WhatsApp
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary"/> 100% Authentic</div>
              <div className="flex items-center gap-2"><Truck className="size-4 text-primary"/> Nationwide delivery</div>
              <div className="flex items-center gap-2"><Sparkles className="size-4 text-primary"/> Curated condition</div>
            </div>
          </motion.div>

          <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{duration:0.8,delay:0.2}}
            className="relative aspect-square">
            <div className="absolute inset-0 grid place-items-center">
              <div className="size-[80%] rounded-full border border-primary/30 animate-spin-slow" />
              <div className="absolute size-[60%] rounded-full border border-primary/20 animate-spin-slow" style={{animationDirection:"reverse"}} />
              <div className="absolute size-[40%] rounded-full bg-primary/10 blur-2xl" />
            </div>
            <img src={heroShoe} alt="Featured sneaker" width={1024} height={1024}
              className="relative z-10 w-full h-full object-contain animate-float drop-shadow-[0_30px_60px_oklch(0.88_0.27_150/0.4)]" />
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {cat:"kids",title:"KIDS",sub:"Sizes 25–35",blurb:"School, sport, sandals"},
            {cat:"ladies",title:"LADIES",sub:"Heels • Sneakers • Boots",blurb:"Sized 36–41"},
            {cat:"men",title:"MEN",sub:"Sizes 39–46",blurb:"Sneakers • Boots • Loafers • Oxford"},
          ].map((c,i)=>(
            <motion.div key={c.cat} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}}>
              <Link to="/shop" search={{cat:c.cat as any}}
                className="block relative overflow-hidden rounded-2xl glass p-8 hover-lift group h-full">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{c.sub}</p>
                <h3 className="display-font text-4xl font-bold mt-2 group-hover:gradient-text transition">{c.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{c.blurb}</p>
                <ArrowRight className="absolute bottom-6 right-6 size-6 group-hover:translate-x-1 group-hover:text-primary transition"/>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Trending</p>
            <h2 className="display-font text-3xl lg:text-5xl font-bold mt-2">Featured Drops</h2>
          </div>
          <Link to="/shop" search={{cat:"all"}} className="text-sm font-medium hover:text-primary">View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
          {featured.isLoading
            ? Array.from({length:8}).map((_,i)=><ProductCardSkeleton key={i}/>)
            : featured.data?.map((p,i)=><ProductCard key={p.id} product={p} index={i}/>)
          }
        </div>
      </section>
    </SiteShell>
  );
}
