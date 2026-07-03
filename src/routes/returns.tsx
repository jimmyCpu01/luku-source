import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/returns")({
  head: () => ({ meta: [{ title: "Returns — LUKU LEGIT" }, { name: "description", content: "Return and size-swap policy for Luku Legit orders." }] }),
  component: () => (
    <SiteShell>
      <section className="container mx-auto px-4 py-16 max-w-3xl prose-invert">
        <h1 className="display-font text-5xl font-bold">Returns & Size Swaps</h1>
        <div className="mt-6 space-y-4 text-muted-foreground">
          <p>Because thrift inventory is one-of-one, we operate a strict but fair policy.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="text-foreground font-semibold">48-hour size swap.</span> If the pair doesn't fit, ping us on WhatsApp within 48 hours and we'll swap for another available size (subject to stock).</li>
            <li><span className="text-foreground font-semibold">No worn refunds.</span> Pairs returned with visible outdoor wear cannot be refunded.</li>
            <li><span className="text-foreground font-semibold">Damaged on arrival.</span> Send photos within 24 hours of delivery — we replace or refund in full.</li>
            <li><span className="text-foreground font-semibold">Return shipping.</span> Buyer covers return shipping unless we shipped the wrong item.</li>
          </ul>
        </div>
      </section>
    </SiteShell>
  ),
});