import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatKES } from "@/lib/cart";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["pending","paid","confirmed","processing","shipped","delivered","cancelled"];

function AdminOrders() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*, payments(*)").order("created_at",{ascending:false})).data ?? [],
  });

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  return (
    <div>
      <h2 className="display-font text-2xl font-bold mb-4">All Orders ({data?.length ?? 0})</h2>
      <div className="space-y-3">
        {data?.map((o:any)=>(
          <div key={o.id} className="glass rounded-2xl p-5">
            <div className="flex flex-wrap justify-between gap-3 items-start">
              <div>
                <p className="font-bold">{o.order_number}</p>
                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
              </div>
              <p className="neon-text font-bold text-lg">{formatKES(Number(o.total))}</p>
            </div>
            <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p><span className="text-muted-foreground">Customer:</span> {o.customer_name}</p>
                <p><span className="text-muted-foreground">Phone:</span> <a href={`tel:${o.customer_phone}`} className="text-primary">{o.customer_phone}</a></p>
                <p><span className="text-muted-foreground">Address:</span> {o.customer_address}</p>
                {o.notes && <p className="text-xs italic text-muted-foreground mt-1">{o.notes}</p>}
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Items:</p>
                <ul className="text-xs space-y-1">
                  {(o.items as any[]).map((it,i)=>(<li key={i}>{it.qty}× {it.name} · /{it.size}</li>))}
                </ul>
                {o.payments?.[0] && (
                  <p className="mt-2 text-xs"><span className="text-muted-foreground">M-Pesa ref:</span> <span className="font-mono">{o.payments[0].reference}</span></p>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button key={s} onClick={()=>setStatus(o.id,s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase transition ${o.status===s?"bg-primary text-primary-foreground":"glass hover:text-primary"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
        {data?.length === 0 && <p className="glass rounded-xl p-8 text-center text-muted-foreground">No orders yet.</p>}
      </div>
    </div>
  );
}