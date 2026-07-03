import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";

const faqs = [
  { q: "Are the shoes really authentic?", a: "Yes — every pair is inspected before it goes live. We do not sell replicas." },
  { q: "How do I pay?", a: "M-PESA Till 6699212. Send payment, paste the reference at checkout, and we confirm in minutes." },
  { q: "Do you deliver across Kenya?", a: "Yes — Nairobi same/next day, rest of Kenya 1–3 days via G4S / Easy Coach / rider." },
  { q: "Can I try before paying?", a: "Within Nairobi CBD we offer doorstep fitting on selected orders. Ask on WhatsApp." },
  { q: "What if the shoes don't fit?", a: "Free size swap within 48 hours (subject to stock). See Returns." },
];

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — LUKU LEGIT" }, { name: "description", content: "Answers to common questions about ordering, payment and delivery." }] }),
  component: () => (
    <SiteShell>
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="display-font text-5xl font-bold">FAQ</h1>
        <div className="mt-8 space-y-3">
          {faqs.map((f,i)=>(
            <details key={i} className="glass rounded-2xl p-5 group">
              <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">{f.q}<span className="text-primary group-open:rotate-45 transition">+</span></summary>
              <p className="mt-3 text-muted-foreground text-sm">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </SiteShell>
  ),
});