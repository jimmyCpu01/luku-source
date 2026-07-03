import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: cErr } = await supabaseAdmin
      .from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
    if (cErr) throw cErr;
    if ((count ?? 0) > 0) {
      const { data: mine } = await supabaseAdmin
        .from("user_roles").select("id").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
      if (mine) return { ok: true, already: true };
      throw new Error("Admin already claimed. Ask an existing admin to grant you access.");
    }
    const { error } = await supabaseAdmin
      .from("user_roles").insert({ user_id: context.userId, role: "admin" });
    if (error) throw error;
    return { ok: true, claimed: true };
  });

export const isCallerAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw error;
    return { isAdmin: !!data };
  });