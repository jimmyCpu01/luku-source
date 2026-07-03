import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";
import { SiteShell } from "@/components/site/SiteShell";
import { setShopper } from "@/lib/session";
import { loginShopper } from "@/lib/shopper.functions";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — LUKU LEGIT" }] }),
  component: LoginPage,
});

const schema = z.object({
  username: z.string().trim().min(2, "Username too short").max(40).regex(/^[a-zA-Z0-9_.-]+$/, "Letters, numbers, . _ - only"),
  phone: z.string().trim().regex(/^(\+?254|0)?7\d{8}$/, "Enter a valid Kenyan phone number"),
});

function normalize(phone: string) {
  const p = phone.replace(/\s+/g, "");
  if (p.startsWith("+254")) return p.slice(1);
  if (p.startsWith("254")) return p;
  if (p.startsWith("0")) return "254" + p.slice(1);
  return "254" + p;
}

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ username, phone });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    try {
      const normPhone = normalize(parsed.data.phone);
      const ua = navigator.userAgent.slice(0, 200);
      const { shopper, token } = await loginShopper({
        data: { username: parsed.data.username, phone: normPhone, device: ua, browser: ua },
      });
      setShopper({ id: shopper.id, username: shopper.username, phone: shopper.phone, token });
      toast.success(`Welcome, ${shopper.username}`);
      navigate({ to: "/account" });
    } catch (err: any) {
      toast.error(err.message ?? "Sign in failed");
    } finally { setLoading(false); }
  }

  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-16 max-w-md">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="glass rounded-3xl p-8">
          <h1 className="display-font text-3xl font-bold">Sign in / Register</h1>
          <p className="text-sm text-muted-foreground mt-2">Use your phone — we'll create your account if you're new.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Username</label>
              <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="streetking254"
                className="mt-1 w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"/>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Phone</label>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="0712345678" inputMode="tel"
                className="mt-1 w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"/>
            </div>
            <button disabled={loading} className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-[var(--neon-glow)] disabled:opacity-60">
              {loading ? "Signing in…" : "Continue"}
            </button>
          </form>
          <p className="text-xs text-muted-foreground mt-6 text-center">
            Admin? <Link to="/auth" className="text-primary">Sign in here</Link>
          </p>
        </motion.div>
      </section>
    </SiteShell>
  );
}