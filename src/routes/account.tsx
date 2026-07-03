import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { useShopper, setShopper } from "@/lib/session";
import { getMyOrders } from "@/lib/shopper.functions";
import { formatKES } from "@/lib/cart";
import { LogOut, Package, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account — LUKU LEGIT" }] }),
  component: AccountPage,
});

function AccountPage() {
  const shopper = useShopper();
  const navigate = useNavigate();
  useEffect(() => { if (shopper === null) { /* may be initial null while loading */ } }, [shopper]);

  const orders = useQuery({
    queryKey: ["my-orders", shopper?.id],
    enabled: !!shopper?.token,
    queryFn: async () =>
      getMyOrders({ data: { shopperId: shopper!.id, token: shopper!.token! } }),
  });

  if (!shopper) {
    return <SiteShell><section className="container mx-auto px-4 py-16 max-w-md text-center">
      <p className="text-muted-foreground">Not signed in.</p>
      <Link to="/login" className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold">Sign in</Link>
    </section></SiteShell>;
  }

  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="glass rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary">Welcome back</p>
            <h1 className="display-font text-3xl font-bold">{shopper.username}</h1>
            <p className="text-sm text-muted-foreground">{shopper.phone}</p>
          </div>
          <button onClick={()=>{ setShopper(null); navigate({to:"/"}); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass hover:text-destructive">
            <LogOut className="size-4"/> Sign out
          </button>
        </div>

        <h2 className="display-font text-2xl font-bold mt-10 mb-4 flex items-center gap-2"><Package className="size-5 text-primary"/> Your Orders</h2>
        {orders.isLoading ? <p className="text-muted-foreground">Loading…</p> :
         orders.data?.length ? (
          <div className="space-y-3">
            {orders.data.map((o:any)=>(
              <Link key={o.id} to="/track" search={{ no: o.order_number }} className="block glass rounded-xl p-4 hover:border-primary border border-transparent transition">
                <div className="flex justify-between"><span className="font-semibold">{o.order_number}</span><span className="text-primary font-bold">{formatKES(Number(o.total))}</span></div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1"><span className="uppercase">{o.status}</span><span>{new Date(o.created_at).toLocaleDateString()}</span></div>
              </Link>
            ))}
          </div>
         ) : <p className="text-muted-foreground glass rounded-xl p-6">No orders yet.</p>}

        <div className="mt-10 glass rounded-2xl p-6 flex items-center gap-4">
          <MessageCircle className="size-6 text-primary"/>
          <div className="flex-1">
            <p className="font-semibold">Need help?</p>
            <p className="text-sm text-muted-foreground">Chat with us on WhatsApp or visit support.</p>
          </div>
          <Link to="/support" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold">Support</Link>
        </div>
      </section>
    </SiteShell>
  );
}