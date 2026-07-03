import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteShell } from "@/components/site/SiteShell";
import { trackOrder } from "@/lib/shopper.functions";
import { formatKES } from "@/lib/cart";

const schema = z.object({ no: fallback(z.string(), "").default("") });

function normalizePhone(phone: string) {
  const p = phone.replace(/\s+/g, "");
  if (p.startsWith("+254")) return p.slice(1);
  if (p.startsWith("254")) return p;
  if (p.startsWith("0")) return "254" + p.slice(1);
  return "254" + p;
}

export const Route = createFileRoute("/track")({
  validateSearch: zodValidator(schema),
  head: () => ({ meta: [{ title: "Track Order — LUKU LEGIT" }] }),
  component: TrackPage,
});

const STEPS = ["pending", "paid", "confirmed", "processing", "shipped", "delivered"] as const;

function TrackPage() {
  const { no } = Route.useSearch();
  const [input, setInput] = useState(no);
  const [phone, setPhone] = useState("");
  const navigate = Route.useNavigate();
  const m = useMutation({
    mutationFn: async (vars: { orderNumber: string; phone: string }) =>
      trackOrder({ data: { orderNumber: vars.orderNumber, phone: normalizePhone(vars.phone) } }),
    onError: (e: any) => toast.error(e.message ?? "Could not track order"),
  });
  const data = m.data;

  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="display-font text-4xl font-bold">Track Order</h1>
        <form onSubmit={(e)=>{
            e.preventDefault();
            const n = input.trim();
            if (!n || !phone.trim()) { toast.error("Enter order number and phone"); return; }
            navigate({ search: { no: n } });
            m.mutate({ orderNumber: n, phone });
          }} className="mt-6 grid sm:grid-cols-[1fr_1fr_auto] gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)} placeholder="LL-XXXXXXXX"
            className="bg-secondary/40 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"/>
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone used at checkout" inputMode="tel"
            className="bg-secondary/40 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"/>
          <button className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold">Track</button>
        </form>

        {m.isPending && <p className="text-muted-foreground mt-6">Searching…</p>}
        {m.isSuccess && !data && <p className="text-muted-foreground mt-6 glass p-6 rounded-xl">Order not found. Check the order number and phone.</p>}
        {data && (
          <div className="mt-8 glass rounded-2xl p-6">
            <div className="flex justify-between items-center">
              <div><p className="text-xs uppercase text-muted-foreground">Order</p><p className="font-bold">{data.order_number}</p></div>
              <p className="neon-text font-bold text-xl">{formatKES(Number(data.total))}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {STEPS.map(s=>{
                const i = STEPS.indexOf(data.status as any);
                const reached = STEPS.indexOf(s) <= i;
                return <div key={s} className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase ${reached?"bg-primary text-primary-foreground":"glass text-muted-foreground"}`}>{s}</div>;
              })}
            </div>
            <div className="mt-6 text-sm text-muted-foreground">
              <p><span className="text-foreground font-semibold">Delivery to:</span> {data.customer_address}</p>
              <p className="mt-1"><span className="text-foreground font-semibold">Contact:</span> {data.customer_phone}</p>
            </div>
          </div>
        )}
      </section>
    </SiteShell>
  );
}