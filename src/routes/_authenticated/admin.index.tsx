import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatKES } from "@/lib/cart";
import { Package, ShoppingCart, Users, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [orders, products, shoppers, chats] = await Promise.all([
        supabase.from("orders").select("total,status,created_at"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("shoppers").select("id", { count: "exact", head: true }),
        supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("sender", "user").eq("read", false),
      ]);
      const o = orders.data ?? [];
      const revenue = o.filter(x=>["paid","confirmed","processing","shipped","delivered"].includes(x.status)).reduce((s:any,x:any)=>s+Number(x.total),0);
      const pending = o.filter(x=>x.status === "pending").length;
      return {
        revenue, pending, total: o.length,
        products: products.count ?? 0, shoppers: shoppers.count ?? 0,
        unread: chats.count ?? 0,
      };
    },
  });

  const recent = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at",{ascending:false}).limit(8);
      return data ?? [];
    },
  });

  const cards = [
    { Icon: ShoppingCart, label: "Revenue", value: stats.data ? formatKES(stats.data.revenue) : "—" },
    { Icon: Package, label: "Pending orders", value: stats.data?.pending ?? "—" },
    { Icon: Users, label: "Shoppers", value: stats.data?.shoppers ?? "—" },
    { Icon: MessageSquare, label: "Unread chats", value: stats.data?.unread ?? "—" },
  ];

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c=>(
          <div key={c.label} className="glass rounded-2xl p-5">
            <c.Icon className="size-5 text-primary"/>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-3">{c.label}</p>
            <p className="display-font text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>
      <h2 className="display-font text-2xl font-bold mt-10 mb-4">Recent Orders</h2>
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">When</th></tr>
          </thead>
          <tbody>
            {recent.data?.map((o:any)=>(
              <tr key={o.id} className="border-t border-border/40">
                <td className="p-3 font-semibold">{o.order_number}</td>
                <td className="p-3">{o.customer_name}<br/><span className="text-xs text-muted-foreground">{o.customer_phone}</span></td>
                <td className="p-3 text-primary font-bold">{formatKES(Number(o.total))}</td>
                <td className="p-3"><span className="px-2 py-1 rounded-full glass text-xs uppercase">{o.status}</span></td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {recent.data?.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}