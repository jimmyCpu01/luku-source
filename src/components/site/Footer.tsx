import { Link } from "@tanstack/react-router";
import { Instagram, Phone, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/40 bg-card/40">
      <div className="container mx-auto px-4 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <div className="display-font text-xl font-bold">LUKU <span className="gradient-text">LEGIT</span></div>
          <p className="mt-3 text-sm text-muted-foreground">Premium thrift kicks. Authentic style. Affordable prices.</p>
          <div className="mt-4 flex gap-3">
            <a href="https://wa.me/254700408174" target="_blank" rel="noreferrer" className="size-9 grid place-items-center rounded-full glass hover:text-primary"><MessageCircle className="size-4"/></a>
            <a href="https://instagram.com/llegit_gang" target="_blank" rel="noreferrer" className="size-9 grid place-items-center rounded-full glass hover:text-primary"><Instagram className="size-4"/></a>
            <a href="tel:0700408174" className="size-9 grid place-items-center rounded-full glass hover:text-primary"><Phone className="size-4"/></a>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop" search={{cat:"kids"}} className="hover:text-primary">Kids Collection</Link></li>
            <li><Link to="/shop" search={{cat:"ladies"}} className="hover:text-primary">Ladies Footwear</Link></li>
            <li><Link to="/shop" search={{cat:"men"}} className="hover:text-primary">Men's Collection</Link></li>
            <li><Link to="/shop" search={{cat:"all"}} className="hover:text-primary">All Products</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Help</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link to="/returns" className="hover:text-primary">Returns</Link></li>
            <li><Link to="/terms" className="hover:text-primary">Terms & Privacy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Payment</h4>
          <p className="text-sm text-muted-foreground">M-PESA Till</p>
          <p className="text-2xl font-bold neon-text mt-1">6699212</p>
          <p className="text-xs text-muted-foreground mt-2">Pay then upload your reference at checkout.</p>
        </div>
      </div>
      <div className="border-t border-border/40 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Luku Legit. Built for the streets.
      </div>
    </footer>
  );
}