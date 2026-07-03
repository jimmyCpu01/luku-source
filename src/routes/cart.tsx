import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useCart, formatKES } from "@/lib/cart";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const cart = useCart();
  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="display-font text-4xl font-bold">Your Cart</h1>
        {cart.items.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center mt-8">
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link to="/shop" search={{cat:"all"}} className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold">Shop now</Link>
          </div>
        ) : (
          <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-3">
              {cart.items.map(i => (
                <div key={i.product_id+i.size} className="glass rounded-xl p-3 flex gap-4 items-center">
                  <img src={i.image} alt={i.name} className="size-20 object-contain bg-secondary/30 rounded-lg"/>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{i.name}</p>
                    <p className="text-xs text-muted-foreground">Size {i.size}</p>
                    <p className="text-primary font-bold mt-1">{formatKES(i.price)}</p>
                  </div>
                  <div className="flex items-center glass rounded-lg">
                    <button onClick={()=>cart.update(i.product_id,i.size,i.qty-1)} className="px-3 py-1.5">−</button>
                    <span className="px-2 text-sm font-semibold">{i.qty}</span>
                    <button onClick={()=>cart.update(i.product_id,i.size,i.qty+1)} className="px-3 py-1.5">+</button>
                  </div>
                  <button onClick={()=>cart.remove(i.product_id,i.size)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="size-4"/></button>
                </div>
              ))}
            </div>
            <div className="glass rounded-2xl p-6 h-fit sticky top-24">
              <div className="flex justify-between mb-2"><span>Subtotal</span><span className="font-semibold">{formatKES(cart.subtotal)}</span></div>
              <div className="flex justify-between mb-2 text-sm text-muted-foreground"><span>Shipping</span><span>At checkout</span></div>
              <div className="border-t border-border/40 my-4"/>
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="neon-text">{formatKES(cart.subtotal)}</span></div>
              <Link to="/checkout" className="mt-5 w-full inline-flex justify-center items-center bg-primary text-primary-foreground px-6 py-3.5 rounded-xl font-semibold shadow-[var(--neon-glow)]">Checkout</Link>
            </div>
          </div>
        )}
      </section>
    </SiteShell>
  );
}