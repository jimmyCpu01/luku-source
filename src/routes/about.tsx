import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { ShieldCheck, Sparkles, Heart, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About — LUKU LEGIT" },
    { name: "description", content: "LUKU LEGIT curates authentic thrift footwear for the Kenyan streets." },
  ] }),
  component: () => (
    <SiteShell>
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Our Story</p>
        <h1 className="display-font text-5xl lg:text-7xl font-bold mt-2">Luku, <span className="gradient-text">legit</span>.</h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">We started LUKU LEGIT to give Kenyan streetwear lovers access to authentic, hand-picked thrift kicks at honest prices — no fakes, no inflated tags.</p>
        <div className="grid sm:grid-cols-2 gap-4 mt-12">
          {[
            {Icon:ShieldCheck,t:"100% Authentic",d:"Every pair is inspected and verified before listing."},
            {Icon:Sparkles,t:"Curated Quality",d:"Condition rated honestly so you know what you're getting."},
            {Icon:Heart,t:"Built for the Streets",d:"Made for hustlers, students, parents, creatives."},
            {Icon:Users,t:"Community First",d:"Real customer support on WhatsApp. Always."},
          ].map((b,i)=>(
            <div key={i} className="glass rounded-2xl p-6">
              <b.Icon className="size-6 text-primary"/>
              <h3 className="font-semibold mt-3">{b.t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{b.d}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  ),
});