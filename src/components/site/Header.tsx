import { Link } from "@tanstack/react-router";
import { ShoppingBag, Search, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useShopper } from "@/lib/session";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop", search: { cat: "all" as const } },
  { to: "/shop", label: "Men", search: { cat: "men" as const } },
  { to: "/shop", label: "Ladies", search: { cat: "ladies" as const } },
  { to: "/shop", label: "Kids", search: { cat: "kids" as const } },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const { count } = useCart();
  const shopper = useShopper();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/40">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="size-9 rounded-md bg-primary grid place-items-center font-bold text-primary-foreground shadow-[var(--neon-glow)] group-hover:scale-110 transition">L</div>
          <span className="display-font text-xl font-bold tracking-tight">LUKU <span className="gradient-text">LEGIT</span></span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map(l => (
            <Link key={l.label} to={l.to as any} search={l.search as any}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative"
              activeProps={{ className: "text-primary" }}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/shop" search={{ cat: "all" }} className="p-2 hover:text-primary transition" aria-label="Search"><Search className="size-5" /></Link>
          <Link to={shopper ? "/account" : "/login"} className="p-2 hover:text-primary transition" aria-label="Account">
            <User className="size-5" />
          </Link>
          <Link to="/cart" className="p-2 hover:text-primary transition relative" aria-label="Cart">
            <ShoppingBag className="size-5" />
            {count > 0 && <span className="absolute -top-0.5 -right-0.5 size-5 grid place-items-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full">{count}</span>}
          </Link>
          <button onClick={() => setOpen(o => !o)} className="lg:hidden p-2" aria-label="Menu">
            {open ? <X className="size-5"/> : <Menu className="size-5"/>}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
            className="lg:hidden border-t border-border/40 overflow-hidden">
            <div className="container mx-auto px-4 py-3 flex flex-col">
              {links.map(l => (
                <Link key={l.label} to={l.to as any} search={l.search as any} onClick={()=>setOpen(false)}
                  className="py-2.5 text-sm font-medium hover:text-primary">{l.label}</Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}