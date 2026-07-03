import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: AdminReviews,
});

function AdminReviews() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => (await supabase.from("reviews").select("*, products(name)").order("created_at",{ascending:false})).data ?? [],
  });

  async function moderate(id: string, status: "approved"|"rejected") {
    const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  }

  return (
    <div>
      <h2 className="display-font text-2xl font-bold mb-4">Reviews ({data?.length ?? 0})</h2>
      <div className="space-y-3">
        {data?.map((r:any)=>(
          <div key={r.id} className="glass rounded-2xl p-5">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold">{r.shopper_name ?? "Anonymous"} <span className="text-muted-foreground text-xs">on {r.products?.name}</span></p>
                <div className="flex gap-0.5 mt-1">{Array.from({length:5}).map((_,i)=><Star key={i} className={`size-4 ${i<r.rating?"fill-primary text-primary":"text-muted-foreground"}`}/>)}</div>
                {r.body && <p className="text-sm text-muted-foreground mt-2">{r.body}</p>}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs uppercase h-fit ${r.status==="approved"?"bg-primary text-primary-foreground":r.status==="rejected"?"bg-destructive text-destructive-foreground":"glass"}`}>{r.status}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={()=>moderate(r.id,"approved")} className="text-xs px-3 py-1.5 rounded-lg glass hover:text-primary">Approve</button>
              <button onClick={()=>moderate(r.id,"rejected")} className="text-xs px-3 py-1.5 rounded-lg glass hover:text-destructive">Reject</button>
            </div>
          </div>
        ))}
        {data?.length === 0 && <p className="glass rounded-xl p-8 text-center text-muted-foreground">No reviews yet.</p>}
      </div>
    </div>
  );
}