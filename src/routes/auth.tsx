import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { SiteShell } from "@/components/site/SiteShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Admin Sign in — LUKU LEGIT" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin"|"signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        navigate({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Account created — you may sign in.");
        setMode("signin");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Auth failed");
    } finally { setLoading(false); }
  }

  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-16 max-w-md">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="glass rounded-3xl p-8">
          <h1 className="display-font text-3xl font-bold">{mode==="signin"?"Admin Sign in":"Create Admin Account"}</h1>
          <p className="text-sm text-muted-foreground mt-2">Staff access only.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                className="mt-1 w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"/>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8}
                className="mt-1 w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"/>
            </div>
            <button disabled={loading} className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-[var(--neon-glow)] disabled:opacity-60">
              {loading ? "Please wait…" : mode==="signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <button onClick={()=>setMode(m=>m==="signin"?"signup":"signin")} className="mt-4 text-xs text-muted-foreground hover:text-primary w-full">
            {mode==="signin"?"Need an account? Create one.":"Have an account? Sign in."}
          </button>
          <p className="text-xs text-muted-foreground mt-6 text-center">
            Shopper? <Link to="/login" className="text-primary">Sign in here</Link>
          </p>
        </motion.div>
      </section>
    </SiteShell>
  );
}