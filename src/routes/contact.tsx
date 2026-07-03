import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Phone, MessageCircle, Instagram, Mail } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact — LUKU LEGIT" },
    { name: "description", content: "Reach Luku Legit on WhatsApp, phone, or Instagram." },
  ] }),
  component: () => (
    <SiteShell>
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="display-font text-5xl font-bold">Contact us</h1>
        <p className="text-muted-foreground mt-3">Fastest reply on WhatsApp.</p>
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          <a href="https://wa.me/254700408174" target="_blank" rel="noreferrer" className="glass rounded-2xl p-6 hover-lift block">
            <MessageCircle className="size-6 text-primary"/><p className="font-semibold mt-3">WhatsApp</p><p className="text-sm text-muted-foreground">+254 700 408 174</p>
          </a>
          <a href="tel:0700408174" className="glass rounded-2xl p-6 hover-lift block">
            <Phone className="size-6 text-primary"/><p className="font-semibold mt-3">Call</p><p className="text-sm text-muted-foreground">0700 408 174</p>
          </a>
          <a href="https://instagram.com/llegit_gang" target="_blank" rel="noreferrer" className="glass rounded-2xl p-6 hover-lift block">
            <Instagram className="size-6 text-primary"/><p className="font-semibold mt-3">Instagram</p><p className="text-sm text-muted-foreground">@llegit_gang</p>
          </a>
          <a href="mailto:hello@lukulegit.co.ke" className="glass rounded-2xl p-6 hover-lift block">
            <Mail className="size-6 text-primary"/><p className="font-semibold mt-3">Email</p><p className="text-sm text-muted-foreground">hello@lukulegit.co.ke</p>
          </a>
        </div>
      </section>
    </SiteShell>
  ),
});