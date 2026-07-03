import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteShell } from "@/components/site/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { claimFirstAdmin, isCallerAdmin } from "@/lib/admin.functions";
import { LogOut, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminShell,
});

const tabs = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/shoppers", label: "Shoppers" },
  { to: "/admin/chat", label: "Chat" },
  { to: "/admin/reviews", label: "Reviews" },
] as const;

function AdminShell() {
  const navigate = useNavigate();
  const check = useServerFn(isCallerAdmin);
  const claim = useServerFn(claimFirstAdmin);
  const [state, setState] = useState<"loading"|"admin"|"none">("loading");

  useEffect(() => {
    let active = true;
    check().then((r: any) => { if (active) setState(r?.isAdmin ? "admin" : "none"); })
      .catch(() => active && setState("none"));
    return () => { active = false; };
  }, []);

  if (state === "loading") return <SiteShell><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div></SiteShell>;

  if (state === "none") return (
    <SiteShell>
      <section className="container mx-auto px-4 py-16 max-w-md">
        <div className="glass rounded-3xl p-8 text-center">
          <Shield className="size-10 text-primary mx-auto"/>
          <h1 className="display-font text-2xl font-bold mt-4">No admin access</h1>
          <p className="text-sm text-muted-foreground mt-2">If you're the first admin, claim access below. Otherwise ask an existing admin to grant you.</p>
          <button onClick={async()=>{
            try { const r:any = await claim(); toast.success(r.claimed ? "You are now admin." : "Already admin."); setState("admin"); }
            catch(e:any){ toast.error(e.message ?? "Failed"); }
          }} className="mt-5 w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold">Claim admin</button>
          <button onClick={async()=>{ await supabase.auth.signOut(); navigate({to:"/auth"}); }}
            className="mt-3 w-full glass py-3 rounded-xl">Sign out</button>
        </div>
      </section>
    </SiteShell>
  );

  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Admin</p>
            <h1 className="display-font text-3xl font-bold">Control Center</h1>
          </div>
          <button onClick={async()=>{ await supabase.auth.signOut(); navigate({to:"/auth"}); }}
            className="inline-flex items-center gap-2 glass px-4 py-2 rounded-xl hover:text-destructive">
            <LogOut className="size-4"/> Sign out
          </button>
        </div>
        <nav className="mt-6 flex gap-2 flex-wrap border-b border-border/40 pb-3">
          {tabs.map(t=>(
            <Link key={t.to} to={t.to} activeOptions={{exact:true}}
              className="px-4 py-2 rounded-full text-sm font-medium glass hover:text-primary"
              activeProps={{ className: "px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground" }}>
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6"><Outlet/></div>
      </section>
    </SiteShell>
  );
}