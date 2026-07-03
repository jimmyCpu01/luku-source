import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";
import { SiteShell } from "@/components/site/SiteShell";
import { useCart, formatKES } from "@/lib/cart";
import { useShopper } from "@/lib/session";
import { createOrder } from "@/lib/shopper.functions";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — LUKU LEGIT" }] }),
  component: CheckoutPage,
});

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^(\+?254|0)?7\d{8}$/, "Valid KE phone required"),
  address: z.string().trim().min(5).max(300),
  notes: z.string().trim().max(500).optional(),
  mpesa_ref: z.string().trim().min(6, "Enter your M-Pesa reference").max(20),
});

const SHIPPING = 300;

function normalizePhone(phone: string) {
  const p = phone.replace(/\s+/g, "");
  if (p.startsWith("+254")) return p.slice(1);
  if (p.startsWith("254")) return p;
  if (p.startsWith("0")) return "254" + p.slice(1);
  return "254" + p;
}

function CheckoutPage() {
  const cart = useCart();
  const shopper = useShopper();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: shopper?.username ?? "", phone: shopper?.phone ?? "", address: "", notes: "", mpesa_ref: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const total = cart.subtotal + (cart.subtotal > 0 ? SHIPPING : 0);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cart.items.length === 0) { toast.error("Cart is empty"); return; }
    if (!shopper?.token) { toast.error("Please sign in to place an order"); navigate({ to: "/login" }); return; }
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    try {
      const result = await createOrder({
        data: {
          shopperId: shopper.id,
          token: shopper.token,
          name: parsed.data.name,
          phone: normalizePhone(parsed.data.phone),
          address: parsed.data.address,
          notes: parsed.data.notes,
          mpesa_ref: parsed.data.mpesa_ref,
          items: cart.items.map(i => ({
            product_id: i.product_id, slug: i.slug, name: i.name,
            image: i.image, size: i.size, qty: i.qty,
          })),
        },
      });
      cart.clear();
      setDone(result.order_number);
    } catch (err: any) {
      toast.error(err.message ?? "Could not place order");
    } finally { setLoading(false); }
  }

  if (done) {
    return <SiteShell>
      <section className="container mx-auto px-4 py-20 max-w-md text-center">
        <motion.div initial={{scale:0}} animate={{scale:1}} className="size-20 mx-auto rounded-full bg-primary/20 grid place-items-center">
          <CheckCircle2 className="size-12 text-primary"/>
        </motion.div>
        <h1 className="display-font text-3xl font-bold mt-6">Order Placed!</h1>
        <p className="text-muted-foreground mt-2">Order number</p>
        <p className="neon-text text-3xl font-bold mt-1">{done}</p>
        <p className="text-sm text-muted-foreground mt-4">We'll confirm your M-Pesa and update you on WhatsApp.</p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link to="/track" search={{no: done}} className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold">Track order</Link>
          <Link to="/shop" search={{cat:"all"}} className="px-5 py-3 rounded-xl glass">Keep shopping</Link>
        </div>
      </section>
    </SiteShell>;
  }

  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-10 max-w-5xl">
        <h1 className="display-font text-4xl font-bold">Checkout</h1>
        {cart.items.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center mt-8">
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link to="/shop" search={{cat:"all"}} className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold">Shop</Link>
          </div>
        ) : (
        <div className="mt-8 grid lg:grid-cols-[1fr_380px] gap-8">
          <form onSubmit={placeOrder} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" v={form.name} on={v=>setForm({...form,name:v})}/>
              <Field label="Phone (M-Pesa)" v={form.phone} on={v=>setForm({...form,phone:v})}/>
            </div>
            <Field label="Delivery address" v={form.address} on={v=>setForm({...form,address:v})}/>
            <Field label="Notes (optional)" v={form.notes} on={v=>setForm({...form,notes:v})}/>
            <div className="glass rounded-2xl p-5">
              <p className="font-semibold">Pay via M-PESA Till</p>
              <p className="neon-text text-2xl font-bold mt-1">6699212</p>
              <p className="text-xs text-muted-foreground mt-1">Send {formatKES(total)} then paste the M-Pesa reference below.</p>
              <div className="mt-3"><Field label="M-Pesa reference" v={form.mpesa_ref} on={v=>setForm({...form,mpesa_ref:v.toUpperCase()})}/></div>
            </div>
            <button disabled={loading} className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-[var(--neon-glow)] disabled:opacity-60">
              {loading ? "Placing order…" : `Place order — ${formatKES(total)}`}
            </button>
          </form>
          <div className="glass rounded-2xl p-6 h-fit sticky top-24 space-y-2">
            <h3 className="font-semibold mb-2">Order summary</h3>
            {cart.items.map(i=>(
              <div key={i.product_id+i.size} className="flex justify-between text-sm">
                <span className="truncate pr-2">{i.qty}× {i.name} <span className="text-muted-foreground">/{i.size}</span></span>
                <span>{formatKES(i.price*i.qty)}</span>
              </div>
            ))}
            <div className="border-t border-border/40 my-3"/>
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatKES(cart.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span>Shipping</span><span>{formatKES(SHIPPING)}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2"><span>Total</span><span className="neon-text">{formatKES(total)}</span></div>
          </div>
        </div>
        )}
      </section>
    </SiteShell>
  );
}

function Field({label,v,on}:{label:string;v:string;on:(v:string)=>void}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input value={v} onChange={e=>on(e.target.value)}
        className="mt-1 w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"/>
    </label>
  );
}