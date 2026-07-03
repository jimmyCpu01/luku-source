import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/shoppers")({
  component: AdminShoppers,
});

function AdminShoppers() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-shoppers"],
    queryFn: async () => (await supabase.from("shoppers").select("id, username, phone, last_login_at, created_at, blocked").order("last_login_at",{ascending:false})).data ?? [],
  });

  async function toggleBlock(id: string, blocked: boolean) {
    const { error } = await supabase.from("shoppers").update({ blocked: !blocked }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(!blocked ? "Blocked" : "Unblocked");
    qc.invalidateQueries({ queryKey: ["admin-shoppers"] });
  }

  return (
    <div>
      <h2 className="display-font text-2xl font-bold mb-4">Shoppers ({data?.length ?? 0})</h2>
      <div className="glass rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-3">Username</th><th className="p-3">Phone</th><th className="p-3">Last seen</th><th className="p-3">Joined</th><th className="p-3">Status</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {data?.map((s:any)=>(
              <tr key={s.id} className="border-t border-border/40">
                <td className="p-3 font-semibold">{s.username}</td>
                <td className="p-3"><a href={`tel:${s.phone}`} className="text-primary">{s.phone}</a></td>
                <td className="p-3 text-xs text-muted-foreground">{s.last_login_at ? new Date(s.last_login_at).toLocaleString() : "—"}</td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${s.blocked?"bg-destructive text-destructive-foreground":"glass"}`}>{s.blocked?"BLOCKED":"ACTIVE"}</span></td>
                <td className="p-3"><button onClick={()=>toggleBlock(s.id, s.blocked)} className="text-xs px-3 py-1.5 rounded-lg glass hover:text-primary">{s.blocked?"Unblock":"Block"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}