import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Privacy — LUKU LEGIT" }, { name: "description", content: "Terms of service and privacy policy." }] }),
  component: () => (
    <SiteShell>
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="display-font text-5xl font-bold">Terms & Privacy</h1>
        <div className="mt-6 space-y-6 text-muted-foreground">
          <div>
            <h2 className="text-foreground font-semibold text-lg">Terms of Service</h2>
            <p className="mt-2">By placing an order with LUKU LEGIT you confirm that the details you provide are accurate and that you accept our return policy. Pricing and availability may change without notice. We reserve the right to cancel suspected fraudulent orders.</p>
          </div>
          <div>
            <h2 className="text-foreground font-semibold text-lg">Privacy</h2>
            <p className="mt-2">We collect only the details needed to fulfil your order: name, phone, delivery address, and device info for fraud prevention. We never sell your data. You can request deletion of your account anytime by emailing hello@lukulegit.co.ke.</p>
          </div>
          <div>
            <h2 className="text-foreground font-semibold text-lg">Cookies & Storage</h2>
            <p className="mt-2">We use local browser storage to remember your cart and sign-in. No third-party advertising cookies.</p>
          </div>
        </div>
      </section>
    </SiteShell>
  ),
});